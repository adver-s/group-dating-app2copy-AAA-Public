import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/utils/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    const body = await request.json()
    const { category, title, content } = body

    // バリデーション
    if (!title || !content) {
      return NextResponse.json({ error: 'タイトルと内容は必須です' }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json({ error: 'タイトルは100文字以内で入力してください' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: '内容は2000文字以内で入力してください' }, { status: 400 })
    }

    // カテゴリのバリデーション
    const validCategories = ['general', 'bug', 'feature', 'complaint', 'praise', 'other']
    const finalCategory = validCategories.includes(category) ? category : 'general'

   // フィードバックを作成
   // NOTE: feedbackテーブルがPrismaスキーマに存在しないため、一時的にダミーレスポンスを返す
   console.log('フィードバック受信:', { userId: decoded.userId, category: finalCategory, title, content })
   const feedback = {
     id: Date.now(),
     userId: decoded.userId,
     category: finalCategory,
     title: title.trim(),
     content: content.trim(),
     status: 'pending',
     priority: 'normal',
     createdAt: new Date(),
     user: {
       username: 'user',
       email: null
     }
   }

    return NextResponse.json({
      message: 'ご意見を送信しました',
      feedback: {
        id: feedback.id,
        category: feedback.category,
        title: feedback.title,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    })

  } catch (error) {
    console.error('Feedback creation error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

   // ユーザーのフィードバック履歴を取得
   // NOTE: feedbackテーブルがPrismaスキーマに存在しないため、空配列を返す
   const feedbacks: any[] = []

   return NextResponse.json({ feedbacks })

  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
