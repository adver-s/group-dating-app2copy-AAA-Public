'use client'

import dayjs from 'dayjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Icon from '../../../components/Icon'
import MatchEstablishedModal from '../../../components/MatchEstablishedModal'
import { useAuth } from '../../../contexts/AuthContext'

// 目的の選択肢
const purposeOptions = [
    { id: 'drinking', label: '定番飲み会', icon: '🍺' },
    { id: 'park', label: '公園散歩', icon: '🌳' },
    { id: 'karaoke', label: 'カラオケ', icon: '🎤' },
    { id: 'cafe', label: 'カフェ', icon: '☕' },
    { id: 'movie', label: '映画', icon: '🎬' },
    { id: 'custom', label: '自由入力', icon: '✏️' }
]

interface ScheduleData {
    purpose: string
    datetime: Date
    location: string
    link?: string
}

export default function ScheduleClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getAccessToken } = useAuth()
    const matchingFlowId = searchParams.get('matchingFlowId')

    const [schedule, setSchedule] = useState<ScheduleData>({
        purpose: '',
        datetime: new Date(), // 初期値は現在時刻
        location: '',
        link: ''
    })
    const [showPurposePicker, setShowPurposePicker] = useState(false)
    const [customPurpose, setCustomPurpose] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // モーダル状態
    const [showMatchModal, setShowMatchModal] = useState(false)
    const [matchData, setMatchData] = useState<{
        proposalId: string
        scheduledAt: string
    } | null>(null)

    // クライアントサイドでのみ明日の日付をセット
    useEffect(() => {
        const tomorrow = new Date(Date.now() + 86400000) // 明日
        setSchedule(prev => ({ ...prev, datetime: tomorrow }))
    }, [])

    const handlePurposeSelect = (purposeId: string) => {
        if (purposeId === 'custom') {
            setCustomPurpose('')
            setSchedule(prev => ({ ...prev, purpose: '' }))
        } else {
            const selectedPurpose = purposeOptions.find(p => p.id === purposeId)
            setSchedule(prev => ({ ...prev, purpose: selectedPurpose?.label || '' }))
        }
        setShowPurposePicker(false)
    }

    const handleCustomPurposeChange = (value: string) => {
        setCustomPurpose(value)
        setSchedule(prev => ({ ...prev, purpose: value }))
    }

    const handleDateChange = (date: string) => {
        setSchedule(prev => ({ ...prev, datetime: new Date(date) }))
    }

    const handleTimeChange = (time: string) => {
        const [hours, minutes] = time.split(':')
        const newDateTime = new Date(schedule.datetime)
        newDateTime.setHours(parseInt(hours), parseInt(minutes))
        setSchedule(prev => ({ ...prev, datetime: newDateTime }))
    }

    const handleLocationChange = (location: string) => {
        setSchedule(prev => ({ ...prev, location }))
    }

    const handleLinkChange = (link: string) => {
        setSchedule(prev => ({ ...prev, link }))
    }

    const handleConfirm = async () => {
        if (!schedule.purpose || !schedule.location) {
            setError('目的と場所を入力してください')
            return
        }

        if (!matchingFlowId) {
            setError('マッチングフローIDが見つかりません')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const accessToken = getAccessToken()
            console.log('🔍 予定調整API呼び出し開始:', {
                matchingFlowId,
                scheduleData: {
                    purpose: schedule.purpose,
                    datetime: schedule.datetime.toISOString(),
                    location: schedule.location,
                    link: schedule.link
                }
            })

            const requestBody = JSON.stringify({
                matchingFlowId,
                scheduleData: {
                    purpose: schedule.purpose,
                    datetime: schedule.datetime.toISOString(),
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
            console.log('🔍 レスポンスヘッダー:', Object.fromEntries(response.headers.entries()))

            if (response.ok) {
                const result = await response.json()
                console.log('✅ 予定確定成功:', result)

                // モーダルを表示
                const formattedDate = dayjs(schedule.datetime).format("YYYY/MM/DD(dd) HH:mm") +
                    (schedule.location ? `  ${schedule.location}` : "")
                setMatchData({
                    proposalId: matchingFlowId || 'unknown',
                    scheduledAt: formattedDate
                })
                setShowMatchModal(true)
            } else {
                let errorData
                try {
                    errorData = await response.json()
                } catch (jsonError) {
                    console.error('❌ JSON解析エラー:', jsonError)
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
                }
                console.error('❌ 予定確定エラー:', errorData)
                setError(errorData.error || `予定の確定に失敗しました (${response.status})`)
            }
        } catch (error: any) {
            console.error('❌ 予定確定ネットワークエラー:', error)
            console.error('❌ エラーの詳細:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            })
            setError(`ネットワークエラー: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">予定調整</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="max-w-md mx-auto space-y-6">
                    {/* エラーメッセージ */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 目的選択 */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">目的</h2>
                        <button
                            onClick={() => setShowPurposePicker(true)}
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-left hover:border-primary-500 transition-colors"
                        >
                            {schedule.purpose ? (
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">
                                        {purposeOptions.find(p => p.label === schedule.purpose)?.icon || '📅'}
                                    </span>
                                    <span className="text-gray-800">{schedule.purpose}</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 text-gray-500">
                                    <Icon name="calendar" className="w-6 h-6" />
                                    <span>目的を選択してください</span>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* 時間選択 */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">時間</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                                <input
                                    type="date"
                                    value={schedule.datetime.toISOString().split('T')[0]}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">時間</label>
                                <input
                                    type="time"
                                    value={schedule.datetime.toTimeString().slice(0, 5)}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    選択された日時: {formatDate(schedule.datetime)} {formatTime(schedule.datetime)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 場所選択 */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">場所</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">場所名</label>
                                <input
                                    type="text"
                                    value={schedule.location}
                                    onChange={(e) => handleLocationChange(e.target.value)}
                                    placeholder="例: 渋谷の居酒屋"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">地図リンク（任意）</label>
                                <input
                                    type="url"
                                    value={schedule.link}
                                    onChange={(e) => handleLinkChange(e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 確定ボタン */}
                    <button
                        onClick={handleConfirm}
                        disabled={!schedule.purpose || !schedule.location || loading}
                        className="w-full bg-primary-500 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '確定中...' : '確定する'}
                    </button>
                </div>
            </div>

            {/* 目的選択モーダル */}
            {showPurposePicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">目的を選択</h3>
                        <div className="space-y-2">
                            {purposeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handlePurposeSelect(option.id)}
                                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{option.icon}</span>
                                        <span className="text-gray-800">{option.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {schedule.purpose === '' && (
                            <div className="mt-4">
                                <input
                                    type="text"
                                    value={customPurpose}
                                    onChange={(e) => handleCustomPurposeChange(e.target.value)}
                                    placeholder="目的を入力してください"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowPurposePicker(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 合コン成立モーダル */}
            {matchData && (
                <MatchEstablishedModal
                    open={showMatchModal}
                    proposalId={matchData.proposalId}
                    scheduledAt={matchData.scheduledAt}
                    onClose={() => {
                        setShowMatchModal(false)
                        setMatchData(null)
                        // モーダルを閉じた後にマッチ一覧ページへ遷移
                        router.push('/matches')
                    }}
                />
            )}
        </div>
    )
}


