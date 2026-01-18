'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Icon from '../../../components/Icon'
import FooterNav from '../../../components/FooterNav'
import TeamImageSwiper from '../../../components/TeamImageSwiper'

interface TeamMember {
  userId: string
  username: string
  bio: string
  age: number
  location: string
  interests: string[]
  isActiveTeam: boolean
  joinedAt: string
}

// チーム詳細データのサンプル
const teamData = {
  id: '1',
  name: 'チームおにぎり',
  description: 'おいしいおにぎりを食べながら楽しい時間を過ごしましょう！',
  tags: ['お酒', 'カラオケ', '旅行'],
  achievements: '合コン成功率80%！楽しい出会いをたくさん作っています。',
  isActiveTeam: false, // 出動状態を追加
  preferences: {
    alcohol: true,
    tobacco: false,
    regions: ['東京都', '神奈川県', '埼玉県']
  },
  schedule: '毎週土曜日の夜に活動予定',
  weeklySchedule: {
    mon: '○',
    tue: '△',
    wed: '△',
    thu: '✖',
    fri: '✖',
    sat: '◎',
    sun: '◎'
  },
  images: [
    '/sample1.jpg',
    '/sample6.jpg',
    '/sample7.jpg',
  ],
  members: [
    { id: '1', name: '田中', status: 'online' as const },
    { id: '2', name: '佐藤', status: 'online' as const },
    { id: '3', name: '鈴木', status: 'away' as const },
  ]
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

export default function TeamProfilePage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  // メンバー情報を取得
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true)
      try {
        const response = await fetch(`/api/teams/${teamId}/members`)
        if (response.ok) {
          const data = await response.json()
          setMembers(data)
        } else {
          console.error('Failed to fetch members')
        }
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchMembers()
  }, [teamId])

  // フォーム状態管理
  const [formData, setFormData] = useState(teamData)
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // 戻るボタンクリック時の処理
  const handleBack = () => {
    router.back()
  }

  // フォーム更新処理
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // タグ追加処理
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // タグ削除処理
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // 都道府県選択処理
  const handleRegionToggle = (region: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        regions: prev.preferences.regions.includes(region)
          ? prev.preferences.regions.filter(r => r !== region)
          : [...prev.preferences.regions, region]
      }
    }))
  }

  // 保存処理
  const handleSave = async () => {
    setSaving(true);
    try {
      // APIが期待する形式にデータを変換
      const apiData = {
        name: formData.name,
        description: formData.description,
        is_active_team: formData.isActiveTeam, // 出動状態を追加
        gender: null, // 後で実装
        target_gender: null, // 後で実装
        smoke: formData.preferences?.tobacco || false,
        alcohol: formData.preferences?.alcohol || false,
        max_members: null, // 後で実装
        photos: formData.images,
        weekdays: Object.entries(formData.weeklySchedule || {}).map(([day, status]) => ({
          weekday: day,
          timeSlot: status === '◎' ? 'available' : status === '○' ? 'maybe' : 'unavailable'
        })),
        hobbies: formData.tags,
        prefectures: formData.preferences?.regions || []
      };

      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
      if (res.ok) {
        alert('保存しました！');
      } else {
        alert('保存に失敗しました');
      }
    } catch (e) {
      alert('保存時にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // メンバー追加処理（削除 - 招待リンクのみ使用）
  const handleAddMember = () => {
    // この機能は削除し、招待リンクのみを使用
    generateInviteLink()
  }

  // 招待リンク生成
  const generateInviteLink = () => {
    // 環境変数からベースURLを取得、なければ実際のIPアドレスを使用
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'development' ? 'http://10.214.74.42:3000' : window.location.origin)
    
    const inviteLink = `${baseUrl}/teams/join/${teamId}`
    
    // クリップボードにコピー
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('招待リンクをコピーしました！\n\nリンクを友達に送って、チームに招待しましょう！')
    }).catch(() => {
      // フォールバック: 手動でコピー
      const textArea = document.createElement('textarea')
      textArea.value = inviteLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('招待リンクをコピーしました！\n\nリンクを友達に送って、チームに招待しましょう！')
    })
  }

  // 招待コード生成
  const generateInviteCode = () => {
    // チームIDを招待コードとして使用
    const inviteCode = teamId
    
    // クリップボードにコピー
    navigator.clipboard.writeText(inviteCode).then(() => {
      alert(`招待コードをコピーしました！\n\n招待コード: ${inviteCode}\n\nこのコードを友達に教えて、チームに招待しましょう！`)
    }).catch(() => {
      // フォールバック: 手動でコピー
      const textArea = document.createElement('textarea')
      textArea.value = inviteCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(`招待コードをコピーしました！\n\n招待コード: ${inviteCode}\n\nこのコードを友達に教えて、チームに招待しましょう！`)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {formData.name}
          </h1>
        </div>
      </div>

      {/* チーム画像 */}
      <div className="bg-white border-b border-gray-200 p-4">
          <TeamImageSwiper 
            images={formData.images} 
            teamName={formData.name}
            onAddImage={(img) => setFormData(prev => ({
              ...prev,
              images: [...prev.images, img]
            }))}
          />
      </div>

      {/* フォーム */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* チーム名 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            チーム名
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="設定しよう"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 自己紹介文 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自己紹介文
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="設定しよう"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 趣味タグ */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            趣味タグ
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag, index) => (
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
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="新しいタグを入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              追加
            </button>
          </div>
        </div>

        {/* 実績 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            実績
          </label>
          <textarea
            value={formData.achievements}
            onChange={(e) => handleInputChange('achievements', e.target.value)}
            placeholder="設定しよう"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* お酒・タバコ */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            お酒・タバコ
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">お酒</span>
              <button
                onClick={() => handleInputChange('preferences', {
                  ...formData.preferences,
                  alcohol: !formData.preferences.alcohol
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.preferences.alcohol ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.preferences.alcohol ? 'transform translate-x-6' : 'transform translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">タバコ</span>
              <button
                onClick={() => handleInputChange('preferences', {
                  ...formData.preferences,
                  tobacco: !formData.preferences.tobacco
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.preferences.tobacco ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.preferences.tobacco ? 'transform translate-x-6' : 'transform translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 出動状態 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出動状態
          </label>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                formData.isActiveTeam ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {formData.isActiveTeam && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-800">
                  {formData.isActiveTeam ? '出動中' : '待機中'}
                </div>
                <div className="text-sm text-gray-600">
                  {formData.isActiveTeam 
                    ? '他のユーザーからマッチングリクエストを受け取ります' 
                    : 'マッチングリクエストは受け取りません'
                  }
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('isActiveTeam', !formData.isActiveTeam)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActiveTeam ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActiveTeam ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 開催希望都道府県 */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            開催希望都道府県
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {prefectures.map((prefecture) => (
              <button
                key={prefecture}
                onClick={() => handleRegionToggle(prefecture)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  formData.preferences.regions.includes(prefecture)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
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
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-3">
            <span className="text-sm text-gray-600">月</span>
            <span className="text-sm text-gray-600">火</span>
            <span className="text-sm text-gray-600">水</span>
            <span className="text-sm text-gray-600">木</span>
            <span className="text-sm text-gray-600">金</span>
            <span className="text-sm text-gray-600">土</span>
            <span className="text-sm text-gray-600">日</span>
          </div>
          <div className="flex justify-between items-center">
            {Object.entries(formData.weeklySchedule).map(([day, status]) => (
              <button
                key={day}
                onClick={() => {
                  const nextStatus = status === '◎' ? '○' : 
                                   status === '○' ? '△' : 
                                   status === '△' ? '✖' : '◎'
                  setFormData(prev => ({
                    ...prev,
                    weeklySchedule: {
                      ...prev.weeklySchedule,
                      [day]: nextStatus
                    }
                  }))
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  status === '◎' ? 'bg-green-500 text-white' :
                  status === '○' ? 'bg-blue-500 text-white' :
                  status === '△' ? 'bg-yellow-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            ◎: 可能 ○: 調整可能 △: 厳しい ✖: 不可
          </div>
        </div>

        {/* メンバー招待 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              メンバー招待
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={generateInviteCode}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <Icon name="hash" className="w-4 h-4" />
                <span>招待コード</span>
              </button>
              <button
                onClick={generateInviteLink}
                className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 flex items-center space-x-2"
              >
                <Icon name="share-2" className="w-4 h-4" />
                <span>招待リンク</span>
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="users" className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-2">友達をチームに招待</h4>
                <p className="text-sm text-gray-600 mb-3">
                  招待コードまたは招待リンクを友達に送って、チームに参加してもらいましょう！
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
              💡 ヒント: 招待コードは短いので、メッセージアプリで簡単に共有できます！
            </p>
          </div>
        </div>

        {/* メンバー一覧 */}
        <div className="bg-white rounded-lg p-4">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.userId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {member.username.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {member.username}
                        </h4>
                        {member.age > 0 && (
                          <span className="text-sm text-gray-500">
                            {member.age}歳
                          </span>
                        )}
                        {member.location && (
                          <span className="text-sm text-gray-500">
                            • {member.location}
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
                招待リンクを友達に送って、チームに参加してもらいましょう！
              </p>
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="fixed bottom-20 left-4 right-4">
          <button
            onClick={handleSave}
            className="w-full py-4 px-6 rounded-xl bg-primary-500 text-white font-bold text-lg hover:bg-primary-600 transition-colors"
            disabled={saving}
          >
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>

      <FooterNav activeTab="teams" />
    </div>
  )
} 