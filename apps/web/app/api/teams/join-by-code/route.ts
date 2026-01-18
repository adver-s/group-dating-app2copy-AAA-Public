import { getUserIdFromRequest } from '@/utils/api';
import { executeQuery } from '@/utils/database';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({
        error: '認証が必要です',
        redirectTo: '/auth/signin'
      }, { status: 401 });
    }

    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ error: '招待コードが必要です' }, { status: 400 });
    }

    console.log('🔍 招待コードでのグループ参加リクエスト:', { inviteCode, userId: currentUserId });

    // 招待コードからチームIDを取得（期限判定はアプリ側で行う）
    const inviteCodeRows = await executeQuery(`
      SELECT ic.team_id, t.name as team_name, ic.expires_at
      FROM invite_codes ic
      JOIN teams t ON ic.team_id = t.id
      WHERE ic.code = ?
      ORDER BY ic.created_at DESC
      LIMIT 1
    `, [inviteCode]);

    if (!inviteCodeRows || inviteCodeRows.length === 0) {
      return NextResponse.json({ error: '無効な招待コードです' }, { status: 404 });
    }

    const inviteData = inviteCodeRows[0];
    const teamId = inviteData.team_id;
    const teamName = inviteData.team_name;

    // 有効期限をサーバー側で厳密チェック（SQLiteの文字列比較差異に依存しない）
    if (inviteData.expires_at) {
      const now = new Date();
      const expiresAt = new Date(inviteData.expires_at);
      if (Number.isNaN(expiresAt.getTime()) || now > expiresAt) {
        return NextResponse.json({ error: '招待コードの有効期限が切れています' }, { status: 410 });
      }
    }

    // 既にメンバーかチェック
    const existingMemberRows = await executeQuery(`
      SELECT id FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [teamId, currentUserId]);

    if (existingMemberRows && existingMemberRows.length > 0) {
      return NextResponse.json({ error: '既にこのチームのメンバーです' }, { status: 400 });
    }

    // ユーザーが他のアクティブチームに所属しているかチェック
    const existingActiveTeamRows = await executeQuery(`
      SELECT tm.id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
    `, [currentUserId]);

    if (existingActiveTeamRows && existingActiveTeamRows.length > 0) {
      return NextResponse.json({
        error: '既に他のアクティブチームに所属しています。一度チームを離脱してから参加してください。'
      }, { status: 400 });
    }

    // チームメンバーとして追加
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await executeQuery(`
      INSERT INTO team_members (id, team_id, user_id, is_active, joined_at)
      VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
    `, [memberId, teamId, currentUserId]);

    console.log('✅ 招待コードでのチーム参加成功:', { teamId, userId: currentUserId, memberId });

    return NextResponse.json({
      success: true,
      message: 'チームに参加しました',
      groupName: teamName,
      teamId: teamId
    });

  } catch (error) {
    console.error('❌ 招待コードでのチーム参加エラー:', error);
    return NextResponse.json(
      { error: 'チームへの参加に失敗しました' },
      { status: 500 }
    );
  }
}
