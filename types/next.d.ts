// Next.js 関連の型定義

import { NextRequest, NextResponse } from 'next/server'

// API ハンドラーの型定義
export type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>

// ミドルウェアの型定義
export type Middleware = (handler: ApiHandler) => ApiHandler

// ページコンポーネントの型定義
export type PageComponent = React.ComponentType<any>

// レイアウトコンポーネントの型定義
export type LayoutComponent = React.ComponentType<{
  children: React.ReactNode
}>

// 認証済みユーザーの型定義
export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role?: 'user' | 'admin'
}

// リクエスト拡張
declare module 'next/server' {
  interface NextRequest {
    user?: AuthenticatedUser
  }
}
