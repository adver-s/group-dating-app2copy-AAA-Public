'use client'

import { useEffect, useState } from 'react'

// 画像表示コンポーネント
function VerificationImage({ imageUrl }: { imageUrl: string }) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true)

        // Base64はそのまま
        if (imageUrl.startsWith('data:image/')) {
          setDisplayUrl(imageUrl)
          return
        }

        // placeholder はデータURIへフォールバック
        if (imageUrl.startsWith('https://via.placeholder.com/')) {
          const svg = encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
            `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
            `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='20'>No Image</text>` +
            `</svg>`
          )
          setDisplayUrl(`data:image/svg+xml;charset=UTF-8,${svg}`)
          return
        }

        // S3画像は presigned-url API を使用
        if (imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
          const response = await fetch('/api/images/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
          })
          if (response.ok) {
            const data = await response.json()
            setDisplayUrl(data.presignedUrl || imageUrl)
          } else {
            setDisplayUrl(imageUrl)
          }
          return
        }

        // ローカルパスはそのまま使用（/api/images/[...path]で処理される）
        if (imageUrl.startsWith('/uploads/')) {
          setDisplayUrl(imageUrl)
          return
        }

        // その他のHTTP URLはそのまま
        setDisplayUrl(imageUrl)
      } catch (error) {
        console.error('画像読み込みエラー:', error)
        setError('画像の読み込みに失敗しました')
        // エラー時はデータURIのプレースホルダー画像を使用
        const svg = encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
          `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
          `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='16'>読み込みエラー</text>` +
          `</svg>`
        )
        setDisplayUrl(`data:image/svg+xml;charset=UTF-8,${svg}`)
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [imageUrl])

  if (loading) {
    return (
      <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <img
      src={displayUrl || ''}
      alt="本人確認書類"
      className="w-full max-w-md rounded-lg border"
      onError={(e) => {
        console.error('❌ 本人確認画像表示エラー:', displayUrl);
        // エラー時はデータURIのプレースホルダー画像を使用
        const svg = encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
          `<rect width='100%' height='100%' fill='#e5e7eb'/>` +
          `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='16'>表示エラー</text>` +
          `</svg>`
        )
        const target = e.target as HTMLImageElement;
        target.src = `data:image/svg+xml;charset=UTF-8,${svg}`;
        setError('画像の表示に失敗しました');
      }}
    />
  )
}

interface Verification {
  id: string
  userId: string
  documentType: string
  documentNumber: string | null
  documentImage: string
  status: string
  submittedAt: string
  user: {
    email: string
    username: string
  }
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    try {
      const response = await fetch('/api/admin/verifications')
      if (response.ok) {
        const data = await response.json()
        // データベースのカラム名をフロントエンドのプロパティ名に変換
        const formattedVerifications = data.verifications.map((v: any) => ({
          id: v.id,
          userId: v.user_id,
          documentType: v.document_type,
          documentNumber: v.document_number,
          documentImage: v.document_image,
          status: v.status,
          submittedAt: v.submitted_at,
          user: {
            email: v.email,
            username: v.username
          }
        }))
        setVerifications(formattedVerifications)
      }
    } catch (error) {
      console.error('本人確認一覧取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (verificationId: string) => {
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}/approve`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchVerifications()
      }
    } catch (error) {
      console.error('承認エラー:', error)
    }
  }

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (response.ok) {
        fetchVerifications()
        setSelectedVerification(null)
      }
    } catch (error) {
      console.error('却下エラー:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">審査中</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">承認済み</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">却下</span>
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'drivers_license':
        return '運転免許証'
      case 'health_insurance':
        return '健康保険証'
      case 'passport':
        return 'パスポート'
      case 'my_number':
        return 'マイナンバーカード'
      default:
        return type
    }
  }

  const filteredVerifications = verifications.filter(v => v.status === activeTab)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">本人確認審査</h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 一覧 */}
          <div>
            {/* タブ */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'pending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                審査中 ({verifications.filter(v => v.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'approved'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                承認済み ({verifications.filter(v => v.status === 'approved').length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'rejected'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                却下 ({verifications.filter(v => v.status === 'rejected').length})
              </button>
            </div>

            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedVerification(verification)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{verification.user.username}</span>
                    {getStatusBadge(verification.status)}
                  </div>
                  <p className="text-sm text-gray-600">{verification.user.email}</p>
                  <p className="text-sm text-gray-600">
                    {getDocumentTypeLabel(verification.documentType)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(verification.submittedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}

              {filteredVerifications.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                  <p className="text-gray-500">該当する本人確認書類がありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 詳細・審査 */}
          {selectedVerification && (
            <div>
              <h2 className="text-lg font-semibold mb-4">詳細</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">申請者情報</h3>
                  <p>ユーザー名: {selectedVerification.user.username}</p>
                  {selectedVerification.user.email !== 'N/A' && (
                    <p>メール: {selectedVerification.user.email}</p>
                  )}
                  <p>書類タイプ: {getDocumentTypeLabel(selectedVerification.documentType)}</p>
                  {selectedVerification.documentNumber && (
                    <p>書類番号: {selectedVerification.documentNumber}</p>
                  )}
                  <p>ステータス: {getStatusBadge(selectedVerification.status)}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">書類画像</h3>
                  <VerificationImage imageUrl={selectedVerification.documentImage} />
                </div>

                {selectedVerification.status === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(selectedVerification.id)}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('却下理由を入力してください:')
                        if (reason) {
                          handleReject(selectedVerification.id, reason)
                        }
                      }}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      却下
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 