'use client'

import { motion as motionAny, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import React, { useState } from 'react'
import ExpandableText from './ExpandableText'
import ImageSlider from './ImageSlider'
const MotionDiv: any = (motionAny as any).div

interface SwipeCardProps {
  team: Team;
  onSwipe?: (action: 'like' | 'pass' | 'hold') => void;
}

interface Team {
  id: string;
  teamName: string;
  description: string;
  gender?: number;
  target_gender?: number[];
  max_members?: number;
  member_count?: number;
  photos?: string[];
  members?: Array<{
    id: string;
    username: string;
    gender: number;
  }>;
  hobbies?: string[];
}

const SwipeCard: React.FC<SwipeCardProps> = ({ team, onSwipe }) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!onSwipe) return

    setIsDragging(false)
    const { offset, velocity } = info
    const swipeThreshold = 100

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        // Swipe right - Like
        onSwipe('like')
      } else {
        // Swipe left - Dislike
        onSwipe('pass')
      }
    } else if (offset.y > swipeThreshold || velocity.y > 500) {
      // Swipe down - Hold
      onSwipe('hold')
    }
  }

  const getSwipeLabel = () => {
    const xValue = x.get()
    const yValue = y.get()

    if (Math.abs(xValue) > 50) {
      return xValue > 0 ? 'アリ' : 'ナシ'
    } else if (yValue > 50) {
      return '保留'
    }
    return null
  }

  const swipeLabel = getSwipeLabel()

  // 性別表示を取得
  const getGenderText = (gender?: number) => {
    switch (gender) {
      case 0: return '女子のみ';
      case 1: return '男女混在';
      case 2: return '男子のみ';
      default: return '男女混在';
    }
  };

  // ターゲット性別表示を取得
  const getTargetGenderText = (targetGender?: number) => {
    switch (targetGender) {
      case 0: return '女子に表示';
      case 1: return '男女どちらにも表示';
      case 2: return '男子に表示';
      default: return '男女どちらにも表示';
    }
  };

  return (
    <MotionDiv
      className="relative w-full max-w-sm mx-auto"
      style={{ x, y, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
    >
      {/* カード本体 */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* 画像 */}
        <div className="relative h-64 bg-gradient-to-br from-purple-400 to-pink-400">
          <ImageSlider
            images={team.photos || []}
            alt={team.teamName}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none"></div>

          {/* スワイプラベル */}
          {swipeLabel && (
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-white font-bold text-lg z-10 ${swipeLabel === 'アリ' ? 'bg-green-500' :
                swipeLabel === 'ナシ' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
              {swipeLabel}
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {team.teamName}
          </h2>

          {/* グループタイプとメンバー数 */}
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-sm text-gray-600">
              {team.member_count || 1}人
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              {team.gender === 0 ? '女性グループ' :
                team.gender === 1 ? '男女混合グループ' :
                  team.gender === 2 ? '男性グループ' : 'その他'}
            </span>
          </div>

          {/* チームメンバー名 */}
          {team.members && team.members.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 text-center">メンバー</p>
              <div className="flex flex-wrap justify-center gap-2">
                {team.members.map((member) => (
                  <span
                    key={member.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {member.username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ノリタグ */}
          {team.hobbies && team.hobbies.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 text-center">趣味</p>
              <div className="flex flex-wrap justify-center gap-2">
                {team.hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* グループ紹介文（展開可能） */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2 text-center">グループ紹介</p>
            <ExpandableText
              text={team.description}
              maxLength={80}
              className="text-center"
            />
          </div>

          {/* チーム情報 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">性別:</span>
              <span className="text-gray-700">{getGenderText(team.gender)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ターゲット:</span>
              <span className="text-gray-700">{getTargetGenderText(Array.isArray(team.target_gender) ? team.target_gender[0] : team.target_gender)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">最大人数:</span>
              <span className="text-gray-700">{team.max_members || 4}人</span>
            </div>

            {team.member_count !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">現在の人数:</span>
                <span className="text-gray-700">{team.member_count}人</span>
              </div>
            )}
          </div>

          {/* アクションガイド */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>← ナシ | 保留 ↓ | アリ →</p>
          </div>
        </div>
      </div>

      {/* ドラッグ中のオーバーレイ */}
      {isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-10 rounded-2xl pointer-events-none"></div>
      )}
    </MotionDiv>
  )
}

export default SwipeCard 