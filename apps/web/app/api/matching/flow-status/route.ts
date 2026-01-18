import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const matchingId = searchParams.get('matchingId')
    const userId = searchParams.get('userId')

    if (!matchingId) {
      return NextResponse.json(
        { success: false, error: 'matchingId is required' },
        { status: 400 }
      )
    }

    const flowRows = await executeQuery(
      `
        SELECT
          tmf.id,
          tmf.from_group_id,
          tmf.to_group_id,
          tmf.status,
          tmf.created_at,
          tmf.updated_at,
          t1.name AS from_team_name,
          t2.name AS to_team_name
        FROM team_matching_flows tmf
        JOIN teams t1 ON tmf.from_group_id = t1.id
        JOIN teams t2 ON tmf.to_group_id = t2.id
        WHERE tmf.id = ?
      `,
      [matchingId]
    )

    if (flowRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matching flow not found' },
        { status: 404 }
      )
    }

    const flow = flowRows[0]

    const membersRows = await executeQuery(
      `
        SELECT tm.user_id, tm.team_id, u.username
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id IN (?, ?)
      `,
      [flow.from_group_id, flow.to_group_id]
    )

    const judgements = await executeQuery(
      `
        SELECT
          id,
          userId,
          groupId,
          judgement,
          updatedAt
        FROM group_member_judgements
        WHERE matchingId = ?
      `,
      [matchingId]
    )

    const fromGroupMembers = membersRows
      .filter((m: any) => m.team_id === flow.from_group_id)
      .map((m: any) => ({ id: m.user_id, username: m.username }))

    const toGroupMembers = membersRows
      .filter((m: any) => m.team_id === flow.to_group_id)
      .map((m: any) => ({ id: m.user_id, username: m.username }))

    let userGroup: { id: number; name: string } | null = null
    if (userId) {
      const userTeam = membersRows.find((m: any) => String(m.user_id) === userId)
      if (userTeam) {
        userGroup = {
          id: userTeam.team_id,
          name: userTeam.team_id === flow.from_group_id ? flow.from_team_name : flow.to_team_name
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        status: flow.status,
        createdAt: flow.created_at,
        statusUpdatedAt: flow.updated_at,
        fromGroup: {
          id: flow.from_group_id,
          name: flow.from_team_name,
          members: fromGroupMembers
        },
        toGroup: {
          id: flow.to_group_id,
          name: flow.to_team_name,
          members: toGroupMembers
        },
        judgements: judgements.map((j: any) => ({
          id: j.id,
          userId: j.userId,
          groupId: j.groupId,
          judgement: j.judgement,
          updatedAt: j.updatedAt
        })),
        userGroup
      }
    })
  } catch (error) {
    console.error('Error fetching flow status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
