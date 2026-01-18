import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 === /api/teams/my-teams デバッグ開始 ===');
    
    // JWTから現在のユーザーIDを取得
    const currentUserId = getUserIdFromRequest(req);
    console.log('🔍 currentUserId:', currentUserId);
    
    if (!currentUserId) {
      console.error('❌ ユーザーIDが取得できません');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 ユーザーIDでチーム検索開始...');
    
    // ユーザーが所属する全チームを取得
    const userTeams = await executeQuery(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        t.updated_at,
        t.is_active,
        t.is_active_team,
        tm.role as user_role,
        tm.is_active_team as user_active_team,
        COUNT(tm2.user_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      GROUP BY t.id, t.name, t.description, t.created_at, t.updated_at, t.is_active, t.is_active_team, tm.role, tm.is_active_team
      ORDER BY tm.is_active_team DESC, t.created_at DESC
    `, [currentUserId]);

    console.log('🔍 SQLクエリ結果:', userTeams);
    console.log('🔍 見つかったチーム数:', Array.isArray(userTeams) ? userTeams.length : 0);

    // 各チームのメンバー情報を取得
    const teamsWithMembers = await Promise.all(
      (userTeams as any[]).map(async (team) => {
        console.log('🔍 チームID', team.id, 'のメンバー情報を取得中...');
        
        const members = await executeQuery(`
          SELECT 
            u.id,
            u.username,
            u.gender,
            u.age,
            u.avatar_url,
            tm.role,
            tm.is_active_team,
            tm.joined_at
          FROM team_members tm
          JOIN users u ON tm.user_id = u.id
          WHERE tm.team_id = ? AND tm.is_active = TRUE
          ORDER BY tm.joined_at ASC
        `, [team.id]);

        console.log('🔍 チームID', team.id, 'のメンバー数:', Array.isArray(members) ? members.length : 0);

        return {
          ...team,
          members: Array.isArray(members) ? members : [],
          status: team.is_active_team ? 'active' : 'inactive'
        };
      })
    );

    console.log('🔍 最終的な返却データ:', teamsWithMembers);
    console.log('🔍 === /api/teams/my-teams デバッグ終了 ===');

    return NextResponse.json(teamsWithMembers);
  } catch (error) {
    console.error('❌ /api/teams/my-teams エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 