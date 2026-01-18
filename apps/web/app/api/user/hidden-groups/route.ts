import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../utils/api'
import { executeQuery } from '../../../../utils/database'

const STATUS_MAP: Record<string, number> = {
  hidden: 0,
  blocked: 1,
  eternal: 2
}

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await executeQuery(
      `
        SELECT 
          uhg.id,
          uhg.user_id,
          uhg.hidden_group_id,
          uhg.status,
          uhg.hidden_start,
          uhg.hidden_until,
          uhg.reason,
          uhg.created_at,
          uhg.updated_at,
          t.name       AS team_name,
          t.description AS team_description
        FROM user_hidden_groups uhg
        LEFT JOIN teams t ON t.id = uhg.hidden_group_id
        WHERE uhg.user_id = ?
        ORDER BY uhg.hidden_start DESC
      `,
      [currentUserId]
    )

    return NextResponse.json(rows ?? [])
  } catch (error) {
    console.error('非表示グループ取得エラー:', error)
    return NextResponse.json(
      { error: '非表示グループ取得エラー' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hiddenGroupId, status, hiddenUntil, reason } = await req.json()

    if (!hiddenGroupId || !status) {
      return NextResponse.json(
        { error: 'hiddenGroupId and status are required' },
        { status: 400 }
      )
    }

    const statusValue = STATUS_MAP[status]
    if (statusValue === undefined) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: hidden, blocked, eternal' },
        { status: 400 }
      )
    }

    const groupRows = await executeQuery(
      `SELECT id FROM teams WHERE id = ?`,
      [hiddenGroupId]
    )

    if (groupRows.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    await executeQuery(
      `DELETE FROM user_hidden_groups WHERE user_id = ? AND hidden_group_id = ?`,
      [currentUserId, hiddenGroupId]
    )

    await executeQuery(
      `
        INSERT INTO user_hidden_groups (
          user_id,
          hidden_group_id,
          status,
          hidden_start,
          hidden_until,
          reason,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [currentUserId, hiddenGroupId, statusValue, hiddenUntil || null, reason || null]
    )

    return NextResponse.json({
      success: true,
      message: 'Hidden group setting saved'
    })
  } catch (error) {
    console.error('非表示グループ設定エラー:', error)
    return NextResponse.json(
      { error: '非表示グループ設定エラー' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const hiddenGroupId = searchParams.get('hidden_group_id')

    if (!hiddenGroupId) {
      return NextResponse.json(
        { error: 'hidden_group_id parameter is required' },
        { status: 400 }
      )
    }

    await executeQuery(
      `
        DELETE FROM user_hidden_groups
        WHERE user_id = ? AND hidden_group_id = ?
      `,
      [currentUserId, hiddenGroupId]
    )

    return NextResponse.json({
      success: true,
      message: 'Hidden group setting removed'
    })
  } catch (error) {
    console.error('非表示グループ削除エラー:', error)
    return NextResponse.json(
      { error: '非表示グループ削除エラー' },
      { status: 500 }
    )
  }
}