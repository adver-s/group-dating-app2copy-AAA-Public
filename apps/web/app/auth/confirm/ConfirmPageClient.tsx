'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import Icon from '../../../components/Icon'

export default function ConfirmPageClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    const [formData, setFormData] = useState({
        code: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/auth/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    code: formData.code
                })
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('メールアドレスが確認されました。ログインしてください。')
                setTimeout(() => {
                    router.push('/auth/signin')
                }, 2000)
            } else {
                setError(data.error || '確認コードが正しくありません')
            }
        } catch (error) {
            setError('確認に失敗しました。もう一度お試しください。')
        }

        setLoading(false)
    }

    const handleResendCode = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/resend-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('確認コードを再送しました。メールをご確認ください。')
            } else {
                setError(data.error || '確認コードの再送に失敗しました')
            }
        } catch (error) {
            setError('確認コードの再送に失敗しました')
        }

        setLoading(false)
    }

    if (!email) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Icon name="exclamation-triangle" className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            エラー
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            メールアドレスが指定されていません
                        </p>
                        <div className="mt-4">
                            <Link href="/auth/signup" className="text-primary-600 hover:text-primary-500">
                                新規登録に戻る
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* ヘッダー */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Icon name="mail" className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        メール確認
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {email} に送信された確認コードを入力してください
                    </p>
                </div>

                {/* フォーム */}
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

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            確認コード
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            required
                            value={formData.code}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="123456"
                            maxLength={6}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            6桁の数字を入力してください
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '確認中...' : '確認する'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            確認コードを再送
                        </button>
                    </div>

                    <div className="text-center">
                        <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-500">
                            ログインページに戻る
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}


