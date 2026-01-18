'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { decodeToken } from '../utils/auth/jwt';

interface User {
  id: string
  email: string
  name: string
  ageVerified?: boolean
  accountId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAgeVerified: boolean
  login: (email: string, password: string, name?: string) => Promise<boolean>
  loginWithToken: (token: string) => void
  signup: (email: string, password: string, name: string, birthdate?: string, location?: string, bio?: string, gender?: string, interests?: string[]) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 認証状態をチェック
  const checkAuth = async () => {
    try {
      // 開発環境でも、まずはローカルのトークンを優先して使用
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const devToken = localStorage.getItem('accessToken')
        if (devToken) {
          try {
            const payload = decodeToken(devToken)
            if (payload && payload.sub) {
              setUser({
                id: payload.sub,
                email: payload.email || 'user@example.com',
                name: payload.name || 'ユーザー',
                ageVerified: payload.ageVerified || false,
                accountId: payload.accountId
              })
              setLoading(false)
              return
            }
          } catch (_e) {
            // フォールバックで開発ユーザーを使用
          }
        }
        // トークンが無い/不正な場合のみ、開発用ユーザーにフォールバック
        setUser({
          id: 'dev-user-1',
          email: 'dev@example.com',
          name: '開発ユーザー',
          ageVerified: true
        })
        setLoading(false)
        return
      }

      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      // JWTトークンからユーザーIDを取得
      try {
        const payload = decodeToken(token)
        console.log('🔍 JWT payload:', payload)

        if (payload && payload.sub) {
          setUser({
            id: payload.sub,
            email: payload.email || 'user@example.com',
            name: payload.name || 'ユーザー',
            ageVerified: payload.ageVerified || false,
            accountId: payload.accountId
          })
          console.log('✅ ユーザー情報をJWTから設定:', payload.sub)
        } else {
          console.error('❌ JWTにsubフィールドがありません')
          setUser(null)
        }
      } catch (jwtError) {
        console.error('❌ JWTデコードエラー:', jwtError)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // ログイン
  const login = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      console.log('🔍 Attempting login for:', email);

      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()
      console.log('🔍 Login response status:', response.status);
      console.log('🔍 Login response data:', data);

      if (response.ok) {
        console.log('✅ Login successful, saving tokens');
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        // JWTトークンからユーザー情報を取得
        try {
          const payload = decodeToken(data.accessToken)
          console.log('🔍 Login JWT payload:', payload)

          if (payload && payload.sub) {
            setUser({
              id: payload.sub,
              email,
              name: payload.name || 'ユーザー',
              ageVerified: payload.ageVerified || false,
              accountId: payload.accountId
            })
            console.log('✅ ログイン時にユーザー情報をJWTから設定:', payload.sub)
          } else {
            console.error('❌ ログインJWTにsubフィールドがありません')
            setUser(null)
          }
        } catch (jwtError) {
          console.error('❌ ログインJWTデコードエラー:', jwtError)
          setUser(null)
        }

        return true
      } else {
        console.log('❌ Login failed:', data.error);
        // メール確認が必要な場合の特別な処理
        if (data.error?.includes('UserNotConfirmedException') || data.error?.includes('User not confirmed')) {
          throw new Error('アカウントの確認が必要です。管理者にお問い合わせください。')
        }
        throw new Error(data.error || 'ログインに失敗しました')
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      return false
    }
  }

  // トークンでログイン（年齢確認後など）
  const loginWithToken = (token: string) => {
    try {
      localStorage.setItem('accessToken', token)

      const payload = decodeToken(token)
      if (payload && payload.sub) {
        setUser({
          id: payload.sub,
          email: payload.email || 'user@example.com',
          name: payload.name || 'ユーザー',
          ageVerified: payload.ageVerified || false,
          accountId: payload.accountId
        })
      }
    } catch (error) {
      console.error('Token login failed:', error)
    }
  }

  // 新規登録
  const signup = async (email: string, password: string, name: string, birthdate?: string, location?: string, bio?: string, gender?: string, interests?: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, birthdate, location, bio, gender, interests })
      })

      const data = await response.json()

      if (response.ok) {
        // サインアップ成功時にそのままログイン状態にする（アクセストークン保存）
        if (data?.accessToken) {
          localStorage.setItem('accessToken', data.accessToken)
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken)
          }

          try {
            const payload = decodeToken(data.accessToken)
            if (payload && payload.sub) {
              setUser({
                id: payload.sub,
                email: payload.email || email,
                name: payload.name || name || 'ユーザー',
                ageVerified: payload.ageVerified || false,
                accountId: payload.accountId
              })
            }
          } catch (e) {
            console.error('❌ サインアップ後のJWTデコードに失敗:', e)
          }
        }
        return true
      } else {
        // Cognitoのエラーメッセージを日本語に変換
        let errorMessage = data.error || '登録に失敗しました'
        if (data.error?.includes('InvalidPasswordException')) {
          errorMessage = 'パスワードが要件を満たしていません。大文字・小文字・数字を含む8文字以上で入力してください。'
        } else if (data.error?.includes('UsernameExistsException')) {
          errorMessage = 'このメールアドレスは既に登録されています。'
        } else if (data.error?.includes('InvalidParameterException')) {
          errorMessage = '入力内容に問題があります。カスタム属性の形式を確認してください。'
        } else if (data.error?.includes('Registration failed')) {
          errorMessage = '登録に失敗しました。入力内容を確認してください。'
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Signup failed:', error)
      return false
    }
  }

  // ログアウト
  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  // アクセストークンを取得
  const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken')
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAgeVerified: true, // 年齢確認状態を常にtrueとして扱う
    login,
    loginWithToken,
    signup,
    logout,
    checkAuth,
    getAccessToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 