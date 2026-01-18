import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, keptGroupId } = body

    if (!userId || !keptGroupId) {
      return NextResponse.json(
        { success: false, error: 'userId and keptGroupId are required' },
        { status: 400 }
      )
    }

    const userIdNum = Number(userId)
    const keptGroupIdNum = Number(keptGroupId)
    if (Number.isNaN(userIdNum) || Number.isNaN(keptGroupIdNum)) {
      return NextResponse.json(
        { success: false, error: 'userId and keptGroupId must be numbers' },
        { status: 400 }
      )
    }

    const existing = await executeQuery(
      `
        SELECT id FROM keep_list
        WHERE user_id = ? AND kept_group_id = ?
        LIMIT 1
      `,
      [userIdNum, keptGroupIdNum]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Group is already kept' },
        { status: 400 }
      )
    }

    const keepId = `keep_${Date.now()}`
    await executeQuery(
      `
        INSERT INTO keep_list (id, user_id, kept_group_id)
        VALUES (?, ?, ?)
      `,
      [keepId, userIdNum, keptGroupIdNum]
    )

    return NextResponse.json({
      success: true,
      data: { id: keepId, userId: userIdNum, keptGroupId: keptGroupIdNum }
    })
  } catch (error) {
    console.error('Error creating keep:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const keptGroupId = searchParams.get('keptGroupId')

    if (!userId || !keptGroupId) {
      return NextResponse.json(
        { success: false, error: 'userId and keptGroupId are required' },
        { status: 400 }
      )
    }

    const userIdNum = Number(userId)
    const keptGroupIdNum = Number(keptGroupId)
    if (Number.isNaN(userIdNum) || Number.isNaN(keptGroupIdNum)) {
      return NextResponse.json(
        { success: false, error: 'userId and keptGroupId must be numbers' },
        { status: 400 }
      )
    }

    const existing = await executeQuery(
      `
        SELECT id FROM keep_list
        WHERE user_id = ? AND kept_group_id = ?
        LIMIT 1
      `,
      [userIdNum, keptGroupIdNum]
    )

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keep entry not found' },
        { status: 404 }
      )
    }

    await executeQuery(
      `
        DELETE FROM keep_list
        WHERE user_id = ? AND kept_group_id = ?
      `,
      [userIdNum, keptGroupIdNum]
    )

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting keep:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
