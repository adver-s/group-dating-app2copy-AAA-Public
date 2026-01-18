'use client'

import { motion as motionAny } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdModal from '@/components/AdModal'
import FooterNav from '@/components/FooterNav'
import Icon from '@/components/Icon'
import SwipeableGroupCard from '@/components/SwipeableGroupCard'
import { useActiveTeam } from '../../contexts/ActiveTeamContext'
import { useAuth } from '../../contexts/AuthContext'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'
const MotionDiv: any = (motionAny as any).div

interface Group {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  availability?: string[];
  status: 'active' | 'waiting';
}

export default function TeamsPage() {
  const router = useRouter()
  const { getAccessToken, user, isAuthenticated } = useAuth()
  const { refreshActiveTeam } = useActiveTeam()
  const [activeGroups, setActiveGroups] = useState<Group[]>([])
  const [waitingGroups, setWaitingGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingGroup, setTogglingGroup] = useState<string | null>(null)
  const [showAdModal, setShowAdModal] = useState(false)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        setError(null)

        // 認証付きAPIを使用
        const accessToken = getAccessToken()
        if (!accessToken) {
          console.log('❌ アクセストークンがありません');
          setError('ログインが必要です');
          setLoading(false);
          return;
        }

        console.log('🔍 チーム一覧取得開始...');

        // まずアクティブチーム制約を強制適用
        try {
          const constraintResponse = await fetch('/api/teams/enforce-constraint', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (constraintResponse.ok) {
            const constraintResponseText = await constraintResponse.text()
            console.log('🔍 制約適用レスポンス内容:', constraintResponseText)

            try {
              const constraintData = JSON.parse(constraintResponseText)
              console.log('✅ 制約適用結果:', constraintData)
              if (constraintData.teamsDeactivated > 0) {
                console.log(`📊 ${constraintData.teamsDeactivated}個のチームを待機状態にしました`)
              }

              // 制約適用後にチーム一覧が返されている場合は使用
              if (constraintData.activeGroups && constraintData.waitingGroups) {
                setActiveGroups(constraintData.activeGroups || [])
                setWaitingGroups(constraintData.waitingGroups || [])
                setLoading(false)
                return
              }
            } catch (parseError) {
              console.error('❌ 制約適用レスポンス解析エラー:', parseError)
              console.error('❌ レスポンス内容:', constraintResponseText)
            }
          }
        } catch (constraintError) {
          console.warn('⚠️ 制約適用でエラーが発生しました:', constraintError)
        }

        // 認証されたユーザーのチーム一覧を取得
        const response = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const responseText = await response.text()
          console.log('🔍 レスポンス内容:', responseText)

          try {
            const data = JSON.parse(responseText)
            console.log('✅ 認証API成功:', data)

            setActiveGroups(data.activeGroups || [])
            setWaitingGroups(data.waitingGroups || [])
          } catch (parseError) {
            console.error('❌ JSON解析エラー:', parseError)
            console.error('❌ レスポンス内容:', responseText)
            setError(`レスポンスの解析に失敗しました: ${parseError instanceof Error ? parseError.message : '不明なエラー'}`)
          }
        } else {
          const responseText = await response.text()
          console.error('❌ 認証APIエラー:', response.status, responseText)

          try {
            const errorData = JSON.parse(responseText)
            setError(`グループ一覧の取得に失敗しました: ${errorData.error || errorData.message || '不明なエラー'}`)
          } catch (parseError) {
            setError(`グループ一覧の取得に失敗しました: ${response.status} ${response.statusText}`)
          }
        }
      } catch (error) {
        console.error('❌ ネットワークエラー:', error)
        setError(`グループ一覧の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [getAccessToken])

  // チームページで定期的にモーダル広告を表示
  useEffect(() => {
    const showAdPeriodically = () => {
      const lastAdTimeTeams = localStorage.getItem('lastAdTimeTeams')
      const currentTime = Date.now()
      const adInterval = 20 * 60 * 1000 // 20分（ミリ秒）

      // 初回表示または20分経過後に表示
      if (!lastAdTimeTeams || (currentTime - parseInt(lastAdTimeTeams)) > adInterval) {
        const adTimer = setTimeout(() => {
          setShowAdModal(true)
          localStorage.setItem('lastAdTimeTeams', currentTime.toString())
        }, 3000) // 3秒後に表示

        return () => clearTimeout(adTimer)
      }
    }

    showAdPeriodically()
  }, [])

  const handleToggleActive = async (groupId: string, isActive: boolean) => {
    try {
      setTogglingGroup(groupId)
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        const result = await response.json()

        // アクティブチームコンテキストを更新
        await refreshActiveTeam()

        // チーム切り替えイベントを発行
        if (result.eventType === 'team-activated') {
          teamEventBus.publish(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, {
            teamId: groupId,
            isActive: true,
            teamName: result.teamName
          });

          // マッチング状態のクリアを通知
          teamEventBus.publish(TEAM_EVENTS.MATCHING_STATE_CLEARED, {
            teamId: groupId,
            teamName: result.teamName
          });
        } else if (result.eventType === 'team-deactivated') {
          teamEventBus.publish(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, {
            teamId: groupId,
            isActive: false,
            teamName: result.teamName
          });
        }

        // 成功したらグループ一覧を再取得
        const updatedResponse = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()

          setActiveGroups(data.activeGroups || [])
          setWaitingGroups(data.waitingGroups || [])
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to toggle group status:', errorData)
        alert(`ステータス変更に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error('Error toggling group status:', error)
      alert(`ステータス変更に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setTogglingGroup(null)
    }
  }

  const handleNavigateToDetail = (groupId: string) => {
    console.log('handleNavigateToDetail が呼ばれました:', groupId)
    router.push(`/teams/${groupId}`)
  }

  // グループのイラストを取得
  const getGroupIllustration = (groupName: string) => {
    const name = groupName.toLowerCase()
    if (name.includes('tea') || name.includes('hatter')) {
      return (
        <div className="w-16 h-16 bg-amber-50 rounded-lg flex items-center justify-center">
          <div className="text-2xl">☕</div>
        </div>
      )
    } else if (name.includes('queen') || name.includes('heart')) {
      return (
        <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-2xl">♥️</div>
        </div>
      )
    } else if (name.includes('cat') || name.includes('cheshire')) {
      return (
        <div className="w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center">
          <div className="text-2xl">😺</div>
        </div>
      )
    } else if (name.includes('rabbit') || name.includes('white')) {
      return (
        <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
          <div className="text-2xl">🐰</div>
        </div>
      )
    } else {
      return (
        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-2xl">🎭</div>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">グループ一覧を読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー表示部分
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert-circle" className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {error}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ページを再読み込み
              </button>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ログイン画面に戻る
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>問題が解決しない場合は、以下をお試しください：</p>
              <ul className="mt-2 space-y-1">
                <li>• ブラウザを再起動する</li>
                <li>• インターネット接続を確認する</li>
                <li>• 再度ログインする</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="arrow-left" className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">グループ一覧</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && user && (
              <span className="text-sm text-gray-600">
                {user.name}
              </span>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => router.push('/auth/simple-login')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Groups */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">アクティブグループ</h2>
        {activeGroups.length > 0 ? (
          <div className="space-y-4">
            {activeGroups.map((group, index) => (
              <MotionDiv
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getGroupIllustration(group.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{group.description}</p>
                    <button
                      onClick={() => handleNavigateToDetail(group.id)}
                      className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      詳細
                      <Icon name="arrow-right" className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="users" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">アクティブグループが見つかりません</p>
          </div>
        )}
      </div>

      {/* Standby Groups */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">待機グループ</h2>
        {waitingGroups.length > 0 ? (
          <div className="space-y-4">
            {waitingGroups.map((group, index) => (
              <MotionDiv
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SwipeableGroupCard
                  group={group}
                  onToggleActive={handleToggleActive}
                  onNavigateToDetail={handleNavigateToDetail}
                  getGroupIllustration={getGroupIllustration}
                  isToggling={togglingGroup === group.id}
                />
              </MotionDiv>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="clock" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">待機グループが見つかりません</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6">
        <div className="space-y-3">
          <button
            onClick={() => router.push('/teams/join')}
            className="w-full py-4 px-6 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            グループに参加
          </button>

          <button
            onClick={() => router.push('/teams/create')}
            className="w-full py-4 px-6 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            新しいグループを作成
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav />


      {/* モーダル広告 */}
      <AdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
      />
    </div>
  )
} 