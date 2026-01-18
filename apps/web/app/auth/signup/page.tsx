'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Icon from '../../../components/Icon'
import { useAuth } from '../../../contexts/AuthContext'

export default function SignUpPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [hasRestored, setHasRestored] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthdate: '',
    location: '',
    bio: '',
    gender: '1', // デフォルト値として1を設定
    interests: [] as string[]
  })
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<string[]>([])

  // 開発モードの強制リダイレクトを削除
  // React.useEffect(() => {
  //   router.push('/teams')
  // }, [router])

  // パスワードバリデーション関数
  const validatePassword = (password: string) => {
    const errors = []

    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含む必要があります')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含む必要があります')
    }
    if (!/\d/.test(password)) {
      errors.push('数字を含む必要があります')
    }

    return errors
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))

    // パスワード入力時に強度チェック
    if (e.target.name === 'password') {
      const errors = validatePassword(e.target.value)
      setPasswordStrength(errors)
    }
  }

  // 初回マウント時に保存された入力内容を復元
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('signupForm')
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormData(prev => ({ ...prev, ...parsed }))
        if (parsed.password) {
          setPasswordStrength(validatePassword(parsed.password))
        }
      }
      const savedAgree = sessionStorage.getItem('signupAgree')
      if (savedAgree != null) {
        setAgree(savedAgree === 'true')
      }
    } catch (_) {
      // 無視: 不正なJSONなど
    }
    setHasRestored(true)
  }, [])

  // 入力内容が変わるたびに保存
  useEffect(() => {
    if (!hasRestored) return
    try {
      sessionStorage.setItem('signupForm', JSON.stringify(formData))
    } catch (_) {
      // 無視: ストレージ上限など
    }
  }, [formData, hasRestored])

  // 規約同意状態も保存
  useEffect(() => {
    if (!hasRestored) return
    try {
      sessionStorage.setItem('signupAgree', String(agree))
    } catch (_) {
      // 無視
    }
  }, [agree, hasRestored])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // パスワード確認
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    // パスワード強度チェック
    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length > 0) {
      setError(`パスワードの要件を満たしていません: ${passwordErrors.join(', ')}`)
      setLoading(false)
      return
    }

    const success = await signup(
      formData.email,
      formData.password,
      formData.name,
      formData.birthdate,
      formData.location,
      formData.bio,
      formData.gender,
      formData.interests
    )

    if (success) {
      // 入力内容をクリア
      sessionStorage.removeItem('signupForm')
      sessionStorage.removeItem('signupAgree')
      // 招待・フロー分岐
      const pendingInvite = sessionStorage.getItem('pendingInvite')
      const origin = sessionStorage.getItem('signupOrigin')
      if (pendingInvite) {
        // 先にグループ参加へ（トークンは既に保存済み）
        sessionStorage.removeItem('signupOrigin')
        router.push(`/invite/${pendingInvite}`)
      } else {
        // 通常は本人確認へ
        setSuccess('アカウントが作成されました。本人確認をお願いします。')
        setTimeout(() => {
          router.push('/auth/verification')
        }, 2000)
      }
    } else {
      // エラーメッセージは既にAuthContextで詳細に設定されている
      setError('登録に失敗しました。入力内容を確認してください。')
    }

    setLoading(false)
  }

  const handleGoogleSignUp = () => {
    // Google登録の実装（後で追加）
    alert('Google登録機能は準備中です')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <Icon name="user-plus" className="w-6 h-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            新規登録
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            アカウントを作成して、素敵な出会いを見つけましょう
          </p>
        </div>

        {/* フォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                お名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                生年月日
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                required
                value={formData.birthdate}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>



            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                居住地
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="東京都"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                性別
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="1">男性</option>
                <option value="2">女性</option>
              </select>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                自己紹介
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="自己紹介を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                趣味・興味
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['カラオケ', 'お酒', '旅行', '料理', 'スポーツ', '映画', '音楽', '読書'].map((interest) => (
                  <label key={interest} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            interests: [...prev.interests, interest]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            interests: prev.interests.filter(i => i !== interest)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="example@email.com"
              />
            </div>

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
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="8文字以上で入力"
              />
              <p className="mt-1 text-xs text-gray-500">
                パスワードは8文字以上で、大文字・小文字・数字を含む必要があります
              </p>
              {formData.password && passwordStrength.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordStrength.map((error, index) => (
                    <p key={index} className="text-xs text-red-500 flex items-center">
                      <Icon name="x-circle" className="w-3 h-3 mr-1" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
              {formData.password && passwordStrength.length === 0 && (
                <p className="mt-2 text-xs text-green-500 flex items-center">
                  <Icon name="check-circle" className="w-3 h-3 mr-1" />
                  パスワードの要件を満たしています
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="パスワードを再入力"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              <Link href={{ pathname: '/me/terms', query: { from: 'signup' } }} className="text-primary-600 hover:text-primary-500">
                利用規約
              </Link>
              と
              <Link href={{ pathname: '/me/privacy', query: { from: 'signup' } }} className="text-primary-600 hover:text-primary-500">
                プライバシーポリシー
              </Link>
              に同意します
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登録中...
                </div>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">または</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Icon name="chrome" className="w-5 h-5 mr-2" />
              Googleで登録
            </button>
          </div>
        </form>

        {/* ログインリンク */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 