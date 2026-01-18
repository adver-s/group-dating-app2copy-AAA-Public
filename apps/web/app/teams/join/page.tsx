'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/Icon'
import FooterNav from '../../../components/FooterNav'

export default function JoinTeamPage() {
  const router = useRouter()
  const { getAccessToken, isAuthenticated, loading: authLoading } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 認証状態をチェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🔍 未認証のためログイン画面にリダイレクト')
      router.push('/auth/signin')
    }
  }, [isAuthenticated, authLoading, router])

  // デバッグ用：認証状態をログ出力
  useEffect(() => {
    console.log('🔍 認証状態:', { 
      authLoading, 
      isAuthenticated, 
      hasToken: !!getAccessToken() 
    })
  }, [authLoading, isAuthenticated, getAccessToken])

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('招待コードを入力してください')
      return
    }

    // 認証状態をチェック
    if (!isAuthenticated) {
      setError('ログインが必要です')
      router.push('/auth/signin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 招待コードでグループに参加
      const accessToken = getAccessToken()
      
      console.log('🔍 認証トークン確認:', { 
        hasToken: !!accessToken, 
        tokenLength: accessToken?.length,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'None'
      })
      
      if (!accessToken) {
        setError('認証トークンが取得できません。再度ログインしてください。')
        router.push('/auth/signin')
        return
      }

      console.log('🔍 APIリクエスト送信:', {
        url: '/api/teams/join-by-code',
        inviteCode: inviteCode.trim(),
        hasAuthHeader: true
      })

      const response = await fetch('/api/teams/join-by-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`グループ「${data.groupName}」に参加しました！`)
        router.push('/teams')
      } else {
        const errorData = await response.json()
        console.log('🔍 エラーレスポンス:', errorData)
        
        if (response.status === 401 && errorData.redirectTo) {
          // 認証エラーの場合
          if (errorData.isValidInviteCode) {
            setError(`認証が必要です。ログインしてから「${errorData.teamName}」に参加してください。`)
          } else {
            setError(errorData.error || '認証が必要です')
          }
          router.push(errorData.redirectTo)
        } else {
          setError(errorData.error || 'グループ参加に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error joining group:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      setError('グループ参加に失敗しました。ネットワーク接続を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByURL = () => {
    // URLから招待コードを抽出する機能
    const url = prompt('招待URLを入力してください:')
    if (url) {
      // URLからグループIDを抽出
      const match = url.match(/\/teams\/join\/([^\/]+)/)
      if (match) {
        setInviteCode(match[1])
      } else {
        setError('無効な招待URLです')
      }
    }
  }

  // 認証読み込み中または未認証の場合はローディング表示
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="arrow-left" className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">グループに参加</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">グループに参加</h2>
          <p className="text-gray-600 text-lg mb-6">
            招待コードまたは招待URLを使ってグループに参加しましょう
          </p>

          {/* 招待コード入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              招待コード
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="招待コードを入力"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleJoinByURL}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                URL
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 参加ボタン */}
          <div className="mb-6">
            <button
              onClick={handleJoinByCode}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {loading ? '参加中...' : 'グループに参加する'}
            </button>
          </div>

          {/* 説明 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="info" className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-2">グループ参加について</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>招待コード: 友達から教えてもらったコードを入力</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>招待URL: 友達から送られてきたリンクを貼り付け</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>参加後はグループの詳細を確認できます</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterNav activeTab="teams" />
    </div>
  )
} 