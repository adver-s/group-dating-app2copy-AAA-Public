import { NextResponse } from 'next/server'
import { ApiResponse, PaginatedResponse } from '../../types'

// 成功レスポンス用のヘルパー関数
export class ResponseHandler {
  // 基本的な成功レスポンス
  static success<T>(data: T, message?: string, status: number = 200): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    }
    return NextResponse.json(response, { status })
  }

  // 作成成功レスポンス
  static created<T>(data: T, message: string = 'リソースが正常に作成されました'): NextResponse {
    return this.success(data, message, 201)
  }

  // 更新成功レスポンス
  static updated<T>(data: T, message: string = 'リソースが正常に更新されました'): NextResponse {
    return this.success(data, message, 200)
  }

  // 削除成功レスポンス
  static deleted(message: string = 'リソースが正常に削除されました'): NextResponse {
    return this.success(null, message, 200)
  }

  // ページネーション付きレスポンス
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): NextResponse {
    const totalPages = Math.ceil(total / limit)
    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
    return this.success(response, message)
  }

  // 空のリストレスポンス
  static emptyList(message: string = 'データが見つかりませんでした'): NextResponse {
    return this.success([], message)
  }

  // 認証成功レスポンス
  static authenticated(token: string, user: any, message: string = '認証に成功しました'): NextResponse {
    return this.success({ token, user }, message)
  }

  // ファイルアップロード成功レスポンス
  static fileUploaded(url: string, message: string = 'ファイルが正常にアップロードされました'): NextResponse {
    return this.success({ url }, message)
  }

  // バッチ処理成功レスポンス
  static batchProcessed(
    processed: number,
    total: number,
    message: string = 'バッチ処理が完了しました'
  ): NextResponse {
    return this.success(
      { processed, total, success: processed === total },
      message
    )
  }
}

// 便利な関数としてもエクスポート
export const {
  success,
  created,
  updated,
  deleted,
  paginated,
  emptyList,
  authenticated,
  fileUploaded,
  batchProcessed
} = ResponseHandler
