'use client'

import { AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import FooterNav from '../../../components/FooterNav'
import { TriStateVoteImage, type VoteStatus } from '../../../components/vote/TriStateVoteImage'
import { useActiveTeam } from '../../../contexts/ActiveTeamContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useTeamData } from '../../../lib/hooks/useTeamData'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'

interface MeetingItem {
    id: string
    teamId?: string // チームIDを追加（オプショナル）
    teamName: string
    description: string
    image: string
    status: string
    createdAt: string
    userLikesCount: number
    userApprovalsCount: number
    allApproved: boolean
}

// 型エイリアス
type TabType = 'sent' | 'received' | 'hold'
type SelectionModeType = 'like' | 'reject' | null
type VoteType = 'like' | 'reject'

interface VerificationStatus {
    allVerified: boolean;
    unverifiedMembers: string[];
    totalMembers: number;
    verifiedMembers: number;
}

interface ShowBanner {
    itemId: string;
    teamName: string;
    description: string;
    image: string;
    voteType: VoteType;
    message?: string;
}

const TABS = [
    { key: "sent", label: "送った＆いいねされた提案" },
    { key: "received", label: "受け取ったお誘い" },
    { key: "hold", label: "保留リスト" },
];

// グループメンバー（DBから取得）
// 自分のみを表示するためのダミー配列は不要

// 一括操作ボタンコンポーネント
const BulkActionButtons: React.FC<{
    isSelectionMode: boolean;
    selectedItems: string[];
    selectionModeType: SelectionModeType;
    onStartBulkLike: () => void;
    onStartBulkReject: () => void;
    onBulkLike: () => void;
    onBulkReject: () => void;
    onCancelSelection: () => void;
    activeTab?: TabType;
}> = ({ isSelectionMode, selectedItems, selectionModeType, onStartBulkLike, onStartBulkReject, onBulkLike, onBulkReject, onCancelSelection, activeTab }) => {
    return (
        <div className="fixed bottom-20 left-4 right-4 z-40">
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
                {!isSelectionMode ? (
                    <div className="flex space-x-3">
                        <button
                            onClick={onStartBulkLike}
                            className="flex-1 flex items-center justify-center py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <span className="font-medium">
                                {activeTab === 'hold' ? '一括あり' : activeTab === 'received' ? '一括OK' : '一括いいね'}
                            </span>
                        </button>
                        <button
                            onClick={onStartBulkReject}
                            className="flex-1 flex items-center justify-center py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <span className="font-medium">
                                {activeTab === 'hold' ? '一括なし' : activeTab === 'received' ? '一括なし' : '一括ブッチ'}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                選択中: {selectedItems.length}件
                            </span>
                            <button
                                onClick={onCancelSelection}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                キャンセル
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            {selectionModeType === 'like' && (
                                <button
                                    onClick={onBulkLike}
                                    disabled={selectedItems.length === 0}
                                    className="flex-1 py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                                >
                                    {activeTab === 'hold' ? '一括ありにする' : activeTab === 'received' ? '一括OKする' : '一括いいねする'} ({selectedItems.length})
                                </button>
                            )}
                            {selectionModeType === 'reject' && (
                                <button
                                    onClick={onBulkReject}
                                    disabled={selectedItems.length === 0}
                                    className="flex-1 py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                                >
                                    {activeTab === 'hold' ? '一括なしにする' : activeTab === 'received' ? '一括なしにする' : '一括ブッチする'} ({selectedItems.length})
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 全員投票バナーコンポーネント
const AllVotedBanner: React.FC<{
    teamName: string;
    description: string;
    image: string;
    voteType: VoteType;
    message?: string;
    onAction: () => void;
    onClose: () => void;
    activeTab?: TabType;
}> = ({ teamName, description, image, voteType, message, onAction, onClose, activeTab }) => {
    const isLike = voteType === 'like';
    const isReceivedTab = activeTab === 'received';

    return (
        <div
            className="fixed bottom-32 left-4 right-4 z-50"
        >
            <div className="bg-white rounded-xl shadow-lg border-2 p-4 border-black">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 flex-shrink-0">
                        <img
                            src={image}
                            alt={teamName}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-lg mb-1 text-black">
                            {message || (isLike
                                ? (isReceivedTab ? '全員がOKしました！' : '全員がいいねしました！')
                                : (isReceivedTab ? '全員がなししました！' : '全員がブッチしました！')
                            )}
                        </div>
                        <div className="font-medium text-gray-800 mb-1">{teamName}</div>
                        <div className="text-sm text-gray-600">{description}</div>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={onAction}
                            className="text-white px-4 py-2 rounded-lg font-bold transition-colors bg-black hover:bg-gray-800"
                        >
                            {isLike
                                ? (isReceivedTab ? 'OKする' : 'いいねを送る')
                                : (isReceivedTab ? 'なしにする' : 'ブッチする')
                            }
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TeamMeetingClient() {
    const router = useRouter();
    const { user, getAccessToken } = useAuth()
    const { activeTeam, refreshActiveTeam } = useActiveTeam()
    const { teamData, loading: teamDataLoading } = useTeamData()
    const searchParams = useSearchParams()
    const focusId = searchParams.get("focus")
    // 自分だけを投票者として扱う
    const members = [
        { id: user?.id ?? 'me', name: user?.name ?? '自分' }
    ]
    const [activeTab, setActiveTab] = useState<TabType>('sent')
    const [sent, setSent] = useState<MeetingItem[]>([])
    const [received, setReceived] = useState<MeetingItem[]>([])
    const [hold, setHold] = useState<MeetingItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // 本人確認状況管理
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

    // 投票状態管理
    const [voteStates, setVoteStates] = useState<{ [key: string]: { [memberId: string]: VoteStatus } }>({});
    const [showBanner, setShowBanner] = useState<ShowBanner | null>(null);

    // 一括操作の状態管理
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionModeType, setSelectionModeType] = useState<SelectionModeType>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

    // 指定アイテムの最新いいね数を取得して反映
    const updateCountsForItems = async (items: MeetingItem[]) => {
        try {
            const entries: Record<string, number> = {};
            await Promise.all(items.map(async (it) => {
                try {
                    const res = await fetch(`/api/meeting/vote?itemId=${it.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const likes = data?.counts?.likes;
                        if (typeof likes === 'number') entries[it.id] = likes;
                    }
                } catch { }
            }));
            if (Object.keys(entries).length > 0) {
                setLikeCounts(prev => ({ ...prev, ...entries }));
            }
        } catch { }
    };

    // テストデータ（実際のチームIDを使用）
    const testSentData: MeetingItem[] = [
        {
            id: 'team_1756365611374_qo0nxj30c',
            teamName: '男性グループA',
            description: 'スワイプでいいねしたチーム',
            image: 'https://via.placeholder.com/120x120/F3CABB/FFFFFF?text=Team+A',
            status: 'liked',
            createdAt: new Date().toISOString(),
            userLikesCount: 3,
            userApprovalsCount: 3,
            allApproved: true
        }
    ];

    const testReceivedData: MeetingItem[] = [
        {
            id: 'team_1756365611374_qo0nxj30c',
            teamName: '女性グループB',
            description: 'お誘いを受け取ったチーム',
            image: 'https://via.placeholder.com/120x120/E5B8F7/FFFFFF?text=Team+B',
            status: 'received',
            createdAt: new Date().toISOString(),
            userLikesCount: 3,
            userApprovalsCount: 3,
            allApproved: true
        }
    ];

    const testHoldData: MeetingItem[] = [
        {
            id: 'team_1756365611374_qo0nxj30c',
            teamName: '保留チームC',
            description: '保留中のチーム',
            image: 'https://via.placeholder.com/120x120/B8E5F7/FFFFFF?text=Team+C',
            status: 'hold',
            createdAt: new Date().toISOString(),
            userLikesCount: 3,
            userApprovalsCount: 3,
            allApproved: false
        }
    ];

    // データ取得
    useEffect(() => {
        const fetchData = async () => {
            try {
                const accessToken = getAccessToken();

                // 送信した提案を取得
                const sentResponse = await fetch('/api/meeting/sent', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (sentResponse.ok) {
                    const sentData = await sentResponse.json();
                    const list = sentData.length > 0 ? sentData : testSentData;
                    setSent(list);
                    updateCountsForItems(list);
                } else {
                    setSent(testSentData);
                    updateCountsForItems(testSentData);
                }

                // 受信した提案を取得
                const receivedResponse = await fetch('/api/meeting/received', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (receivedResponse.ok) {
                    const receivedData = await receivedResponse.json();
                    const listR = receivedData.length > 0 ? receivedData : testReceivedData;
                    setReceived(listR);
                    updateCountsForItems(listR);
                } else {
                    setReceived(testReceivedData);
                    updateCountsForItems(testReceivedData);
                }

                // 保留リストを取得
                const holdResponse = await fetch('/api/meeting/hold', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (holdResponse.ok) {
                    const holdData = await holdResponse.json();
                    const list = holdData.length > 0 ? holdData : testHoldData;
                    setHold(list);
                    // 初期表示時に各アイテムのいいね数を取得
                    updateCountsForItems(list);
                } else {
                    setHold(testHoldData);
                    updateCountsForItems(testHoldData);
                }

                setLoading(false);
            } catch (error) {
                console.error('データ取得エラー:', error);
                // エラー時もテストデータを表示
                setSent(testSentData);
                setReceived(testReceivedData);
                setHold(testHoldData);
                setLoading(false);
            }
        };

        fetchData();
    }, [getAccessToken]);

    // アクティブチーム変更イベントを監視
    useEffect(() => {
        const unsubscribe = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async (data) => {
            console.log('🔄 合コン会議画面: アクティブチーム変更イベントを受信:', data);
            // アクティブチームを更新
            await refreshActiveTeam();
        });

        return () => {
            unsubscribe();
        };
    }, [teamData, refreshActiveTeam]);

    // フォーカス機能
    useEffect(() => {
        if (!focusId) return;
        const el = document.getElementById(`card-${focusId}`);
        if (!el) return;

        // スクロールコンテナを特定
        const container = document.querySelector<HTMLDivElement>("#conference-list") ||
            document.querySelector<HTMLDivElement>(".min-h-screen") ||
            document.scrollingElement as any;

        // 要素を中央にスクロール
        const rect = el.getBoundingClientRect();
        const cRect = (container as HTMLElement).getBoundingClientRect?.() ?? { top: 0, height: window.innerHeight };
        const currentTop = (container as HTMLElement).scrollTop ?? window.scrollY;

        const elCenter = rect.top + currentTop + rect.height / 2;
        const targetTop = elCenter - (cRect.height / 2);

        (container as HTMLElement).scrollTo({ top: targetTop, behavior: "smooth" });

        // 一時的なハイライト
        el.classList.add("ring-4", "ring-amber-300", "shadow-[0_0_0_8px_rgba(251,191,36,0.25)]");
        const t = setTimeout(() => {
            el.classList.remove("ring-4", "ring-amber-300", "shadow-[0_0_0_8px_rgba(251,191,36,0.25)]");
        }, 1800);
        return () => clearTimeout(t);
    }, [focusId]);

    // 本人確認状況を取得
    useEffect(() => {
        const fetchVerificationStatus = async () => {
            try {
                const accessToken = getAccessToken();
                if (!accessToken) return;

                const response = await fetch('/api/teams/verification-status', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setVerificationStatus({
                        allVerified: data.allVerified,
                        unverifiedMembers: data.unverifiedMembers.map((m: any) => m.username),
                        totalMembers: data.totalMembers,
                        verifiedMembers: data.verifiedMembers
                    });
                }
            } catch (error) {
                console.error('本人確認状況取得エラー:', error);
            }
        };

        fetchVerificationStatus();
    }, [getAccessToken]);

    // 投票状態を更新する関数
    const updateVoteState = (itemId: string, memberId: string, voteStatus: VoteStatus) => {
        setVoteStates((prev: { [key: string]: { [memberId: string]: VoteStatus } }) => {
            const newStates = {
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    [memberId]: voteStatus
                }
            };

            // 全員の投票状況をチェック
            const itemVotes = newStates[itemId];
            if (false) {
                const allLiked = Object.values(itemVotes).every((vote: VoteStatus) => vote === 'YES');
                const allRejected = Object.values(itemVotes).every((vote: VoteStatus) => vote === 'NO');

                if (allLiked || allRejected) {
                    // 現在のタブのデータから該当アイテムを取得
                    let targetItem;
                    if (activeTab === 'sent') {
                        targetItem = sent.find((item: MeetingItem) => item.id === itemId);
                    } else if (activeTab === 'received') {
                        targetItem = received.find((item: MeetingItem) => item.id === itemId);
                    } else if (activeTab === 'hold') {
                        targetItem = hold.find((item: MeetingItem) => item.id === itemId);
                    }

                    if (targetItem) {
                        // 受け取ったお誘いページで全員が「あり」にした場合は特別なメッセージ
                        const bannerMessage = activeTab === 'received' && allLiked
                            ? '全員がOKしました！'
                            : allLiked ? '全員がいいねしました！' : '全員がブッチしました！';

                        setShowBanner({
                            itemId,
                            teamName: targetItem.teamName,
                            description: targetItem.description,
                            image: targetItem.image,
                            voteType: allLiked ? 'like' : 'reject',
                            message: bannerMessage
                        });
                    }
                }
            }

            return newStates;
        });
        // サーバー集計で全員一致判定（グループ人数*いいね数）
        (async () => {
            try {
                const accessToken = getAccessToken();
                await fetch('/api/meeting/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                    },
                    body: JSON.stringify({ itemId, vote: voteStatus })
                });
                const res = await fetch(`/api/meeting/vote?itemId=${itemId}`);
                if (res.ok) {
                    const data = await res.json();
                    const counts = data?.counts;
                    const total = verificationStatus?.totalMembers;
                    if (counts && typeof total === 'number' && total > 0) {
                        if (counts.likes === total || counts.rejects === total) {
                            const voteType: VoteType = counts.likes === total ? 'like' : 'reject';
                            const targetItem = [...sent, ...received, ...hold].find(i => i.id === itemId);
                            if (targetItem) {
                                setShowBanner({
                                    itemId,
                                    teamName: targetItem.teamName,
                                    description: targetItem.description,
                                    image: targetItem.image,
                                    voteType,
                                    message: voteType === 'like' ? (activeTab === 'received' ? '全員がOKしました！' : '全員が「あり」にしました！') : (activeTab === 'received' ? '全員が「なし」にしました！' : '全員がブッチしました！')
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('vote aggregation check failed', e);
            }
        })();
    };

    // 一括いいねの選択モード開始
    const startBulkLike = () => {
        setIsSelectionMode(true);
        setSelectionModeType('like');
        setSelectedItems([]);
    };

    // 一括ブッチの選択モード開始
    const startBulkReject = () => {
        setIsSelectionMode(true);
        setSelectionModeType('reject');
        setSelectedItems([]);
    };

    // 選択のキャンセル
    const cancelSelection = () => {
        setIsSelectionMode(false);
        setSelectionModeType(null);
        setSelectedItems([]);
    };

    // アイテムの選択/選択解除
    const toggleItemSelection = (itemId: string) => {
        if (!isSelectionMode) return;

        setSelectedItems((prev: string[]) =>
            prev.includes(itemId)
                ? prev.filter((id: string) => id !== itemId)
                : [...prev, itemId]
        );
    };

    // 一括いいね
    const handleBulkLike = async () => {
        if (selectedItems.length === 0) return;

        try {
            const accessToken = getAccessToken();

            for (const itemId of selectedItems) {
                let response;

                if (activeTab === 'received') {
                    // 受信したお誘いの場合は承認APIを使用
                    response = await fetch('/api/meeting/received', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            proposalId: itemId,
                            action: 'accept'
                        }),
                    });

                    // マッチング成立時にローカルストレージに保存
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.matchData) {
                            // 既存のマッチデータを取得
                            const existingMatches = JSON.parse(localStorage.getItem('confirmedMatches') || '[]');
                            // 新しいマッチデータを追加
                            const updatedMatches = [...existingMatches, result.matchData];
                            // ローカルストレージに保存
                            localStorage.setItem('confirmedMatches', JSON.stringify(updatedMatches));
                            console.log('✅ マッチング成立データをローカルストレージに保存:', result.matchData);
                        }
                    }
                } else {
                    // 送信した提案または保留リストの場合はスワイプAPIを使用
                    response = await fetch('/api/match/swipe', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            teamId: itemId,
                            action: 'like'
                        }),
                    });
                }

                if (response.ok) {
                    console.log('✅ 一括いいね送信成功:', itemId);
                } else {
                    console.error('❌ 一括いいね送信エラー:', itemId);
                }
            }

            const actionText = activeTab === 'received' ? '承認' : 'いいね';
            alert(`${selectedItems.length}件の${actionText}を送信しました！🎉`);

            // 選択モードを終了
            setIsSelectionMode(false);
            setSelectionModeType(null);
            setSelectedItems([]);

            // データを再取得
            await refreshData();
        } catch (error) {
            console.error('❌ 一括いいねエラー:', error);
            alert('一括いいねの処理に失敗しました');
        }
    };

    // 一括ブッチ
    const handleBulkReject = async () => {
        if (selectedItems.length === 0) return;

        try {
            const accessToken = getAccessToken();

            for (const itemId of selectedItems) {
                let response;

                if (activeTab === 'received') {
                    // 受信したお誘いの場合は拒否APIを使用
                    response = await fetch('/api/meeting/received', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            proposalId: itemId,
                            action: 'reject'
                        }),
                    });
                } else {
                    // 送信した提案または保留リストの場合はスワイイプAPIを使用
                    response = await fetch('/api/match/swipe', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            teamId: itemId,
                            action: 'pass'
                        }),
                    });
                }

                if (response.ok) {
                    console.log('✅ 一括ブッチ送信成功:', itemId);
                } else {
                    console.error('❌ 一括ブッチ送信エラー:', itemId);
                }
            }

            const actionText = activeTab === 'received' ? '拒否' : 'ブッチ';
            alert(`${selectedItems.length}件を一括で${actionText}しました`);

            // 選択モードを終了
            setIsSelectionMode(false);
            setSelectionModeType(null);
            setSelectedItems([]);

            // データを再取得
            await refreshData();
        } catch (error) {
            console.error('❌ 一括ブッチエラー:', error);
            alert('一括ブッチの処理に失敗しました');
        }
    };

    // バナーアクション実行関数
    const handleBannerAction = (itemId: string, voteType: VoteType) => {
        if (activeTab === 'received') {
            // 受信したお誘いの場合
            if (voteType === 'like') {
                handleAcceptProposal(itemId);
            } else {
                handleRejectProposal(itemId);
            }
        } else {
            // 送信した提案または保留リストの場合
            if (voteType === 'like') {
                handleSendLike(itemId);
            } else {
                handleReject(itemId);
            }
        }
    };

    // いいねを送信する関数
    const handleSendLike = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();

            // アイテムからチームIDを取得
            let targetTeamId = itemId;

            // 送信した提案または保留リストからチームIDを取得
            const currentItems = activeTab === 'sent' ? sent : activeTab === 'hold' ? hold : received;
            const targetItem = currentItems.find(item => item.id === itemId);

            if (targetItem && targetItem.teamId) {
                targetTeamId = targetItem.teamId;
            }

            console.log('いいね送信:', { itemId, targetTeamId, activeTab });

            const response = await fetch('/api/match/swipe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: targetTeamId,
                    action: 'like'
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ いいねを送信しました:', itemId, result);
                alert('いいねを送信しました！🎉');

                // バナーを閉じる
                setShowBanner(null);

                // データを再取得
                await refreshData();
            } else {
                const errorData = await response.json();
                console.error('❌ いいね送信エラー:', errorData);

                if (errorData.error === '本人確認が完了していないメンバーがいます') {
                    alert('チームメンバー全員の本人確認が完了するまで、いいねを送信できません。');
                } else {
                    alert('いいねの送信に失敗しました');
                }
            }
        } catch (error) {
            console.error('❌ いいね送信エラー:', error);
            alert('いいねの送信に失敗しました');
        }
    };

    // 受信したお誘いを承認する関数
    const handleAcceptProposal = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();

            console.log('お誘い承認リクエスト送信:', { itemId, action: 'accept' });

            // デバッグ用: 提案の詳細をチェック
            try {
                const debugResponse = await fetch(`/api/debug/check-proposal?proposalId=${itemId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    console.log('デバッグ情報:', debugData);
                }
            } catch (debugError) {
                console.log('デバッグチェック失敗:', debugError);
            }

            const response = await fetch('/api/meeting/received', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proposalId: itemId,
                    action: 'accept'
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ お誘いを承認しました:', itemId, result);
                alert('お誘いを承認しました！🎉');

                // バナーを閉じる
                setShowBanner(null);

                // データを再取得
                await refreshData();

                // マッチ成立データが返ってきた場合はローカル保存してマッチ一覧へフォーカスジャンプ
                if (result.success && result.matchData) {
                    const existingMatches = JSON.parse(localStorage.getItem('confirmedMatches') || '[]');
                    const updatedMatches = [...existingMatches, result.matchData].reduce((acc: any[], item: any) => {
                        if (!acc.find((x) => x.id === item.id)) acc.push(item)
                        return acc
                    }, [])
                    localStorage.setItem('confirmedMatches', JSON.stringify(updatedMatches));
                    // マッチ一覧に遷移して、対象カードをハイライト
                    router.push(`/matches?focus=${encodeURIComponent(result.matchData.id)}`)
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
                console.error('❌ お誘い承認エラー:', response.status, errorData);

                let errorMessage = 'お誘いの承認に失敗しました';
                if (response.status === 404) {
                    errorMessage = 'お誘いが見つかりません。既に処理済みの可能性があります。';
                } else if (response.status === 400) {
                    errorMessage = '無効なリクエストです。';
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }

                alert(errorMessage);
            }
        } catch (error) {
            console.error('❌ お誘い承認エラー:', error);
            alert('ネットワークエラーが発生しました。インターネット接続を確認してください。');
        }
    };

    // 受信したお誘いを拒否する関数
    const handleRejectProposal = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();

            console.log('お誘い拒否リクエスト送信:', { itemId, action: 'reject' });

            // デバッグ用: 提案の詳細をチェック
            try {
                const debugResponse = await fetch(`/api/debug/check-proposal?proposalId=${itemId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    console.log('デバッグ情報:', debugData);
                }
            } catch (debugError) {
                console.log('デバッグチェック失敗:', debugError);
            }

            const response = await fetch('/api/meeting/received', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proposalId: itemId,
                    action: 'reject'
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ お誘いを拒否しました:', itemId, result);
                alert('お誘いを拒否しました');

                // バナーを閉じる
                setShowBanner(null);

                // データを再取得
                await refreshData();
            } else {
                const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
                console.error('❌ お誘い拒否エラー:', response.status, errorData);

                let errorMessage = 'お誘いの拒否に失敗しました';
                if (response.status === 404) {
                    errorMessage = 'お誘いが見つかりません。既に処理済みの可能性があります。';
                } else if (response.status === 400) {
                    errorMessage = '無効なリクエストです。';
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }

                alert(errorMessage);
            }
        } catch (error) {
            console.error('❌ お誘い拒否エラー:', error);
            alert('ネットワークエラーが発生しました。インターネット接続を確認してください。');
        }
    };

    // ブッチ（削除）する関数
    const handleReject = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();

            const response = await fetch('/api/match/swipe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: itemId,
                    action: 'pass'
                }),
            });

            if (response.ok) {
                console.log('✅ ブッチしました:', itemId);
                alert('ブッチしました！');

                // バナーを閉じる
                setShowBanner(null);

                // データを再取得
                await refreshData();
            } else {
                console.error('❌ ブッチエラー');
                alert('ブッチに失敗しました');
            }
        } catch (error) {
            console.error('❌ ブッチエラー:', error);
            alert('ブッチに失敗しました');
        }
    };

    // データを再取得する関数
    const refreshData = async () => {
        try {
            const accessToken = getAccessToken();

            // 送信した提案を取得
            const sentResponse = await fetch('/api/meeting/sent', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (sentResponse.ok) {
                const sentData = await sentResponse.json();
                setSent(sentData);
                updateCountsForItems(sentData);
            }

            // 受信した提案を取得
            const receivedResponse = await fetch('/api/meeting/received', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (receivedResponse.ok) {
                const receivedData = await receivedResponse.json();
                setReceived(receivedData);
                updateCountsForItems(receivedData);
            }

            // 保留リストを取得
            const holdResponse = await fetch('/api/meeting/hold', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (holdResponse.ok) {
                const holdData = await holdResponse.json();
                setHold(holdData);
                updateCountsForItems(holdData);
            }
        } catch (error) {
            console.error('データ再取得エラー:', error);
        }
    };

    // バナーを閉じる関数
    const handleCloseBanner = () => {
        setShowBanner(null);
    };

    // 保留リストから「あり」にする関数
    const handleHoldToLike = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();
            const response = await fetch('/api/match/swipe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: itemId,
                    action: 'like'
                }),
            });

            if (response.ok) {
                console.log('✅ 保留リストから「あり」にしました:', itemId);
                alert('保留リストから「あり」にしました！');
                // バナーを閉じる
                setShowBanner(null);
                // データを再取得
                await refreshData();
            } else {
                console.error('❌ 保留リストから「あり」にするエラー:', itemId);
                alert('保留リストから「あり」にするのに失敗しました');
            }
        } catch (error) {
            console.error('❌ 保留リストから「あり」にするエラー:', error);
            alert('保留リストから「あり」にするのに失敗しました');
        }
    };

    // 保留リストから「なし」にする関数
    const handleHoldToReject = async (itemId: string) => {
        try {
            const accessToken = getAccessToken();
            const response = await fetch('/api/match/swipe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: itemId,
                    action: 'pass'
                }),
            });

            if (response.ok) {
                console.log('✅ 保留リストから「なし」にしました:', itemId);
                alert('保留リストから「なし」にしました！');
                // バナーを閉じる
                setShowBanner(null);
                // データを再取得
                await refreshData();
            } else {
                console.error('❌ 保留リストから「なし」にするエラー:', itemId);
                alert('保留リストから「なし」にするのに失敗しました');
            }
        } catch (error) {
            console.error('❌ 保留リストから「なし」にするエラー:', error);
            alert('保留リストから「なし」にするのに失敗しました');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        )
    }

    const currentData = activeTab === 'sent' ? sent : activeTab === 'received' ? received : hold;

    return (
        <div className="min-h-screen bg-white relative">
            {/* ヘッダー部分 */}
            <div className="bg-white border-b border-gray-100 relative z-10">
                <div className="px-4 pt-6 pb-4">
                    <div className="relative flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="absolute left-0 text-gray-700 hover:text-gray-900 p-2 z-10"
                        >
                            ←
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 w-full text-center">合コン会議</h1>
                    </div>
                </div>
            </div>

            {/* タブナビゲーション */}
            <div className="bg-white border-b border-gray-100 relative z-10">
                <div className="px-4">
                    <div className="flex space-x-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as TabType)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.key
                                    ? "border-black text-black"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 本人確認未完了警告 */}
            {verificationStatus && !verificationStatus.allVerified && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 relative z-10">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                本人確認が完了していないメンバーがいます
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    未確認メンバー: {verificationStatus.unverifiedMembers.join('、')}
                                </p>
                                <p className="mt-1">
                                    チームメンバー全員の本人確認が完了するまで、いいねを送信できません。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* メインコンテンツ */}
            <div className="px-4 py-6 pb-20 relative z-10" id="conference-list">
                <AnimatePresence mode="wait">
                    {activeTab === "sent" && (
                        <div
                            key="sent"
                            className="space-y-4"
                        >
                            {sent.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">💌</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">まだ提案がありません</h3>
                                    <p className="text-gray-500">スワイプ画面で「あり」を押すと、ここに表示されます</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sent.map((item: MeetingItem) => (
                                        <div
                                            key={item.id}
                                            className="relative flex items-center p-4 bg白 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer shadow-sm border"
                                            onClick={() => toggleItemSelection(item.id)}
                                            id={`card-${item.id}`}
                                        >
                                            {/* 選択モード時のチェックボックス */}
                                            {isSelectionMode && (
                                                <div className="absolute top-2 left-2 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                        className="w-5 h-5 appearance-none bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 checked:bg-black checked:border-black custom-checkbox"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                            <div className="w-12 h-12 bg-gray-200 flex-shrink-0 mr-4">
                                                <img
                                                    src={item.image}
                                                    alt={item.teamName}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800 mb-1">{item.teamName}</div>
                                                <div className="text-sm text-gray-600">{item.description}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* 画像トグル群 */}
                                                <div className="flex items-end justify-center gap-2">
                                                    {members.map((member) => (
                                                        <div key={member.id} className="flex flex-col items-center">
                                                            <span
                                                                className="text-xs font-medium mb-1 text-center max-w-16 truncate"
                                                                style={{ color: '#3E2F2A' }}
                                                            >
                                                                {member.name}
                                                            </span>
                                                            <div className="inline-flex items-center gap-2">
                                                                <TriStateVoteImage
                                                                    size={48}
                                                                    ariaLabelBase={`${member.name}の判定`}
                                                                    persistKey={`vote:${activeTab}:${item.id}:${member.id}`}
                                                                    onChange={(v: VoteStatus) => {
                                                                        console.log(`${member.name}の投票: ${v}`);
                                                                        updateVoteState(item.id, member.id, v);
                                                                        // サーバー集計へ送信して全員一致判定はAPIで行う
                                                                        (async () => { try { await fetch('/api/meeting/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: item.id, vote: v }) }) } catch { } })();
                                                                    }}
                                                                />
                                                                <span className="text-xs text-gray-700 whitespace-nowrap">
                                                                    {(likeCounts[item.id] ?? 0)}/{typeof verificationStatus?.totalMembers === 'number' ? verificationStatus!.totalMembers : '-'}
                                                                    {typeof verificationStatus?.totalMembers === 'number' && verificationStatus!.totalMembers > 0 ? ` (${Math.round(((likeCounts[item.id] ?? 0) / verificationStatus!.totalMembers) * 100)}%)` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "received" && (
                        <div
                            key="received"
                            className="space-y-4"
                        >
                            {received.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">🎯</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">まだお誘いがありません</h3>
                                    <p className="text-gray-500">他のグループからお誘いがあると、ここに表示されます</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {received.map((item: MeetingItem) => (
                                        <div
                                            key={item.id}
                                            className="relative flex items-center p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer shadow-sm border"
                                            onClick={() => toggleItemSelection(item.id)}
                                            id={`card-${item.id}`}
                                        >
                                            {/* 選択モード時のチェックボックス */}
                                            {isSelectionMode && (
                                                <div className="absolute top-2 left-2 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                        className="w-5 h-5 appearance-none bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 checked:bg-black checked:border-black custom-checkbox"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                            <div className="w-12 h-12 bg-gray-200 flex-shrink-0 mr-4">
                                                <img
                                                    src={item.image}
                                                    alt={item.teamName}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800 mb-1">{item.teamName}</div>
                                                <div className="text-sm text-gray-600">{item.description}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* 画像トグル群 */}
                                                <div className="flex items-end justify-center gap-2">
                                                    {members.map((member) => (
                                                        <div key={member.id} className="flex flex-col items-center">
                                                            <span
                                                                className="text-xs font-medium mb-1 text-center max-w-16 truncate"
                                                                style={{ color: '#3E2F2A' }}
                                                            >
                                                                {member.name}
                                                            </span>
                                                            <div className="inline-flex items-center gap-2">
                                                                <TriStateVoteImage
                                                                    size={48}
                                                                    ariaLabelBase={`${member.name}の判定`}
                                                                    persistKey={`vote:${activeTab}:${item.id}:${member.id}`}
                                                                    onChange={(v: VoteStatus) => {
                                                                        console.log(`${member.name}の投票: ${v}`);
                                                                        updateVoteState(item.id, member.id, v);
                                                                    }}
                                                                />
                                                                <span className="text-xs text-gray-700 whitespace-nowrap">
                                                                    {(likeCounts[item.id] ?? 0)}/{typeof verificationStatus?.totalMembers === 'number' ? verificationStatus!.totalMembers : '-'}
                                                                    {typeof verificationStatus?.totalMembers === 'number' && verificationStatus!.totalMembers > 0 ? ` (${Math.round(((likeCounts[item.id] ?? 0) / verificationStatus!.totalMembers) * 100)}%)` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "hold" && (
                        <div
                            key="hold"
                            className="space-y-4"
                        >
                            {hold.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">⏰</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">保留中の提案がありません</h3>
                                    <p className="text-gray-500">スワイプ画面で「一回考える」を押すと、ここに表示されます</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {hold.map((item: MeetingItem) => (
                                        <div
                                            key={item.id}
                                            className="relative flex items-center p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer shadow-sm border"
                                            onClick={() => toggleItemSelection(item.id)}
                                        >
                                            {/* 選択モード時のチェックボックス */}
                                            {isSelectionMode && (
                                                <div className="absolute top-2 left-2 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                        className="w-5 h-5 appearance-none bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 checked:bg-black checked:border-black custom-checkbox"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                            <div className="w-12 h-12 bg-gray-200 flex-shrink-0 mr-4">
                                                <img
                                                    src={item.image}
                                                    alt={item.teamName}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800 mb-1">{item.teamName}</div>
                                                <div className="text-sm text-gray-600">{item.description}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* あり・なしボタン（保留リスト専用） */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleHoldToLike(item.id);
                                                        }}
                                                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-gray-800 transition-colors"
                                                    >
                                                        あり
                                                    </button>
                                                    <span className="text-xs text-gray-700">
                                                        {(likeCounts[item.id] ?? 0)}/{typeof verificationStatus?.totalMembers === 'number' ? verificationStatus!.totalMembers : '-'}
                                                        {typeof verificationStatus?.totalMembers === 'number' && verificationStatus!.totalMembers > 0 ?
                                                            ` (${Math.round(((likeCounts[item.id] ?? 0) / verificationStatus!.totalMembers) * 100)}%)` : ''}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleHoldToReject(item.id);
                                                        }}
                                                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justifyセンター font-bold text-sm hover:bg-gray-800 transition-colors"
                                                    >
                                                        なし
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* 一括操作ボタン */}
            <BulkActionButtons
                isSelectionMode={isSelectionMode}
                selectedItems={selectedItems}
                selectionModeType={selectionModeType}
                onStartBulkLike={startBulkLike}
                onStartBulkReject={startBulkReject}
                onBulkLike={handleBulkLike}
                onBulkReject={handleBulkReject}
                onCancelSelection={cancelSelection}
                activeTab={activeTab}
            />

            {/* 全員投票バナー */}
            <AnimatePresence>
                {showBanner && (
                    <AllVotedBanner
                        teamName={showBanner.teamName}
                        description={showBanner.description}
                        image={showBanner.image}
                        voteType={showBanner.voteType}
                        message={showBanner.message}
                        onAction={() => handleBannerAction(showBanner.itemId, showBanner.voteType)}
                        onClose={handleCloseBanner}
                        activeTab={activeTab}
                    />
                )}
            </AnimatePresence>

            <FooterNav activeTab="meeting" />

        </div>
    )
}


