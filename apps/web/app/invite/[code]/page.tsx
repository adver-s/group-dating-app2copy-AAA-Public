'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Icon from '../../../components/Icon'
import { useAuth } from '../../../contexts/AuthContext'

interface TeamInfo {
  id: string
  name: string
  description: string
  memberCount: number
  isMember?: boolean // ユーザーがグループのメンバーかどうかを示すフラグ（オプショナル）
}

export default function InvitePage() {
  const params = useParams() as { code: string }
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  // ルートパラメータを取得
  const { code } = params

  useEffect(() => {
    // 招待コードからチーム情報を取得
    fetchTeamInfo()
  }, [code])

  const fetchTeamInfo = async () => {
    try {
      console.log('🔍 チーム情報取得開始:', code);

      // アクセストークンを取得（オプショナル）
      const accessToken = localStorage.getItem('accessToken')

      const response = await fetch(`/api/invite/${code}`, {
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      })

      console.log('📊 レスポンスステータス:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('✅ チーム情報取得成功:', data);
        setTeamInfo(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }));
        console.error('❌ チーム情報取得エラー:', response.status, errorData);
        setError(errorData.error || '無効な招待リンクです')
      }
    } catch (error) {
      console.error('❌ チーム情報取得エラー:', error)
      setError('チーム情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!isAuthenticated) {
      // ログインしていない場合は、招待コードを保存してログインページにリダイレクト
      console.log('🔐 未認証ユーザー、ログインページにリダイレクト');
      sessionStorage.setItem('pendingInvite', code)
      router.push('/auth/signin')
      return
    }

    // ログイン済みの場合は直接グループ参加
    console.log('🚀 チーム参加処理開始');
    setJoining(true)
    try {
      // アクセストークンを取得
      const accessToken = localStorage.getItem('accessToken')
      console.log('🔑 アクセストークン:', accessToken ? '存在' : 'なし');

      const response = await fetch(`/api/invite/${code}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      })

      console.log('📊 参加レスポンスステータス:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('✅ チーム参加成功:', data);
        alert(`グループ「${data.groupName}」に参加しました！`)
        router.push('/teams')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }));
        console.error('❌ チーム参加エラー:', response.status, errorData);

        if (response.status === 401 && errorData.redirectTo) {
          // 認証エラーの場合はログインページにリダイレクト
          console.log('🔐 認証エラー、ログインページにリダイレクト');
          sessionStorage.setItem('pendingInvite', code)
          router.push(errorData.redirectTo)
        } else {
          setError(errorData.error || 'グループ参加に失敗しました')
        }
      }
    } catch (error) {
      console.error('❌ チーム参加エラー:', error)
      setError('グループ参加に失敗しました')
    } finally {
      setJoining(false)
    }
  }

  const handleSignIn = () => {
    sessionStorage.setItem('pendingInvite', code)
    router.push('/auth/signin')
  }

  const handleSignUp = () => {
    sessionStorage.setItem('pendingInvite', code)
    sessionStorage.setItem('signupOrigin', 'invite')
    router.push('/auth/signup')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="alert-circle" className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">エラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="users" className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">グループに招待されました</h1>
          <p className="text-gray-600">以下のグループに参加しますか？</p>
        </div>

        {teamInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{teamInfo.name}</h2>
            <p className="text-gray-600 text-sm mb-2">{teamInfo.description}</p>
            <p className="text-gray-500 text-sm">メンバー数: {teamInfo.memberCount}人</p>
          </div>
        )}

        {isAuthenticated ? (
          teamInfo?.isMember ? (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-4">既にこのグループのメンバーです</p>
              <button
                onClick={() => router.push('/teams')}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                グループ一覧に戻る
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinTeam}
              disabled={joining}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? '参加中...' : 'グループに参加する'}
            </button>
          )
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              ログインして参加する
            </button>
            <button
              onClick={handleSignUp}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              新規登録して参加する
            </button>
            <p className="text-xs text-gray-500 text-center">
              アカウントをお持ちでない方は新規登録をお願いします
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-gray-500 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
