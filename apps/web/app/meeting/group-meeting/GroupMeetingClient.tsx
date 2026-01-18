'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import FooterNav from '../../../components/FooterNav'
import { TriStateVoteImage } from '../../../components/vote/TriStateVoteImage'
import { useActiveTeam } from '../../../contexts/ActiveTeamContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useTeamData } from '../../../lib/hooks/useTeamData'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'

interface MeetingItem {
    id: string
    groupName: string
    status: string
    groupUsers: Array<{
        id: string
        name: string
        color: string
        avatar?: string
    }>
    date?: string
    location?: string
}

export default function GroupMeetingClient() {
    const { getAccessToken } = useAuth()
    const { activeTeam, refreshActiveTeam } = useActiveTeam()
    const { teamData, loading: teamDataLoading, refreshData } = useTeamData()
    const searchParams = useSearchParams()
    const focusId = searchParams.get('focus')
    const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'hold'>('sent')
    const [meetings, setMeetings] = useState<MeetingItem[]>([])
    const [loading, setLoading] = useState(true)

    const testMeetings: MeetingItem[] = [
        {
            id: '1', groupName: '東京大学サークル', status: '提案中', groupUsers: [
                { id: '1', name: '田中太郎', color: 'bg-blue-500' },
                { id: '2', name: '佐藤花子', color: 'bg-pink-500' },
                { id: '3', name: '鈴木次郎', color: 'bg-green-500' }
            ]
        },
        {
            id: '2', groupName: '早稲田大学サークル', status: '検討中', groupUsers: [
                { id: '4', name: '山田三郎', color: 'bg-purple-500' },
                { id: '5', name: '高橋美咲', color: 'bg-yellow-500' },
                { id: '6', name: '伊藤健太', color: 'bg-red-500' }
            ]
        }
    ]

    useEffect(() => {
        if (teamData && teamData.meetingProposals.proposals.length > 0) {
            const converted = teamData.meetingProposals.proposals.map((p: any) => ({
                id: p.id,
                groupName: p.proposed_to_team_name,
                status: p.status === 'accepted' ? '承認済み' : p.status === 'pending' ? '検討中' : '提案中',
                groupUsers: [],
                date: p.proposed_date,
                location: p.proposed_location
            })) as MeetingItem[]
            setMeetings(converted)
        } else {
            setMeetings(testMeetings)
        }
        setLoading(false)
    }, [teamData])

    useEffect(() => {
        const unsub = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async () => {
            await refreshActiveTeam()
            refreshData()
        })
        return () => unsub()
    }, [teamData, refreshActiveTeam])

    useEffect(() => {
        if (!focusId) return
        const el = document.getElementById(`card-${focusId}`)
        if (!el) return
        const container = document.querySelector<HTMLDivElement>('#conference-list')
            || document.querySelector<HTMLDivElement>('.min-h-screen')
            || (document.scrollingElement as any)
        const rect = el.getBoundingClientRect()
        const cRect = (container as HTMLElement).getBoundingClientRect?.() ?? { top: 0, height: window.innerHeight }
        const currentTop = (container as HTMLElement).scrollTop ?? window.scrollY
        const elCenter = rect.top + currentTop + rect.height / 2
        const targetTop = elCenter - (cRect.height / 2)
            ; (container as HTMLElement).scrollTo({ top: targetTop, behavior: 'smooth' })
        el.classList.add('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]')
        const t = setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-300', 'shadow-[0_0_0_8px_rgba(251,191,36,0.25)]')
        }, 1800)
        return () => clearTimeout(t)
    }, [focusId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        )
    }

    const getBackgroundImage = () => activeTab === 'sent' ? 'alice' : activeTab === 'received' ? 'rabbit' : 'cat'

    return (
        <div className="min-h-screen bg-[#f8f6f3] relative">
            <div
                className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0"
                style={{
                    backgroundImage: `url(/assets/characters/${getBackgroundImage()}.svg)`,
                    backgroundSize: '70%',
                    backgroundPosition: 'center 60%',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            <div className="bg-white shadow-sm border-b border-gray-200 relative z-10">
                <div className="px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900">合コン会議</h1>
                </div>
                <div className="flex border-b border-gray-200">
                    {(['sent', 'received', 'hold'] as const).map(key => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={activeTab === key ? 'true' : 'false'}
                            onClick={() => setActiveTab(key)}
                            className={`relative flex-1 px-6 py-3 text-lg font-bold transition-all duration-200 ${activeTab === key ? 'text-amber-900 border-b-4 border-orange-300' : 'text-amber-700 border-b-4 border-transparent hover:text-amber-800'}`}
                        >
                            {key === 'sent' ? '送った提案' : key === 'received' ? '受け取ったお誘い' : '保留リスト'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10" id="conference-list">
                <div className="px-4 py-6 space-y-4">
                    {meetings.map(item => (
                        <div key={item.id} id={`card-${item.id}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {item.groupName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{item.groupName}</h3>
                                        <p className="text-sm text-pink-600">{item.status}</p>
                                    </div>
                                </div>
                                <div className="text-2xl">😊</div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-end justify-center gap-2">
                                    {item.groupUsers.map(member => (
                                        <div key={member.id} className="flex flex-col items-center">
                                            <span className="text-xs font-medium mb-1 text-center max-w-16 truncate" style={{ color: '#3E2F2A' }}>{member.name}</span>
                                            <div>
                                                <TriStateVoteImage size={48} ariaLabelBase={`${member.name}の判定`} persistKey={`vote:${activeTab}:${item.id}:${member.id}`} onChange={() => { }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {meetings.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-500">
                                {activeTab === 'sent' && '送った提案はありません'}
                                {activeTab === 'received' && '受け取ったお誘いはありません'}
                                {activeTab === 'hold' && '保留リストは空です'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <FooterNav activeTab="meeting" />
        </div>
    )
}


