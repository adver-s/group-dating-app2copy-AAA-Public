import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../utils/database'

export async function GET(_request: NextRequest) {
  try {
    const hasTable = await executeQuery(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'verifications'
    `)

    if (!hasTable || hasTable.length === 0) {
      return NextResponse.json({ success: true, verifications: [] })
    }

    const verifications = await executeQuery(`
      SELECT 
        v.id,
        v.user_id,
        v.document_type,
        v.document_number,
        v.document_image,
        v.status,
        v.submitted_at,
        v.reviewed_at,
        v.reviewed_by,
        v.rejection_reason,
        v.admin_notes,
        u.username,
        u.email
      FROM verifications v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.submitted_at DESC
    `)

    return NextResponse.json({
      success: true,
      verifications: verifications.map(v => ({
        id: v.id,
        user_id: v.user_id,
        document_type: v.document_type,
        document_number: v.document_number,
        document_image: v.document_image,
        status: v.status,
        submitted_at: v.submitted_at,
        reviewed_at: v.reviewed_at,
        reviewed_by: v.reviewed_by,
        rejection_reason: v.rejection_reason,
        admin_notes: v.admin_notes,
        username: v.username,
        email: v.email
      }))
    })
  } catch (error) {
    console.error('本人確認データ取得エラー:', error)
    return NextResponse.json(
      { error: '本人確認データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
