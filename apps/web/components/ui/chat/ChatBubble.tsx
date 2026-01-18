import React from 'react'

interface ChatMessage {
  id: string
  userId: string
  teamId: string
  content: string
  timestamp: Date
  senderName: string
  isMyTeam: boolean
  senderAvatar?: string | undefined
  teamName?: string
  memberId?: string
}

interface ChatBubbleProps {
  message: ChatMessage
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex ${message.isMyTeam ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* 相手チームのメッセージ（左側） */}
      {!message.isMyTeam && (
        <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
          {/* 相手チームのメンバーアイコン */}
          <div className="flex-shrink-0">
            <img
              src={message.senderAvatar || '/default-avatar.png'}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>

          {/* メッセージ内容 */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs text-gray-600 font-medium">
                {message.senderName}
              </span>
            </div>

            <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            </div>

            <div className="text-xs text-gray-500 mt-1 text-left">
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      )}

      {/* 自分のチームのメッセージ（右側） */}
      {message.isMyTeam && (
        <div className="flex items-start space-x-2 max-w-xs lg:max-w-md ml-auto">
          {/* メッセージ内容 */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end space-x-2 mb-1">
              <span className="text-xs text-gray-600 font-medium">
                {message.senderName}
              </span>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            </div>

            <div className="text-xs text-gray-500 mt-1 text-right">
              {formatTime(message.timestamp)}
            </div>
          </div>

          {/* 自分のチームのメンバーアイコン */}
          <div className="flex-shrink-0">
            <img
              src={message.senderAvatar || '/default-avatar.png'}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBubble
