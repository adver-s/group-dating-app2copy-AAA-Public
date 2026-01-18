import { executeQuery } from '@/utils/database'
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../../utils/api'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params;
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({
        error: '認証が必要です',
        redirectTo: '/auth/signin'
      }, { status: 401 });
    }

    console.log('🔍 招待コード参加処理開始:', inviteCode, 'User:', currentUserId);

    // まず、新しい方式（invite_codesテーブル）で検索
    const inviteRows = await executeQuery(`
      SELECT ic.id, ic.code, ic.team_id, ic.created_by, ic.created_at, ic.expires_at,
             t.id as team_id, t.name as team_name, t.description, t.is_active
      FROM invite_codes ic
      JOIN teams t ON ic.team_id = t.id
      WHERE ic.code = ?
    `, [inviteCode]) as any[];

    let teamId: string;
    let teamName: string;

    // 新しい方式で見つからない場合、古い方式（チームIDベース）で検索
    if (inviteRows.length === 0) {
      console.log('📝 新しい方式で見つからないため、古い方式で検索:', inviteCode);

      // チームIDとして直接検索
      const teamRows = await executeQuery(`
        SELECT id, name, description, is_active
        FROM teams 
        WHERE id = ?
      `, [inviteCode]) as any[];

      if (teamRows.length === 0) {
        console.log('❌ チームが見つかりません:', inviteCode);
        return NextResponse.json(
          { error: '無効な招待コードです' },
          { status: 404 }
        );
      }

      const team = teamRows[0];

      // チームがアクティブかチェック
      if (!team.is_active) {
        return NextResponse.json(
          { error: 'このチームは現在非アクティブです' },
          { status: 410 }
        );
      }

      teamId = team.id;
      teamName = team.name;

      // 既にメンバーかチェック
      const existingMemberRows = await executeQuery(`
        SELECT id FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `, [teamId, currentUserId]) as any[];

      if (existingMemberRows.length > 0) {
        return NextResponse.json(
          { error: '既にこのチームのメンバーです' },
          { status: 400 }
        );
      }

    } else {
      // 新しい方式の場合の処理
      console.log('✅ 新しい方式で招待コードが見つかりました');
      const invite = inviteRows[0];

      // 有効期限チェック
      if (invite.expires_at && new Date() > new Date(invite.expires_at)) {
        return NextResponse.json(
          { error: '招待コードの有効期限が切れています' },
          { status: 410 }
        );
      }

      // チームがアクティブかチェック
      if (!invite.is_active) {
        return NextResponse.json(
          { error: 'このチームは現在非アクティブです' },
          { status: 410 }
        );
      }

      // 既にメンバーかチェック
      const existingMemberRows = await executeQuery(`
        SELECT id FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `, [invite.team_id, currentUserId]) as any[];

      if (existingMemberRows.length > 0) {
        return NextResponse.json(
          { error: '既にこのチームのメンバーです' },
          { status: 400 }
        );
      }

      teamId = invite.team_id;
      teamName = invite.team_name;
    }

    // ユーザーが他のアクティブチームに所属しているかチェック
    const existingActiveTeamRows = await executeQuery(`
      SELECT tm.id, tm.team_id, t.name as team_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]) as any[];

    if (existingActiveTeamRows.length > 0) {
      return NextResponse.json({
        error: '既に他のアクティブチームに所属しています。一度チームを離脱してから参加してください。'
      }, { status: 400 });
    }

    // チームメンバーとして追加
    try {
      console.log('📝 チームメンバー作成開始:', { teamId, userId: currentUserId });

      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await executeQuery(`
        INSERT INTO team_members (id, team_id, user_id, is_active, joined_at)
        VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
      `, [memberId, teamId, currentUserId]);

      console.log('✅ チームメンバー作成成功:', { memberId, teamId, userId: currentUserId });
    } catch (createError) {
      console.error('❌ チームメンバー作成エラー:', createError);

      // 既にメンバーかどうかを再チェック
      const existingMemberCheck = await executeQuery(`
        SELECT id FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `, [teamId, currentUserId]) as any[];

      if (existingMemberCheck.length > 0) {
        return NextResponse.json(
          { error: '既にこのチームのメンバーです' },
          { status: 400 }
        );
      }

      throw createError; // 他のエラーの場合は再スロー
    }

    console.log('✅ 招待コードでチーム参加成功:', {
      teamId: teamId,
      userId: currentUserId,
      inviteCode: inviteCode
    });

    return NextResponse.json({
      success: true,
      message: 'チームに参加しました',
      groupName: teamName,
      teamId: teamId
    });

  } catch (error) {
    console.error('❌ 招待コードでチーム参加エラー:', error);
    return NextResponse.json(
      { error: 'チームへの参加に失敗しました' },
      { status: 500 }
    );
  }
}
