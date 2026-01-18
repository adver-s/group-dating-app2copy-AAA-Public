'use client'

/// <reference types="react" />
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import FooterNav from '../../../components/FooterNav'
import Icon from '../../../components/Icon'
import MatchEstablishedModal from '../../../components/MatchEstablishedModal'
import BgSilhouette from '../../../components/ui/chat/BgSilhouette'
import ChatBubble from '../../../components/ui/chat/ChatBubble'
import ChatComposer from '../../../components/ui/chat/ChatComposer'
import ChatHeader from '../../../components/ui/chat/ChatHeader'
import ChatProgressBar from '../../../components/ui/chat/ChatProgressBar'
import SystemMessage from '../../../components/ui/chat/SystemMessage'
import VoiceCallComponent from '../../../components/ui/voice-call/VoiceCallComponent'
import { useActiveTeam } from '../../../contexts/ActiveTeamContext'
import { useAuth } from '../../../contexts/AuthContext'
import { apiGet, apiPost } from '@/utils/api'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'

// チャットメッセージの型定義（新しいAPI構造に対応）
interface ChatMessage {
  chatRoomId: string
  timestampId: string
  senderId: string
  message: string
  messageType: 'text' | 'image' | 'system'
  createdAt: string
  senderName?: string
  senderAvatar?: string
  isMyTeam?: boolean
  senderTeamId?: string
}

// チームメンバーの型定義
interface TeamMember {
  id: string
  username: string
  avatar_url?: string
  teamId: string
}

// マッチしたグループの型定義
interface MatchedGroup {
  teamName: string
  image?: string
  myTeamMembers: TeamMember[]
  otherTeamMembers: TeamMember[]
  myTeamId: string
  otherTeamId: string
}

// マッチの型定義
interface Match {
  id: string
  teamName: string
  lastMessage: string
  timestamp: Date
  status: string
  schedule: {
    purpose: string
    datetime: Date
    location: string
  }
  photos: {
    team1: string[]
    team2: string[]
  }
}

// 会いたい意思表示データの型定義
interface MeetIntentData {
  totalIntents: number
  totalMembers: number
  userHasExpressedIntent: boolean
  isCompleted: boolean
  fromGroupIntents: number
  toGroupIntents: number
  fromGroupMembers: number
  toGroupMembers: number
}

// サンプルデータ
const sampleMatch: Match = {
  id: '1',
  teamName: '相手チーム',
  lastMessage: 'よろしくお願いします！',
  timestamp: new Date(),
  status: 'confirmed',
  schedule: {
    purpose: '合コン',
    datetime: new Date(),
    location: '未定'
  },
  photos: {
    team1: ['/sample1.jpg'],
    team2: ['/sample2.jpg']
  }
}

// スケジュールコンポーネント
const ScheduleComponent: React.FC<{
  onBack: () => void
  onConfirm: (schedule: any) => void
}> = ({ onBack, onConfirm }: { onBack: () => void; onConfirm: (schedule: any) => void }) => {
  const [selectedPurpose, setSelectedPurpose] = useState('合コン')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const handleConfirm = () => {
    if (!selectedPurpose || !selectedDate || !selectedTime || !selectedLocation) {
      alert('目的、日付、時間、場所を入力してください')
      return
    }

    const dateTime = new Date(`${selectedDate}T${selectedTime}`)

    onConfirm({
      purpose: selectedPurpose,
      date: selectedDate,
      time: selectedTime,
      location: selectedLocation,
      datetime: dateTime.toISOString()
    })
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={onBack} className="text-gray-600">
          <Icon name="arrow-left" className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">予定調整</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目的
          </label>
          <input
            type="text"
            value={selectedPurpose}
            onChange={(e: any) => setSelectedPurpose(e.target.value)}
            placeholder="例: 合コン、飲み会、カフェ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日付
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e: any) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            時間
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e: any) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            場所
          </label>
          <input
            type="text"
            value={selectedLocation}
            onChange={(e: any) => setSelectedLocation(e.target.value)}
            placeholder="例: 渋谷駅前のカフェ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleConfirm}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          予定を確定する
        </button>
      </div>
    </div>
  )
}

// スケジュール解除祝いコンポーネント
const ScheduleUnlockCelebration: React.FC<{ onComplete: () => void }> = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">全員が会いたい意思表示をしました！</h2>
        <p className="text-gray-600 mb-4">
          予定調整画面で詳細を決めましょう
        </p>
        <button
          onClick={onComplete}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          了解
        </button>
      </div>
    </div>
  )
}

const ChatPage = () => {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading, getAccessToken } = useAuth()
  const { refreshActiveTeam } = useActiveTeam()
  const roomId = params['roomId'] as string

  // スワイプハンドラー
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => console.log('Swiped left'),
    onSwipedRight: () => console.log('Swiped right'),
    trackMouse: true
  })

  // 状態管理
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentView, setCurrentView] = useState<'chat' | 'schedule'>('chat')
  const [showMatchSuccess, setShowMatchSuccess] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showVoiceCall] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [matchedGroup, setMatchedGroup] = useState<MatchedGroup | null>(null)
  const [match, setMatch] = useState<Match>(sampleMatch)
  const [headerTeamName, setHeaderTeamName] = useState<string>('相手チーム')
  const [hasExpressedIntent, setHasExpressedIntent] = useState(false)
  const [isScheduleUnlocked, setIsScheduleUnlocked] = useState(false)
  const [matchData, setMatchData] = useState<{ proposalId: string; scheduledAt: string } | null>(null)
  const [meetIntentData, setMeetIntentData] = useState<MeetIntentData>({
    totalIntents: 0,
    totalMembers: 4,
    userHasExpressedIntent: false,
    isCompleted: false,
    fromGroupIntents: 0,
    toGroupIntents: 0,
    fromGroupMembers: 2,
    toGroupMembers: 2
  })
  const [isPolling, setIsPolling] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // メッセージが更新された時に自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // メッセージが更新された時に自動スクロール
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 会いたい意思表示データを取得する関数（新しい同意管理システム）
  const fetchMeetIntentData = async () => {
    console.log('🔍 会いたい意思表示データを取得中...')

    try {
      // 新しい同意管理APIからデータを取得（GET相当の処理）
      const response = await fetch(`/api/chat/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          consent: false  // 取得のみなのでfalseを送信
        })
      })

      const data = await response.json()
      console.log('🔍 会いたい意思表示データ取得レスポンス:', data)

      if (response.ok && data.success) {
        console.log('✅ 会いたい意思表示データ取得成功')

        // 新しい同意データで状態を更新
        const teams = data.teams || [];
        const myTeam = teams.find((team: any) => team.team_id === matchedGroup?.myTeamId);
        const otherTeam = teams.find((team: any) => team.team_id === matchedGroup?.otherTeamId);

        setMeetIntentData({
          totalIntents: teams.reduce((sum: number, team: any) => sum + (team.consenting_members || 0), 0),
          totalMembers: teams.reduce((sum: number, team: any) => sum + (team.total_members || 0), 0),
          userHasExpressedIntent: myTeam?.consenting_members > 0,
          isCompleted: data.isCompleted || false,
          fromGroupIntents: myTeam?.consenting_members || 0,
          toGroupIntents: otherTeam?.consenting_members || 0,
          fromGroupMembers: myTeam?.total_members || 0,
          toGroupMembers: otherTeam?.total_members || 0
        })

        // スケジュール解除の条件をチェック
        const isCompleted = data.isCompleted || false
        setIsScheduleUnlocked(isCompleted)

        // 全員が同意した場合、祝いモーダルを表示（一度だけ）
        if (isCompleted) {
          const celebrationShown = localStorage.getItem(`celebration_shown_${roomId}`)
          if (!celebrationShown) {
            setShowCelebration(true)
            localStorage.setItem(`celebration_shown_${roomId}`, 'true')
          }
        }
      } else {
        console.error('❌ 会いたい意思表示データ取得エラー:', data.error)
        // エラー時は既存のデータを保持
      }
    } catch (error) {
      console.error('❌ 会いたい意思表示データ取得エラー:', error)
      // エラー時は既存のデータを保持
    }
  }

  // 予定調整状況をチェックする関数
  const checkScheduleStatus = async () => {
    try {
      const matchingFlowId = roomId.replace('chat_', '');
      console.log('🔍 予定調整状況をチェック中...', matchingFlowId);

      const response = await fetch(`/api/meeting/schedule/check?matchingFlowId=${matchingFlowId}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasSchedule) {
          console.log('✅ 予定が確定されています:', data.scheduleData);
          // 予定が確定されている場合、モーダルを表示
          setShowMatchSuccess(true);
          setMatchData({
            proposalId: matchingFlowId,
            scheduledAt: data.scheduleData.datetime
          });
        }
      }
    } catch (error) {
      console.error('❌ 予定調整状況チェックエラー:', error);
    }
  };

  // マッチしたグループの情報を取得
  useEffect(() => {
    const fetchMatchInfo = async () => {
      console.log('🚀 fetchMatchInfo関数開始')
      try {
        setPageLoading(true)
        const matchId = roomId.replace('chat_', '')
        console.log('🔍 マッチ情報を取得中... matchId:', matchId)

        // マッチ一覧APIからマッチ情報を取得
        console.log('🔍 マッチ一覧API呼び出し開始')
        const matchesResponse = await apiGet('/matches')
        console.log('🔍 マッチ一覧情報:', matchesResponse)

        if (matchesResponse.success && matchesResponse.data) {
          const matches = matchesResponse.data as any[]
          const currentMatch = matches.find(m => m.id === matchId)

          if (currentMatch) {
            console.log('🔍 現在のマッチ情報:', currentMatch)

            // ユーザーのチーム情報を取得
            const userTeamsResponse = await apiGet('/teams')
            console.log('🔍 ユーザーのチーム情報:', userTeamsResponse)

            let userTeamId = currentMatch.userTeamId
            let otherTeamId = currentMatch.otherTeamId
            const resolvedOtherTeamName = (currentMatch.otherTeamName
              || currentMatch.teamName
              || (currentMatch.otherTeam && currentMatch.otherTeam.name)
              || '相手チーム') as string
            let otherTeamName = resolvedOtherTeamName

            if (userTeamsResponse.success && userTeamsResponse.data) {
              const userTeams = userTeamsResponse.data as any[]
              const activeTeam = userTeams.find(team => team.isActive === true || team.is_active === true || team.user_active_team === true)
              if (activeTeam) {
                userTeamId = activeTeam.id
                // team1_id 等が存在する場合にのみ再計算し、無ければ既存の値を保持
                if (currentMatch.team1_id && currentMatch.team2_id) {
                  otherTeamId = currentMatch.team1_id === userTeamId ? currentMatch.team2_id : currentMatch.team1_id
                  const computedOtherName = currentMatch.team1_id === userTeamId ? (currentMatch.team2_name || currentMatch.otherTeamName) : (currentMatch.team1_name || currentMatch.otherTeamName)
                  otherTeamName = computedOtherName || otherTeamName
                }
              }
            }

            // フォールバック: まだ相手チーム名が解決できない場合はチーム詳細APIから取得
            if (!otherTeamName || otherTeamName === '相手チーム') {
              try {
                if (otherTeamId) {
                  const otherTeamData = await apiGet(`/teams/${otherTeamId}/data`)
                  if (otherTeamData.success && (otherTeamData.data as any)?.team?.name) {
                    otherTeamName = (otherTeamData.data as any).team.name as string
                  }
                }
              } catch (e) {
                console.log('⚠️ 相手チーム名フォールバック取得に失敗:', e)
              }
            }

            // ヘッダー名を即時反映
            setHeaderTeamName(otherTeamName)

            console.log('✅ チーム情報設定完了:', {
              userTeamId,
              otherTeamId,
              otherTeamName
            })

            // 実際のチームメンバー情報を取得
            console.log('🔍 チームメンバー情報取得開始:', { userTeamId, otherTeamId })
            const myTeamMembersResponse = await apiGet(`/teams/${userTeamId}/members`)
            const otherTeamMembersResponse = await apiGet(`/teams/${otherTeamId}/members`)

            console.log('🔍 チームメンバーAPIレスポンス:', {
              myTeamSuccess: myTeamMembersResponse.success,
              otherTeamSuccess: otherTeamMembersResponse.success,
              myTeamData: myTeamMembersResponse.data,
              otherTeamData: otherTeamMembersResponse.data
            })

            const myTeamMembers = myTeamMembersResponse.success ?
              (myTeamMembersResponse.data as any).members || [] : []
            const otherTeamMembers = otherTeamMembersResponse.success ?
              (otherTeamMembersResponse.data as any).members || [] : []

            console.log('🔍 チームメンバー詳細:', {
              myTeamMembers: myTeamMembers.map((m: any) => ({
                id: m.user_id || m.users?.id || m.id,
                username: m.username || m.users?.username,
                avatar_url: m.avatar_url || m.users?.avatar_url
              })),
              otherTeamMembers: otherTeamMembers.map((m: any) => ({
                id: m.user_id || m.users?.id || m.id,
                username: m.username || m.users?.username,
                avatar_url: m.avatar_url || m.users?.avatar_url
              }))
            })

            console.log('🔍 チームメンバー情報:', {
              myTeamMembers: myTeamMembers.length,
              otherTeamMembers: otherTeamMembers.length,
              myTeamMembersDetail: myTeamMembers.map((m: any) => ({
                id: m.user_id || m.users?.id || m.id,
                username: m.username || m.users?.username
              })),
              otherTeamMembersDetail: otherTeamMembers.map((m: any) => ({
                id: m.user_id || m.users?.id || m.id,
                username: m.username || m.users?.username
              }))
            })

            // matchedGroupの状態を更新（実際のメンバー情報を使用）
            const newMatchedGroup = {
              teamName: otherTeamName,
              image: '/default-team.png',
              myTeamMembers: myTeamMembers.map((member: any) => ({
                id: member.user_id || member.users?.id || member.id,
                username: member.username || member.users?.username,
                avatar_url: member.avatar_url || member.users?.avatar_url
              })),
              otherTeamMembers: otherTeamMembers.map((member: any) => ({
                id: member.user_id || member.users?.id || member.id,
                username: member.username || member.users?.username,
                avatar_url: member.avatar_url || member.users?.avatar_url
              })),
              myTeamId: userTeamId,
              otherTeamId: otherTeamId
            }

            console.log('✅ matchedGroup設定完了:', newMatchedGroup)
            setMatchedGroup(newMatchedGroup)

            // matchの状態も更新
            setMatch({
              ...sampleMatch,
              id: matchId,
              teamName: otherTeamName
            })
          } else {
            console.error('マッチが見つかりません:', matchId)
            // マッチが見つからない場合でもローディングを解除
            setPageLoading(false)
          }
        } else {
          console.error('マッチ一覧の取得に失敗しました')
          setPageLoading(false)
        }
      } catch (error) {
        console.error('マッチ情報取得エラー:', error)
        setPageLoading(false)
      } finally {
        // 最終的にローディングを解除
        setPageLoading(false)
      }
    }

    if (roomId && user) {
      console.log('🔍 fetchMatchInfo実行開始:', { roomId, user: user.id })
      fetchMatchInfo()
    } else {
      console.log('⚠️ fetchMatchInfo実行条件未満足:', { roomId, hasUser: !!user })
    }
  }, [roomId, user])

  // メッセージを取得（統合版）
  const fetchMessages = async () => {
    try {
      console.log('🔍 メッセージを取得中... roomId:', roomId)

      // matchedGroupが初期化されていない場合はスキップ
      console.log('🔍 matchedGroup状態確認:', {
        matchedGroup: matchedGroup,
        hasMyTeamMembers: !!matchedGroup?.myTeamMembers,
        hasOtherTeamMembers: !!matchedGroup?.otherTeamMembers,
        myTeamMembersLength: matchedGroup?.myTeamMembers?.length,
        otherTeamMembersLength: matchedGroup?.otherTeamMembers?.length
      })

      const response = await apiGet(`/chat/${roomId}`)

      if (response.success && response.data) {
        const fetchedMessages = (response.data as any).messages as ChatMessage[]
        console.log('✅ メッセージ取得成功:', fetchedMessages.length, '件')

        // matchedGroupが初期化されている場合のみチーム情報を追加
        if (matchedGroup?.myTeamMembers && matchedGroup?.otherTeamMembers) {
          // メッセージにチーム情報を追加
          const messagesWithTeamInfo = fetchedMessages.map(msg => {
            // システムメッセージの場合は中央に表示
            if (msg.senderId === 'system') {
              return {
                ...msg,
                isMyTeam: false,
                senderTeamId: 'system'
              }
            }

            // 自分のチームのメンバーIDリストを作成（APIレスポンス構造に合わせて修正）
            const myTeamMemberIds = matchedGroup?.myTeamMembers?.map((member: any) => (member as any).user_id || (member as any).users?.id || member.id) || []
            const otherTeamMemberIds = matchedGroup?.otherTeamMembers?.map((member: any) => (member as any).user_id || (member as any).users?.id || member.id) || []

            // 送信者が自分のチームのメンバーかどうかを判定
            const isMyTeam = myTeamMemberIds.includes(msg.senderId) || (user?.id ? msg.senderId === user.id : false)
            const isOtherTeam = otherTeamMemberIds.includes(msg.senderId)

            // デバッグログ（メッセージ表示位置の確認用）
            console.log(`🔍 メッセージ送信者判定:`, {
              senderId: msg.senderId,
              senderName: msg.senderName,
              isMyTeam,
              isOtherTeam,
              myTeamMemberIds,
              otherTeamMemberIds
            })

            return {
              ...msg,
              isMyTeam,
              senderTeamId: isMyTeam ? matchedGroup?.myTeamId : matchedGroup?.otherTeamId
            }
          })

          setMessages(messagesWithTeamInfo)
        } else {
          // matchedGroupが初期化されていない場合は、チーム情報なしでメッセージを表示
          console.log('⚠️ matchedGroupが初期化されていないため、チーム情報なしでメッセージを表示')
          const messagesWithoutTeamInfo = fetchedMessages.map(msg => ({
            ...msg,
            isMyTeam: user?.id ? msg.senderId === user.id : false,
            senderTeamId: 'unknown'
          }))
          setMessages(messagesWithoutTeamInfo)
        }
      } else {
        console.error('❌ メッセージ取得エラー:', response.error)
      }
    } catch (error) {
      console.error('❌ メッセージ取得エラー:', error)
    }
  }

  // 会いたい意思表示の状態を取得
  useEffect(() => {
    if (roomId && user) {
      fetchMeetIntentData()

      // 軽量ポーリングでゲージを更新（5秒）
      const interval = setInterval(fetchMeetIntentData, 5000)
      return () => clearInterval(interval)
    }
  }, [roomId, user])

  // matchedGroupが初期化された後にメッセージを再取得
  useEffect(() => {
    if (matchedGroup?.myTeamMembers && matchedGroup?.otherTeamMembers) {
      console.log('🔄 matchedGroup初期化完了、メッセージを再取得')
      fetchMessages()
    }
  }, [matchedGroup])

  // 予定調整状況を定期的にチェック
  useEffect(() => {
    if (roomId && user && isScheduleUnlocked) {
      // 初回チェック
      checkScheduleStatus();

      // 30秒ごとにチェック
      const interval = setInterval(checkScheduleStatus, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [roomId, user, isScheduleUnlocked]);

  // アクティブチーム変更イベントを監視
  useEffect(() => {
    const unsubscribe = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async (data) => {
      console.log('🔄 チャット画面: アクティブチーム変更イベントを受信:', data);
      // アクティブチームを更新
      await refreshActiveTeam();
      // マッチ情報を再取得
      const fetchMatchInfo = async () => {
        try {
          const matchId = roomId.replace('chat_', '');
          console.log('🔍 マッチ情報を再取得中... matchId:', matchId);

          const matchDetailsResponse = await apiGet(`/debug/check-matching-flow?matchId=${matchId}`);
          if (matchDetailsResponse.success) {
            const matchData = matchDetailsResponse.data as any;

            // ユーザーのチーム情報を再取得
            const userTeamsResponse = await apiGet('/teams/my-teams');
            let userTeamId = matchData.flow.fromTeam.id;
            if (userTeamsResponse.success && userTeamsResponse.data) {
              const userTeams = userTeamsResponse.data as any[];
              const activeTeam = userTeams.find(team => team.status === 'active');
              if (activeTeam) {
                userTeamId = activeTeam.id;
              }
            }

            // マッチ情報を更新
            const otherTeamId = matchData.flow.fromTeam.id === userTeamId ?
              matchData.flow.toTeam.id : matchData.flow.fromTeam.id;

            // 実際のチームメンバー情報を取得
            try {
              const [myTeamResponse, otherTeamResponse] = await Promise.all([
                apiGet(`/teams/${userTeamId}/members`),
                apiGet(`/teams/${otherTeamId}/members`)
              ]);

              const myTeamMembers = myTeamResponse.success ? (myTeamResponse.data as any).members : [];
              const otherTeamMembers = otherTeamResponse.success ? (otherTeamResponse.data as any).members : [];

              setMatchedGroup({
                teamName: matchData.flow.fromTeam.id === userTeamId ?
                  matchData.flow.toTeam.name : matchData.flow.fromTeam.name,
                myTeamMembers: myTeamMembers,
                otherTeamMembers: otherTeamMembers,
                myTeamId: userTeamId,
                otherTeamId: otherTeamId
              });
            } catch (error) {
              console.error('❌ チームメンバー情報取得エラー:', error);
              // フォールバック: デバッグAPIの情報を使用
              const myTeamMembers = matchData.flow.fromTeam.id === userTeamId ?
                matchData.flow.fromTeam.members : matchData.flow.toTeam.members;

              const otherTeamMembers = matchData.flow.fromTeam.id === userTeamId ?
                matchData.flow.toTeam.members : matchData.flow.fromTeam.members;

              setMatchedGroup({
                teamName: matchData.flow.fromTeam.id === userTeamId ?
                  matchData.flow.toTeam.name : matchData.flow.fromTeam.name,
                myTeamMembers: myTeamMembers,
                otherTeamMembers: otherTeamMembers,
                myTeamId: userTeamId,
                otherTeamId: otherTeamId
              });
            }
          }
        } catch (error) {
          console.error('❌ マッチ情報再取得エラー:', error);
        }
      };
      fetchMatchInfo();
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, refreshActiveTeam]);



  // 初期メッセージ取得とポーリング（matchedGroup初期化後に実行）
  useEffect(() => {
    if (roomId && user) {
      console.log('🔍 メッセージ取得条件チェック:', {
        roomId,
        userId: user.id,
        hasMatchedGroup: !!matchedGroup,
        hasMyTeamMembers: !!matchedGroup?.myTeamMembers,
        hasOtherTeamMembers: !!matchedGroup?.otherTeamMembers,
        myTeamMembersLength: matchedGroup?.myTeamMembers?.length,
        otherTeamMembersLength: matchedGroup?.otherTeamMembers?.length
      })

      // matchedGroupが初期化されていなくても、メッセージ取得を試行
      if (matchedGroup?.myTeamMembers && matchedGroup?.otherTeamMembers) {
        console.log('🔍 matchedGroup初期化完了、メッセージ取得開始:', {
          myTeamMembers: matchedGroup.myTeamMembers.length,
          otherTeamMembers: matchedGroup.otherTeamMembers.length
        })

        // 初期取得
        fetchMessages()

        // ポーリング間隔（ミリ秒）
        const POLLING_INTERVAL = 5000 // 5秒に変更（データベース負荷軽減）

        // 定期的にメッセージを更新（ポーリング）
        const interval = setInterval(() => {
          console.log('🔄 メッセージを自動更新中...')
          setIsPolling(true)
          fetchMessages().finally(() => {
            setIsPolling(false)
          })
        }, POLLING_INTERVAL)

        // クリーンアップ
        return () => {
          console.log('🧹 ポーリングを停止')
          clearInterval(interval)
        }
      } else {
        console.log('⚠️ matchedGroupが初期化されていないため、メッセージ取得をスキップ')
      }
    }
    return undefined;
  }, [roomId, user, matchedGroup])

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await apiPost(`/chat/${roomId}`, {
        message: newMessage,
        messageType: 'text'
      })

      if (response.success) {
        console.log('✅ メッセージ送信成功')
        setNewMessage('')

        // 送信後に即座にメッセージを再取得
        setTimeout(() => {
          fetchMessages()
        }, 100)
      }
    } catch (error) {
      console.error('❌ メッセージ送信エラー:', error)
      alert('メッセージの送信に失敗しました')
    }
  }

  // 会いたい意思表示（新しい同意管理システム）
  const handleMeetIntent = async () => {
    try {
      console.log('🔍 会いたい意思表示開始:', roomId)

      // 新しい同意管理APIを呼び出し
      const response = await fetch(`/api/chat/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          consent: true
        })
      })

      const data = await response.json()
      console.log('🔍 API レスポンス:', data)

      if (response.ok && data.success) {
        console.log('✅ 会いたい意思表示完了')
        setHasExpressedIntent(true)

        // システムメッセージを追加
        const systemMsg: ChatMessage = {
          chatRoomId: roomId,
          timestampId: `system_${Date.now()}`,
          senderId: 'system',
          message: `${user?.name || 'あなた'}が会いたい意思表示をしました！`,
          messageType: 'system',
          createdAt: new Date().toISOString(),
          senderName: 'システム'
        }
        setMessages((prev: any[]) => [...prev, systemMsg])

        // 新しい同意データで状態を更新
        setMeetIntentData({
          totalIntents: data.teams.reduce((sum: number, team: any) => sum + team.consenting_members, 0),
          totalMembers: data.teams.reduce((sum: number, team: any) => sum + team.total_members, 0),
          userHasExpressedIntent: true,
          isCompleted: data.isCompleted || false,
          fromGroupIntents: data.teams.find((team: any) => team.team_id === matchedGroup?.myTeamId)?.consenting_members || 0,
          toGroupIntents: data.teams.find((team: any) => team.team_id === matchedGroup?.otherTeamId)?.consenting_members || 0,
          fromGroupMembers: data.teams.find((team: any) => team.team_id === matchedGroup?.myTeamId)?.total_members || 0,
          toGroupMembers: data.teams.find((team: any) => team.team_id === matchedGroup?.otherTeamId)?.total_members || 0
        })

        // 全員が同意した場合、祝いモーダルを表示（一度だけ）
        if (data.isCompleted) {
          setIsScheduleUnlocked(true)
          const celebrationShown = localStorage.getItem(`celebration_shown_${roomId}`)
          if (!celebrationShown) {
            setShowCelebration(true)
            localStorage.setItem(`celebration_shown_${roomId}`, 'true')
          }
        }
      } else {
        console.error('❌ 会いたい意思表示エラー:', data.error)
        alert(data.error || '会いたい意思表示に失敗しました')
      }
    } catch (error) {
      console.error('❌ 会いたい意思表示エラー:', error)
      alert('会いたい意思表示に失敗しました')
    }
  }

  // キャンセル
  const handleCancel = () => {
    router.back()
  }

  // スケジュール確定
  const handleScheduleConfirm = async (schedule: any) => {
    try {
      const actualMatchId = roomId.replace('chat_', '')
      console.log('🔍 予定調整確定開始:', { actualMatchId, schedule })

      // 直接fetchを使用して詳細なエラーハンドリング
      const accessToken = getAccessToken()
      const requestBody = JSON.stringify({
        matchingFlowId: actualMatchId,
        scheduleData: {
          purpose: schedule.purpose || '合コン',
          datetime: schedule.datetime,
          location: schedule.location,
          link: schedule.link
        }
      })

      console.log('🔍 リクエストボディ:', requestBody)

      const response = await fetch('/api/meeting/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: requestBody,
      })

      console.log('🔍 レスポンスステータス:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 予定調整確定成功:', result)
        setCurrentView('chat')

        // 合コン成立モーダルを表示
        const responseData = result.data || result
        const formattedDate = new Date(responseData.scheduledDateTime).toLocaleString('ja-JP')
        setMatchData({
          proposalId: actualMatchId,
          scheduledAt: `${responseData.purpose} - ${formattedDate} - ${responseData.location}`
        })
        setShowMatchSuccess(true)

        // システムメッセージを追加（APIで既に送信済みだが、ローカルでも追加）
        const systemMsg: ChatMessage = {
          chatRoomId: roomId,
          timestampId: `system_${Date.now()}`,
          senderId: 'system',
          message: `🎉 合コンが成立しました！\n📅 ${responseData.purpose}\n🕐 ${formattedDate}\n📍 ${responseData.location}`,
          messageType: 'system',
          createdAt: new Date().toISOString(),
          senderName: 'システム'
        }
        setMessages((prev: any[]) => [...prev, systemMsg])

        // 予定調整状態を更新
        setIsScheduleUnlocked(false)
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          console.error('❌ JSON解析エラー:', jsonError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('❌ 予定調整確定エラー:', errorData)
        alert(errorData.error || `予定調整の確定に失敗しました (${response.status})`)
      }
    } catch (error: any) {
      console.error('❌ 予定調整確定ネットワークエラー:', error)
      console.error('❌ エラーの詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      alert(`ネットワークエラー: ${error.message}`)
    }
  }

  // メッセージエリアを最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 認証チェック
  if (authLoading) {
    return <div className="h-screen flex items-center justify-center">読み込み中...</div>
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  if (pageLoading) {
    return <div className="h-screen flex items-center justify-center">チャットを読み込み中...</div>
  }

  return (
    <div {...swipeHandlers} className="h-screen bg-[#FCFAFA] flex flex-col relative pb-24">
      {/* 背景シルエット */}
      <BgSilhouette />

      {currentView === 'chat' ? (
        // チャットビュー
        <>
          {/* ヘッダー */}
          <div className="relative">
            <ChatHeader
              teamName={matchedGroup?.teamName || headerTeamName || match.teamName}
              teamImage={matchedGroup?.image}
              teamMembers={matchedGroup?.otherTeamMembers?.map((member: any) => ({
                id: member.id,
                name: member.username,
                avatar: member.avatar_url as string | undefined
              }))}
              onBack={() => router.back()}
              isScheduleUnlocked={isScheduleUnlocked}
            />
            {/* ポーリング状態インジケーター */}
            {isPolling && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* 会いたい人数プログレス */}
          <div className="px-4 py-2 bg-white border-b border-[#F1E9EC] flex-shrink-0">
            <ChatProgressBar
              current={meetIntentData.totalIntents}
              total={meetIntentData.totalMembers}
              fromGroupIntents={meetIntentData.fromGroupIntents}
              toGroupIntents={meetIntentData.toGroupIntents}
              fromGroupMembers={meetIntentData.fromGroupMembers}
              toGroupMembers={meetIntentData.toGroupMembers}
              isCompleted={meetIntentData.isCompleted}
            />
          </div>

          {/* デバッグ情報（開発時のみ表示） */}
          {process.env.NODE_ENV === 'development' && matchedGroup && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">自分チーム ({matchedGroup.myTeamMembers.length}人):</span>
                  {matchedGroup.myTeamMembers.map((member: any) => (
                    <span key={member.id} className="ml-2 text-gray-600">
                      {member.username}
                    </span>
                  ))}
                </div>
                <div>
                  <span className="font-medium">相手チーム ({matchedGroup.otherTeamMembers.length}人): {matchedGroup.teamName}</span>
                  {matchedGroup.otherTeamMembers.map((member: any) => (
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
                <div>matchedGroup: {matchedGroup ? '初期化済み' : '未初期化'}</div>
                <div>myTeamMembers: {matchedGroup?.myTeamMembers?.length || 0}</div>
                <div>otherTeamMembers: {matchedGroup?.otherTeamMembers?.length || 0}</div>
              </div>
            )}

            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>メッセージがありません</p>
                  <p className="text-sm">チャットを開始しましょう！</p>
                </div>
              ) : (
                messages.map((message: any, index: number) => {
                  if (message.messageType === 'system') {
                    return <SystemMessage message={message.message} />
                  }

                  return (
                    <ChatBubble
                      message={{
                        id: message.timestampId,
                        userId: message.senderId,
                        teamId: message.senderTeamId || '',
                        content: message.message,
                        timestamp: new Date(message.createdAt),
                        senderName: message.senderName || 'Unknown',
                        isMyTeam: message.isMyTeam || false,
                        senderAvatar: message.senderAvatar as string | undefined
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
              onMeetIntent={handleMeetIntent}
              onCancel={handleCancel}
              hasExpressedIntent={hasExpressedIntent}
              isScheduleUnlocked={isScheduleUnlocked}
              onScheduleMeeting={() => setCurrentView('schedule')}
              totalIntents={meetIntentData.totalIntents}
              totalMembers={meetIntentData.totalMembers}
              onRefreshData={fetchMeetIntentData}
            />
          </div>
        </>
      ) : (
        // 予定調整ビュー
        <ScheduleComponent
          onBack={() => setCurrentView('chat')}
          onConfirm={handleScheduleConfirm}
        />
      )}

      {/* 祝いモーダル */}
      {showCelebration && (
        <ScheduleUnlockCelebration onComplete={() => {
          setShowCelebration(false)
          // ローカルストレージのフラグをクリアして、再度表示できるようにする
          localStorage.removeItem(`celebration_shown_${roomId}`)
        }} />
      )}

      {/* 合コン成立モーダル */}
      {matchData && (
        <MatchEstablishedModal
          open={showMatchSuccess}
          proposalId={matchData.proposalId}
          scheduledAt={matchData.scheduledAt}
          onClose={() => {
            setShowMatchSuccess(false);
            setMatchData(null);
          }}
        />
      )}

      {/* ボイスコール */}
      {showVoiceCall && (
        <VoiceCallComponent
          roomId={roomId}
          externalUserId={user?.id || ''}
        />
      )}

      {/* フッターナビゲーション */}
      <FooterNav activeTab="matches" />
    </div>
  )
}

export default ChatPage;