import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../utils/database';
import { getUserIdFromRequest } from '../../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    console.log('🔧 === 予定調整状況チェックAPI開始 ===');
    
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      console.log('❌ 認証失敗: User ID not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchingFlowId = searchParams.get('matchingFlowId');
    
    if (!matchingFlowId) {
      return NextResponse.json(
        { error: 'マッチングフローIDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 予定調整状況チェック:', { matchingFlowId, currentUserId });

    // ユーザーがこのマッチングに関連するチームのメンバーかチェック
    const userTeam = await executeQuery(`
      SELECT team_id
      FROM team_members
      WHERE user_id = ? AND team_id IN (
        SELECT from_group_id FROM team_matching_flows WHERE id = ?
        UNION
        SELECT to_group_id FROM team_matching_flows WHERE id = ?
      ) AND is_active = TRUE
    `, [currentUserId, matchingFlowId, matchingFlowId]) as any[];

    if (userTeam.length === 0) {
      return NextResponse.json(
        { error: 'このマッチングにアクセスする権限がありません' },
        { status: 403 }
      );
    }

    // 予定が確定されているかチェック
    const schedule = await executeQuery(`
      SELECT 
        id,
        matching_flow_id,
        purpose,
        datetime,
        location,
        link,
        status,
        created_at
      FROM meeting_schedules
      WHERE matching_flow_id = ? AND status = 'confirmed'
      ORDER BY created_at DESC
      LIMIT 1
    `, [matchingFlowId]) as any[];

    const hasSchedule = schedule.length > 0;
    const scheduleData = hasSchedule ? schedule[0] : null;

    console.log('✅ 予定調整状況チェック完了:', { hasSchedule, scheduleData });

    return NextResponse.json({
      success: true,
      hasSchedule,
      scheduleData: scheduleData ? {
        id: scheduleData.id,
        purpose: scheduleData.purpose,
        datetime: scheduleData.datetime,
        location: scheduleData.location,
        link: scheduleData.link,
        status: scheduleData.status,
        createdAt: scheduleData.created_at
      } : null
    });

  } catch (error) {
    console.error('❌ 予定調整状況チェックエラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
