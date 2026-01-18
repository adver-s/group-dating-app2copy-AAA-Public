'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/Icon'
import FooterNav from '../../../components/FooterNav'
import TeamImageSwiper from '../../../components/TeamImageSwiper'
// import { safeJson } from '@/utils/safeFetch'
interface Group {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  availability?: string[];
}

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

// メンバー招待用のインターフェース
interface InviteMember {
  userId: string;
  username: string;
  email: string;
}

interface ActiveGroup {
  id: string
  name: string
  isActive: boolean
}

// 型エイリアス
type EditDataType = {
  name: string;
  description: string;
  tags: string[];
  availability: string[];
}

type ScheduleType = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

type GenderCountsType = {
  male: number;
  female: number;
  other: number;
}

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

// 利用可能時間のオプション
const availableTimes = [
  '平日昼', '平日夜', '土日昼', '土日夜', '平日', '土日', '毎日'
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

// ノリタグ候補リスト
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

export default function TeamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { getAccessToken, user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [editData, setEditData] = useState<EditDataType>({
    name: '',
    description: '',
    tags: [],
    availability: []
  })

  // 都道府県選択の状態
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([])
  
  // 予定表示の状態
  const [schedule, setSchedule] = useState<ScheduleType>({
    monday: 'possible',
    tuesday: 'possible',
    wednesday: 'possible',
    thursday: 'possible',
    friday: 'possible',
    saturday: 'possible',
    sunday: 'possible'
  })

  // メンバー関連の状態
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false)
  const [newTag, setNewTag] = useState<string>('')

  // グループタイプ表示用の状態
  const [groupType, setGroupType] = useState<string>('')
  const [genderCounts, setGenderCounts] = useState<GenderCountsType>({
    male: 0,
    female: 0,
    other: 0
  })

  // ターゲットジェンダー選択の状態
  const [targetGender, setTargetGender] = useState<number[]>([]) // 複数選択可能

  // 画像関連の状態
  const [images, setImages] = useState<string[]>([])
  const [loadingImages, setLoadingImages] = useState<boolean>(true)
  const [photoStatuses, setPhotoStatuses] = useState<Array<{
    photoUrl: string;
    status: 'pending_review' | 'active' | 'rejected';
    moderationResult?: any;
  }>>([])

  // メンバー招待関連の状態
  const [inviteMembers, setInviteMembers] = useState<InviteMember[]>([])
  const [inviteCode, setInviteCode] = useState<string>('')
  const [inviteUserId, setInviteUserId] = useState<string>('')
  const [inviteEmail, setInviteEmail] = useState<string>('')
  const [loadingInvite, setLoadingInvite] = useState<boolean>(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // アクティブグループ関連の状態
  const [activeGroup, setActiveGroup] = useState<ActiveGroup | null>(null)
  const [loadingActiveGroup, setLoadingActiveGroup] = useState<boolean>(true)
  const [makeActive, setMakeActive] = useState<boolean>(false)
  const [showActiveGroupSection, setShowActiveGroupSection] = useState<boolean>(false)

  const groupId = params.id as string

  // 画像を取得する関数
  const fetchTeamPhotos = async () => {
    try {
      setLoadingImages(true)
      const accessToken = getAccessToken()
      // 審査中の画像も含めて取得
      const response = await fetch(`/api/teams/${groupId}/photos?includePending=true`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const photos = await response.json()
        setImages(photos.map((photo: any) => photo.photo_url))
        setPhotoStatuses(photos.map((photo: any) => ({
          photoUrl: photo.photo_url,
          status: photo.status || 'pending_review',
          moderationResult: photo.moderation_result ? JSON.parse(photo.moderation_result) : null
        })))
      } else {
        // フォールバック用のサンプル画像
        setImages(['/sample1.jpg', '/sample6.jpg', '/sample7.jpg'])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
      // フォールバック用のサンプル画像
      setImages(['/sample1.jpg', '/sample6.jpg', '/sample7.jpg'])
    } finally {
      setLoadingImages(false)
    }
  }

  // チーム情報を取得
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const accessToken = getAccessToken()
        // const res = await safeJson<{ team: any }>(`/api/teams/${Number(groupId)}`)
        // if (!res.ok) {
        //   console.error('❌ Failed to fetch group:', res.error, res.status)
        //   setError(`グループ情報の取得に失敗しました: ${res.error}`)
        // } else {
        //   console.log('🔍 グループ情報:', res.data?.team)
        //   setGroup(res.data?.team)
        //   const team = res.data?.team
        const response = await fetch(`/api/teams/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 グループ情報:', data.team)
          setGroup(data.team)
          const team = data.team
          setEditData({
            name: team?.name || '',
            description: team?.description || '',
            tags: team?.hobbies || [],
            availability: team?.availability || []
          })

          // メンバー情報も取得
          fetchMembers()

          // ターゲットジェンダー情報も取得
          fetchTargetGenders()
          
          // 招待コードも取得
          fetchInviteCode()
          
          // 画像情報も設定
          if (team.photos && team.photos.length > 0) {
            setImages(team.photos.map((photo: any) => photo.photoUrl))
            setPhotoStatuses(team.photos.map((photo: any) => ({
              photoUrl: photo.photoUrl,
              status: photo.status || 'pending_review',
              moderationResult: photo.moderationResult
            })))
          }
          
          // メンバー情報も設定
          if (team.members) {
            const currentUserMember = team.members.find((m: any) => m.userId === user?.id)
            if (currentUserMember) {
              setMakeActive(currentUserMember.isActive)
            }
          }
          
          console.log('🔍 設定されたデータ:', {
            name: team?.name,
            description: team?.description,
            hobbies: team?.hobbies,
            availability: team?.availability,
            prefectures: team?.prefectures,
            weekdays: team?.weekdays,
            photos: team?.photos,
            members: team?.members
          })
          
          // 都道府県とスケジュールも設定
          if (team?.prefectures) {
            // 数値の都道府県コードを都道府県名に変換
            const prefectureNames = team.prefectures.map((code: number) => {
              if (code >= 1 && code <= prefectures.length) {
                return prefectures[code - 1]
              }
              return ''
            }).filter((name: string) => name !== '')
            setSelectedPrefectures(prefectureNames)
            console.log('🔍 設定された都道府県:', prefectureNames)
          }
          
          // 利用可能時間の設定
          if (team?.availability && Array.isArray(team.availability)) {
            setEditData(prev => ({
              ...prev,
              availability: team.availability
            }))
            console.log('🔍 設定された利用可能時間:', team.availability)
          }
          
          if (team?.weekdays) {
            // weekdaysデータをschedule形式に変換
            const scheduleData = {
              monday: 'impossible',
              tuesday: 'impossible',
              wednesday: 'impossible',
              thursday: 'impossible',
              friday: 'impossible',
              saturday: 'impossible',
              sunday: 'impossible'
            }
            
            team.weekdays.forEach((w: any) => {
              const dayIndex = w.weekday - 1 // 0ベースのインデックス
              if (dayIndex >= 0 && dayIndex < days.length) {
                const dayKey = days[dayIndex].key
                // 保存されたデータがある場合は「可能」として表示
                scheduleData[dayKey as keyof typeof scheduleData] = 'possible'
              }
            })
            setSchedule(scheduleData)
            console.log('🔍 設定されたスケジュール:', scheduleData)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Failed to fetch group:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          setError(`グループ情報の取得に失敗しました: ${errorData.error || '不明なエラー'}`)
        }
      } catch (error) {
        console.error('Error fetching group:', error)
        setError(`グループ情報の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchGroup()
    }
  }, [groupId, getAccessToken, user?.id])

  // 画像を取得
  useEffect(() => {
    if (groupId) {
      fetchTeamPhotos()
    }
  }, [groupId])

  // メンバー情報を取得する関数
  const fetchMembers = async () => {
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
        console.log('🔍 メンバーデータ:', data)
        
        // APIから返されるデータ構造を正しく処理
        if (data.members && Array.isArray(data.members)) {
          // APIのformattedMembers構造をTeamMember構造に変換
          const processedMembers = data.members.map((member: any) => ({
            userId: member.user_id,
            username: member.users?.username || '名前なし',
            bio: member.users?.bio || '',
            age: member.users?.age || 0,
            avatarUrl: member.latest_photo || member.users?.avatar_url || null,
            interests: member.users?.interests || [],
            isActiveTeam: member.is_active || false,
            joinedAt: member.joined_at
          }))
          setMembers(processedMembers)
          console.log('✅ 処理済みメンバー:', processedMembers)
        } else {
          console.error('❌ メンバーデータの形式が不正:', data)
          setMembers([])
        }
        
        setGroupType(data.groupType)
        setGenderCounts(data.genderCounts)
      } else {
        console.error('Failed to fetch members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  // ターゲットジェンダー情報を取得する関数
  const fetchTargetGenders = async () => {
    try {
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}/target-genders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTargetGender(data.targetGenders)
      } else {
        console.error('Failed to fetch target genders')
      }
    } catch (error) {
      console.error('Error fetching target genders:', error)
    }
  }

  // メンバー情報の自動更新（一時的に無効化）

  const handleTagToggle = (tag: string) => {
    setEditData((prev: EditDataType) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t: string) => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleAvailabilityToggle = (time: string) => {
    setEditData((prev: EditDataType) => ({
      ...prev,
      availability: prev.availability.includes(time)
        ? prev.availability.filter((t: string) => t !== time)
        : [...prev.availability, time]
    }))
  }

  const handlePrefectureToggle = (prefecture: string) => {
    setSelectedPrefectures((prev: string[]) => 
      prev.includes(prefecture) 
        ? prev.filter((p: string) => p !== prefecture)
        : [...prev, prefecture]
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

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // ターゲットジェンダーの選択処理
  const handleTargetGenderToggle = (gender: number) => {
    setTargetGender((prev: number[]) => 
      prev.includes(gender)
        ? prev.filter((g: number) => g !== gender)
        : [...prev, gender]
    )
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData((prev: EditDataType) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // 都道府県名を数値コードに変換
      const prefectureCodes = selectedPrefectures.map((name: string) => {
        const index = prefectures.indexOf(name)
        return index + 1 // 1ベースのインデックス
      })
      
      // スケジュールデータをweekdays形式に変換
      const weekdays = Object.entries(schedule)
        .filter(([_, status]) => status === 'possible')
        .map(([day, _]) => {
          const dayIndex = days.findIndex(d => d.key === day) + 1
          return { weekday: dayIndex, timeSlot: 1 } // デフォルトで平日昼
        })
      
      // 招待メンバーのIDリストを作成
      const memberUserIds = inviteMembers.map((member: InviteMember) => member.userId)
      
      const updateData = {
        name: editData.name,
        description: editData.description,
        gender: 1, // デフォルト値（自動判別で上書きされる）
        target_gender: targetGender.length > 0 ? targetGender : [1], // 選択されたターゲットジェンダー
        smoke: 0, // デフォルト値
        alcohol: 0, // デフォルト値
        hobbies: editData.tags, // ノリタグ
        prefectures: prefectureCodes,
        weekdays: weekdays,
        images: images, // 画像情報も含める
        memberUserIds: memberUserIds, // 招待メンバーID
        makeActive: makeActive // アクティブ化フラグ
      }
      
      console.log('🔍 更新データ:', updateData)
      
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedGroup = await response.json()
        setGroup(updatedGroup)
        
        // ターゲットジェンダーも更新
        if (targetGender.length > 0) {
          const targetGenderResponse = await fetch(`/api/teams/${groupId}/target-genders`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetGenders: targetGender }),
          })
          
          if (!targetGenderResponse.ok) {
            console.error('Failed to update target genders')
          }
        }
        
        // メンバー情報を再取得してグループタイプを更新
        fetchMembers()
        // 成功メッセージを表示
        alert('グループ情報を更新しました')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'グループ情報の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating group:', error)
      setError('グループ情報の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 画像追加時の処理
  const handleAddImage = (newImageUrl: string) => {
    setImages((prev: string[]) => [...prev, newImageUrl])
    // 新しい画像は審査待ち状態として追加
    setPhotoStatuses((prev: Array<{
      photoUrl: string;
      status: 'pending_review' | 'active' | 'rejected';
      moderationResult?: any;
    }>) => [...prev, {
      photoUrl: newImageUrl,
      status: 'pending_review',
      moderationResult: null
    }])
  }

  // 招待リンク生成
  const generateInviteLink = async () => {
    try {
      // 招待コードを取得
      const accessToken = getAccessToken()
      const inviteResponse = await fetch(`/api/teams/${groupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!inviteResponse.ok) {
        console.error('招待コード取得エラー:', inviteResponse.status)
        alert('招待コードの取得に失敗しました')
        return
      }

      const inviteData = await inviteResponse.json()
      const inviteCode = inviteData.inviteCode

      // 環境変数からベースURLを取得、なければ現在のURLを使用
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      
      if (!baseUrl) {
        // 現在のURLを使用（ローカルホストでも他の端末からアクセス可能）
        baseUrl = window.location.origin
      }
      
      // 完全なURLを生成
      const inviteLink = `${baseUrl}/invite/${inviteCode}`
      
      // モダンなコピー機能を使用
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteLink).then(() => {
          // 成功時の処理
          showCopySuccess('招待リンク発行されました！', inviteLink)
        }).catch(() => {
          // フォールバック処理
          fallbackCopyTextToClipboard(inviteLink)
        })
      } else {
        // フォールバック処理
        fallbackCopyTextToClipboard(inviteLink)
      }
    } catch (error) {
      console.error('招待リンク生成エラー:', error)
      // フォールバック: 環境変数または現在のURLを使用
      const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      
      const inviteLink = `${fallbackUrl}/invite/${inviteCode}`
      
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteLink).then(() => {
          showCopySuccess('招待リンク発行されました！', inviteLink)
        }).catch(() => {
          fallbackCopyTextToClipboard(inviteLink)
        })
      } else {
        fallbackCopyTextToClipboard(inviteLink)
      }
    }
  }

  // フォールバック用のコピー機能
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      showCopySuccess('招待リンク発行されました！', text)
    } catch (err) {
      console.error('コピーに失敗しました:', err)
      alert('コピーに失敗しました。手動でリンクをコピーしてください。\n\n' + text)
    }
    
    document.body.removeChild(textArea)
  }

  // コピー成功時の表示
  const showCopySuccess = (message: string, text: string) => {
    // カスタム通知を作成
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm'
    
    // メッセージに応じて異なる説明文を表示
    const isInviteCode = message.includes('招待コード')
    const description = isInviteCode 
      ? 'コードを友達に送って、グループに参加してもらいましょう！'
      : 'リンクを友達に送って、グループに招待しましょう！'
    
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div>
          <p class="font-medium">${message}</p>
          <p class="text-sm opacity-90">${description}</p>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 3秒後に自動削除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  // 招待コード生成（招待リンクをコピー）
  const generateInviteCode = async () => {
    try {
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

      // 招待コードを取得
      const accessToken = getAccessToken()
      const inviteResponse = await fetch(`/api/teams/${groupId}/invite-code`, {
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
        
        // モダンなコピー機能を使用
        console.log('コピーする招待リンク:', inviteLink)
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(inviteLink).then(() => {
            // 成功時の処理
            console.log('クリップボードにコピー成功:', inviteLink)
            showCopySuccess('招待リンク発行されました！', inviteLink)
          }).catch(() => {
            // フォールバック処理
            console.log('クリップボードコピー失敗、フォールバック使用')
            fallbackCopyTextToClipboard(inviteLink)
          })
        } else {
          // フォールバック処理
          console.log('クリップボードAPI非対応、フォールバック使用')
          fallbackCopyTextToClipboard(inviteLink)
        }
      } else {
        // フォールバック: チームIDを使用
        console.log('APIエラー、フォールバックでチームIDを使用:', groupId)
        const inviteLink = `${baseUrl}/invite/${groupId}`
        console.log('フォールバック招待リンク:', inviteLink)
        
        // モダンなコピー機能を使用
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(inviteLink).then(() => {
            // 成功時の処理
            console.log('フォールバック: クリップボードにコピー成功:', inviteLink)
            showCopySuccess('招待リンク発行されました！', inviteLink)
          }).catch(() => {
            // フォールバック処理
            console.log('フォールバック: クリップボードコピー失敗、フォールバック使用')
            fallbackCopyTextToClipboard(inviteLink)
          })
        } else {
          // フォールバック処理
          console.log('フォールバック: クリップボードAPI非対応、フォールバック使用')
          fallbackCopyTextToClipboard(inviteLink)
        }
      }
    } catch (error) {
      console.error('招待コード取得エラー:', error)
      // フォールバック: 環境変数または現在のURLを使用
      const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      console.log('エラー時のフォールバックURL:', fallbackUrl)
      const inviteLink = `${fallbackUrl}/invite/${groupId}`
      console.log('エラー時の招待リンク:', inviteLink)
      
      // モダンなコピー機能を使用
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteLink).then(() => {
          // 成功時の処理
          console.log('エラー時: クリップボードにコピー成功:', inviteLink)
          showCopySuccess('招待リンク発行されました！', inviteLink)
        }).catch(() => {
          // フォールバック処理
          console.log('エラー時: クリップボードコピー失敗、フォールバック使用')
          fallbackCopyTextToClipboard(inviteLink)
        })
      } else {
        // フォールバック処理
        console.log('エラー時: クリップボードAPI非対応、フォールバック使用')
        fallbackCopyTextToClipboard(inviteLink)
      }
    }
  }

  // 招待コードの状態
  const [currentInviteCode, setCurrentInviteCode] = useState<string>('')
  const [loadingInviteCode, setLoadingInviteCode] = useState<boolean>(false)

  // 招待コードを取得する関数
  const fetchInviteCode = async () => {
    try {
      setLoadingInviteCode(true)
      const accessToken = getAccessToken()
      const inviteResponse = await fetch(`/api/teams/${groupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        setCurrentInviteCode(inviteData.inviteCode)
      } else {
        console.error('招待コード取得エラー:', inviteResponse.status)
      }
    } catch (error) {
      console.error('招待コード取得エラー:', error)
    } finally {
      setLoadingInviteCode(false)
    }
  }

  // 招待コードのみをコピーする関数
  const copyInviteCodeOnly = async () => {
    try {
      // 招待コードを取得
      const accessToken = getAccessToken()
      const inviteResponse = await fetch(`/api/teams/${groupId}/invite-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json()
        const inviteCode = inviteData.inviteCode
        setCurrentInviteCode(inviteCode)
        
        // 招待コードのみをクリップボードにコピー
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(inviteCode).then(() => {
            showCopySuccess('招待コードをコピーしました！', inviteCode)
          }).catch(() => {
            fallbackCopyTextToClipboard(inviteCode)
          })
        } else {
          fallbackCopyTextToClipboard(inviteCode)
        }
      } else {
        // フォールバック: チームIDを使用
        const inviteCode = groupId
        
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(inviteCode).then(() => {
            showCopySuccess('招待コードをコピーしました！', inviteCode)
          }).catch(() => {
            fallbackCopyTextToClipboard(inviteCode)
          })
        } else {
          fallbackCopyTextToClipboard(inviteCode)
        }
      }
    } catch (error) {
      console.error('招待コード取得エラー:', error)
      // フォールバック: チームIDを使用
      const inviteCode = groupId
      
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteCode).then(() => {
          showCopySuccess('招待コードをコピーしました！', inviteCode)
        }).catch(() => {
          fallbackCopyTextToClipboard(inviteCode)
        })
      } else {
        fallbackCopyTextToClipboard(inviteCode)
      }
    }
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
        
        // チームにメンバーとして追加
        const inviteResponse = await fetch(`/api/teams/${groupId}/members`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userData.id }),
        })

        if (inviteResponse.ok) {
          const newMember: InviteMember = {
            userId: userData.id,
            username: userData.username,
            email: userData.email
          }
          setInviteMembers(prev => [...prev, newMember])
          setInviteCode('')
          alert('メンバーを招待しました！')
          // メンバー情報を再取得
          fetchMembers()
        } else {
          const errorData = await inviteResponse.json()
          setInviteError(errorData.error || '招待に失敗しました')
        }
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
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: inviteUserId.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        // ユーザー情報を取得してリストに追加
        const userResponse = await fetch(`/api/users/${inviteUserId.trim()}`, {
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
        }
        
        setInviteUserId('')
        alert('メンバーを招待しました！')
        // メンバー情報を再取得
        fetchMembers()
      } else {
        const errorData = await response.json()
        setInviteError(errorData.error || '招待に失敗しました')
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
      const searchResponse = await fetch(`/api/users/search?email=${encodeURIComponent(inviteEmail.trim())}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (searchResponse.ok) {
        const userData = await searchResponse.json()
        
        // チームにメンバーとして追加
        const inviteResponse = await fetch(`/api/teams/${groupId}/members`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userData.id }),
        })

        if (inviteResponse.ok) {
          const newMember: InviteMember = {
            userId: userData.id,
            username: userData.username,
            email: userData.email
          }
          setInviteMembers(prev => [...prev, newMember])
          setInviteEmail('')
          alert('メンバーを招待しました！')
          // メンバー情報を再取得
          fetchMembers()
        } else {
          const errorData = await inviteResponse.json()
          setInviteError(errorData.error || '招待に失敗しました')
        }
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
    setInviteMembers((prev: InviteMember[]) => prev.filter((member: InviteMember) => member.userId !== userId))
  }

  // メンバーを削除
  const removeMember = async (userId: string) => {
    if (!confirm('このメンバーを削除しますか？')) {
      return
    }

    try {
      const accessToken = getAccessToken()
      const response = await fetch(`/api/teams/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert('メンバーを削除しました')
        // メンバー情報を再取得
        fetchMembers()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'メンバーの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('メンバーの削除に失敗しました')
    }
  }

  // 招待コード再生成
  const regenerateInviteCode = async () => {
    try {
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

      const accessToken = getAccessToken()
      const inviteResponse = await fetch(`/api/teams/${groupId}/invite-code`, {
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
        
        // 現在の招待コードを更新
        setCurrentInviteCode(newInviteCode)
        
        // モダンなコピー機能を使用
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(newInviteLink).then(() => {
            showCopySuccess('新しい招待リンク発行されました！', newInviteLink)
          }).catch(() => {
            fallbackCopyTextToClipboard(newInviteLink)
          })
        } else {
          fallbackCopyTextToClipboard(newInviteLink)
        }
      } else {
        alert('招待コードの再生成に失敗しました')
      }
    } catch (error) {
      console.error('招待コード再生成エラー:', error)
      alert('招待コードの再生成に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">グループ情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="exclamation-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'グループが見つかりません'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="arrow-left" className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              グループ編集
            </h1>
          </div>
        </div>
      </div>

      {/* グループ画像 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <TeamImageSwiper 
          images={images} 
          teamName={group.name}
          teamId={groupId}
          onAddImage={handleAddImage}
          isEditable={true}
          photoStatuses={photoStatuses}
        />
        {loadingImages && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">画像を読み込み中...</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icon name="exclamation-triangle" className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* グループタイプ表示 */}
        {groupType && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                グループタイプ
              </label>
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
                <Icon name="info" className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">自動判別結果</p>
                  <p>メンバーの性別情報に基づいて、グループタイプが自動的に判別されました。</p>
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
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                targetGender.includes(1)
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
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                targetGender.includes(2)
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
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                targetGender.includes(0)
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

        {/* グループ名 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            グループ名
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData((prev: EditDataType) => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="グループ名を入力してください"
          />
        </div>

        {/* 説明 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData((prev: EditDataType) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="グループの説明を入力してください"
          />
        </div>

        {/* ノリタグ */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ノリタグ
          </label>
          <p className="text-sm text-gray-500 mb-3">
            グループの雰囲気や活動内容を表すノリタグを選択してください
          </p>
          
          {/* 選択済みノリタグ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {editData.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {/* ノリタグ候補 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  editData.tags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* カスタムタグ追加 */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="カスタムノリタグを入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              追加
            </button>
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  editData.availability.includes(time)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          {editData.availability.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              選択中: {editData.availability.join(', ')}
            </p>
          )}
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
                    onClick={() => handleScheduleChange(day.key, currentStatus)}
                    className={`w-12 h-12 rounded-full text-white text-lg font-bold transition-all duration-200 hover:scale-110 ${
                      statusInfo?.color || 'bg-gray-200'
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

        {/* 開催希望都道府県 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">開催希望都道府県</h3>
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {prefectures.map((prefecture) => (
              <button
                key={prefecture}
                onClick={() => handlePrefectureToggle(prefecture)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPrefectures.includes(prefecture)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {prefecture}
              </button>
            ))}
          </div>
        </div>

        {/* 招待リンク */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">招待リンク</h3>
            <div className="flex items-center space-x-2">
              <Icon name="share-2" className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">友達を招待</span>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="users" className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-2">友達をグループに招待</h4>
                <p className="text-sm text-gray-600 mb-3">
                  招待リンクまたは招待コードを友達に送って、グループに参加してもらいましょう！
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>招待リンク: ワンタップで参加</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>招待コード: 短い文字列で簡単共有</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Icon name="check" className="w-3 h-3 text-green-500" />
                    <span>招待した友達と一緒に活動可能</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 現在の招待コード表示 */}
          {currentInviteCode && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">現在の招待コード</p>
                  <p className="text-lg font-mono text-gray-900">{currentInviteCode}</p>
                </div>
                <button
                  onClick={() => {
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(currentInviteCode).then(() => {
                        showCopySuccess('招待コードをコピーしました！', currentInviteCode)
                      }).catch(() => {
                        fallbackCopyTextToClipboard(currentInviteCode)
                      })
                    } else {
                      fallbackCopyTextToClipboard(currentInviteCode)
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="招待コードをコピー"
                >
                  <Icon name="copy" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <div className="flex space-x-2">
                <button
                  onClick={generateInviteLink}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Icon name="link" className="w-4 h-4" />
                  <span>招待リンクをコピー</span>
                </button>
                <button
                  onClick={regenerateInviteCode}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="新しい招待コードを生成"
                >
                  <Icon name="refresh-cw" className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                💡 ヒント: 招待リンクは長いので、メールやSNSで共有するのに便利です！
              </p>
            </div>
            
            <div>
              <button
                onClick={copyInviteCodeOnly}
                className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Icon name="copy" className="w-4 h-4" />
                <span>招待コードをコピー</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                💡 ヒント: 招待コードは短い文字列なので、メッセージで共有しやすいです！
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              💡 ヒント: 招待リンクはワンタップで参加できるので、友達に送りやすいです！
            </p>
          </div>
        </div>

        {/* メンバー招待セクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              メンバー招待
            </h3>
          </div>
          
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
                {inviteMembers.map((member: InviteMember) => (
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
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
              {members.map((member: TeamMember) => (
                <div key={member.userId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 画像読み込みエラー時の処理
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <span className={`text-white font-bold text-lg ${member.avatarUrl ? 'hidden' : ''}`}>
                        {member.username && member.username.length > 0 ? member.username.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {member.username && member.username.trim() !== '' ? member.username : '名前なし'}
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
                      
                      {member.interests && member.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.interests.map((interest: string, index: number) => (
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
                        参加日: {(() => {
                          try {
                            const date = new Date(member.joinedAt)
                            if (isNaN(date.getTime())) {
                              return '日付不明'
                            }
                            return date.toLocaleDateString('ja-JP')
                          } catch (error) {
                            console.error('日付変換エラー:', member.joinedAt, error)
                            return '日付不明'
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => removeMember(member.userId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="メンバーを削除"
                      >
                        <Icon name="trash-2" className="w-4 h-4" />
                      </button>
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

        {/* アクティブ化制約 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            アクティブ化設定
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="makeActive"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="makeActive" className="text-sm font-medium text-gray-700">
                このグループをアクティブにする
              </label>
            </div>
            <p className="text-sm text-gray-500">
              アクティブにすると、このグループがマッチング対象になります。同時にアクティブにできるグループは1つまでです。
            </p>
          </div>
        </div>

        {/* 更新ボタン */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {saving ? '更新中...' : 'グループ情報を更新'}
            </button>
          </div>
        </div>
      </div>

      <FooterNav activeTab="teams" />
    </div>
  )
} 
