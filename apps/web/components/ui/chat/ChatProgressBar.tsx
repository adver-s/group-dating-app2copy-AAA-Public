import React from 'react'

interface ChatProgressBarProps {
  current: number
  total: number
  fromGroupIntents?: number
  toGroupIntents?: number
  fromGroupMembers?: number
  toGroupMembers?: number
  isCompleted?: boolean
}

const ChatProgressBar: React.FC<ChatProgressBarProps> = ({ 
  current, 
  total, 
  fromGroupIntents = 0,
  toGroupIntents = 0,
  fromGroupMembers = 0,
  toGroupMembers = 0,
  isCompleted = false
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          会いたい意思表示
        </span>
        <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
          {current}/{total}人
          {isCompleted && ' ✓'}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ease-out ${
            isCompleted ? 'bg-green-500' : 'bg-gray-900'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* チーム別の詳細情報 */}
      {(fromGroupMembers > 0 || toGroupMembers > 0) && (
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>あなたのチーム: {fromGroupIntents}/{fromGroupMembers}人</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
            <span>相手チーム: {toGroupIntents}/{toGroupMembers}人</span>
          </div>
        </div>
      )}
      
      {current > 0 && !isCompleted && (
        <p className="text-xs text-gray-600 mt-1">
          {current}人が会いたいと意思表示しました
        </p>
      )}
      
      {isCompleted && (
        <p className="text-xs text-green-600 font-medium mt-1">
          🎉 全員が会いたいと意思表示しました！予定調整が可能になりました
        </p>
      )}
    </div>
  )
}

export default ChatProgressBar
