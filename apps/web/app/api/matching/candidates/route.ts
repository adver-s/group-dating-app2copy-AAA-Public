import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = Number(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const userIdNum = Number(userId)
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'userId must be a number' },
        { status: 400 }
      )
    }

    const userTeams = await executeQuery(
      `
        SELECT DISTINCT team_id
        FROM team_members
        WHERE user_id = ? AND status = 0
      `,
      [userIdNum]
    )

    if (userTeams.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of any team' },
        { status: 400 }
      )
    }

    const excludedIds = userTeams.map((row: any) => row.team_id)

    const candidateWhere =
      excludedIds.length > 0
        ? `t.id NOT IN (${excludedIds.map(() => '?').join(',')})`
        : '1=1'

    const candidateRows = await executeQuery(
      `
        SELECT
          t.id,
          t.name,
          t.description,
          t.gender,
          t.target_gender,
          t.created_at,
          (
            SELECT photo_url
            FROM team_photos tp
            WHERE tp.team_id = t.id
            ORDER BY tp.display_order ASC
            LIMIT 1
          ) AS photo_url
        FROM teams t
        WHERE t.is_active = TRUE
          AND ${candidateWhere}
        ORDER BY t.created_at DESC
        LIMIT ?
      `,
      [...excludedIds, limit]
    )

    if (candidateRows.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const candidateIds = candidateRows.map((team: any) => team.id)
    const placeholders = candidateIds.map(() => '?').join(',')

    const memberRows = await executeQuery(
      `
        SELECT
          tm.team_id,
          u.id   AS user_id,
          u.username,
          u.age,
          u.gender
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id IN (${placeholders}) AND tm.status = 0
      `,
      candidateIds
    )

    const hobbyRows = await executeQuery(
      `
        SELECT team_id, hobby_tag
        FROM team_hobbies
        WHERE team_id IN (${placeholders})
      `,
      candidateIds
    )

    const prefectureRows = await executeQuery(
      `
        SELECT team_id, prefecture_code
        FROM team_prefectures
        WHERE team_id IN (${placeholders})
      `,
      candidateIds
    )

    const weekdayRows = await executeQuery(
      `
        SELECT team_id, weekday, time_slot
        FROM team_weekdays
        WHERE team_id IN (${placeholders})
      `,
      candidateIds
    )

    const membersByTeam = new Map<number, any[]>()
    const hobbiesByTeam = new Map<number, number[]>()
    const prefecturesByTeam = new Map<number, number[]>()
    const weekdaysByTeam = new Map<number, { weekday: number; time_slot: number }[]>()

    memberRows.forEach((row: any) => {
      const list = membersByTeam.get(row.team_id) ?? []
      list.push({
        id: row.user_id,
        username: row.username,
        age: row.age,
        gender: row.gender
      })
      membersByTeam.set(row.team_id, list)
    })

    hobbyRows.forEach((row: any) => {
      const list = hobbiesByTeam.get(row.team_id) ?? []
      list.push(row.hobby_tag)
      hobbiesByTeam.set(row.team_id, list)
    })

    prefectureRows.forEach((row: any) => {
      const list = prefecturesByTeam.get(row.team_id) ?? []
      list.push(row.prefecture_code)
      prefecturesByTeam.set(row.team_id, list)
    })

    weekdayRows.forEach((row: any) => {
      const list = weekdaysByTeam.get(row.team_id) ?? []
      list.push({ weekday: row.weekday, time_slot: row.time_slot })
      weekdaysByTeam.set(row.team_id, list)
    })

    const data = candidateRows.map((team: any) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      gender: team.gender,
      target_gender: team.target_gender,
      created_at: team.created_at,
      photo: team.photo_url ?? '',
      members: membersByTeam.get(team.id) ?? [],
      hobbies: hobbiesByTeam.get(team.id) ?? [],
      prefectures: prefecturesByTeam.get(team.id) ?? [],
      availabilities: weekdaysByTeam.get(team.id) ?? []
    }))

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
