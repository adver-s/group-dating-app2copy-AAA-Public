'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import FooterNav from '@/components/FooterNav'
import Icon from '@/components/Icon'
import { WonderlandMatchCard } from '@/components/ui/wonderland/WonderlandMatchCard'
import { WonderlandMatchHeader } from '@/components/ui/wonderland/WonderlandMatchHeader'
import { WonderlandMatchStats } from '@/components/ui/wonderland/WonderlandMatchStats'
import { WonderlandSectionHeader } from '@/components/ui/wonderland/WonderlandSectionHeader'
import { useActiveTeam } from '../../contexts/ActiveTeamContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTeamData } from '../../lib/hooks/useTeamData'
import { apiGet } from '@/utils/api'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'

interface BaseMatch {
    id: string
    teamName: string
    lastMessage: string
    timestamp: Date
}

interface ChattingMatch extends BaseMatch {
    status: 'chatting'
    meetIntents: { [teamId: string]: string[] }
    totalMembers: number
    intentMembers: number
}

interface SchedulingMatch extends BaseMatch {
    status: 'scheduling'
    meetIntents: { [teamId: string]: string[] }
    totalMembers: number
    intentMembers: number
}

interface ConfirmedMatch extends BaseMatch {
    status: 'confirmed'
    schedule: {
        purpose: string
        datetime: Date
        location: string
        link?: string
    }
}

type Match = ChattingMatch | SchedulingMatch | ConfirmedMatch

interface Stats {
    confirmedCount: number
    decidedCount: number
    successRate: number
}

interface ConfirmedMeeting {
    id: string
    teamName: string
    purpose: string
    datetime: Date
    location: string
    participantCount: number
    status: 'confirmed'
    teamPhotos?: string[]
}

const StatsSection: React.FC<{ stats: Stats }> = ({ stats }) => (
    <WonderlandMatchStats
        stats={{
            confirmedCount: stats.confirmedCount,
            decidedCount: stats.decidedCount,
            successRate: stats.successRate
        }}
    />
)

const ConfirmedMeetingCard: React.FC<{ meeting: ConfirmedMeeting }> = ({ meeting }) => {
    const router = useRouter()

    const handleCardClick = () => {
        router.push(`/matches/confirmed/${meeting.id}`)
    }

    const handleMapClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(meeting.location)}`
        window.open(mapUrl, '_blank')
    }

    const handleChatClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const chatRoomId = `chat_${meeting.id}`
        router.push(`/chat/${chatRoomId}`)
    }

    return (
        <WonderlandMatchCard
            meeting={{
                id: meeting.id,
                teamName: meeting.teamName,
                purpose: meeting.purpose,
                datetime: meeting.datetime,
                location: meeting.location,
                participantCount: meeting.participantCount,
                status: meeting.status,
                teamPhotos: meeting.teamPhotos
            }}
            onCardClick={handleCardClick}
            onMapClick={handleMapClick}
            onChatClick={handleChatClick}
            id={`match-${meeting.id}`}
        />
    )
}

const MatchedGroupCard: React.FC<{ match: any }> = ({ match }) => {
    const router = useRouter()

    const handleCardClick = () => {
        const chatRoomId = `chat_${match.id}`
        router.push(`/chat/${chatRoomId}`)
    }

    const handleChatClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const chatRoomId = `chat_${match.id}`
        router.push(`/chat/${chatRoomId}`)
    }

    return (
        <div
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={handleCardClick}
        >
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 flex-shrink-0">
                    <img
                        src={match.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center'}
                        alt={match.teamName}
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-black mb-1">{match.teamName}</h3>
                    <p className="text-sm text-gray-600">{match.description}</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    マッチ成立: {new Date(match.confirmedAt).toLocaleDateString('ja-JP')}
                </div>
                <button
                    onClick={handleChatClick}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors bg-amber-200 hover:bg-amber-300 text-white shadow-[0_0_10px_rgba(255,255,255,0.65)]"
                >
                    チャット
                </button>
            </div>
        </div>
    )
}

const matchesData: Match[] = [
    {
        id: '1',
        teamName: 'チームおにぎり',
        status: 'chatting',
        lastMessage: 'こんにちは！よろしくお願いします！',
        timestamp: new Date(Date.now() - 300000),
        meetIntents: { 'team1': ['user1', 'user2'], 'team2': ['user3'] },
        totalMembers: 6,
        intentMembers: 3
    },
    {
        id: '2',
        teamName: 'チームカレー',
        status: 'scheduling',
        lastMessage: '会う意思が揃いました！予定を決めましょう',
        timestamp: new Date(Date.now() - 600000),
        meetIntents: { 'team1': ['user1', 'user2', 'user3'], 'team2': ['user4', 'user5'] },
        totalMembers: 8,
        intentMembers: 8
    },
    {
        id: '3',
        teamName: 'チームラーメン',
        status: 'confirmed',
        lastMessage: '合コンが成立しました！',
        timestamp: new Date(Date.now() - 86400000),
        schedule: {
            purpose: '定番飲み会',
            datetime: new Date(Date.now() + 604800000),
            location: '渋谷の居酒屋',
            link: 'https://maps.google.com/...'
        }
    }
]

const MatchCard: React.FC<{ match: Match; key?: string }> = ({ match }) => {
    const router = useRouter()
    const { getAccessToken } = useAuth()

    const handleCardClick = async () => {
        try {
            const accessToken = getAccessToken()
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    matchingFlowId: match.id,
                    roomName: match.teamName
                }),
            })

            if (response.ok) {
                const result = await response.json()
                router.push(`/chat/${result.data.roomId}`)
            } else {
                const errorData = await response.json()
                alert(`エラー: ${errorData.error || 'チャットルーム作成に失敗しました'}`)
            }
        } catch (error) {
            alert('チャット開始に失敗しました')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'chatting':
                return 'bg-blue-500'
            case 'scheduling':
                return 'bg-yellow-500'
            case 'confirmed':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'chatting':
                return 'チャット中'
            case 'scheduling':
                return '予定調整中'
            case 'confirmed':
                return '成立済み'
            default:
                return '不明'
        }
    }

    return (
        <div
            id={`match-${match.id}`}
            className="card p-4 mb-4 cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={handleCardClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status)}`} />
                    <h3 className="text-lg font-bold text-gray-800">{match.teamName}</h3>
                </div>
                <span className="text-sm text-gray-500">
                    {match.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <p className="text-gray-600 mb-3">{match.lastMessage}</p>

            {match.status === 'chatting' && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        会いたい人数: {match.intentMembers}/{match.totalMembers}
                    </span>
                    <div className="flex space-x-1">
                        {Object.values(match.meetIntents).map((_, index) => (
                            <div key={index} className="w-2 h-2 bg-green-500 rounded-full" />
                        ))}
                    </div>
                </div>
            )}

            {match.status === 'scheduling' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">全員が会う意思を表明しました！</p>
                    <p className="text-xs text-yellow-600">予定調整画面で詳細を決めましょう</p>
                </div>
            )}

            {match.status === 'confirmed' && (
                <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">合コン成立！</p>
                    <p className="text-xs text-green-600">
                        {match.schedule.datetime.toLocaleDateString('ja-JP')} - {match.schedule.location}
                    </p>
                </div>
            )}

            <div className="mt-3 flex justify-end">
                <span className={`px-2 py-1 text-xs rounded-full ${match.status === 'chatting' ? 'bg-blue-100 text-blue-700' : match.status === 'scheduling' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {getStatusText(match.status)}
                </span>
            </div>
        </div>
    )
}

export default function MatchesClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const focusId = searchParams.get('focus')
    const { getAccessToken } = useAuth()
    const { activeTeam } = useActiveTeam()
    const { teamData, loading: teamDataLoading, error: teamDataError, refreshData } = useTeamData()
    const [matches, setMatches] = useState<Match[]>([])
    const [confirmedMeetings, setConfirmedMeetings] = useState<ConfirmedMeeting[]>([])
    const [matchedGroups, setMatchedGroups] = useState<any[]>([])
    const [stats, setStats] = useState<Stats>({ confirmedCount: 0, decidedCount: 0, successRate: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const confirmedLocal = JSON.parse(localStorage.getItem('confirmedMatches') || '[]')
                const matchesResponse = await apiGet<Match[]>('/matches')

                if (matchesResponse.success && matchesResponse.data) {
                    const confirmed = matchesResponse.data.filter(m => {
                        const d = m as any
                        return d.status === 'confirmed' && d.schedule
                    })
                    const activeMatches = matchesResponse.data.filter(m => (m as any).status !== 'confirmed')
                    const confirmedMeetingsData = confirmed.map(m => {
                        const d = m as any
                        const displayTeamName = d.otherTeamName || m.teamName || `チーム${m.id}`
                        return {
                            id: m.id,
                            teamName: displayTeamName,
                            purpose: d.schedule?.purpose || '合コン',
                            datetime: new Date(d.schedule?.datetime || Date.now()),
                            location: d.schedule?.location || '未定',
                            participantCount: 4,
                            status: 'confirmed' as const,
                            teamPhotos: d.teamPhotos || []
                        }
                    }) as ConfirmedMeeting[]

                    // ローカル保存分（直前に確定した分）を決定済みにマージ
                    const confirmedLocalAsMeetings = (confirmedLocal as any[])
                      .map((cm: any) => ({
                        id: cm.id || cm.proposalId || cm.matchingFlowId || cm.matchId,
                        teamName: cm.teamName || cm.otherTeamName || `チーム${cm.id || cm.proposalId}`,
                        purpose: cm.purpose || '合コン',
                        datetime: new Date(cm.scheduledAt || cm.datetime || Date.now()),
                        location: cm.location || '未定',
                        participantCount: cm.participantCount || 4,
                        status: 'confirmed' as const,
                        teamPhotos: cm.teamPhotos || []
                      }))
                      .filter((cm: any) => cm.id)

                    const existingConfirmedIds = new Set(confirmedMeetingsData.map(m => m.id))
                    const mergedConfirmedMeetings = [
                      ...confirmedMeetingsData,
                      ...confirmedLocalAsMeetings.filter((m: any) => !existingConfirmedIds.has(m.id))
                    ] as ConfirmedMeeting[]

                    const nextConfirmedMeetings = mergedConfirmedMeetings
                    setConfirmedMeetings(nextConfirmedMeetings)

                    // マッチ側は「非確定のみ」。ローカルのconfirmedMatchesは混在させない
                    const matchedGroupsData = activeMatches.map(m => ({
                        id: m.id,
                        teamName: m.teamName || `チーム${m.id}`,
                        description: 'マッチしたチーム',
                        confirmedAt: new Date((m as any).timestamp || Date.now()).toISOString(),
                        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center'
                    }))
                    setMatchedGroups(matchedGroupsData)

                    const convertedMatches = matchesResponse.data.map(m => {
                        const baseMatch = { ...m, timestamp: new Date((m as any).timestamp || Date.now()), teamName: m.teamName || `チーム${m.id}`, lastMessage: (m as any).lastMessage || '新しいメッセージがあります' }
                        const status = (m as any).status as 'chatting' | 'scheduling' | 'confirmed'
                        if (status === 'confirmed' && (m as any).schedule) {
                            return {
                                ...baseMatch,
                                status: 'confirmed' as const,
                                schedule: {
                                    ...(m as any).schedule,
                                    datetime: new Date((m as any).schedule.datetime || Date.now()),
                                    purpose: (m as any).schedule.purpose || '合コン',
                                    location: (m as any).schedule.location || '未定'
                                }
                            } as ConfirmedMatch
                        } else if (status === 'scheduling') {
                            return { ...baseMatch, status: 'scheduling' as const, meetIntents: (m as any).meetIntents || {}, totalMembers: (m as any).totalMembers || 0, intentMembers: (m as any).intentMembers || 0 } as SchedulingMatch
                        } else {
                            return { ...baseMatch, status: 'chatting' as const, meetIntents: (m as any).meetIntents || {}, totalMembers: (m as any).totalMembers || 0, intentMembers: (m as any).intentMembers || 0 } as ChattingMatch
                        }
                    }) as Match[]
                    setMatches(convertedMatches)
                }

                if (confirmedMeetings.length === 0 && teamData && teamData.establishedMatches.matches.length > 0) {
                    const convertedMeetings = teamData.establishedMatches.matches.map((match: any) => ({
                        id: match.matching_id,
                        teamName: match.partner_team_name,
                        purpose: '合コン',
                        datetime: new Date(match.created_at),
                        location: '未定',
                        participantCount: 6,
                        status: 'confirmed' as const,
                        teamPhotos: []
                    })) as ConfirmedMeeting[]
                    setConfirmedMeetings(convertedMeetings)
                } else if (confirmedMeetings.length === 0) {
                    setConfirmedMeetings([])
                }

                // テストデータ注入は無効化（本番データのみ表示）

                try {
                    const statsResponse = await apiGet<Stats>('/matches/stats')
                    if (statsResponse.success && statsResponse.data) {
                        setStats(statsResponse.data)
                    } else {
                        const confirmedCount = teamData ? teamData.establishedMatches.total : 0
                        const decidedCount = confirmedMeetings.length
                        const successRate = teamData && teamData.matchFlows.total > 0 ? Math.round((teamData.establishedMatches.total / teamData.matchFlows.total) * 100) : 0
                        setStats({ confirmedCount, decidedCount, successRate })
                    }
                } catch {
                    const confirmedCount = teamData ? teamData.establishedMatches.total : 0
                    const decidedCount = confirmedMeetings.length
                    const successRate = teamData && teamData.matchFlows.total > 0 ? Math.round((teamData.establishedMatches.total / teamData.matchFlows.total) * 100) : 0
                    setStats({ confirmedCount, decidedCount, successRate })
                }
            } catch {
                setMatches(matchesData)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [teamData])

    useEffect(() => {
        const unsubscribe = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async () => {
            refreshData()
        })
        return () => { unsubscribe() }
    }, [teamData])

    useEffect(() => {
        if (!focusId) return
        const timer = setTimeout(() => {
            const el = document.getElementById(`match-${focusId}`)
            if (!el) return
            const container = document.querySelector<HTMLDivElement>('#matches-container') || document.querySelector<HTMLDivElement>('.min-h-screen') || (document.scrollingElement as any)
            const rect = el.getBoundingClientRect()
            const cRect = (container as HTMLElement).getBoundingClientRect?.() ?? { top: 0, height: window.innerHeight }
            const currentTop = (container as HTMLElement).scrollTop ?? window.scrollY
            const elCenter = rect.top + currentTop + rect.height / 2
            const targetTop = elCenter - (cRect.height / 2)
                ; (container as HTMLElement).scrollTo({ top: targetTop, behavior: 'smooth' })
            el.classList.add('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]')
            const t = setTimeout(() => { el.classList.remove('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]') }, 1800)
            return () => clearTimeout(t)
        }, 500)
        return () => clearTimeout(timer)
    }, [focusId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="bg-white border-b border-gray-200 px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <Icon name="heart" className="text-primary-500" />
                        <h1 className="text-xl font-bold text-gray-800">マッチ一覧</h1>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-gray-600">マッチを読み込み中...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="bg白 border-b border-gray-200 px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <Icon name="heart" className="text-primary-500" />
                        <h1 className="text-xl font-bold text-gray-800">マッチ一覧</h1>
                    </div>
                </div>
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary">再試行</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fefefe 0%, #faf8f5 100%)' }}>
            <WonderlandMatchHeader title="Match List" subtitle="あなたのマッチング状況" />
            <div className="container mx-auto px-4 py-6" id="matches-container">
                <StatsSection stats={stats} />
                <div className="mb-8">
                    <WonderlandSectionHeader title="決定済み合コン" count={confirmedMeetings.length} />
                    {confirmedMeetings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {confirmedMeetings.map((meeting) => (
                                <ConfirmedMeetingCard key={meeting.id} meeting={meeting} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">まだ決定済みの合コンはありません</p>
                            <p className="text-sm text-gray-400 mt-2">チャットで予定調整を完了するとここに表示されます</p>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <WonderlandSectionHeader title="マッチした合コン" count={matchedGroups.length} />
                    {matchedGroups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {matchedGroups.map((match) => (
                                <MatchedGroupCard key={match.id} match={match} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">まだマッチした合コンはありません</p>
                            <p className="text-sm text-gray-400 mt-2">スワイプでマッチを成立させるとここに表示されます</p>
                        </div>
                    )}
                </div>

                {confirmedMeetings.length === 0 && matchedGroups.length === 0 && (
                    <div className="text中心 py-12">
                        <Icon name="heart" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">まだマッチがありません</p>
                        <p className="text-sm text-gray-400 mt-2">スワイプページで新しい出会いを見つけましょう</p>
                    </div>
                )}
            </div>
            <FooterNav activeTab="matches" />
        </div>
    )
}


