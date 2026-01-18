'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'

export default function AuthChoicePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <Icon name="heart" className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Gather-s
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            グループ合コンアプリへようこそ
          </p>
          <p className="mt-1 text-sm text-gray-500">
            素敵な出会いを見つけましょう
          </p>
        </div>

        {/* 選択ボタン */}
        <div className="space-y-4">
          {/* 新規登録 */}
          <Link
            href="/auth/signup"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Icon name="user-plus" className="w-6 h-6 mr-3" />
            新規登録
          </Link>

          {/* ログイン */}
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Icon name="login" className="w-6 h-6 mr-3" />
            ログイン
          </Link>

          {/* QR共有 */}
          <Link
            href="/share"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Icon name="qr-code" className="w-6 h-6 mr-3" />
            QR共有
          </Link>
        </div>

        {/* 説明 */}
        <div className="text-center space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              📱 アプリの使い方
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 新規登録：初回利用の方はこちら</li>
              <li>• ログイン：既存アカウントでログイン</li>
              <li>• QR共有：他のデバイスとアプリを共有</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 <strong>ヒント:</strong> グループで利用する場合は、QR共有機能を使って他のメンバーとアプリを共有できます。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            利用することで
            <Link href={{ pathname: '/me/terms', query: { from: 'signup' } }} className="text-blue-600 hover:text-blue-500 mx-1">
              利用規約
            </Link>
            と
            <Link href={{ pathname: '/me/privacy', query: { from: 'signup' } }} className="text-blue-600 hover:text-blue-500 mx-1">
              プライバシーポリシー
            </Link>
            に同意したことになります
          </p>
        </div>
      </div>
    </div>
  )
}
