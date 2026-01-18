'use client'

import { useRouter } from 'next/navigation'
import React from 'react'
import { useActiveTeam } from '../contexts/ActiveTeamContext'
import Icon from './Icon'

interface TeamChatButtonProps {
  className?: string
  showBadge?: boolean
  badgeCount?: number
}

const TeamChatButton: React.FC<TeamChatButtonProps> = ({
  className = '',
  showBadge = false,
  badgeCount = 0
}) => {
  const router = useRouter()
  const { activeTeam } = useActiveTeam()

  const handleTeamChatClick = () => {
    if (!activeTeam) {
      alert('アクティブなチームがありません。まずチームに参加してください。')
      return
    }

    // チーム内チャットページに遷移
    const teamChatRoomId = `team_chat_${activeTeam.id}`
    router.push(`/team-chat/${teamChatRoomId}`)
  }

  return (
    <button
      onClick={handleTeamChatClick}
      className={`relative p-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all duration-200 group ${className}`}
      title="チーム内チャット"
    >
      <Icon
        name="chat-bubble-oval-left-ellipsis"
        className="w-6 h-6 text-white"
      />

      {/* 未読メッセージのバッジ */}
      {showBadge && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full pointer-events-none">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}

      {/* ツールチップ */}
      <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        チーム内チャット
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent pointer-events-none"></div>
      </div>
    </button>
  )
}

export default TeamChatButton
