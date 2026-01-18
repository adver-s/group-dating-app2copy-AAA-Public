'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import FooterNav from '@/components/FooterNav'
import Icon from '@/components/Icon'
import { useAuth } from '../../contexts/AuthContext'
import { apiRequest } from '@/utils/api'

const publicImages = [
  '/sample1.jpg', '/sample2.jpg', '/sample3.jpg', '/sample4.jpg', '/sample5.jpg', '/sample6.jpg', '/sample7.jpg'
]

export default function ProfilePage() {
  const router = useRouter()
  const { getAccessToken, logout } = useAuth()
  const [userProfile, setUserProfile] = useState({
    name: '',
    age: 0,
    location: '',
    bio: '',
    interests: [],
    teamCount: 0,
    matchCount: 0,
    photo: null as { id: string; url: string; status: string; type: string } | null
  })
  const [loading, setLoading] = useState(true)
  const [icon, setIcon] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    hasSubmittedVerification: false,
    latestVerification: null as any
  })
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | null>(null)

  // プロフィールデータを取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = getAccessToken();
        console.log('🔍 Access token:', accessToken ? 'Present' : 'Missing');
        console.log('🔍 Token length:', accessToken?.length || 0);

        // プロフィール情報を取得
        const profileResponse = await apiRequest('/api/me/profile', {}, accessToken);
        console.log('🔍 Profile API response status:', profileResponse.status);

        if (profileResponse.ok) {
          const responseText = await profileResponse.text();
          let profileData;
          try {
            profileData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Profile JSON parse error:', parseError);
            profileData = {};
          }
          console.log('✅ Profile data received:', profileData);
          console.log('🔍 Interests data type:', typeof profileData.interests);
          console.log('🔍 Interests data value:', profileData.interests);
          console.log('🔍 Is interests array?', Array.isArray(profileData.interests));
          setUserProfile(prev => ({
            ...prev,
            name: profileData.username || '',
            age: profileData.age || 0,
            location: profileData.location || '',
            bio: profileData.bio || '',
            interests: Array.isArray(profileData.interests) ? profileData.interests : [],
            photo: profileData.photo || null
          }))
        } else if (profileResponse.status === 401) {
          console.log('❌ Unauthorized - redirecting to login');
          // 認証エラーの場合はログインページにリダイレクト
          router.push('/auth/signin')
          return
        } else {
          console.log('❌ Profile API error:', profileResponse.status);
        }

        // チーム数を取得
        const teamsResponse = await apiRequest('/api/me/teams', {}, accessToken);
        console.log('🔍 Teams API response status:', teamsResponse.status);

        if (teamsResponse.ok) {
          const responseText = await teamsResponse.text();
          let teamsData;
          try {
            teamsData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Teams JSON parse error:', parseError);
            teamsData = {};
          }
          console.log('✅ Teams data received:', teamsData);
          setUserProfile(prev => ({
            ...prev,
            teamCount: teamsData.totalTeams || 0
          }))
        } else {
          console.log('❌ Teams API error:', teamsResponse.status);
        }

        // マッチ数を取得
        const matchesResponse = await apiRequest('/api/me/matches', {}, accessToken);
        console.log('🔍 Matches API response status:', matchesResponse.status);

        if (matchesResponse.ok) {
          const responseText = await matchesResponse.text();
          let matchesData;
          try {
            matchesData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Matches JSON parse error:', parseError);
            matchesData = {};
          }
          console.log('✅ Matches data received:', matchesData);
          setUserProfile(prev => ({
            ...prev,
            matchCount: matchesData.totalMatches || 0
          }))
        } else {
          console.log('❌ Matches API error:', matchesResponse.status);
        }

        // 本人確認状態を取得
        const verificationResponse = await apiRequest('/api/me/verification-status', {}, accessToken);
        console.log('🔍 Verification API response status:', verificationResponse.status);

        if (verificationResponse.ok) {
          const responseText = await verificationResponse.text();
          let verificationData;
          try {
            verificationData = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Verification JSON parse error:', parseError);
            verificationData = {};
          }
          console.log('✅ Verification data received:', verificationData);
          console.log('🔍 isVerified value:', verificationData.isVerified);
          console.log('🔍 hasSubmittedVerification value:', verificationData.hasSubmittedVerification);
          console.log('🔍 latestVerification status:', verificationData.latestVerification?.status);

          setVerificationStatus({
            isVerified: verificationData.isVerified || false,
            hasSubmittedVerification: verificationData.hasSubmittedVerification || false,
            latestVerification: verificationData.latestVerification || null
          })

          console.log('🔍 Updated verificationStatus state:', {
            isVerified: verificationData.isVerified || false,
            hasSubmittedVerification: verificationData.hasSubmittedVerification || false,
            latestVerification: verificationData.latestVerification || null
          });
        } else {
          console.log('❌ Verification API error:', verificationResponse.status);
          const errorText = await verificationResponse.text();
          console.log('❌ Verification API error response:', errorText);
        }

      } catch (error) {
        console.error('❌ Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [getAccessToken, router])

  // プロフィール写真URLの解決（S3は署名URLに変換）
  useEffect(() => {
    const resolveUrl = async () => {
      const url = userProfile.photo?.url || null
      if (!url) {
        setResolvedPhotoUrl(null)
        return
      }

      try {
        if (url.startsWith('data:image/')) {
          setResolvedPhotoUrl(url)
          return
        }
        if (url.startsWith('https://via.placeholder.com/')) {
          setResolvedPhotoUrl(url)
          return
        }
        if (url.startsWith('/uploads/')) {
          // ローカル画像のパスはそのまま使用（/api/images/[...path]で処理される）
          console.log('🔍 マイページ: /uploads/ パスをそのまま使用:', url)
          setResolvedPhotoUrl(url)
          return
        }
        if (url.startsWith('/')) {
          // ローカルへの相対パス（他のパス形式）
          // API経由に変換して公開パスを取得
          const imagePath = url.replace(/^\//, '')
          const resp = await fetch(`/api/images/${imagePath}`)
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}))
            setResolvedPhotoUrl(data.imageUrl || url)
          } else {
            setResolvedPhotoUrl(url)
          }
          return
        }
        if (url.includes('s3.') && url.includes('amazonaws.com')) {
          const resp = await fetch('/api/images/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url })
          })
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}))
            setResolvedPhotoUrl(data.presignedUrl || url)
          } else {
            setResolvedPhotoUrl(url)
          }
          return
        }
        // その他のHTTP URLはそのまま
        setResolvedPhotoUrl(url)
      } catch (e) {
        console.error('写真URL解決エラー:', e)
        console.error('エラー発生時のURL:', url)
        // エラー時はデフォルトのプレースホルダー画像を使用
        const svg = encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
          `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
          `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='12'>No Image</text>` +
          `</svg>`
        )
        setResolvedPhotoUrl(`data:image/svg+xml;charset=UTF-8,${svg}`)
      }
    }
    resolveUrl()
  }, [userProfile.photo?.url])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const accessToken = getAccessToken()
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      if (response.ok) {
        const responseText = await response.text()
        let data
        try {
          data = responseText ? JSON.parse(responseText) : {}
        } catch (parseError) {
          console.error('Upload success JSON parse error:', parseError)
          data = {}
        }
        setIcon(data.photoUrl)
        setShowPicker(false)

        // プロフィール情報を再取得して写真ステータスを更新
        try {
          const accessToken = getAccessToken()
          const profileResponse = await apiRequest('/api/me/profile', {}, accessToken)
          if (profileResponse.ok) {
            const responseText = await profileResponse.text()
            let profileData
            try {
              profileData = responseText ? JSON.parse(responseText) : {}
            } catch (parseError) {
              console.error('Profile refresh JSON parse error:', parseError)
              profileData = {}
            }
            setUserProfile(prevProfile => ({
              ...prevProfile,
              photo: profileData.photo
            }))
          }
        } catch (error) {
          console.error('Profile refresh error:', error)
        }

        alert('画像がアップロードされました。管理者の審査後に使用可能になります。')
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = errorText ? JSON.parse(errorText) : {}
        } catch (parseError) {
          errorData = { message: errorText || 'エラーが発生しました' }
        }
        alert(`アップロードに失敗しました: ${errorData.message || 'エラーが発生しました'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('アップロード中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  const menuItems = [
    { id: 'account', label: 'アカウント', icon: 'user' },
    { id: 'verification', label: '本人確認', icon: 'identification' },
    { id: 'announcements', label: 'お知らせ', icon: 'megaphone' },
    { id: 'terms', label: '利用規約', icon: 'document-text' },
    { id: 'privacy', label: 'プライバシーポリシー', icon: 'shield-check' },
    { id: 'feedback', label: 'ご意見box', icon: 'chat-bubble-left-right' },
    { id: 'crowdfunding', label: 'クラウドファンディング', icon: 'heart' },
    { id: 'gather-s', label: 'Gather-sについて', icon: 'information-circle' },
    { id: 'adver-s', label: 'Adver-sについて', icon: 'information-circle' },
    { id: 'logout', label: 'ログアウト', icon: 'arrow-right-on-rectangle' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <Icon name="user-circle" className="text-primary-500" />
          <h1 className="text-xl font-bold text-gray-800">マイページ</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <button
                  className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden focus:outline-none"
                  onClick={() => setShowPicker(true)}
                  aria-label="アイコンを変更"
                >
                  {resolvedPhotoUrl ? (
                    <img src={resolvedPhotoUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : icon ? (
                    <img src={icon} alt="icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {userProfile.name.charAt(0) || '?'}
                    </span>
                  )}
                </button>
                {userProfile.photo && userProfile.photo.status === 'pending_review' && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    審査中
                  </div>
                )}
                {userProfile.photo && userProfile.photo.status === 'rejected' && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    却下
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {userProfile.name ? userProfile.name : (
                    <span className="text-gray-500 italic">名前を設定してください</span>
                  )}
                </h2>
                <p className="text-gray-600">
                  {userProfile.age > 0 ? `${userProfile.age}歳` : ''}
                  {userProfile.age > 0 && userProfile.location ? ' • ' : ''}
                  {userProfile.location || ''}
                </p>
              </div>
            </div>
            {/* 画像選択モーダル */}
            {showPicker && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
                  <h3 className="text-lg font-bold mb-4">アイコン画像を選択</h3>

                  {/* アップロードセクション */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新しい画像をアップロード
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        アップロード中...
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      既存の画像から選択
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {publicImages.map(img => (
                        <button key={img} onClick={() => { setIcon(img); setShowPicker(false); }}>
                          <img src={img} alt="候補" className="w-20 h-20 object-cover rounded-lg border hover:ring-2 hover:ring-primary-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setShowPicker(false)} className="w-full py-2 bg-gray-200 rounded-lg">キャンセル</button>
                </div>
              </div>
            )}
            <p className="text-gray-700 mb-4">
              {userProfile.bio ? userProfile.bio : (
                <span className="text-gray-500 italic">自己紹介を設定してください</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(userProfile.interests) && userProfile.interests.length > 0 ? (
                userProfile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm italic">趣味を設定してください</span>
              )}
            </div>

            <div className="flex space-x-6 text-center">
              <div>
                <div className="dashboard-metric text-2xl">{userProfile.teamCount}</div>
                <div className="text-sm text-gray-600">参加チーム</div>
              </div>
              <div>
                <div className="dashboard-metric text-2xl">{userProfile.matchCount}</div>
                <div className="text-sm text-gray-600">マッチ数</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Menu Items */}
      <div className="bg-white">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'account') {
                router.push('/me/account')
              } else if (item.id === 'verification') {
                router.push('/auth/verification')
              } else if (item.id === 'announcements') {
                // お知らせページへの遷移（実装予定）
                alert('お知らせ機能は準備中です')
              } else if (item.id === 'terms') {
                router.push('/me/terms?from=me')
              } else if (item.id === 'privacy') {
                router.push('/me/privacy?from=me')
              } else if (item.id === 'feedback') {
                router.push('/me/feedback')
              } else if (item.id === 'crowdfunding') {
                // クラウドファンディングページへの遷移（実装予定）
                alert('クラウドファンディングページは準備中です')
              } else if (item.id === 'gather-s') {
                // Gather-sについてページへの遷移（実装予定）
                alert('Gather-sについてページは準備中です')
              } else if (item.id === 'adver-s') {
                // Adver-sについてページへの遷移（実装予定）
                alert('Adver-sについてページは準備中です')
              } else if (item.id === 'logout') {
                // ログアウト確認ダイアログ
                if (confirm('ログアウトしますか？')) {
                  logout()
                  router.push('/auth/signin')
                }
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.id === 'logout' ? 'text-red-600 hover:text-red-700' : ''
              }`}
          >
            <div className="flex items-center space-x-3">
              <Icon name={item.icon} className="w-5 h-5 text-gray-500" />
              <span className="text-gray-800">{item.label}</span>
              {item.id === 'verification' && (
                <div className="ml-2">
                  {(() => {
                    console.log('🔍 Rendering verification status:', {
                      isVerified: verificationStatus.isVerified,
                      hasSubmittedVerification: verificationStatus.hasSubmittedVerification,
                      latestStatus: verificationStatus.latestVerification?.status
                    });

                    if (verificationStatus.isVerified) {
                      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">完了</span>;
                    } else if (verificationStatus.hasSubmittedVerification && verificationStatus.latestVerification?.status === 'pending') {
                      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">審査中</span>;
                    } else if (verificationStatus.hasSubmittedVerification && verificationStatus.latestVerification?.status === 'rejected') {
                      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">却下</span>;
                    } else {
                      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">未完了</span>;
                    }
                  })()}
                </div>
              )}
            </div>
            <Icon name="chevron-right" className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      <FooterNav activeTab="profile" />

    </div>
  )
} 