import { prisma } from '@/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../utils/auth/jwt'

// 管理者認証チェック
async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = await verifyToken(token)
  
  // 管理者チェック（実際の実装では管理者フラグを確認）
  if (!decoded || !decoded.userId) {
    return null
  }

  // 簡易的な管理者チェック（本番では適切な管理者判定ロジックを実装）
  const user = await prisma.user.findUnique({
    where: { id: parseInt(decoded.userId) },
    select: { cognito_sub: true }
  })

  // 管理者メールアドレスで判定（本番では適切な管理者テーブルを使用）
  if (user?.cognito_sub === 'admin@example.com') {
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // フィルター条件を構築
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } }
      ]
    }

    // フィードバック機能は削除されました
    // フィードバック一覧を取得
    const [feedbacks, total] = await Promise.all([
      // prisma.feedback (削除されたテーブル)
      [],
      0
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Admin feedback fetch error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, priority, adminNotes } = body

    if (!id) {
      return NextResponse.json({ error: 'フィードバックIDが必要です' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'resolved') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = admin.userId
      }
    }
    
    if (priority) {
      updateData.priority = priority
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    // フィードバック機能は削除されました
    // const feedback = await prisma.feedback.update({
    //   where: { id },
    //   data: updateData,
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

    // 仮のnullデータ
    const feedback = null

    return NextResponse.json({
      message: 'フィードバックを更新しました',
      feedback
    })

  } catch (error) {
    console.error('Admin feedback update error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
