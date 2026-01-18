import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    // JWTから現在のユーザーIDを取得
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのアクティブなチームを取得
    const userTeam = await executeQuery(`
      SELECT t.id as team_id, t.name as team_name, t.description
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]);

    if (!userTeam || (Array.isArray(userTeam) && userTeam.length === 0)) {
      return NextResponse.json([]);
    }

    const teamData = (Array.isArray(userTeam) ? userTeam[0] : userTeam) as any;
    const userTeamId = teamData.team_id;

    // このチームが送ったマッチングフローを取得（重複を除外）
    const sentLikes = await executeQuery(`
      SELECT 
        tmf.id as matching_flow_id,
        t.id,
        t.name as teamName,
        t.description as description,
        tmf.status,
        tmf.created_at,
        COUNT(DISTINCT tm.user_id) as member_count
      FROM team_matching_flows tmf
      JOIN teams t ON tmf.to_group_id = t.id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
      WHERE tmf.from_group_id = ?
      AND tmf.id = (
        SELECT id
        FROM team_matching_flows tmf2
        WHERE tmf2.from_group_id = ?
        AND tmf2.to_group_id = tmf.to_group_id
        ORDER BY tmf2.created_at DESC
        LIMIT 1
      )
      GROUP BY tmf.id, t.id, t.name, t.description, tmf.status, tmf.created_at
      ORDER BY tmf.created_at DESC
    `, [userTeamId, userTeamId]);

    console.log('送ったいいねのデータ:', sentLikes);
    return NextResponse.json(sentLikes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 