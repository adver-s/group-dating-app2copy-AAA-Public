import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/utils/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: verificationIdParam } = await params
    const verificationId = parseInt(verificationIdParam, 10)

    if (Number.isNaN(verificationId)) {
      return NextResponse.json({ error: '不正なIDです' }, { status: 400 })
    }

    const body = await request.json()
    const reason = body?.reason ?? 'rejected'

    const updated = await executeQuery(
      `
      UPDATE verifications
      SET status = 'rejected',
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = 'admin',
          admin_notes = ?,
          rejection_reason = ?
      WHERE id = ?
      RETURNING user_id, document_image
    `,
      [reason, reason, verificationId]
    )

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: '本人確認が見つかりません' }, { status: 404 })
    }

    const userId = updated[0].user_id

    await executeQuery(
      `UPDATE users SET is_verified = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      message: '本人確認を却下しました'
    })
  } catch (error) {
    console.error('本人確認却下エラー:', error)
    return NextResponse.json(
      { error: '本人確認の却下に失敗しました' },
      { status: 500 }
    )
  }
}
