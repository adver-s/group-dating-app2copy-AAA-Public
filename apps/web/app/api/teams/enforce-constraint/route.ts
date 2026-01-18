import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/api';
import { TeamActiveConstraint } from '@/utils/team-constraints';

export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔧 === アクティブチーム制約強制適用API開始 ===');
    console.log('🔍 User ID:', currentUserId);
    
    // 現在のアクティブチーム数を確認
    const beforeCount = await TeamActiveConstraint.getActiveTeamCount(currentUserId);
    console.log('📊 制約適用前のアクティブチーム数:', beforeCount);
    
    if (beforeCount <= 1) {
      return NextResponse.json({
        success: true,
        message: '制約は既に満たされています',
        beforeCount,
        afterCount: beforeCount,
        teamsDeactivated: 0
      });
    }
    
    // 制約を強制適用
    await TeamActiveConstraint.enforceConstraint(currentUserId);
    
    // 適用後のアクティブチーム数を確認
    const afterCount = await TeamActiveConstraint.getActiveTeamCount(currentUserId);
    const teamsDeactivated = beforeCount - afterCount;
    
    console.log('📊 制約適用後のアクティブチーム数:', afterCount);
    console.log('📊 非アクティブ化されたチーム数:', teamsDeactivated);
    
    // 制約適用後のチーム一覧を取得して返す
    const { executeQuery } = await import('@/utils/database');
    
    const userTeams = await executeQuery(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        t.updated_at,
        t.is_active,
        CASE WHEN tm.is_active = TRUE THEN TRUE ELSE FALSE END as user_active_team,
        COUNT(tm2.user_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
      WHERE tm.user_id = ? AND t.is_active = TRUE
      GROUP BY t.id, t.name, t.description, t.created_at, t.updated_at, t.is_active, tm.is_active
      ORDER BY tm.is_active DESC, t.created_at DESC
    `, [currentUserId]);

    const activeGroups = userTeams.filter((team: any) => team.user_active_team);
    const waitingGroups = userTeams.filter((team: any) => !team.user_active_team);
    
    return NextResponse.json({
      success: true,
      message: `制約を適用しました。${teamsDeactivated}個のチームを待機状態にしました。`,
      beforeCount,
      afterCount,
      teamsDeactivated,
      activeGroups,
      waitingGroups
    });
    
  } catch (error) {
    console.error('❌ アクティブチーム制約強制適用API エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
