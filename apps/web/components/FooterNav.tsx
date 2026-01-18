"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Icon from './Icon';
import MessageSlideModal from './MessageSlideModal';

interface FooterNavProps {
  activeTab?: string
}

const FooterNav: React.FC<FooterNavProps> = ({ activeTab = 'teams' }) => {
  const router = useRouter()
  const [showMessageModal, setShowMessageModal] = useState(false)

  // ナビゲーション項目の定義
  const navItems = [
    { id: 'teams', name: 'users', path: '/teams', label: 'グループ一覧' },
    { id: 'swipe', name: 'arrow-left-right', path: '/match/swipe', label: 'スワイプ' },
    { id: 'matches', name: 'heart', path: '/matches', label: 'マッチ一覧' },
    { id: 'meeting', name: 'calendar', path: '/team/meeting', label: '合コン会議' },
    { id: 'profile', name: 'user', path: '/me', label: 'マイページ' },
    { id: 'admin', name: 'cog', path: '/admin', label: '管理者' },
  ]

  const handleNavClick = (path: string) => {
    router.push(path)
  }

  const handleMessageClick = () => {
    setShowMessageModal(true)
  }

  return (
    <>
      {/* フッターナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 z-20">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 touch-target ${activeTab === item.id
                  ? 'text-yellow-500'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <Icon
                name={item.name}
                className={`w-5 h-5 ${activeTab === item.id
                    ? 'text-yellow-500'
                    : 'text-gray-600'
                  }`}
              />
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 浮遊メッセージボタン（FAB） */}
      <button
        onClick={handleMessageClick}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-50 group"
      >
        <Icon
          name="chat-bubble-oval-left-ellipsis"
          className="w-7 h-7 text-white"
        />
        {/* 未読メッセージのバッジ */}
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full pointer-events-none">
          3
        </span>
        {/* ツールチップ */}
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          メッセージ
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent pointer-events-none"></div>
        </div>
      </button>

      {/* メッセージモーダル */}
      <MessageSlideModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </>
  )
}

export default FooterNav 