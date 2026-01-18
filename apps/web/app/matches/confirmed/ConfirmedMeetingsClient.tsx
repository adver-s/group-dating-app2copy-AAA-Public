'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import FooterNav from '../../../components/FooterNav'
import Icon from '../../../components/Icon'

interface ConfirmedMeeting {
    id: string
    teamName: string
    purpose: string
    datetime: Date
    location: string
    link?: string
    memberCount: number
    image?: string
}

const confirmedMeetings: ConfirmedMeeting[] = [
    { id: '1', teamName: 'チームラーメン', purpose: '定番飲み会', datetime: new Date(Date.now() + 604800000), location: '渋谷の居酒屋', link: 'https://maps.google.com/...', memberCount: 6, image: '/sample1.jpg' },
    { id: '2', teamName: 'チームカレー', purpose: 'カフェ', datetime: new Date(Date.now() + 1209600000), location: '表参道のカフェ', memberCount: 4, image: '/sample2.jpg' },
    { id: '3', teamName: 'チームおにぎり', purpose: '公園散歩', datetime: new Date(Date.now() + 2592000000), location: '代々木公園', memberCount: 8, image: '/sample6.jpg' },
]

const MeetingCard: React.FC<{ meeting: ConfirmedMeeting; key?: string }> = ({ meeting }) => {
    const router = useRouter()

    const handleCardClick = () => {
        router.push(`/matches/confirmed/${meeting.id}`)
    }

    const formatDate = (date: Date) => date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })
    const formatTime = (date: Date) => date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    const getPurposeIcon = (purpose: string) => ({ '定番飲み会': '🍺', '公園散歩': '🌳', 'カラオケ': '🎤', 'カフェ': '☕', '映画': '🎬' }[purpose] || '📅')

    return (
        <div id={`card-${meeting.id}`} className="card overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-200" onClick={handleCardClick}>
            <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600">
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl text-white opacity-20">{getPurposeIcon(meeting.purpose)}</span></div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">成立済み</div>
            </div>
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{meeting.teamName}</h3>
                    <div className="flex items-center space-x-1 text-gray-500"><Icon name="users" className="w-4 h-4" /><span className="text-sm">{meeting.memberCount}人</span></div>
                </div>
                <div className="flex items-center space-x-2 mb-3"><span className="text-2xl">{getPurposeIcon(meeting.purpose)}</span><span className="text-gray-700 font-medium">{meeting.purpose}</span></div>
                <div className="flex items-center space-x-2 mb-3 text-gray-600"><Icon name="calendar" className="w-4 h-4" /><span className="text-sm">{formatDate(meeting.datetime)} {formatTime(meeting.datetime)}</span></div>
                <div className="flex items-center space-x-2 mb-4 text-gray-600"><Icon name="map-pin" className="w-4 h-4" /><span className="text-sm">{meeting.location}</span></div>
                <div className="flex space-x-2">
                    {meeting.link && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(meeting.link!, '_blank') }} className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1">
                            <Icon name="map" className="w-4 h-4" /><span>地図</span>
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/chat/${meeting.id}`) }} className="flex-1 bg-primary-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center space-x-1">
                        <Icon name="chat-bubble-left" className="w-4 h-4" /><span>チャット</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ConfirmedMeetingsClient() {
    const router = useRouter()
    const sp = useSearchParams()
    const focusId = sp.get('focus')

    useEffect(() => {
        if (!focusId) return
        const el = document.getElementById(`card-${focusId}`)
        if (!el) return
        const container = document.querySelector<HTMLDivElement>('#confirmed-meetings-list') || (document.scrollingElement as any)
        const rect = el.getBoundingClientRect()
        const cRect = (container as HTMLElement).getBoundingClientRect?.() ?? { top: 0, height: window.innerHeight }
        const currentTop = (container as HTMLElement).scrollTop ?? window.scrollY
        const elCenter = rect.top + currentTop + rect.height / 2
        const targetTop = elCenter - cRect.height / 2
            ; (container as HTMLElement).scrollTo({ top: targetTop, behavior: 'smooth' })
        el.classList.add('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]')
        const t = setTimeout(() => { el.classList.remove('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]') }, 1800)
        return () => clearTimeout(t)
    }, [focusId])

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                            <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">決定済み合コン</h1>
                            <p className="text-sm text-gray-500">成立した合コンの一覧</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-2xl font-bold text-green-600">{confirmedMeetings.length}</p><p className="text-xs text-gray-600">成立済み</p></div>
                        <div><p className="text-2xl font-bold text-blue-600">{confirmedMeetings.reduce((s, m) => s + m.memberCount, 0)}</p><p className="text-xs text-gray-600">参加予定者</p></div>
                        <div><p className="text-2xl font-bold text-purple-600">{Math.round(confirmedMeetings.length / 3 * 100)}%</p><p className="text-xs text-gray-600">成功率</p></div>
                    </div>
                </div>
                {confirmedMeetings.length > 0 ? (
                    <div id="confirmed-meetings-list" className="space-y-6">
                        {confirmedMeetings.map((meeting) => (<MeetingCard key={meeting.id} meeting={meeting} />))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">まだ成立した合コンがありません</p>
                        <p className="text-sm text-gray-400 mt-2">チャットで会う意思を表明して、合コンを成立させましょう</p>
                    </div>
                )}
            </div>
            <FooterNav activeTab="matches" />
        </div>
    )
}


