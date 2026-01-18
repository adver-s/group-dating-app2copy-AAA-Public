'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'

interface AdminLoginForm {
  username: string
  password: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<AdminLoginForm>({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // 管理者トークンを保存
        localStorage.setItem('adminToken', data.adminToken)
        localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
        
        // 管理者ダッシュボードへリダイレクト
        router.push('/admin')
      } else {
        setError(data.error || 'ログインに失敗しました')
      }
    } catch (error) {
      console.error('管理者ログインエラー:', error)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-red-400 to-purple-500 rounded-full flex items-center justify-center">
            <Icon name="shield-check" className="w-6 h-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            管理者ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            管理者専用のログイン画面です
          </p>
        </div>

        {/* フォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* ユーザー名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ユーザー名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="管理者ユーザー名"
              />
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="管理者パスワード"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ログイン中...
                </div>
              ) : (
                '管理者としてログイン'
              )}
            </button>
          </div>
        </form>

        {/* 注意事項 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• この画面は管理者専用です</li>
            <li>• 一般ユーザーはアクセスできません</li>
            <li>• ログイン情報は安全に管理してください</li>
          </ul>
        </div>

        {/* 一般ユーザーログインへのリンク */}
        <div className="text-center">
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            一般ユーザーログインはこちら
          </button>
        </div>
      </div>
    </div>
  )
}
