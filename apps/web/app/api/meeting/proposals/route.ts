import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { getUserIdFromRequest } from '../../../../utils/api'
import { executeQuery } from '@/utils/database'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const teamRows = await executeQuery<{ id: number }>(
      `
        SELECT t.id
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
        LIMIT 1
      `,
      [currentUserId]
    )

    if (teamRows.length === 0) {
      return NextResponse.json([])
    }

    const userTeamId = teamRows[0].id

    const proposals = await executeQuery(
      `
        SELECT
          tmf.id,
          tmf.created_at,
          t.id   AS team_id,
          t.name AS team_name,
          t.description AS team_description,
          (
            SELECT COUNT(*)
            FROM team_members tm
            WHERE tm.team_id = t.id AND tm.is_active = TRUE
          ) AS member_count,
          (
            SELECT tp.photo_url
            FROM team_photos tp
            WHERE tp.team_id = t.id AND tp.status = 'active'
            ORDER BY tp.display_order ASC
            LIMIT 1
          ) AS photo_url
        FROM team_matching_flows tmf
        JOIN teams t ON tmf.to_group_id = t.id
        WHERE tmf.from_group_id = ? AND tmf.status = 0
        ORDER BY tmf.created_at DESC
      `,
      [userTeamId]
    )

    const formatted = proposals.map((proposal) => ({
      id: proposal.id,
      team: {
        id: proposal.team_id,
        name: proposal.team_name,
        description: proposal.team_description,
        member_count: Number(proposal.member_count ?? 0),
        photo: proposal.photo_url ?? ''
      },
      status: 'sent',
      createdAt: proposal.created_at
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('送った提案リスト取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
})
