'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'

export default function CancelledPage() {
  const router = useRouter()

  useEffect(() => {
    // 3秒後にマッチ一覧へ自動遷移
    const timer = setTimeout(() => {
      router.push('/matches')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 mx-4 text-center shadow-2xl max-w-md w-full">
        {/* 残念アイコン */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="x-mark" className="w-10 h-10 text-red-600" />
        </div>

        {/* ブッチメッセージ */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          残念...
        </h1>
        
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-red-800 text-sm leading-relaxed">
            ブッチ率が基準に達したため、<br />
            このマッチは自動的に消去されます。
          </p>
        </div>

        {/* 説明 */}
        <p className="text-gray-600 mb-6">
          また新しい出会いを見つけましょう！<br />
          スワイプページで新しいチームとマッチしてみてください。
        </p>

        {/* 統計情報 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">85%</p>
              <p className="text-xs text-gray-600">ブッチ率</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">3/6</p>
              <p className="text-xs text-gray-600">会う意思表明</p>
            </div>
          </div>
        </div>

        {/* 自動遷移メッセージ */}
        <div className="text-center">
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">
              マッチ一覧へ自動で移動します...
            </p>
          </div>
          <div className="flex justify-center mt-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push('/matches')}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            マッチ一覧へ
          </button>
          <button
            onClick={() => router.push('/match/swipe')}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            スワイプで新しい出会いを
          </button>
        </div>
      </div>
    </div>
  )
} 