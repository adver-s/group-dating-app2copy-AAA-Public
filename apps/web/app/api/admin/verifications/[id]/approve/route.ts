import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: verificationIdParam } = await params
    const verificationId = parseInt(verificationIdParam, 10)

    if (Number.isNaN(verificationId)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 })
    }

    const updated = await executeQuery(
      `
      UPDATE verifications
      SET status = 'approved',
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = 'admin',
          admin_notes = NULL,
          rejection_reason = NULL
      WHERE id = ?
      RETURNING user_id
    `,
      [verificationId]
    )

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: '本人確認が見つかりません' }, { status: 404 })
    }

    const userId = updated[0].user_id

    await executeQuery(
      `UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      message: '本人確認を承認しました'
    })
  } catch (error) {
    console.error('本人確認承認エラー:', error)
    return NextResponse.json(
      { error: '本人確認の承認に失敗しました' },
      { status: 500 }
    )
  }
}
