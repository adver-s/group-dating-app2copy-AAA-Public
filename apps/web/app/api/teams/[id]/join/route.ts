import { withErrorHandler } from '@/middleware/errorHandler';
import { getUserIdFromRequest } from '@/utils/api';
import { executeQuery } from '@/utils/database';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: teamIdOrInviteCode } = await params;
  const currentUserId = getUserIdFromRequest(req);

  if (!currentUserId) {
    console.log('❌ 認証エラー: ユーザーIDが取得できません');
    console.log('🔍 リクエストURL:', req.url);
    console.log('🔍 リクエストメソッド:', req.method);
    console.log('🔍 Authorization header:', req.headers.get('authorization') ? '存在' : '不足');

    // 招待コードとして処理を試行（認証なしでも招待コードの有効性をチェック）
    console.log('🔍 認証なしで招待コードとして処理を試行:', teamIdOrInviteCode);

    // 招待コードとして検索
    const inviteRows = await executeQuery(`
      SELECT ic.id, ic.code, ic.team_id, ic.created_by, ic.created_at, ic.expires_at,
             t.id as team_id, t.name as team_name, t.description, t.is_active
      FROM invite_codes ic
      JOIN teams t ON ic.team_id = t.id
      WHERE ic.code = ?
    `, [teamIdOrInviteCode]) as any[];

    if (inviteRows.length > 0) {
      console.log('✅ 招待コードとして認識（認証なし）:', teamIdOrInviteCode);
      return NextResponse.json({
        error: '認証が必要です。ログインしてから招待コードを使用してください。',
        redirectTo: '/auth/signin',
        isValidInviteCode: true,
        teamName: inviteRows[0].team_name
      }, { status: 401 });
    }

    return NextResponse.json({
      error: '認証が必要です。ログインしてください。',
      redirectTo: '/auth/signin'
    }, { status: 401 });
  }

  try {
    console.log('🔍 グループ参加リクエスト:', {
      teamIdOrInviteCode,
      userId: currentUserId,
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      origin: req.headers.get('origin')
    });

    // まず、招待コードとして検索
    const inviteRows = await executeQuery(`
      SELECT ic.id, ic.code, ic.team_id, ic.created_by, ic.created_at, ic.expires_at,
             t.id as team_id, t.name as team_name, t.description, t.is_active
      FROM invite_codes ic
      JOIN teams t ON ic.team_id = t.id
      WHERE ic.code = ?
    `, [teamIdOrInviteCode]) as any[];

    let actualTeamId: string;
    let teamName: string;

    if (inviteRows.length > 0) {
      // 招待コードが見つかった場合
      console.log('✅ 招待コードとして認識:', teamIdOrInviteCode);
      const invite = inviteRows[0];

      // 有効期限チェック
      if (invite.expires_at && new Date() > new Date(invite.expires_at)) {
        return NextResponse.json(
          { error: '招待コードの有効期限が切れています' },
          { status: 410 }
        );
      }

      actualTeamId = invite.team_id;
      teamName = invite.team_name;
    } else {
      // 招待コードとして見つからない場合、チームIDとして扱う
      console.log('📝 チームIDとして扱います:', teamIdOrInviteCode);

      // チームの存在確認
      const team = await prisma.team.findUnique({
        where: { id: teamIdOrInviteCode },
        include: {
          members: {
            where: { user_id: currentUserId }
          }
        }
      });

      if (!team) {
        return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
      }

      actualTeamId = team.id;
      teamName = team.name;
    }

    // 既にメンバーかチェック
    const existingMemberRows = await executeQuery(`
      SELECT id FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [actualTeamId, currentUserId]) as any[];

    if (existingMemberRows.length > 0) {
      return NextResponse.json({ error: '既にこのチームのメンバーです' }, { status: 400 });
    }

    // ユーザーが他のアクティブチームに所属しているかチェック
    const existingActiveTeamRows = await executeQuery(`
      SELECT tm.id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
    `, [currentUserId]) as any[];

    if (existingActiveTeamRows.length > 0) {
      return NextResponse.json({
        error: '既に他のアクティブチームに所属しています。一度チームを離脱してから参加してください。'
      }, { status: 400 });
    }

    // チームメンバーとして追加
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await executeQuery(`
      INSERT INTO team_members (id, team_id, user_id, is_active, joined_at)
      VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
    `, [memberId, actualTeamId, currentUserId]);

    console.log('✅ チーム参加成功:', { actualTeamId, userId: currentUserId, memberId });

    return NextResponse.json({
      success: true,
      message: 'チームに参加しました',
      groupName: teamName,
      teamId: actualTeamId
    });

  } catch (error) {
    console.error('❌ チーム参加エラー:', error);
    return NextResponse.json(
      { error: 'チームへの参加に失敗しました' },
      { status: 500 }
    );
  }
}); 