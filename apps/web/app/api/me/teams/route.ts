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

    const userTeamsCount = await executeQuery(
      `
      SELECT 
        COUNT(DISTINCT t.id) as total_teams,
        SUM(CASE WHEN tm.status = 0 THEN 1 ELSE 0 END) as active_teams,
        SUM(CASE WHEN tm.status != 0 THEN 1 ELSE 0 END) as waiting_teams
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND t.is_active = TRUE
    `,
      [userIdInt]
    )

    const countData = Array.isArray(userTeamsCount) ? userTeamsCount[0] : userTeamsCount

    return NextResponse.json({
      totalTeams: countData?.total_teams || 0,
      activeTeams: countData?.active_teams || 0,
      waitingTeams: countData?.waiting_teams || 0
    })
  } catch (error) {
    console.error('Error fetching user teams count:', error)
    return NextResponse.json(
      { error: 'チーム数の取得に失敗しました' },
      { status: 500 }
    )
  }
}
