'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useActiveTeam } from '../contexts/ActiveTeamContext'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiPost } from '../utils/api'
import Icon from './Icon'

type ApiResponse<T> = { success: boolean; data?: T; error?: string }

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isMyTeam: boolean
  senderAvatar?: string
}

interface ChatRoom {
  id: string
  name: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
  }>
}

interface MessageSlideModalProps {
  isOpen: boolean
  onClose: () => void
}

const MessageSlideModal: React.FC<MessageSlideModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { activeTeam } = useActiveTeam()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  // 実際のチームチャット機能を使用するため、テストモードは完全に無効化
  const modalRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  // チャットルームとメッセージを取得
  const fetchChatData = async () => {
    console.log('fetchChatData called:', { user: !!user, activeTeam: !!activeTeam })

    if (!user || !activeTeam) {
      console.log('Missing user or activeTeam, cannot load team chat')
      // ユーザーやアクティブチームがない場合は何も表示しない
      setChatRoom(null)
      setMessages([])
      return
    }

    setLoading(true)

    // 本番モード：実際のチームチャットルームを使用
    try {
        if (!activeTeam) {
          throw new Error('アクティブなチームがありません')
        }

        const roomId = `team_chat_${activeTeam.id}`
        const [roomResponse, messagesResponse] = await Promise.all([
          apiGet(`/team-chat/rooms`),
          apiGet(`/team-chat/${roomId}`)
        ])

        if (roomResponse.success && messagesResponse.success && roomResponse.data) {
          // チームチャットルーム情報を設定
          const teamChatRoom = (roomResponse.data as any).chatRooms?.find((room: any) => room.id === roomId)
          if (teamChatRoom) {
          // チームメンバーの情報を取得（専用エンドポイント）
          const membersResponse = await apiGet(`/teams/${activeTeam.id}/members`)
          const members = membersResponse.success ? (membersResponse.data as any)?.members || [] : []

            setChatRoom({
              id: teamChatRoom.id,
              name: teamChatRoom.name,
              participants: (members || []).map((member: any) => ({
                id: member?.id,
                name: member?.username || member?.name || 'ユーザー',
                avatar: member?.avatar_url || member?.avatar || null
              }))
            })
          }

          // メッセージを設定（自分のメッセージ判定をクライアント側で付与）
          const chatMessages = (messagesResponse.data as any)?.messages || []
          setMessages(chatMessages.map((msg: any) => ({
            id: msg.timestampId,
            senderId: msg.senderId,
            senderName: msg.senderName || 'Unknown',
            content: msg.message,
            timestamp: msg.createdAt,
            isMyTeam: msg.senderId === (user as any)?.id,
            senderAvatar: msg.senderAvatar
          })))
        } else {
          throw new Error('チームチャット情報の取得に失敗しました')
        }
      } catch (error) {
        console.error('チームチャット取得エラー:', error)
        // 実際のチームチャットルームの作成を試行
        if (activeTeam) {
          try {
            const createResponse = await apiPost('/team-chat/rooms', {
              teamId: activeTeam.id
            })

            if (createResponse.success) {
              // 作成後に再取得を試行
              setTimeout(() => fetchChatData(), 1000)
              return
            }
          } catch (createError) {
            console.error('チームチャットルーム作成エラー:', createError)
          }
        }

        // 最終フォールバック：エラーメッセージ
        setChatRoom(null)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

  // モーダルが開かれた時やテストモードが変更された時にチャットデータを取得
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, fetching chat data')
      fetchChatData()
    }
  }, [isOpen, user, activeTeam])

  // 実際のチームチャット機能を使用するため、テスト関連の処理は削除済み


  // メッセージ送信
  const handleSendMessage = async () => {
    console.log('handleSendMessage called:', {
      message: newMessage.trim(),
      chatRoom: !!chatRoom,
      sending
    })

    if (!newMessage.trim() || !chatRoom || sending) {
      console.log('Send message blocked:', {
        hasMessage: !!newMessage.trim(),
        hasChatRoom: !!chatRoom,
        isSending: sending
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage('') // 即座に入力フィールドをクリア
    setSending(true)

    // 楽観的更新：送信中のメッセージを即座に表示
    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: (user as any)?.id || 'current_user',
      senderName: (user as any)?.username || 'あなた',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isMyTeam: true,
      senderAvatar: (user as any)?.avatar
    }

    setMessages(prev => [...prev, tempMsg])

    // 本番モード：実際のチームチャットAPIを使用
      try {
        if (!chatRoom) {
          throw new Error('チャットルームが設定されていません')
        }

        const response = await apiPost(`/team-chat/${chatRoom.id}`, {
          message: messageContent,
          messageType: 'text'
        })

      if (response.success) {
          // サーバーからの実際のメッセージで更新
          const chatMessage = (response.data as any)?.chatMessage
          if (chatMessage) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === tempMsg.id
                  ? {
                      ...chatMessage,
                      id: chatMessage.timestampId,
                      content: chatMessage.message,
                      senderName: chatMessage.senderName,
                      senderAvatar: chatMessage.senderAvatar,
                      timestamp: chatMessage.createdAt,
                      isMyTeam: true
                    }
                  : msg
              )
            )
          }
        } else {
          throw new Error(response.error || 'メッセージ送信に失敗しました')
        }
      } catch (error) {
        console.error('チームチャットメッセージ送信エラー:', error)
        // エラー時は一時的なメッセージを削除
        setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id))
        setNewMessage(messageContent) // 入力内容を復元
        alert('メッセージの送信に失敗しました。もう一度お試しください。')
      } finally {
        setSending(false)
      }
  }

  // メッセージが更新された時に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // リアルタイムメッセージ受信（ポーリング）
  useEffect(() => {
    if (!isOpen || !chatRoom) return

    const pollMessages = async () => {
      try {
        if (!chatRoom) return

        const response = await apiGet(`/team-chat/${chatRoom.id}`)
        if (response.success && (response.data as any)?.messages) {
          const chatMessages = (response.data as any).messages
          setMessages(chatMessages.map((msg: any) => ({
            id: msg.timestampId,
            senderId: msg.senderId,
            senderName: msg.senderName || 'Unknown',
            content: msg.message,
            timestamp: msg.createdAt,
            isMyTeam: msg.senderId === (user as any)?.id,
            senderAvatar: msg.senderAvatar
          })))
        }
      } catch (error) {
        console.error('チームチャットメッセージ取得エラー:', error)
      }
    }

    // 初回取得
    pollMessages()

    // 5秒ごとにポーリング
    const interval = setInterval(pollMessages, 5000)

    return () => clearInterval(interval)
  }, [isOpen, chatRoom])

  // モーダル外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // 背景スクロールを無効化
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out"
        style={{
          height: '90vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        }}
      >
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {chatRoom?.participants?.slice(0, 4).filter(Boolean).map((participant) => (
                  <div
                    key={participant.id}
                    className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden"
                  >
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {(participant.name?.charAt(0)) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{chatRoom?.name || 'メッセージ'}</h2>
                <p className="text-sm text-gray-500">
                  {chatRoom?.participants.length || 0}人が参加中
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Icon name="x-mark" className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50" style={{ height: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Icon name="chat-bubble-oval-left-ellipsis" className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">まだメッセージがありません</p>
              <p className="text-sm text-center">最初のメッセージを送ってみましょう！</p>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isMyTeam ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs ${message.isMyTeam ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* アバター */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex-shrink-0">
                      {message.senderAvatar ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {message.senderName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* メッセージバブル */}
                    <div className={`flex flex-col ${message.isMyTeam ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3 py-2 rounded-lg ${message.isMyTeam
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                          } ${message.id.startsWith('temp_') ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.id.startsWith('temp_') && (
                          <div className="flex justify-end mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-500">{message.senderName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                        {message.id.startsWith('temp_') && (
                          <span className="text-xs text-gray-400">送信中...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* メッセージ入力エリア */}
        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Icon name="paper-airplane" className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageSlideModal
