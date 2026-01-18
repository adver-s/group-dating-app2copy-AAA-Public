import { NextRequest, NextResponse } from 'next/server'
import { ResponseHandler } from '@/utils/api/ResponseHandler'
import { ErrorHandler, requireAuth } from '../utils/errors'

// API ミドルウェアの型定義
export type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>

// 認証が必要なAPI用のミドルウェア
export const withAuth = (handler: ApiHandler) => {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // 認証チェック
      const token = requireAuth(req)

      // トークンの検証（実際の実装では JWT の検証を行う）
      // const user = await verifyToken(token)

      // リクエストにユーザー情報を追加
      req.headers.set('x-user-id', 'user_id_from_token') // 実際の実装では検証済みユーザーID

      return await handler(req, context)
    } catch (error) {
      return ErrorHandler.handle(error as Error, 'withAuth middleware')
    }
  }
}

// 管理者権限が必要なAPI用のミドルウェア
export const withAdminAuth = (handler: ApiHandler) => {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // 認証チェック
      const token = requireAuth(req)

      // 管理者権限チェック
      // const user = await verifyToken(token)
      // if (user.role !== 'admin') {
      //   throw createError.authorization('管理者権限が必要です')
      // }

      return await handler(req, context)
    } catch (error) {
      return ErrorHandler.handle(error as Error, 'withAdminAuth middleware')
    }
  }
}

// レート制限用のミドルウェア
export const withRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (handler: ApiHandler) => {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        const now = Date.now()

        // 既存のリクエスト情報を取得
        const clientRequests = requests.get(clientId)

        if (!clientRequests || now > clientRequests.resetTime) {
          // 新しいウィンドウを開始
          requests.set(clientId, { count: 1, resetTime: now + windowMs })
        } else {
          // リクエスト数を増加
          clientRequests.count++

          if (clientRequests.count > maxRequests) {
            return ResponseHandler.success(
              null,
              'リクエスト制限に達しました。しばらく待ってから再試行してください。',
              429
            )
          }
        }

        return await handler(req, context)
      } catch (error) {
        return ErrorHandler.handle(error as Error, 'withRateLimit middleware')
      }
    }
  }
}

// CORS用のミドルウェア
export const withCors = (handler: ApiHandler) => {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const response = await handler(req, context)

    // CORS ヘッダーを追加
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response
  }
}

// ログ用のミドルウェア
export const withLogging = (handler: ApiHandler) => {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const method = req.method
    const url = req.url

    try {
      const response = await handler(req, context)
      const duration = Date.now() - startTime

      console.log(`${method} ${url} - ${response.status} - ${duration}ms`)

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`${method} ${url} - ERROR - ${duration}ms`, error)
      throw error
    }
  }
}

// 複数のミドルウェアを組み合わせる関数
export const compose = (...middlewares: Array<(handler: ApiHandler) => ApiHandler>) => {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// よく使用されるミドルウェアの組み合わせ
export const withStandardMiddleware = compose(
  withLogging,
  withCors,
  withRateLimit()
)

export const withAuthMiddleware = compose(
  withLogging,
  withCors,
  withRateLimit(),
  withAuth
)

export const withAdminMiddleware = compose(
  withLogging,
  withCors,
  withRateLimit(),
  withAdminAuth
)
