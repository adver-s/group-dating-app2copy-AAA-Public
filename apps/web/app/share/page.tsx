'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SharePage() {
  const [appUrl, setAppUrl] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 動的にIPアドレスを取得
    const getAppUrl = async () => {
      try {
        // まずローカルIPアドレスを取得
        const response = await fetch('/api/network/ip')
        const data = await response.json()
        const url = data.publicIp ? `http://${data.publicIp}:3000` : window.location.origin
        setAppUrl(url)
        generateQRCode(url)
      } catch (error) {
        console.error('IPアドレス取得エラー:', error)
        // フォールバック
        const fallbackUrl = window.location.origin
        setAppUrl(fallbackUrl)
        generateQRCode(fallbackUrl)
      } finally {
        setIsLoading(false)
      }
    }

    getAppUrl()
  }, [])

  const generateQRCode = (url: string) => {
    // 簡易的なQRコード表示（実際のQRコードライブラリを使用することを推奨）
    const qrText = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║                    📱 グループ合コンアプリ                    ║
    ║                                                              ║
    ║  URL: ${url.padEnd(50)} ║
    ║                                                              ║
    ║  このURLをブラウザで開くか、QRコードスキャナーで読み取ってください  ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `
    setQrCode(qrText)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appUrl)
      alert('URLをクリップボードにコピーしました！')
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error)
    }
  }

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'グループ合コンアプリ',
          text: 'グループ合コンアプリに参加しませんか？',
          url: appUrl
        })
      } catch (error) {
        console.error('共有に失敗しました:', error)
      }
    } else {
      copyToClipboard()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">URLを取得中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            📱 アプリを共有
          </h1>
          
          <p className="text-gray-600 mb-6">
            このURLを他のデバイスで開いて、グループ合コンアプリに参加しましょう！
          </p>

          {/* QRコード表示 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre overflow-x-auto">
              {qrCode}
            </pre>
          </div>

          {/* URL表示 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アプリURL
            </label>
            <div className="flex">
              <input
                type="text"
                value={appUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-sm"
              >
                コピー
              </button>
            </div>
          </div>

          {/* 共有ボタン */}
          <div className="space-y-3">
            <button
              onClick={shareViaNative}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 font-medium"
            >
              📤 共有する
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 font-medium"
            >
              🏠 ホームに戻る
            </button>
          </div>

          {/* 使用方法 */}
          <div className="mt-8 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              📋 使用方法
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 他のスマートフォンやタブレットでこのURLを開く</li>
              <li>• QRコードスキャナーでQRコードを読み取る</li>
              <li>• 共有ボタンでメッセージアプリに送信</li>
              <li>• 複数のデバイスから同時にアクセス可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 