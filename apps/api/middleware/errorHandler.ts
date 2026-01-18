import { NextRequest, NextResponse } from 'next/server';
import { AppError, AuthenticationError, DatabaseError, ValidationError } from '../utils/errors';

// ロガーのインポートエラーを回避するため、console.logを使用
const log = {
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || '')
};

export function errorHandler(error: Error, req?: NextRequest): NextResponse {
  log.error(`Error occurred: ${error.message}`, {
    stack: error.stack,
    url: req?.url,
    method: req?.method,
  });

  // カスタムエラーの処理
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  // データベースエラーの処理
  if (error instanceof DatabaseError) {
    log.error('Database error occurred');
    return NextResponse.json(
      {
        success: false,
        error: 'Database operation failed',
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // バリデーションエラーの処理
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // 認証エラーの処理
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statusCode: 401,
      },
      { status: 401 }
    );
  }

  // 予期しないエラーの処理
  log.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
  });

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    },
    { status: 500 }
  );
}

// APIルート用のエラーハンドラー
export function withErrorHandler(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return errorHandler(error as Error, req);
    }
  };
} 