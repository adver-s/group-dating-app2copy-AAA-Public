'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/Icon'
import FooterNav from '../../../components/FooterNav'

interface Group {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  availability?: string[];
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const { getAccessToken, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const teamId = params.teamId as string

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true)
        // 認証なしでグループ情報を取得
        const response = await fetch(`/api/teams/${teamId}`)

        if (response.ok) {
          const data = await response.json()
          setGroup(data)
        } else {
          setError('グループ情報の取得に失敗しました')
        }
      } catch (error) {
        console.error('Error fetching group:', error)
        setError('グループ情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchGroup()
    }
  }, [teamId])

  const handleJoin = async () => {
    if (!isAuthenticated) {
      // 未認証の場合は認証モーダルを表示
      setShowAuthModal(true)
      return
    }

    try {
      setJoining(true)
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('✅ グループ参加成功')
        router.push('/teams')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'グループ参加に失敗しました')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      setError('グループ参加に失敗しました')
    } finally {
      setJoining(false)
    }
  }

  const handleLogin = () => {
    // 招待情報をセッションストレージに保存
    sessionStorage.setItem('pendingInvite', teamId)
    router.push('/auth/signin')
  }

  const handleSignup = () => {
    // 招待情報をセッションストレージに保存
    sessionStorage.setItem('pendingInvite', teamId)
    router.push('/auth/signup')
  }

  const parseTags = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  const parseAvailability = (availability: string | string[] | undefined): string[] => {
    if (!availability) return [];
    if (Array.isArray(availability)) return availability;
    try {
      return JSON.parse(availability);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">グループ情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="exclamation-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'グループが見つかりません'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            ホームに戻る
          </button>
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
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="arrow-left" className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">グループ招待</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <Icon name="gift" className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h2>
            <p className="text-gray-600 text-lg">{group.description}</p>
          </div>
          
          {group.tags && parseTags(group.tags).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">興味・趣味</h3>
              <div className="flex flex-wrap gap-2">
                {parseTags(group.tags).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {group.availability && parseAvailability(group.availability).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">利用可能時間</h3>
              <div className="flex flex-wrap gap-2">
                {parseAvailability(group.availability).map((time, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 参加ボタン */}
          <div className="mt-8">
            {isAuthenticated ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${
                  joining
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {joining ? '参加中...' : 'このグループに参加する'}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleSignup}
                  className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors"
                >
                  新規登録して参加する
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full py-4 px-6 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 transition-colors"
                >
                  ログインして参加する
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>この招待リンクは友達と共有できます</p>
          </div>
        </div>
      </div>

      <FooterNav activeTab="teams" />
    </div>
  )
} 