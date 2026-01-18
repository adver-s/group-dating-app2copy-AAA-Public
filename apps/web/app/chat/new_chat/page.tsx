'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChatMessage {
  id: string
  userId: string
  teamId: string
  content: string
  timestamp: Date
  senderName: string
  isMyTeam: boolean
  senderAvatar?: string
  teamName?: string
}

export default function SimpleTestChatPage() {
  const router = useRouter()
  // ダミーメッセージ
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'user1',
      teamId: 'team1',
      content: 'こんにちは！',
      timestamp: new Date(),
      senderName: 'ささき',
      isMyTeam: false,
      senderAvatar: '',
      teamName: 'Aチーム'
    },
    {
      id: '2',
      userId: 'user2',
      teamId: 'team2',
      content: 'こんにちは！よろしくお願いします！',
      timestamp: new Date(),
      senderName: 'たなか',
      isMyTeam: true,
      senderAvatar: '',
      teamName: 'Bチーム'
    },
    {
      id: '3',
      userId: 'user1',
      teamId: 'team1',
      content: '今日はどんな話をしましょうか？',
      timestamp: new Date(),
      senderName: 'ささき',
      isMyTeam: false,
      senderAvatar: '',
      teamName: 'Aチーム'
    },
    {
      id: '4',
      userId: 'user2',
      teamId: 'team2',
      content: '趣味の話とかどうですか？',
      timestamp: new Date(),
      senderName: 'たなか',
      isMyTeam: true,
      senderAvatar: '',
      teamName: 'Bチーム'
    },
    {
      id: '5',
      userId: 'user1',
      teamId: 'team1',
      content: 'いいですね！私は映画が好きです。',
      timestamp: new Date(),
      senderName: 'ささき',
      isMyTeam: false,
      senderAvatar: '',
      teamName: 'Aチーム'
    },
    {
      id: '6',
      userId: 'user2',
      teamId: 'team2',
      content: '最近見た映画は何ですか？',
      timestamp: new Date(),
      senderName: 'たなか',
      isMyTeam: true,
      senderAvatar: '',
      teamName: 'Bチーム'
    },
    {
      id: '7',
      userId: 'user1',
      teamId: 'team1',
      content: '「君の名は。」を見ました！',
      timestamp: new Date(),
      senderName: 'ささき',
      isMyTeam: false,
      senderAvatar: '',
      teamName: 'Aチーム'
    },
    {
      id: '8',
      userId: 'user2',
      teamId: 'team2',
      content: '私も好きです！感動しましたよね。',
      timestamp: new Date(),
      senderName: 'たなか',
      isMyTeam: true,
      senderAvatar: '',
      teamName: 'Bチーム'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    const newMsg: ChatMessage = {
      id: (messages.length + 1).toString(),
      userId: 'user2',
      teamId: 'team2',
      content: newMessage,
      timestamp: new Date(),
      senderName: 'たなか',
      isMyTeam: true,
      senderAvatar: '',
      teamName: 'Bチーム'
    }
    setMessages([...messages, newMsg])
    setNewMessage('')
  }

  const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className={`flex ${message.isMyTeam ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.isMyTeam ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs`}>
        <div className="flex-shrink-0">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt={message.senderName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">{message.senderName.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className={`px-4 py-2 rounded-2xl ${
          message.isMyTeam 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
        }`}>
          <div className={`text-xs mb-1 ${
            message.isMyTeam ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.senderName}
            {message.teamName && (
              <span className="ml-1">({message.teamName})</span>
            )}
          </div>
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${
            message.isMyTeam ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">メッセージを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 固定ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-gray-800">シンプルテストチャット</h1>
              <p className="text-sm text-gray-500">認証不要のテスト</p>
            </div>
          </div>
        </div>
      </div>

      {/* スクロール可能なメッセージエリア（高さ最大70vh） */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50"
        style={{ maxHeight: '45vh' }}
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </div>

      {/* 固定フッターエリア */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="メッセージを入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}