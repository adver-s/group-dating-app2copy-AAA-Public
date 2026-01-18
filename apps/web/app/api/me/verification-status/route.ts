import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { executeQuery } from '../../../../utils/database'

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  // 認証チェック（簡易版）
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  // 開発環境用の簡易ユーザーID取得
  const token = authHeader.replace('Bearer ', '')
  let currentUserId: string

  try {
    const base64 = token.split('.')[1] || ''
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    const payload = JSON.parse(json)
    currentUserId = payload.sub || 'user_1754107511944_nv3utk089'
  } catch {
    currentUserId = 'user_1754107511944_nv3utk089'
  }

  const userIdInt = parseInt(currentUserId, 10)
  if (Number.isNaN(userIdInt)) {
    log.warn('ユーザーIDが数値に変換できません', { currentUserId })
    return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
  }

  log.info('本人確認ステータス取得開始:', { currentUserId })

  try {
    // ユーザーの本人確認状態を取得
    const userRows = await executeQuery(`
      SELECT 
        id,
        username,
        is_verified
      FROM users 
      WHERE id = ?
    `, [userIdInt])

    if (!userRows || userRows.length === 0) {
      log.warn('ユーザーが見つかりません', { userId: currentUserId })
      return NextResponse.json({
        error: 'ユーザーが見つかりません'
      }, { status: 404 })
    }

    const user = userRows[0]

    // 最新の本人確認申請を取得（テーブル有無を確認）
    let latestVerification: any = null
    try {
      const hasVerificationTable = await executeQuery(`
        SELECT name 
        FROM sqlite_master 
        WHERE type = 'table' AND name = 'verifications'
      `)

      if (hasVerificationTable.length > 0) {
        const verificationRows = await executeQuery(`
          SELECT 
            id,
            document_type,
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
        `, [userIdInt])

        if (verificationRows.length > 0) {
          latestVerification = verificationRows[0]
        }
      } else {
        log.warn('verifications テーブルが存在しないため、本人確認履歴をスキップします')
      }
    } catch (verificationError) {
      log.warn('本人確認履歴の取得に失敗しましたが処理を継続します', verificationError)
    }

    const verificationStatus = {
      userId: user.id,
      username: user.username,
      isVerified: user.is_verified,
      hasSubmittedVerification: !!latestVerification,
      latestVerification: latestVerification ? {
        id: latestVerification.id,
        documentType: latestVerification.document_type,
        status: latestVerification.status,
        submittedAt: latestVerification.submitted_at,
        reviewedAt: latestVerification.reviewed_at,
        adminNotes: latestVerification.admin_notes ?? latestVerification.rejection_reason ?? null,
        reviewedBy: latestVerification.reviewed_by ?? null
      } : null
    }

    log.info('ユーザー本人確認状態取得完了', {
      userId: user.id,
      isVerified: verificationStatus.isVerified,
      hasSubmittedVerification: verificationStatus.hasSubmittedVerification,
      latestStatus: latestVerification?.status || 'none'
    })

    return NextResponse.json(verificationStatus)

  } catch (error) {
    log.error('ユーザー本人確認状態取得エラー:', error)
    throw error
  }
})
