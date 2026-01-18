import { prisma } from '@/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../../utils/auth/jwt'

// 管理者認証チェック
async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = await verifyToken(token)

  if (!decoded || !decoded.userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(decoded.userId) },
    select: { cognito_sub: true }
  })

  // 管理者チェック（cognito_subで確認）
  // TODO: 適切な管理者チェックロジックを実装
  if (user) {
    return decoded
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // フィルター条件を構築
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // フィードバック機能は削除されました
    // 全フィードバックを取得
    // const feedbacks = await prisma.feedback.findMany({
    //   where,
    //   orderBy: {
    //     createdAt: 'desc'
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         username: true,
    //         cognito_sub: true
    //       }
    //     }
    //   }
    // })

    // 仮の空データ
    const feedbacks: any[] = []

    // CSVヘッダー
    const headers = [
      'ID',
      'ユーザーID',
      'ユーザー名',
      'Cognito Sub',
      'カテゴリ',
      'タイトル',
      '内容',
      'ステータス',
      '優先度',
      '管理者メモ',
      '作成日時',
      '解決日時',
      '解決者',
      '更新日時'
    ]

    // CSVデータ
    const csvData = feedbacks.map(feedback => [
      feedback.id,
      feedback.userId,
      feedback.user.username,
      feedback.user.cognito_sub,
      feedback.category,
      `"${feedback.title.replace(/"/g, '""')}"`,
      `"${feedback.content.replace(/"/g, '""')}"`,
      feedback.status,
      feedback.priority,
      feedback.admin_notes ? `"${feedback.admin_notes.replace(/"/g, '""')}"` : '',
      feedback.createdAt.toISOString(),
      feedback.resolved_at ? feedback.resolved_at.toISOString() : '',
      feedback.resolved_by || '',
      feedback.updated_at.toISOString()
    ])

    // CSV文字列を生成
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    // ファイル名を生成
    const now = new Date()
    const timestamp = now.toISOString().split('T')[0]
    const filename = `feedback_export_${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Feedback export error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
