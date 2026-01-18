import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../utils/database'
import { getUserIdFromRequest } from '../../../../utils/api'

async function ensureVerificationsTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT,
      document_image TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT,
      rejection_reason TEXT,
      admin_notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(request)
    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = parseInt(currentUserId, 10)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    await ensureVerificationsTable()

    const formData = await request.formData()
    const documentType = formData.get('documentType') as string
    const documentNumber = formData.get('documentNumber') as string | null
    const documentImage = formData.get('documentImage') as File
    const birthDate = formData.get('birthDate') as string

    if (!documentType || !documentImage || !birthDate) {
      return NextResponse.json({
        error: '必要な情報が不足しています'
      }, { status: 400 })
    }

    const birthDateObj = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    if (age < 20) {
      return NextResponse.json(
        { error: '20歳未満の方はご利用いただけません' },
        { status: 403 }
      )
    }

    if (documentImage.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '画像サイズが大きすぎます（最大10MB）' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(documentImage.type)) {
      return NextResponse.json({
        error: '対応していない画像形式です'
      }, { status: 400 })
    }

    const existingVerification = await executeQuery(
      `
      SELECT id, status
      FROM verifications
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
      [userId]
    )

    if (existingVerification.length > 0 && existingVerification[0].status === 'pending') {
      return NextResponse.json({
        error: '既に審査中の本人確認書類があります'
      }, { status: 400 })
    }

    const imageBuffer = Buffer.from(await documentImage.arrayBuffer())
    const fileName = `${Date.now()}_${documentImage.name}`
    let imageUrl: string

    try {
      const { saveImage } = require('../../../../utils/s3-upload')
      imageUrl = await saveImage(imageBuffer, fileName, 'verification')
    } catch (uploadError) {
      console.error('画像アップロードエラー:', uploadError)
      return NextResponse.json({
        error: '画像のアップロードに失敗しました'
      }, { status: 500 })
    }

    const inserted = await executeQuery(
      `
      INSERT INTO verifications (user_id, document_type, document_number, document_image, status)
      VALUES (?, ?, ?, ?, 'pending')
      RETURNING id
    `,
      [userId, documentType, documentNumber || null, imageUrl]
    )

    await executeQuery(
      `UPDATE users SET age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [age, userId]
    )

    return NextResponse.json({
      success: true,
      message: '本人確認書類を送信しました',
      verificationId: inserted[0]?.id ?? null
    })
  } catch (error) {
    console.error('本人確認送信エラー:', error)
    return NextResponse.json(
      { error: '本人確認書類の送信に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(request)
    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = parseInt(currentUserId, 10)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    await ensureVerificationsTable()

    const [userRow] = await executeQuery(
      `SELECT is_verified FROM users WHERE id = ?`,
      [userId]
    )

    const latestVerificationRows = await executeQuery(
      `
      SELECT 
        id,
        document_type,
        document_number,
        document_image,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        admin_notes
      FROM verifications
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
      [userId]
    )

    const latestVerification = latestVerificationRows.length > 0 ? latestVerificationRows[0] : null

    return NextResponse.json({
      isVerified: !!userRow?.is_verified,
      latestVerification
    })
  } catch (error) {
    console.error('本人確認状態取得エラー:', error)
    return NextResponse.json(
      { error: '本人確認状態の取得に失敗しました' },
      { status: 500 }
    )
  }
}
