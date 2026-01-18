import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '../../types'

// カスタムエラークラス
export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 認証エラー
export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

// 認可エラー
export class AuthorizationError extends AppError {
  constructor(message: string = '権限がありません') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

// バリデーションエラー
export class ValidationError extends AppError {
  constructor(message: string = '入力値が無効です') {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

// リソースが見つからないエラー
export class NotFoundError extends AppError {
  constructor(message: string = 'リソースが見つかりません') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

// データベースエラー
export class DatabaseError extends AppError {
  constructor(message: string = 'データベースエラーが発生しました') {
    super(message, 500, 'DATABASE_ERROR')
  }
}

// 外部APIエラー
export class ExternalApiError extends AppError {
  constructor(message: string = '外部APIエラーが発生しました') {
    super(message, 502, 'EXTERNAL_API_ERROR')
  }
}

// レート制限エラー
export class RateLimitError extends AppError {
  constructor(message: string = 'リクエスト制限に達しました') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

// エラーハンドラー
export class ErrorHandler {
  // エラーをログに記録
  private static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString()
    const errorInfo = {
      timestamp,
      message: error.message,
      stack: error.stack,
      context,
      type: error.constructor.name
    }

    // 本番環境では適切なログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      console.error('Error logged:', errorInfo)
      // TODO: 本番環境では CloudWatch や Sentry などに送信
    } else {
      console.error('Development error:', errorInfo)
    }
  }

  // エラーをAPIレスポンス形式に変換
  private static formatErrorResponse(error: AppError): ApiError {
    return {
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  // メインエラーハンドラー
  static handle(error: Error, context?: string): NextResponse {
    // エラーログを記録
    this.logError(error, context)

    // 既知のエラーの場合
    if (error instanceof AppError) {
      return NextResponse.json(
        this.formatErrorResponse(error),
        { status: error.statusCode }
      )
    }

    // 予期しないエラーの場合
    const unexpectedError = new AppError(
      '予期しないエラーが発生しました',
      500,
      'UNEXPECTED_ERROR'
    )

    return NextResponse.json(
      this.formatErrorResponse(unexpectedError),
      { status: 500 }
    )
  }

  // API ルート用のエラーハンドラー
  static async withErrorHandling(
    handler: (req: NextRequest) => Promise<NextResponse>,
    req: NextRequest,
    context?: string
  ): Promise<NextResponse> {
    try {
      return await handler(req)
    } catch (error) {
      return this.handle(error as Error, context)
    }
  }

  // 非同期関数用のエラーハンドラー
  static async withAsyncErrorHandling<T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await asyncFn()
    } catch (error) {
      this.logError(error as Error, context)
      throw error
    }
  }
}

// 便利なエラーファクトリー関数
export const createError = {
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
  validation: (message?: string) => new ValidationError(message),
  notFound: (message?: string) => new NotFoundError(message),
  database: (message?: string) => new DatabaseError(message),
  externalApi: (message?: string) => new ExternalApiError(message),
  rateLimit: (message?: string) => new RateLimitError(message)
}

// バリデーション用のヘルパー関数
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName}は必須です`)
  }
}

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('有効なメールアドレスを入力してください')
  }
}

export const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new ValidationError('パスワードは6文字以上である必要があります')
  }
}

export const validateStringLength = (value: string, min: number, max: number, fieldName: string): void => {
  if (value.length < min) {
    throw new ValidationError(`${fieldName}は${min}文字以上である必要があります`)
  }
  if (value.length > max) {
    throw new ValidationError(`${fieldName}は${max}文字以下である必要があります`)
  }
}

export const validateNumberRange = (value: number, min: number, max: number, fieldName: string): void => {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName}は${min}から${max}の範囲で入力してください`)
  }
}

// 認証チェック用のヘルパー関数
export const requireAuth = (req: NextRequest): string => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError.authentication('認証トークンが必要です')
  }

  const token = authHeader.substring(7)
  if (!token) {
    throw createError.authentication('認証トークンが無効です')
  }

  return token
}

// 管理者権限チェック用のヘルパー関数
export const requireAdmin = (user: any): void => {
  if (!user || user.role !== 'admin') {
    throw createError.authorization('管理者権限が必要です')
  }
}
