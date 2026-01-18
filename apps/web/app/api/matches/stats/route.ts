import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { executeQuery } from '../../../../utils/database';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    console.log('🔍 マッチ統計API開始 - ユーザーID:', currentUserId);

    // デバッグ用: ユーザーが所属するチームを確認
    const userTeams = await executeQuery(`
      SELECT DISTINCT tm.team_id, t.name as team_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE
    `, [currentUserId]) as any[];

    console.log('🔍 ユーザーが所属するチーム:', userTeams);

    // デバッグ用: ユーザーに関連するマッチングフローを確認
    const userMatchingFlows = await executeQuery(`
      SELECT DISTINCT tmf.id, tmf.status, tmf.from_group_id, tmf.to_group_id
      FROM team_matching_flows tmf
      JOIN team_members tm ON (tm.team_id = tmf.from_group_id OR tm.team_id = tmf.to_group_id)
      WHERE tm.user_id = ? AND tm.is_active = TRUE
      ORDER BY tmf.updated_at DESC
    `, [currentUserId]) as any[];

    console.log('🔍 ユーザーに関連するマッチングフロー:', userMatchingFlows);

    // デバッグ用: meeting_schedulesテーブル（無ければ空で進行）
    let meetingSchedules: any[] = []
    try {
      meetingSchedules = await executeQuery(`
        SELECT ms.*, tmf.from_group_id, tmf.to_group_id
        FROM meeting_schedules ms
        JOIN team_matching_flows tmf ON ms.matching_flow_id = tmf.id
        JOIN team_members tm ON (tm.team_id = tmf.from_group_id OR tm.team_id = tmf.to_group_id)
        WHERE tm.user_id = ? AND tm.is_active = TRUE
        ORDER BY ms.created_at DESC
      `, [currentUserId]) as any[]
    } catch (e) {
      console.warn('⚠️ meeting_schedules が存在しないためスキップします')
      meetingSchedules = []
    }
    console.log('🔍 meeting_schedulesテーブルのデータ:', meetingSchedules);

    // 1. 成立済み合コン数（マッチした合コンの数）
    const confirmedMatchesCount = await executeQuery(`
      SELECT COUNT(DISTINCT tmf.id) as count
      FROM team_matching_flows tmf
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      JOIN team_members tm ON (tm.team_id = t1.id OR tm.team_id = t2.id)
      WHERE tmf.status = 3
      AND tm.user_id = ? AND tm.is_active = TRUE
    `, [currentUserId]) as any[];

    const confirmedCountRaw = confirmedMatchesCount[0]?.count || 0;
    const confirmedCount = typeof confirmedCountRaw === 'bigint' ? Number(confirmedCountRaw) : confirmedCountRaw;
    console.log('🔍 成立済み合コン数クエリ結果:', confirmedMatchesCount);
    console.log('🔍 成立済み合コン数:', confirmedCount);

    // 2. 決定済み合コン数（meeting_schedules が無ければ 0 にフォールバック）
    let decidedCount = 0
    let decidedRows: any[] = []
    try {
      decidedRows = await executeQuery(`
        SELECT COUNT(DISTINCT tmf.id) as count
        FROM team_matching_flows tmf
        JOIN teams t1 ON tmf.from_group_id = t1.id
        JOIN teams t2 ON tmf.to_group_id = t2.id
        JOIN team_members tm ON (tm.team_id = t1.id OR tm.team_id = t2.id)
        JOIN meeting_schedules ms ON tmf.id = ms.matching_flow_id
        WHERE tmf.status = 3
        AND ms.status = 'confirmed'
        AND tm.user_id = ? AND tm.is_active = TRUE
      `, [currentUserId]) as any[]
      const decidedRaw = decidedRows[0]?.count || 0
      decidedCount = typeof decidedRaw === 'bigint' ? Number(decidedRaw) : decidedRaw
    } catch (e) {
      console.warn('⚠️ meeting_schedules が無いため decidedCount=0 とします')
      decidedCount = 0
    }
    console.log('🔍 決定済み合コン数クエリ結果:', decidedRows);
    console.log('🔍 決定済み合コン数:', decidedCount);

    // 3. キャンセルされた合コン数
    const cancelledMatchesCount = await executeQuery(`
      SELECT COUNT(DISTINCT tmf.id) as count
      FROM team_matching_flows tmf
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      JOIN team_members tm ON (tm.team_id = t1.id OR tm.team_id = t2.id)
      WHERE tmf.status = 4
      AND tm.user_id = ? AND tm.is_active = TRUE
    `, [currentUserId]) as any[];

    const cancelledRaw = cancelledMatchesCount[0]?.count || 0;
    const cancelledCount = typeof cancelledRaw === 'bigint' ? Number(cancelledRaw) : cancelledRaw;
    console.log('🔍 キャンセルされた合コン数クエリ結果:', cancelledMatchesCount);
    console.log('🔍 キャンセルされた合コン数:', cancelledCount);

    // 4. 成功率の計算
    // 成功率 = (決定済み合コン数) / (成立済み合コン数 - キャンセルされた合コン数) * 100
    const effectiveConfirmedCount = Number(confirmedCount) - Number(cancelledCount);
    const successRate = effectiveConfirmedCount > 0 ?
      Math.round((decidedCount / effectiveConfirmedCount) * 100) : 0;

    console.log('✅ マッチ統計計算完了:', {
      confirmedCount,
      decidedCount,
      cancelledCount,
      effectiveConfirmedCount,
      successRate
    });

    // デバッグ用の詳細情報を出力
    console.log('🔍 統計計算の詳細:');
    console.log('- 成立済み合コン数:', confirmedCount);
    console.log('- 決定済み合コン数:', decidedCount);
    console.log('- キャンセルされた合コン数:', cancelledCount);
    console.log('- 有効な成立済み合コン数:', effectiveConfirmedCount);
    console.log('- 成功率:', successRate + '%');

    return NextResponse.json({
      confirmedCount,
      decidedCount,
      successRate
    });

  } catch (error) {
    console.error('❌ マッチ統計APIエラー:', error);
    return NextResponse.json(
      { error: 'データベース接続エラー' },
      { status: 500 }
    );
  }
}
