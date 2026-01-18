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

    const userMatchesCount = await executeQuery(
      `
      SELECT COUNT(DISTINCT tmf.id) as total_matches
      FROM team_matching_flows tmf
      JOIN team_members tm1 ON tmf.from_group_id = tm1.team_id
      JOIN team_members tm2 ON tmf.to_group_id = tm2.team_id
      WHERE tmf.status = 3
        AND (tm1.user_id = ? OR tm2.user_id = ?)
        AND tm1.status = 0
        AND tm2.status = 0
        AND tmf.id = (
          SELECT id
          FROM team_matching_flows tmf2
          WHERE tmf2.status = 3
            AND (
              (tmf2.from_group_id = tmf.from_group_id AND tmf2.to_group_id = tmf.to_group_id)
              OR
              (tmf2.from_group_id = tmf.to_group_id AND tmf2.to_group_id = tmf.from_group_id)
            )
          ORDER BY tmf2.updated_at DESC
          LIMIT 1
        )
    `,
      [userIdInt, userIdInt]
    )

    const countData = Array.isArray(userMatchesCount) ? userMatchesCount[0] : userMatchesCount

    return NextResponse.json({
      totalMatches: countData?.total_matches || 0
    })
  } catch (error) {
    console.error('Error fetching user matches count:', error)
    return NextResponse.json(
      { error: 'マッチ数の取得に失敗しました' },
      { status: 500 }
    )
  }
}
