'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Icon from '../../../../components/Icon'
import FooterNav from '../../../../components/FooterNav'
import { apiGet } from '../../../../utils/api'

interface ConfirmedMatch {
  id: string
  teamName: string
  status: 'confirmed'
  schedule: {
    purpose: string
    datetime: Date
    location: string
    link?: string
  }
}

export default function ConfirmedMatchPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  
  const [match, setMatch] = useState<ConfirmedMatch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true)
        const response = await apiGet<ConfirmedMatch>(`/matches/${matchId}`)
        
        if (response.success && response.data) {
          const matchData = {
            ...response.data,
            schedule: {
              ...response.data.schedule,
              datetime: new Date(response.data.schedule.datetime)
            }
          }
          setMatch(matchData)
        } else {
          // フォールバックデータ
          setMatch({
            id: matchId,
            teamName: 'チームおにぎり',
            status: 'confirmed',
            schedule: {
              purpose: '合コン',
              datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
              location: '渋谷の居酒屋',
              link: 'https://maps.google.com/...'
            }
          })
        }
      } catch (error) {
        console.error('マッチデータ取得エラー:', error)
        // フォールバックデータ
        setMatch({
          id: matchId,
          teamName: 'チームおにぎり',
          status: 'confirmed',
          schedule: {
            purpose: '合コン',
            datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            location: '渋谷の居酒屋',
            link: 'https://maps.google.com/...'
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMatch()
  }, [matchId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-red-500">マッチが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">合コン詳細</h1>
            <p className="text-sm text-gray-500">{match.teamName}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 成立通知 */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="check-circle" className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-bold text-green-800">合コン成立！</h2>
          </div>
          <p className="text-green-700">素敵な出会いをお楽しみください！</p>
        </div>

        {/* スケジュール詳細 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">予定詳細</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Icon name="calendar" className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">日時</p>
                <p className="font-medium">{match.schedule.datetime.toLocaleDateString('ja-JP')}</p>
                <p className="text-sm text-gray-500">{match.schedule.datetime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Icon name="map-pin" className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">場所</p>
                <p className="font-medium">{match.schedule.location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Icon name="heart" className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">目的</p>
                <p className="font-medium">{match.schedule.purpose}</p>
              </div>
            </div>
          </div>

          {match.schedule.link && (
            <div className="mt-4">
              <a 
                href={match.schedule.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center"
              >
                地図を見る
              </a>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          <button className="btn-primary w-full">
            チャットを開く
          </button>
          <button className="btn-secondary w-full">
            予定を変更
          </button>
          <button className="btn-danger w-full">
            キャンセル
          </button>
        </div>
      </div>

      <FooterNav activeTab="matches" />
    </div>
  )
} 