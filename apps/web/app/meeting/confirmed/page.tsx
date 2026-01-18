'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'

export default function ConfirmedPage() {
  const router = useRouter()
  const [confirmedDate, setConfirmedDate] = useState<Date | null>(null)
  const [dateString, setDateString] = useState('')
  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    // 3秒後に決定済み合コン一覧へ自動遷移
    const timer = setTimeout(() => {
      router.push('/matches/confirmed')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  useEffect(() => {
    // クライアントサイドでのみ日付を生成
    const date = new Date(Date.now() + 604800000) // 1週間後
    setConfirmedDate(date)
    
    // 日付文字列を生成
    setDateString(date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }))
    
    setTimeString(date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 mx-4 text-center shadow-2xl max-w-md w-full">
        {/* 成功アイコン */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="check" className="w-10 h-10 text-green-600" />
        </div>

        {/* 成立メッセージ */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          合コン成立！
        </h1>
        
        <p className="text-gray-600 mb-6">
          おめでとうございます！<br />
          合コンが成立しました。
        </p>

        {/* 日付表示 */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-green-800 mb-2">予定日時</p>
          <p className="text-lg font-semibold text-green-900">
            {dateString}
          </p>
          <p className="text-md font-medium text-green-800">
            {timeString}
          </p>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">目的:</span>
            <span className="font-medium text-gray-800">定番飲み会</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">場所:</span>
            <span className="font-medium text-gray-800">渋谷の居酒屋</span>
          </div>
        </div>

        {/* 自動遷移メッセージ */}
        <div className="text-center">
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">
              決定済み合コン一覧へ自動で移動します...
            </p>
          </div>
          <div className="flex justify-center mt-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* 手動遷移ボタン */}
        <button
          onClick={() => router.push('/matches/confirmed')}
          className="mt-6 w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          今すぐ移動
        </button>
      </div>
    </div>
  )
} 