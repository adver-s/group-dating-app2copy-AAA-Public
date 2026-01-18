import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, matchingId, groupId, judgement } = body

    if (!userId || !matchingId || !groupId || !judgement) {
      return NextResponse.json(
        { success: false, error: 'userId, matchingId, groupId, and judgement are required' },
        { status: 400 }
      )
    }

    if (!['UNSET', 'LIKE', 'PASS'].includes(judgement)) {
      return NextResponse.json(
        { success: false, error: 'Invalid judgement value' },
        { status: 400 }
      )
    }

    const judgementId = `${matchingId}_${userId}`

    await executeQuery(
      `
        INSERT INTO group_member_judgements (id, matchingId, userId, groupId, judgement, updatedAt)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(matchingId, userId) DO NOTHING
      `,
      [judgementId, matchingId, userId, groupId, judgement]
    )

    await updateMatchingFlowStatus(matchingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating judgement:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateMatchingFlowStatus(matchingId: string) {
  const flowRows = await executeQuery(
    `
      SELECT
        tmf.id,
        tmf.from_group_id,
        tmf.to_group_id,
        tmf.status
      FROM team_matching_flows tmf
      WHERE tmf.id = ?
    `,
    [matchingId]
  )

  if (flowRows.length === 0) return

  const flow = flowRows[0]

  const memberRows = await executeQuery(
    `
      SELECT tm.team_id, COUNT(DISTINCT tm.user_id) AS count
      FROM team_members tm
      WHERE tm.team_id IN (?, ?)
      GROUP BY tm.team_id
    `,
    [flow.from_group_id, flow.to_group_id]
  )

  const fromGroupMembers = Number(memberRows.find((m: any) => m.team_id === flow.from_group_id)?.count ?? 0)
  const toGroupMembers = Number(memberRows.find((m: any) => m.team_id === flow.to_group_id)?.count ?? 0)

  const judgementRows = await executeQuery(
    `
      SELECT judgement, groupId
      FROM group_member_judgements
      WHERE matchingId = ?
    `,
    [matchingId]
  ) as any[]

  const fromGroupJudgements = judgementRows.filter((j) => j.groupId === flow.from_group_id)
  const toGroupJudgements = judgementRows.filter((j) => j.groupId === flow.to_group_id)

  const fromGroupAllLiked =
    fromGroupMembers > 0 &&
    fromGroupJudgements.length === fromGroupMembers &&
    fromGroupJudgements.every((j) => j.judgement === 'LIKE')

  const toGroupAllLiked =
    toGroupMembers > 0 &&
    toGroupJudgements.length === toGroupMembers &&
    toGroupJudgements.every((j) => j.judgement === 'LIKE')

  const hasRejection = judgementRows.some((j) => j.judgement === 'PASS')

  let newStatus = flow.status
  if (hasRejection) {
    newStatus = 4 // rejected
  } else if (fromGroupAllLiked && toGroupAllLiked) {
    newStatus = 3 // agreed / confirmed
  } else if (fromGroupAllLiked || toGroupAllLiked) {
    newStatus = 2 // pending other team
  } else {
    newStatus = 1 // in-progress
  }

  if (newStatus !== flow.status) {
    await executeQuery(
      `
        UPDATE team_matching_flows
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [newStatus, matchingId]
    )
  }
}
