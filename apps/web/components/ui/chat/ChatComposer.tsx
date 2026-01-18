import React from 'react'
import Icon from '../../Icon'

interface ChatComposerProps {
  newMessage: string
  onNewMessageChange: (message: string) => void
  onSendMessage: () => void
  onMeetIntent: () => void
  onCancel: () => void
  hasExpressedIntent: boolean
  isScheduleUnlocked: boolean
  onScheduleMeeting: () => void
  totalIntents?: number
  totalMembers?: number
  onRefreshData?: () => void
}

const ChatComposer: React.FC<ChatComposerProps> = ({
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onMeetIntent,
  onCancel,
  hasExpressedIntent,
  isScheduleUnlocked,
  onScheduleMeeting,
  totalIntents = 0,
  totalMembers = 0,
  onRefreshData
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      {/* アクションボタン */}
      <div className="flex space-x-3">
        {!hasExpressedIntent && !isScheduleUnlocked && (
          <button
            onClick={onMeetIntent}
            className="flex-1 bg-amber-300 text-white py-3 rounded-xl font-semibold hover:bg-amber-400 transition-colors shadow-[0_2px_6px_rgba(251,191,36,0.22)]"
          >
            <Icon name="heart" className="w-5 h-5 inline mr-2 text-white" />
            会いたい！
          </button>
        )}
        
        {hasExpressedIntent && !isScheduleUnlocked && (
          <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-3 rounded-xl font-semibold flex items-center justify-center">
            <Icon name="heart" className="w-5 h-5 inline mr-2 text-green-600" />
            会いたい意思表示済み
            <span className="ml-2 text-sm">
              ({totalIntents}/{totalMembers}人)
            </span>
          </div>
        )}
        
        {isScheduleUnlocked && (
          <button
            onClick={onScheduleMeeting}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <Icon name="calendar" className="w-5 h-5 inline mr-2" />
            予定調整へ進む
          </button>
        )}
        
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            title="データを更新"
          >
            <Icon name="refresh" className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>

      {/* メッセージ入力 */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
          className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="send" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default ChatComposer
