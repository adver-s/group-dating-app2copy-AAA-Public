'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import BgSilhouette from '../../../components/ui/chat/BgSilhouette'
import ChatBubble from '../../../components/ui/chat/ChatBubble'
import ChatComposer from '../../../components/ui/chat/ChatComposer'
import ChatHeader from '../../../components/ui/chat/ChatHeader'
import SystemMessage from '../../../components/ui/chat/SystemMessage'
import { useActiveTeam } from '../../../contexts/ActiveTeamContext'
import { useAuth } from '../../../contexts/AuthContext'
import { apiGet, apiPost } from '@/utils/api'

// チーム内チャットメッセージの型定義
interface TeamChatMessage {
  chatRoomId: string
  timestampId: string
  senderId: string
  message: string
  messageType: 'text' | 'image' | 'system'
  createdAt: string
  senderName?: string
  senderAvatar?: string
  isMyMessage?: boolean
}

// チームメンバーの型定義
interface TeamMember {
  id: string
  username: string
  avatar_url?: string
  teamId: string
}

// チーム情報の型定義
interface TeamInfo {
  id: string
  name: string
  description?: string
  members: TeamMember[]
}

const TeamChatPage = () => {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeTeam } = useActiveTeam()
  const roomId = params.roomId as string

  // スワイプハンドラー
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => console.log('Swiped left'),
    onSwipedRight: () => console.log('Swiped right'),
    trackMouse: true
  })

  // 状態管理
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // メッセージが更新された時に自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // チーム情報を取得
  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        setPageLoading(true)
        const teamId = roomId.replace('team_chat_', '')
        console.log('🔍 チーム情報を取得中... teamId:', teamId)

        // チーム情報を取得
        const teamResponse = await apiGet(`/teams/${teamId}`)
        console.log('🔍 チーム情報:', teamResponse)

        if (teamResponse.success && teamResponse.data) {
          const team = (teamResponse.data as any).team || null

          // チームメンバー情報を取得
          const membersResponse = await apiGet(`/teams/${teamId}/members`)
          console.log('🔍 チームメンバー情報:', membersResponse)

          const members = membersResponse.success ?
            (membersResponse.data as any).members || [] : []

          const teamData: TeamInfo = team ? {
            id: team.id,
            name: team.name,
            description: team.description,
            members: members.map((member: any) => ({
              id: member.user_id || member.users?.id || member.id,
              username: member.username || member.users?.username,
              avatar_url: member.avatar_url || member.users?.avatar_url,
              teamId: team.id
            }))
          } : null as any

          console.log('✅ チーム情報設定完了:', teamData)
          setTeamInfo(teamData)
        } else {
          console.error('チーム情報の取得に失敗しました')
        }
      } catch (error) {
        console.error('チーム情報取得エラー:', error)
      } finally {
        setPageLoading(false)
      }
    }

    if (roomId && user) {
      console.log('🔍 fetchTeamInfo実行開始:', { roomId, user: user.id })
      fetchTeamInfo()
    }
  }, [roomId, user])

  // メッセージを取得
  const fetchMessages = async () => {
    try {
      console.log('🔍 チームチャットメッセージを取得中... roomId:', roomId)

      const response = await apiGet(`/team-chat/${roomId}`)

      if (response.success && response.data) {
        const fetchedMessages = (response.data as any).messages as TeamChatMessage[]
        console.log('✅ チームチャットメッセージ取得成功:', fetchedMessages.length, '件')

        // メッセージに自分のメッセージかどうかの情報を追加
        const messagesWithUserInfo = fetchedMessages.map(msg => {
          const isMyMessage = msg.senderId === user?.id

          return {
            ...msg,
            isMyMessage
          }
        })

        setMessages(messagesWithUserInfo)
      } else {
        console.error('❌ チームチャットメッセージ取得エラー:', response.error)
      }
    } catch (error) {
      console.error('❌ チームチャットメッセージ取得エラー:', error)
    }
  }

  // 初期メッセージ取得とポーリング
  useEffect(() => {
    if (roomId && user && teamInfo) {
      console.log('🔍 チームチャットメッセージ取得条件チェック:', {
        roomId,
        userId: user.id,
        hasTeamInfo: !!teamInfo,
        teamMembers: teamInfo.members.length
      })

      // 初期取得
      fetchMessages()

      // ポーリング間隔（ミリ秒）
      const POLLING_INTERVAL = 5000 // 5秒

      // 定期的にメッセージを更新（ポーリング）
      const interval = setInterval(() => {
        console.log('🔄 チームチャットメッセージを自動更新中...')
        setIsPolling(true)
        fetchMessages().finally(() => {
          setIsPolling(false)
        })
      }, POLLING_INTERVAL)

      // クリーンアップ
      return () => {
        console.log('🧹 チームチャットポーリングを停止')
        clearInterval(interval)
      }
    }
  }, [roomId, user, teamInfo])

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await apiPost(`/team-chat/${roomId}`, {
        message: newMessage,
        messageType: 'text'
      })

      if (response.success) {
        console.log('✅ チームチャットメッセージ送信成功')
        setNewMessage('')

        // 送信後に即座にメッセージを再取得
        setTimeout(() => {
          fetchMessages()
        }, 100)
      }
    } catch (error) {
      console.error('❌ チームチャットメッセージ送信エラー:', error)
      alert('メッセージの送信に失敗しました')
    }
  }

  // キャンセル
  const handleCancel = () => {
    router.back()
  }

  // 認証チェック
  if (authLoading) {
    return <div className="h-screen flex items-center justify-center">読み込み中...</div>
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  // アクティブチームが無い場合の案内
  if (!activeTeam) {
    return (
      <div className="h-screen bg-[#FCFAFA] flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 text-gray-800 text-lg font-medium">チームチャット</div>
        <p className="text-gray-600 mb-8">アクティブなチームがありません。まずチームを作成・参加してからご利用ください。</p>
        <button
          onClick={() => router.push('/teams')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600"
        >
          チームを探す / 作成する
        </button>
      </div>
    )
  }

  if (pageLoading) {
    return <div className="h-screen flex items-center justify-center">チームチャットを読み込み中...</div>
  }

  return (
    <div {...swipeHandlers} className="h-screen bg-[#FCFAFA] flex flex-col relative">
      {/* 背景シルエット */}
      <BgSilhouette />

      {/* ヘッダー */}
      <div className="relative">
        <ChatHeader
          teamName={teamInfo?.name || 'チームチャット'}
          teamImage={null}
          teamMembers={teamInfo?.members?.map(member => ({
            id: member.id,
            name: member.username,
            avatar: member.avatar_url
          }))}
          onBack={() => router.back()}
          isScheduleUnlocked={false}
        />
        {/* ポーリング状態インジケーター */}
        {isPolling && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && teamInfo && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
          <div className="flex justify-between">
            <div>
              <span className="font-medium">チームメンバー ({teamInfo.members.length}人):</span>
              {teamInfo.members.map(member => (
                <span key={member.id} className="ml-2 text-gray-600">
                  {member.username}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-[#FCFAFA] relative z-10">
        {/* デバッグ情報（開発時のみ表示） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs mb-2">
            <div>メッセージ数: {messages.length}</div>
            <div>teamInfo: {teamInfo ? '初期化済み' : '未初期化'}</div>
            <div>teamMembers: {teamInfo?.members?.length || 0}</div>
          </div>
        )}

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>まだメッセージがありません</p>
              <p className="text-sm">最初のメッセージを送ってみましょう！</p>
            </div>
          ) : (
            messages.map((message, index) => {
              if (message.messageType === 'system') {
                return <SystemMessage key={`${message.timestampId}-${index}`} message={message.message} />
              }

              return (
                <ChatBubble
                  key={`${message.timestampId}-${index}`}
                  message={{
                    id: message.timestampId,
                    userId: message.senderId,
                    teamId: teamInfo?.id || '',
                    content: message.message,
                    timestamp: new Date(message.createdAt),
                    senderName: message.senderName || 'Unknown',
                    isMyTeam: message.isMyMessage || false,
                    senderAvatar: message.senderAvatar
                  }}
                />
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="relative z-10">
        <ChatComposer
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onMeetIntent={() => { }} // チーム内チャットでは使用しない
          onCancel={handleCancel}
          hasExpressedIntent={false} // チーム内チャットでは使用しない
          isScheduleUnlocked={false} // チーム内チャットでは使用しない
          onScheduleMeeting={() => { }} // チーム内チャットでは使用しない
          totalIntents={0} // チーム内チャットでは使用しない
          totalMembers={0} // チーム内チャットでは使用しない
          onRefreshData={() => { }} // チーム内チャットでは使用しない
        />
      </div>
    </div>
  )
}

export default TeamChatPage
