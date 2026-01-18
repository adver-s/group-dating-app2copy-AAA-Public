import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { getUserIdFromRequest } from '../../../../utils/api'
import { executeQuery } from '@/utils/database'

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
}

async function getActiveTeamId(userId: string) {
  const rows = await executeQuery<{ team_id: number }>(
    `
      SELECT t.id as team_id
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `,
    [userId]
  )
  return rows[0]?.team_id
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const userTeamId = await getActiveTeamId(currentUserId)
    if (!userTeamId) {
      return NextResponse.json([])
    }

    const rows = await executeQuery(
      `
        SELECT
          tmf.id,
          tmf.created_at,
          t.id   AS team_id,
          t.name AS team_name,
          t.description AS team_description,
          (
            SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id AND tm.is_active = TRUE
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
        WHERE tmf.from_group_id = ? AND tmf.status = 2
        ORDER BY tmf.created_at DESC
      `,
      [userTeamId]
    )

    const formatted = rows.map((item) => ({
      id: item.id,
      team: {
        id: item.team_id,
        name: item.team_name,
        description: item.team_description,
        member_count: Number(item.member_count ?? 0),
        photo: item.photo_url ?? ''
      },
      status: 'hold',
      createdAt: item.created_at
    }))

    log.info('保留リスト取得完了', { count: formatted.length })
    return NextResponse.json(formatted)
  } catch (error) {
    log.error('保留リスト取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { holdId } = await req.json()
    if (!holdId) {
      return NextResponse.json({ error: 'holdId は必須です' }, { status: 400 })
    }

    const userTeamId = await getActiveTeamId(currentUserId)
    if (!userTeamId) {
      return NextResponse.json({ error: 'アクティブなチームが見つかりません' }, { status: 400 })
    }

    const rows = await executeQuery(
      `
        SELECT id FROM team_matching_flows
        WHERE id = ? AND from_group_id = ?
      `,
      [holdId, userTeamId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: '保留データが見つかりません' }, { status: 404 })
    }

    await executeQuery(
      `
        UPDATE team_matching_flows
        SET status = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [holdId]
    )

    log.info('保留から提案に変更完了', { holdId })
    return NextResponse.json({ success: true, message: '保留から提案に変更しました' })
  } catch (error) {
    log.error('保留から提案への変更エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const holdId = searchParams.get('holdId')
    if (!holdId) {
      return NextResponse.json({ error: 'holdId は必須です' }, { status: 400 })
    }

    const userTeamId = await getActiveTeamId(currentUserId)
    if (!userTeamId) {
      return NextResponse.json({ error: 'アクティブなチームが見つかりません' }, { status: 400 })
    }

    const rows = await executeQuery(
      `
        SELECT id FROM team_matching_flows
        WHERE id = ? AND from_group_id = ?
      `,
      [holdId, userTeamId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: '保留データが見つかりません' }, { status: 404 })
    }

    await executeQuery(`DELETE FROM team_matching_flows WHERE id = ?`, [holdId])

    log.info('保留リストから削除完了', { holdId })
    return NextResponse.json({ success: true, message: '保留リストから削除しました' })
  } catch (error) {
    log.error('保留リスト削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
})
