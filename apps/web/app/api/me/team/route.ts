import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../utils/database'
import { getUserIdFromRequest } from '../../../../utils/api'

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIdInt = parseInt(currentUserId, 10)
    if (Number.isNaN(userIdInt)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    const userTeams = await executeQuery(
      `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        t.updated_at,
        t.is_active,
        tm.role as user_role,
        CASE WHEN tm.status = 0 THEN 1 ELSE 0 END as is_active_team
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.status = 0 AND t.is_active = TRUE
      ORDER BY t.created_at DESC
      LIMIT 1
    `,
      [userIdInt]
    )

    if (!userTeams || (Array.isArray(userTeams) && userTeams.length === 0)) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 })
    }

    const team = Array.isArray(userTeams) ? userTeams[0] : userTeams

    const members = await executeQuery(
      `
      SELECT 
        u.id,
        u.username,
        u.gender,
        u.age,
        u.avatar_url,
        tm.role,
        tm.joined_at,
        CASE 
          WHEN u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN u.avatar_url
          ELSE NULL
        END as avatar_url
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ? AND tm.status = 0
      ORDER BY tm.joined_at ASC
    `,
      [(team as any).id]
    )

    const membersArray = Array.isArray(members) ? members : []

    return NextResponse.json({
      team: {
        ...team,
        members: membersArray
      }
    })
  } catch (error) {
    console.error('Error fetching user team:', error)
    return NextResponse.json(
      { error: 'チーム情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
