'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'
import { useAuth } from '../../../contexts/AuthContext'

interface VerificationForm {
  documentType: string
  documentNumber: string
  documentImage: File | null
  birthDate: string
  agreeToTerms: boolean
}

export default function VerificationPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()
  const [formData, setFormData] = useState<VerificationForm>({
    documentType: '',
    documentNumber: '',
    documentImage: null,
    birthDate: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    hasSubmittedVerification: false,
    latestVerification: null as any
  })
  const [statusLoading, setStatusLoading] = useState(true)

  const documentTypes = [
    { value: 'drivers_license', label: '運転免許証', description: '表面のみ（個人情報は隠してください）' },
    { value: 'health_insurance', label: '健康保険証', description: '表面のみ（個人情報は隠してください）' },
    { value: 'passport', label: 'パスポート', description: '表面のみ（個人情報は隠してください）' },
    { value: 'my_number', label: 'マイナンバーカード', description: '表面のみ（個人情報は隠してください）' }
  ]

  // 本人確認状態を取得
  React.useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const accessToken = getAccessToken()
        const response = await fetch('/api/me/verification-status', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setVerificationStatus({
            isVerified: data.isVerified || false,
            hasSubmittedVerification: data.hasSubmittedVerification || false,
            latestVerification: data.latestVerification || null
          })
        }
      } catch (error) {
        console.error('本人確認状態取得エラー:', error)
      } finally {
        setStatusLoading(false)
      }
    }

    fetchVerificationStatus()
  }, [getAccessToken])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, documentImage: file }))
      
      // プレビュー表示
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.documentType) {
      setError('本人確認書類の種類を選択してください')
      setLoading(false)
      return
    }

    if (!formData.birthDate) {
      setError('生年月日を入力してください')
      setLoading(false)
      return
    }

    if (!formData.documentImage) {
      setError('本人確認書類の画像をアップロードしてください')
      setLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      setError('利用規約に同意してください')
      setLoading(false)
      return
    }

    try {
      const accessToken = getAccessToken()
      
      // 画像をアップロード
      const formDataToSend = new FormData()
      formDataToSend.append('documentType', formData.documentType)
      formDataToSend.append('documentNumber', formData.documentNumber)
      formDataToSend.append('documentImage', formData.documentImage)
      formDataToSend.append('birthDate', formData.birthDate)

      console.log('本人確認書類送信中...', {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        imageSize: formData.documentImage.size,
        imageType: formData.documentImage.type,
        birthDate: formData.birthDate
      })

      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-user-id': 'test-user-id', // 開発環境用
        },
        body: formDataToSend
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('本人確認書類送信成功:', responseData)
        setSuccess('本人確認書類を送信しました。審査には1-2営業日かかります。')
        setTimeout(() => {
          router.push('/me')
        }, 3000)
      } else {
        console.error('本人確認書類送信エラー:', responseData)
        
        // より詳細なエラーメッセージを表示
        let errorMessage = responseData.error || '送信に失敗しました'
        
        if (responseData.details) {
          console.error('エラー詳細:', responseData.details)
          
          // 特定のエラーケースに対する詳細メッセージ
          if (responseData.error === '既に本人確認書類が送信されています') {
            errorMessage = '既に本人確認書類が送信されています。審査結果をお待ちください。'
          } else if (responseData.error === '画像のアップロードに失敗しました') {
            errorMessage = '画像のアップロードに失敗しました。画像サイズや形式を確認してください。'
          } else if (responseData.error === 'データベースエラーが発生しました') {
            errorMessage = 'システムエラーが発生しました。しばらく時間をおいて再度お試しください。'
          } else if (responseData.error === '対応していない画像形式です') {
            errorMessage = '対応していない画像形式です。JPEG、JPG、PNG形式の画像をご使用ください。'
          }
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('本人確認送信エラー:', error)
      
      let errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'サーバーに接続できません。インターネット接続を確認してください。'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'ネットワークエラーが発生しました。しばらく時間をおいて再度お試しください。'
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <Icon name="shield-check" className="w-6 h-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            本人確認
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            安全なサービス提供のため、本人確認をお願いします
          </p>
        </div>

        {/* 現在の状態表示 */}
        {!statusLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">現在の本人確認状態</h3>
            {verificationStatus.isVerified ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Icon name="check-circle" className="w-5 h-5" />
                <span className="font-medium">本人確認完了</span>
              </div>
            ) : verificationStatus.hasSubmittedVerification && verificationStatus.latestVerification?.status === 'pending' ? (
              <div className="flex items-center space-x-2 text-yellow-600">
                <Icon name="clock" className="w-5 h-5" />
                <span className="font-medium">審査中</span>
                <span className="text-sm text-gray-500">
                  {new Date(verificationStatus.latestVerification.submittedAt).toLocaleDateString('ja-JP')} に提出
                </span>
              </div>
            ) : verificationStatus.hasSubmittedVerification && verificationStatus.latestVerification?.status === 'rejected' ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-red-600">
                  <Icon name="x-circle" className="w-5 h-5" />
                  <span className="font-medium">却下</span>
                  <span className="text-sm text-gray-500">
                    {new Date(verificationStatus.latestVerification.submittedAt).toLocaleDateString('ja-JP')} に提出
                  </span>
                </div>
                {verificationStatus.latestVerification?.adminNotes && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-700">
                      <strong>却下理由:</strong> {verificationStatus.latestVerification.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <Icon name="exclamation-triangle" className="w-5 h-5" />
                <span className="font-medium">本人確認未完了</span>
              </div>
            )}
          </div>
        )}

        {/* フォーム */}
        {!verificationStatus.isVerified && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

          <div className="space-y-4">
            {/* 書類タイプ選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                本人確認書類の種類
              </label>
              <div className="space-y-2">
                {documentTypes.map((type) => (
                  <label key={type.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="documentType"
                      value={type.value}
                      checked={formData.documentType === type.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 生年月日 */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                生年月日 *
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                本人確認書類に記載されている生年月日を入力してください
              </p>
            </div>

            {/* 書類番号（任意） */}
            <div>
              <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">
                書類番号（任意）
              </label>
              <input
                id="documentNumber"
                name="documentNumber"
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="例: 123456789012"
              />
              <p className="mt-1 text-xs text-gray-500">
                書類番号の一部を入力すると、審査が早くなります
              </p>
            </div>

            {/* 画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                本人確認書類の画像
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Icon name="camera" className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="documentImage" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>画像をアップロード</span>
                      <input
                        id="documentImage"
                        name="documentImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                        required
                      />
                    </label>
                    <p className="pl-1">またはドラッグ&ドロップ</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG 最大10MB</p>
                </div>
              </div>
            </div>

            {/* プレビュー */}
            {previewUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プレビュー
                </label>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, documentImage: null }))
                      setPreviewUrl(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• 個人情報（氏名、住所、生年月日など）は黒塗りまたは隠してください</li>
                <li>• 書類の表面のみを撮影してください</li>
                <li>• 画像が鮮明で読み取れる状態で撮影してください</li>
                <li>• 審査には1-2営業日かかります</li>
                <li>• 送信された画像は暗号化して安全に保管されます</li>
              </ul>
            </div>

            {/* 利用規約同意 */}
            <div className="flex items-start">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                本人確認書類の送信と審査に同意します
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !formData.documentType || !formData.documentImage}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  送信中...
                </div>
              ) : (
                '本人確認書類を送信'
              )}
            </button>
          </div>
        </form>
        )}

        {/* 後で確認ボタン */}
        <div className="text-center">
          <button
            onClick={() => router.push('/me')}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            マイページに戻る
          </button>
        </div>
      </div>
    </div>
  )
} 