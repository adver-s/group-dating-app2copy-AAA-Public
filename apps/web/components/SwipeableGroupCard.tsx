'use client'

import { motion as motionAny, PanInfo } from 'framer-motion'
import React, { useState } from 'react'
import Icon from './Icon'
const MotionDiv: any = (motionAny as any).div

interface Group {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'waiting';
}

interface SwipeableGroupCardProps {
  group: Group;
  onToggleActive: (groupId: string, isActive: boolean) => Promise<void>;
  onNavigateToDetail: (groupId: string) => void;
  getGroupIllustration: (groupName: string) => React.ReactNode;
  isToggling?: boolean;
}

export default function SwipeableGroupCard({
  group,
  onToggleActive,
  onNavigateToDetail,
  getGroupIllustration,
  isToggling = false
}: SwipeableGroupCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  // 長押し検出
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (group.status === 'waiting' && !isDragging) {
      const timer = setTimeout(() => {
        setIsLongPressing(true)
        setShowConfirmModal(true)
      }, 600) // 600ms長押しでモーダル表示

      setLongPressTimer(timer)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setIsLongPressing(false)
  }

  // ドラッグ開始
  const handleDragStart = (event: any) => {
    // data-no-drag属性を持つ要素でのドラッグを無効化
    const target = event.target as HTMLElement
    if (target.closest('[data-no-drag]')) {
      return false
    }

    setIsDragging(true)
    // ドラッグ開始時に長押しタイマーをクリア
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // ドラッグ終了
  const handleDragEnd = async (event: any, info: PanInfo) => {
    setIsDragging(false)

    // スワイプの判定
    const threshold = 100
    if (info.offset.x > threshold) {
      // 右スワイプ - アクティブ化
      if (group.status === 'waiting') {
        await onToggleActive(group.id, true)
      }
    } else if (info.offset.x < -threshold) {
      // 左スワイプ - 非アクティブ化
      if (group.status === 'active') {
        await onToggleActive(group.id, false)
      }
    }

    // ドラッグオフセットをリセット
    setDragOffset(0)
  }

  // ドラッグ中の処理
  const handleDrag = (event: any, info: PanInfo) => {
    setDragOffset(info.offset.x)
  }

  // 背景色を計算（軽量化版）
  const getBackgroundColor = () => {
    if (Math.abs(dragOffset) < 50) return 'bg-gray-50'
    if (dragOffset > 0) return 'bg-green-50' // 右スワイプ
    return 'bg-red-50' // 左スワイプ
  }

  // スケールを計算（軽量化版）
  const getScale = () => {
    return Math.abs(dragOffset) > 50 ? 0.98 : 1
  }

  // 回転を計算（軽量化版）
  const getRotate = () => {
    return Math.abs(dragOffset) > 50 ? (dragOffset > 0 ? 2 : -2) : 0
  }

  return (
    <>
      <MotionDiv
        className={`relative w-full bg-white rounded-xl shadow-lg overflow-hidden transition-colors duration-200 ${getBackgroundColor()}`}
        style={{
          scale: getScale(),
          rotate: getRotate(),
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        whileTap={{ scale: 0.95 }}
      >
        {/* スワイプインジケーター */}
        {Math.abs(dragOffset) > 20 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {dragOffset > 0 ? (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Icon name="check" className="w-5 h-5" />
                <span className="font-medium">アクティブ化</span>
              </div>
            ) : (
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Icon name="x-mark" className="w-5 h-5" />
                <span className="font-medium">非アクティブ化</span>
              </div>
            )}
          </div>
        )}

        {/* カード内容 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {group.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${group.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
                }`}>
                {group.status === 'active' ? 'アクティブ' : '待機中'}
              </span>

              <button
                data-no-drag
                onClick={() => onNavigateToDetail(group.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="chevron-right" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* グループイラスト */}
          <div className="mb-3">
            {getGroupIllustration(group.name)}
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-2">
            <button
              data-no-drag
              onClick={() => onNavigateToDetail(group.id)}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              詳細を見る
            </button>

            {group.status === 'waiting' && (
              <button
                data-no-drag
                onClick={() => onToggleActive(group.id, true)}
                disabled={isToggling}
                className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isToggling ? '処理中...' : 'アクティブ化'}
              </button>
            )}
          </div>
        </div>
      </MotionDiv>

      {/* 確認モーダル */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MotionDiv
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="question-mark-circle" className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                グループをアクティブ化しますか？
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                「{group.name}」をアクティブ化すると、マッチング対象になります。
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    await onToggleActive(group.id, true)
                    setShowConfirmModal(false)
                  }}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  アクティブ化する
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </>
  )
}