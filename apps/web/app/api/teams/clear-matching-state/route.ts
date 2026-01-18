import { getUserIdFromRequest } from '@/utils/api';
import { executeQuery } from '@/utils/database';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 === マッチング状態クリアAPI開始 ===');
    console.log('🔍 User ID:', currentUserId);

    // ユーザーのアクティブチームを取得
    const activeTeam = await executeQuery(`
      SELECT t.id as team_id, t.name as team_name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]) as any[];

    if (activeTeam.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'アクティブなチームが見つかりません'
      }, { status: 404 });
    }

    const teamId = activeTeam[0].team_id;
    const teamName = activeTeam[0].team_name;

    console.log('🔍 アクティブチーム:', { teamId, teamName });

    // このチームに関連する進行中のマッチングフローを取得
    const activeFlows = await executeQuery(`
      SELECT id, from_group_id, to_group_id, status
      FROM team_matching_flows
      WHERE (from_group_id = ? OR to_group_id = ?)
      AND status IN (0, 1, 2) -- 進行中のステータス
    `, [teamId, teamId]) as any[];

    console.log('🔍 進行中のマッチングフロー:', activeFlows);

    // マッチングフローをキャンセル状態に更新
    if (activeFlows.length > 0) {
      const flowIds = activeFlows.map(flow => flow.id);

      await executeQuery(`
        UPDATE team_matching_flows 
        SET status = 4, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${flowIds.map(() => '?').join(',')})
      `, flowIds);

      console.log(`✅ ${activeFlows.length}個のマッチングフローをキャンセルしました`);
    }

    // このチームのメンバーの判定をリセット
    const resetJudgements = await executeQuery(`
      UPDATE group_member_judgements 
      SET judgement = 'UNSET', updatedAt = CURRENT_TIMESTAMP
      WHERE groupId = ?
    `, [teamId]);

    console.log('✅ チームメンバーの判定をリセットしました');

    return NextResponse.json({
      success: true,
      message: `アクティブチーム「${teamName}」のマッチング状態をクリアしました`,
      clearedFlows: activeFlows.length,
      teamId,
      teamName
    });

  } catch (error) {
    console.error('❌ マッチング状態クリアAPI エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
