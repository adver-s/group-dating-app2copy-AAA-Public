'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import FooterNav from '../../../components/FooterNav'
import Icon from '../../../components/Icon'
import TeamImageSwiper from '../../../components/TeamImageSwiper'
import { useAuth } from '../../../contexts/AuthContext'

interface TeamMember {
  userId: string;
  username: string;
  bio: string;
  age: number;
  avatarUrl?: string;
  interests: string[];
  isActiveTeam: boolean;
  joinedAt: string;
}

interface ActiveGroup {
  id: string;
  name: string;
  description: string;
}

// メンバー招待用のインターフェース
interface InviteMember {
  userId: string;
  username: string;
  email: string;
}

// 利用可能時間のオプション
const availableTimes = [
  '平日昼', '平日夜', '土日昼', '土日夜', '平日', '土日', '毎日'
]

// 都道府県リスト
const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

// 曜日の設定
const days = [
  { key: 'monday', label: '月' },
  { key: 'tuesday', label: '火' },
  { key: 'wednesday', label: '水' },
  { key: 'thursday', label: '木' },
  { key: 'friday', label: '金' },
  { key: 'saturday', label: '土' },
  { key: 'sunday', label: '日' }
]

// 予定表示の状態
const scheduleStatuses = [
  { key: 'possible', symbol: '○', label: '可能', color: 'bg-green-500' },
  { key: 'maybe', symbol: '△', label: '要相談', color: 'bg-yellow-500' },
  { key: 'impossible', symbol: '×', label: '不可', color: 'bg-red-500' }
]

export default function CreateTeamPage() {
  const router = useRouter()
  const { getAccessToken, isAuthenticated, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)
  const [showInviteSection, setShowInviteSection] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // アクティブグループ関連の状態
  const [activeGroup, setActiveGroup] = useState<ActiveGroup | null>(null)
  const [loadingActiveGroup, setLoadingActiveGroup] = useState(true)
  const [makeActive, setMakeActive] = useState(false)
  const [showActiveGroupSection, setShowActiveGroupSection] = useState(false)

  // メンバー招待関連の状態
  const [inviteMembers, setInviteMembers] = useState<InviteMember[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [lastCopyText, setLastCopyText] = useState<string | null>(null)
  const lastCopyInputRef = useRef<HTMLInputElement>(null)
  // クリップボード書き込み（フォールバック付き）
  const writeToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (_) {
      // 続いてフォールバックへ
    }

    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textArea)
      return ok
    } catch (_) {
      return false
    }
  }

  const handleCopy = async (text: string, successTitle: string) => {
    const ok = await writeToClipboard(text)
    setLastCopyText(text)
    if (ok) {
      alert(`${successTitle}\n\n${text}`)
    } else {
      alert(`コピーに失敗しました。以下のテキストを手動でコピーしてください。\n\n${text}`)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    availability: [] as string[]
  })

  // ターゲットジェンダー選択の状態
  const [targetGender, setTargetGender] = useState<number[]>([]) // 複数選択可能

  // グループタイプ表示用の状態
  const [groupType, setGroupType] = useState<string>('')
  const [genderCounts, setGenderCounts] = useState({
    male: 0,
    female: 0,
    other: 0
  })

  // 画像関連の状態を追加
  const [images, setImages] = useState<string[]>([])
  type PhotoStatus = {
    photoUrl: string;
    status: 'pending_review' | 'active' | 'rejected';
    moderationResult?: any;
  };
  const [photoStatuses, setPhotoStatuses] = useState<PhotoStatus[]>([])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([])
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([])

  // 予定表示の状態
  const [schedule, setSchedule] = useState({
    monday: 'possible',
    tuesday: 'possible',
    wednesday: 'possible',
    thursday: 'possible',
    friday: 'possible',
    saturday: 'possible',
    sunday: 'possible'
  })

  // 一時的なteamIdを生成（グループ作成時用）
  const [temporaryTeamId] = useState(() => `temp_team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // 認証状態のデバッグ情報を表示
  useEffect(() => {
    console.log('🔍 認証状態:', {
      authLoading,
      isAuthenticated,
      user: user ? { id: user.id, name: user.name } : null,
      accessToken: getAccessToken() ? 'Present' : 'Missing'
    })
  }, [authLoading, isAuthenticated, user, getAccessToken])

  // 認証されていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🔍 未認証のためログインページにリダイレクト')
      router.push('/auth/signin')
    }
  }, [isAuthenticated, authLoading, router])

  // アクティブグループを取得
  useEffect(() => {
    const fetchActiveGroup = async () => {
      if (!isAuthenticated || authLoading) return

      try {
        setLoadingActiveGroup(true)
        const accessToken = getAccessToken()

        if (!accessToken) {
          console.log('❌ アクセストークンがありません')
          return
        }

        const response = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 チーム一覧:', data)

          // アクティブグループがあるかチェック
          if (data.activeGroups && data.activeGroups.length > 0) {
            setActiveGroup(data.activeGroups[0])
            setShowActiveGroupSection(true)
          }
        }
      } catch (error) {
        console.error('Error fetching active group:', error)
      } finally {
        setLoadingActiveGroup(false)
      }
    }

    fetchActiveGroup()
  }, [isAuthenticated, authLoading, getAccessToken])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">ログインが必要です</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  const availableTags = [
    // 🌟 盛り上がり系
    '🎉 ワイワイ系（気軽に盛り上がる）',
    '🍻 飲み友（居酒屋・バーで乾杯）',
    '🎤 カラオケ行こ',
    '🎮 ゲーム仲間',
    '🎲 ボードゲーム会',
    // 🎬 趣味シェア系
    '🎬 映画トーク',
    '📺 アニメ好き',
    '🎶 音楽しみたい（ライブ・鑑賞）',
    '🎨 クリエイター交流',
    '📚 読書好き',
    // 🌿 まったり系
    '🌿 まったり雑談',
    '☕ 落ち着いたカフェ',
    '🌙 静かに語ろ',
    '📖 インドア派',
    '🚶 散歩',
    // 🤝 つながり系
    '💼 仕事ライク（ビジネス寄り）',
    '🤝 チーム作り（仲間募集）',
    '💡 アイデア出し（企画・起業）',
    '🎁 イベント好き（参加・企画）',
    '🚀 夢語り',
    // 🏞️ アクティブ系
    '🏀 スポーツ観戦／プレイ',
    '✈️ 旅行仲間',
    '🍴 グルメ巡り',
    '🏞️ アウトドア派（キャンプ・ハイキング）',
    '🎢 テーマパーク行こ',
    // 🐾 ライフスタイル系
    '🐾 ペット好き',
    '🌸 ゆるオフ会（気軽に集まる）',
    '📚 勉強会',
    '🌙 夜ふかしトーク',
    '🎭 趣味なんでもOK（雑多・お試し）'
  ]

  // 画像追加時の処理
  const handleAddImage = (newImageUrl: string) => {
    setImages(prev => [...prev, newImageUrl])
    // 新しい画像は審査待ち状態として追加
    setPhotoStatuses(prev => [...prev, {
      photoUrl: newImageUrl,
      status: 'pending_review',
      moderationResult: null
    }])
  }

  const getTemporaryTeamId = () => {
    return temporaryTeamId
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleAvailabilityToggle = (time: string) => {
    setSelectedAvailability(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    )
  }

  const handleScheduleChange = (day: string, currentStatus: string) => {
    const statusKeys = scheduleStatuses.map(s => s.key);
    const currentIndex = statusKeys.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusKeys.length;
    const nextStatus = statusKeys[nextIndex];

    setSchedule(prev => ({
      ...prev,
      [day]: nextStatus
    }));
  }

  const handlePrefectureToggle = (prefecture: string) => {
    setSelectedPrefectures(prev =>
      prev.includes(prefecture)
        ? prev.filter(p => p !== prefecture)
        : [...prev, prefecture]
    )
  }

  // ターゲットジェンダーの選択処理
  const handleTargetGenderToggle = (gender: number) => {
    setTargetGender(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    )
  }

  // メンバー招待処理
  const handleInviteByCode = async () => {
    if (!inviteCode.trim()) {
      setInviteError('招待コードを入力してください')
      return
    }

    setLoadingInvite(true)
    setInviteError(null)

    try {
      const accessToken = getAccessToken()

      // 招待コードからユーザー情報を取得
      const userResponse = await fetch(`/api/users/${inviteCode.trim()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        const newMember: InviteMember = {
          userId: userData.id,
          username: userData.username,
          email: userData.email
        }
        setInviteMembers(prev => [...prev, newMember])
        setInviteCode('')
        alert('メンバーを招待しました！')
      } else {
        setInviteError('ユーザーが見つかりません')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      setInviteError('招待に失敗しました')
    } finally {
      setLoadingInvite(false)
    }
  }

  // ユーザーIDでメンバー招待
  const handleInviteByUserId = async () => {
    if (!inviteUserId.trim()) {
      setInviteError('ユーザーIDを入力してください')
      return
    }

    setLoadingInvite(true)
    setInviteError(null)

    try {
      // ユーザー情報を取得
      const accessToken = getAccessToken()
      const response = await fetch(`/api/users/${inviteUserId.trim()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        const newMember: InviteMember = {
          userId: userData.id,
          username: userData.username,
          email: userData.email
        }
        setInviteMembers(prev => [...prev, newMember])
        setInviteUserId('')
        alert('メンバーを招待しました！')
      } else {
        setInviteError('ユーザーが見つかりません')
      }
    } catch (error) {
      console.error('Error inviting member by user ID:', error)
      setInviteError('招待に失敗しました')
    } finally {
      setLoadingInvite(false)
    }
  }

  // メールアドレスでメンバー招待
  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('メールアドレスを入力してください')
      return
    }

    setLoadingInvite(true)
    setInviteError(null)

    try {
      // メールアドレスでユーザーを検索
      const accessToken = getAccessToken()
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(inviteEmail.trim())}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        const newMember: InviteMember = {
          userId: userData.id,
          username: userData.username,
          email: userData.email
        }
        setInviteMembers(prev => [...prev, newMember])
        setInviteEmail('')
        alert('メンバーを招待しました！')
      } else {
        setInviteError('ユーザーが見つかりません')
      }
    } catch (error) {
      console.error('Error inviting member by email:', error)
      setInviteError('招待に失敗しました')
    } finally {
      setLoadingInvite(false)
    }
  }

  // 招待メンバーを削除
  const removeInviteMember = (userId: string) => {
    setInviteMembers(prev => prev.filter(member => member.userId !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('グループ名を入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accessToken = getAccessToken()
      console.log('🔍 Access token:', accessToken ? 'Present' : 'Missing')
      console.log('🔍 Access token value:', accessToken)

      if (!accessToken) {
        console.log('❌ アクセストークンがありません')
        setError('ログインが必要です')
        return
      }

      // スケジュールデータをavailabilities形式に変換
      const availabilities = Object.entries(schedule)
        .filter(([_, status]) => status === 'possible' || status === 'maybe')
        .map(([day, status]) => {
          const dayIndex = days.findIndex(d => d.key === day) + 1
          return {
            weekday: dayIndex,
            timeslot: 1 // デフォルトで平日昼
          }
        })

      // 都道府県名を数値コードに変換
      const preferredPrefs = selectedPrefectures.map(name => {
        const index = prefectures.indexOf(name)
        return index + 1 // 1ベースのインデックス
      })

      // 招待メンバーのIDリストを作成
      const memberUserIds = inviteMembers.map(member => member.userId)

      const requestBody = {
        name: formData.name,
        description: formData.description,
        gender: 1, // デフォルト値（自動判別で上書きされる）
        targetGender: targetGender.length > 0 ? targetGender : [1], // 選択されたターゲットジェンダー
        hobbies: selectedTags, // 選択されたノリタグ
        preferredPrefs: preferredPrefs, // 都道府県コード
        availabilities: availabilities, // 利用可能時間
        images: images, // 画像配列
        memberUserIds: memberUserIds, // 招待メンバーID
        makeActive: makeActive // アクティブ化フラグ
      }

      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2))
      console.log('🔍 Authorization header:', `Bearer ${accessToken}`)
      console.log('🔍 selectedTags:', selectedTags)
      console.log('🔍 selectedPrefectures:', selectedPrefectures)
      console.log('🔍 availabilities:', availabilities)
      console.log('🔍 images count:', images.length)
      console.log('🔍 memberUserIds:', memberUserIds)
      console.log('🔍 makeActive:', makeActive)

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🔍 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ グループ作成成功:', data)
        setCreatedGroupId(data.groupId)
        setShowInviteSection(true)
        // メンバー情報を取得
        fetchMembers(data.groupId)
      } else {
        let errorMessage = 'グループの作成に失敗しました'
        try {
          const errorData = await response.json()
          console.error('❌ グループ作成エラー:', errorData)
          console.error('❌ エラーの詳細:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            errorCode: errorData.code,
            errorMessage: errorData.message,
            issues: errorData.issues
          })
          // バリデーションエラーの場合は詳細を表示
          if (errorData.code === 'VALIDATION_ERROR' && errorData.issues) {
            const fieldErrors = errorData.issues.map((issue: any) =>
              `${issue.field}: ${issue.message}`
            ).join(', ')
            errorMessage = `入力内容に問題があります: ${fieldErrors}`
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch (parseError) {
          console.error('❌ エラーレスポンスの解析に失敗:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        setError(errorMessage)
      }
    } catch (error) {
      console.error('❌ グループ作成中にエラーが発生:', error)
      console.error('❌ エラーの詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(`グループの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (groupId: string) => {
    setLoadingMembers(true)
    try {
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        // APIのフォーマット（formattedMembers）をUI用のメンバーデータに整形
        const processedMembers = Array.isArray(data.members)
          ? data.members.map((member: any) => ({
            userId: member.user_id,
            username: member.users?.username || '名前なし',
            bio: member.users?.bio || '',
            age: member.users?.age || 0,
            avatarUrl: member.latest_photo || member.users?.avatar_url || null,
            interests: member.users?.interests || [],
            isActiveTeam: member.is_active || false,
            joinedAt: member.joined_at,
          }))
          : []
        setMembers(processedMembers)

        // 性別カウントとグループタイプを算出（gender: 1=male, 2=female, その他=other と仮定）
        const counts = { male: 0, female: 0, other: 0 }
        if (Array.isArray(data.members)) {
          data.members.forEach((m: any) => {
            const g = m?.users?.gender
            if (g === 1) counts.male += 1
            else if (g === 2) counts.female += 1
            else counts.other += 1
          })
        }
        setGenderCounts(counts)

        let inferredType = ''
        if (counts.male > 0 && counts.female === 0 && counts.other === 0) inferredType = 'male'
        else if (counts.female > 0 && counts.male === 0 && counts.other === 0) inferredType = 'female'
        else if (counts.male > 0 && counts.female > 0) inferredType = 'mixed'
        else if (counts.other > 0 && counts.male === 0 && counts.female === 0) inferredType = 'other'
        setGroupType(inferredType)
      } else {
        console.error('Failed to fetch members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const generateInviteLink = async () => {
    if (!createdGroupId) return

    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        setInviteError('ログインが必要です')
        return
      }

      // 招待リンクを生成
      const response = await fetch('/api/network/ip')
      const data = await response.json()

      // 環境変数からベースURLを取得、なければ動的に取得したパブリックIPアドレスを使用
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL

      if (!baseUrl) {
        if (process.env.NODE_ENV === 'development') {
          // 開発環境ではパブリックIPを使用
          baseUrl = `http://${data.publicIp}:3000`
        } else {
          // 本番環境では現在のURLを使用
          baseUrl = window.location.origin
        }
      }

      // 招待コードを取得
      const inviteResponse = await fetch(`/api/teams/${createdGroupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        const inviteCode = inviteData.inviteCode
        // 完全なURLを生成
        const inviteLink = `${baseUrl}/invite/${inviteCode}`
        console.log('生成する招待リンク:', inviteLink)

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nリンクを友達に送って、グループに招待しましょう！')
      } else {
        // フォールバック: チームIDを使用
        console.log('APIエラー、フォールバックでチームIDを使用:', createdGroupId)
        const inviteLink = `${baseUrl}/invite/${createdGroupId}`

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nリンクを友達に送って、グループに招待しましょう！')
      }
    } catch (error) {
      console.error('招待リンク生成エラー:', error)
      // フォールバック: 環境変数または現在のURLを使用
      const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin

      // 招待コードを取得
      const inviteResponse = await fetch(`/api/teams/${createdGroupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        const inviteCode = inviteData.inviteCode
        console.log('エラー時の招待コード:', inviteCode)
        const inviteLink = `${fallbackUrl}/invite/${inviteCode}`
        console.log('エラー時の招待リンク:', inviteLink)

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nリンクを友達に送って、グループに招待しましょう！')
      } else {
        // フォールバック: チームIDを使用
        console.log('エラー時のフォールバックでチームIDを使用:', createdGroupId)
        const inviteLink = `${fallbackUrl}/invite/${createdGroupId}`

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nリンクを友達に送って、グループに招待しましょう！')
      }
    }
  }

  const generateInviteCode = async () => {
    if (!createdGroupId) return

    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        alert('ログインが必要です')
        return
      }

      // 環境変数からベースURLを取得、なければ現在のURLを使用
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL

      if (!baseUrl) {
        // 現在のURLを使用（ローカルホストでも他の端末からアクセス可能）
        baseUrl = window.location.origin
      }

      // 招待コードを取得
      const inviteResponse = await fetch(`/api/teams/${createdGroupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        console.log('招待コードAPIレスポンス:', inviteData)
        const inviteCode = inviteData.inviteCode
        console.log('取得した招待コード:', inviteCode)
        console.log('生成する招待リンク:', `${baseUrl}/invite/${inviteCode}`)
        const inviteLink = `${baseUrl}/invite/${inviteCode}`

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nこのリンクを友達に送って、チームに招待しましょう！')
      } else {
        // フォールバック: チームIDを使用
        const inviteLink = `${baseUrl}/invite/${createdGroupId}`

        await handleCopy(inviteLink, '招待リンク発行されました！\n\nこのリンクを友達に送って、チームに招待しましょう！')
      }
    } catch (error) {
      console.error('招待コード取得エラー:', error)
      // フォールバック: 環境変数または現在のURLを使用
      const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      console.log('エラー時のフォールバックURL:', fallbackUrl)
      const inviteLink = `${fallbackUrl}/invite/${createdGroupId}`
      console.log('エラー時の招待リンク:', inviteLink)

      await handleCopy(inviteLink, '招待リンク発行されました！\n\nこのリンクを友達に送って、チームに招待しましょう！')
    }
  }

  const regenerateInviteCode = async () => {
    if (!createdGroupId) return

    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        alert('ログインが必要です')
        return
      }

      // パブリックIPアドレスを取得
      const response = await fetch('/api/network/ip')
      const data = await response.json()

      // 環境変数からベースURLを取得、なければ動的に取得したパブリックIPアドレスを使用
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL

      if (!baseUrl) {
        if (process.env.NODE_ENV === 'development') {
          // 開発環境ではパブリックIPを使用
          baseUrl = `http://${data.publicIp}:3000`
        } else {
          // 本番環境では現在のURLを使用
          baseUrl = window.location.origin
        }
      }

      // 招待コードを再生成
      const inviteResponse = await fetch(`/api/teams/${createdGroupId}/regenerate-invite-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        const newInviteCode = inviteData.inviteCode
        const newInviteLink = `${baseUrl}/invite/${newInviteCode}`

        await handleCopy(newInviteLink, '新しい招待リンク発行されました！\n\nこのリンクを友達に送って、チームに招待しましょう！')
      } else {
        let errorMessage = '招待コードの再生成に失敗しました'
        try {
          const errorData = await inviteResponse.json()
          console.error('❌ 招待コード再生成エラー:', errorData)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          console.error('❌ エラーレスポンスの解析に失敗:', parseError)
          errorMessage = `HTTP ${inviteResponse.status}: ${inviteResponse.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('招待コード再生成エラー:', error)
      alert('招待コードの再生成に失敗しました')
    }
  }

  const handleGoToGroupDetails = () => {
    if (createdGroupId) {
      router.push(`/teams/${createdGroupId}`)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Icon name="plus" className="text-blue-500" />
              <h1 className="text-xl font-bold text-gray-800">グループ作成</h1>
            </div>
            <div className="text-sm text-gray-500">
              {isAuthenticated ? `ログイン中: ${user?.name || 'ユーザー'}` : '未認証'}
            </div>
          </div>
        </div>

        {!showInviteSection ? (
          /* グループ作成フォーム */
          <div className="px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* グループ名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    グループ名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="グループ名を入力してください"
                    required
                  />
                </div>

                {/* 説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="グループの説明を入力してください"
                  />
                </div>

                {/* 画像アップロード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    グループ画像
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    グループの雰囲気を伝える画像を追加できます。複数の画像を追加可能です。
                  </p>
                  <TeamImageSwiper
                    images={images}
                    teamName={formData.name || '新しいグループ'}
                    teamId={getTemporaryTeamId()}
                    onAddImage={handleAddImage}
                    isEditable={true}
                    photoStatuses={photoStatuses}
                  />
                  {images.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {images.length}枚の画像が追加されています
                    </p>
                  )}
                </div>

                {/* ノリタグ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ノリタグ
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    グループの雰囲気や活動内容を表すノリタグを選択してください
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 利用可能時間 */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    利用可能時間
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleAvailabilityToggle(time)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAvailability.includes(time)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* メンバー招待セクション */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メンバー招待
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    グループ作成時にメンバーを招待できます。招待コード、ユーザーID、またはメールアドレスで招待可能です。
                  </p>

                  {/* 招待エラーメッセージ */}
                  {inviteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-600 text-sm">{inviteError}</p>
                    </div>
                  )}

                  {/* 招待コードでの招待 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      招待コードで招待
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="招待コードを入力"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleInviteByCode}
                        disabled={loadingInvite}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loadingInvite ? '招待中...' : '招待'}
                      </button>
                    </div>
                  </div>

                  {/* ユーザーIDでの招待 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ユーザーIDで招待
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inviteUserId}
                        onChange={(e) => setInviteUserId(e.target.value)}
                        placeholder="ユーザーIDを入力"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleInviteByUserId}
                        disabled={loadingInvite}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loadingInvite ? '招待中...' : '招待'}
                      </button>
                    </div>
                  </div>

                  {/* メールアドレスでの招待 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレスで招待
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="メールアドレスを入力"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleInviteByEmail}
                        disabled={loadingInvite}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loadingInvite ? '招待中...' : '招待'}
                      </button>
                    </div>
                  </div>

                  {/* 招待メンバー一覧 */}
                  {inviteMembers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        招待予定メンバー ({inviteMembers.length}人)
                      </h4>
                      <div className="space-y-2">
                        {inviteMembers.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="font-medium text-gray-800">{member.username}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeInviteMember(member.userId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Icon name="x-mark" className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* アクティブグループ選択 */}
                {showActiveGroupSection && activeGroup && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="exclamation-triangle" className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800 mb-2">アクティブグループの設定</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          現在「{activeGroup.name}」がアクティブグループとして設定されています。
                        </p>

                        <div className="bg-white rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{activeGroup.name}</p>
                              <p className="text-sm text-gray-600">{activeGroup.description || '説明なし'}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">アクティブ</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={makeActive}
                              onChange={(e) => setMakeActive(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="font-medium text-yellow-800">
                                新しいグループをアクティブにする
                              </p>
                              <p className="text-sm text-yellow-700">
                                チェックすると「{activeGroup.name}」は待機グループになり、新しいグループがアクティブになります
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ターゲットジェンダー選択 */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    マッチしたいグループの種類
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    どのようなグループとマッチしたいか選択してください（複数選択可能）
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTargetGenderToggle(1)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${targetGender.includes(1)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">👨</div>
                        <div>男性グループ</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetGenderToggle(2)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${targetGender.includes(2)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">👩</div>
                        <div>女性グループ</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetGenderToggle(0)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${targetGender.includes(0)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">👥</div>
                        <div>男女混合</div>
                      </div>
                    </button>
                  </div>
                  {targetGender.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ 少なくとも1つ選択してください
                    </p>
                  )}
                </div>

                {/* 開催希望都道府県 */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開催希望都道府県
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {prefectures.map((prefecture) => (
                      <button
                        key={prefecture}
                        type="button"
                        onClick={() => handlePrefectureToggle(prefecture)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPrefectures.includes(prefecture)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {prefecture}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 予定表示 */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予定表示
                  </label>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {days.map((day) => {
                      const currentStatus = schedule[day.key as keyof typeof schedule];
                      const statusInfo = scheduleStatuses.find(s => s.key === currentStatus);

                      return (
                        <div key={day.key} className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-2">{day.label}</div>
                          <button
                            type="button"
                            onClick={() => handleScheduleChange(day.key, currentStatus)}
                            className={`w-12 h-12 rounded-full text-white text-lg font-bold transition-all duration-200 hover:scale-110 ${statusInfo?.color || 'bg-gray-200'
                              }`}
                          >
                            {statusInfo?.symbol || '?'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="flex flex-wrap gap-4">
                      {scheduleStatuses.map((status) => (
                        <div key={status.key} className="flex items-center space-x-1">
                          <div className={`w-4 h-4 rounded-full ${status.color}`}></div>
                          <span>{status.symbol}: {status.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* 作成ボタン */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {loading ? '作成中...' : 'グループを作成'}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* メンバー招待セクション */
          <div className="px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-6">
                {/* 成功メッセージ */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="check-badge" className="w-6 h-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">グループ作成完了！</h3>
                      <p className="text-green-600">友達を招待してグループを始めましょう</p>
                    </div>
                  </div>
                </div>

                {/* メンバー招待 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      メンバー招待
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={generateInviteCode}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 flex items-center space-x-2"
                      >
                        <Icon name="link" className="w-4 h-4" />
                        <span>招待リンク</span>
                      </button>
                      <button
                        onClick={generateInviteLink}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <Icon name="share" className="w-4 h-4" />
                        <span>招待リンク</span>
                      </button>
                      <button
                        onClick={regenerateInviteCode}
                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
                        title="新しい招待コードを生成"
                      >
                        <Icon name="refresh-cw" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="users" className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-2">友達をグループに招待</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          招待コードまたは招待リンクを友達に送って、グループに参加してもらいましょう！
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Icon name="check" className="w-3 h-3 text-green-500" />
                            <span>招待コード: 短い文字列で簡単共有</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Icon name="check" className="w-3 h-3 text-green-500" />
                            <span>招待リンク: ワンタップで参加</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Icon name="check" className="w-3 h-3 text-green-500" />
                            <span>招待した友達と一緒に活動可能</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 text-center">
                      💡 ヒント: 招待リンクはワンタップで参加できるので、友達に送りやすいです！
                    </p>
                  </div>
                </div>

                {/* グループタイプ表示 */}
                {groupType && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        グループタイプ
                      </h3>
                      <div className="flex items-center space-x-2">
                        {groupType === 'male' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                            男性グループ
                          </span>
                        )}
                        {groupType === 'female' && (
                          <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full font-medium">
                            女性グループ
                          </span>
                        )}
                        {groupType === 'mixed' && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                            男女混合グループ
                          </span>
                        )}
                        {groupType === 'other' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">
                            その他
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-600">{genderCounts.male}</div>
                        <div className="text-sm text-blue-700">男性</div>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-pink-600">{genderCounts.female}</div>
                        <div className="text-sm text-pink-700">女性</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-600">{genderCounts.other}</div>
                        <div className="text-sm text-gray-700">その他</div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Icon name="information-circle" className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">自動判別結果</p>
                          <p>メンバーの性別情報に基づいて、グループタイプが自動的に判別されました。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* メンバー一覧 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      メンバー一覧
                    </h3>
                    <span className="text-sm text-gray-500">
                      {members.length}人
                    </span>
                  </div>

                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : members.length > 0 ? (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div key={member.userId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-lg">
                                {member.username ? member.username.charAt(0) : '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-800 truncate">
                                  {member.username || '名前なし'}
                                </h4>
                                {member.age > 0 && (
                                  <span className="text-sm text-gray-500">
                                    {member.age}歳
                                  </span>
                                )}
                                {member.avatarUrl && (
                                  <span className="text-sm text-gray-500">
                                    • プロフィール画像あり
                                  </span>
                                )}
                                {member.isActiveTeam && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                    出動中
                                  </span>
                                )}
                              </div>

                              {member.bio && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {member.bio}
                                </p>
                              )}

                              {member.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {member.interests.map((interest, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2 text-xs text-gray-500">
                                参加日: {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon name="users" className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">まだメンバーがいません</p>
                      <p className="text-sm text-gray-400">
                        招待リンクを友達に送って、グループに参加してもらいましょう！
                      </p>
                    </div>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoToGroupDetails}
                    className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors"
                  >
                    グループ詳細を見る
                  </button>

                  <button
                    onClick={() => router.push('/teams')}
                    className="w-full py-4 px-6 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 transition-colors"
                  >
                    グループ一覧に戻る
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <FooterNav activeTab="teams" />
      </div>
    </ErrorBoundary>
  )
} 