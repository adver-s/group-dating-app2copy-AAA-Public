import React from 'react'

interface ChatHeaderProps {
  teamName: string
  teamImage?: string | undefined
  teamMembers?: Array<{
    id: string
    name: string
    avatar?: string | undefined
  }> | undefined
  onBack: () => void
  isScheduleUnlocked: boolean
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  teamName,
  teamImage,
  teamMembers,
  onBack,
  isScheduleUnlocked
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
      <div className="flex items-center justify-center">
        {/* チーム情報のみを中央に表示 */}
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{teamName}</h1>
            <p className="text-sm text-gray-600">
              {isScheduleUnlocked ? '予定調整可能' : 'チャット中'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
