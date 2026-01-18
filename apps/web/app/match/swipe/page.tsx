'use client'

import { AnimatePresence, motion as motionAny } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ExpandableText from '../../../components/ExpandableText'
import FooterNav from '../../../components/FooterNav'
import Icon from '../../../components/Icon'
import ImageSlider from '../../../components/ImageSlider'
import { useActiveTeam } from '../../../contexts/ActiveTeamContext'
import { useAuth } from '../../../contexts/AuthContext'
import { TEAM_EVENTS, teamEventBus } from '@/utils/team-event-bus'
const MotionDiv: any = (motionAny as any).div

interface Team {
  id: string;
  teamName: string;
  description: string;
  gender?: number;
  target_gender?: number[];
  max_members?: number;
  member_count?: number;
  approved_photos?: string;
  photos?: string[];
  members?: Array<{
    id: string;
    username: string;
    gender: number;
  }>;
  hobbies?: string[];
}

export default function SwipePage() {
  const router = useRouter()
  const { getAccessToken, isAuthenticated, user } = useAuth()
  const { activeTeam, refreshActiveTeam } = useActiveTeam()
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [candidates, setCandidates] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 本人確認状況管理
  const [verificationStatus, setVerificationStatus] = useState<{
    allVerified: boolean;
    unverifiedMembers: string[];
    totalMembers: number;
    verifiedMembers: number;
  } | null>(null)

  // リアルタイム更新のための状態
  const [judgementStats, setJudgementStats] = useState({
    totalJudgements: 0,
    likeCount: 0,
    skipCount: 0,
    pendingCount: 0
  });

  // 候補チームを取得
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true)
        setError(null)

        // 認証チェック
        if (!isAuthenticated) {
          console.error('❌ ユーザーが認証されていません')
          setError('ログインが必要です')
          setLoading(false)
          return
        }

        // 認証付きAPIを使用
        const accessToken = getAccessToken()
        if (!accessToken) {
          console.error('❌ アクセストークンが取得できません')
          setError('認証トークンが無効です。再度ログインしてください。')
          setLoading(false)
          return
        }

        console.log('🔍 実際のチームデータを取得中...')

        // 実際のスワイプ候補APIを呼び出し
        const response = await fetch('/api/match/swipe', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ 実際のチームデータ取得成功:', data)

          if (Array.isArray(data) && data.length > 0) {
            // テストデータかどうかをチェック
            const isTestData = data.some(team => team.id.startsWith('test-'));
            if (isTestData) {
              console.log('📝 テストデータが返されました');
            }
            setCandidates(data)
          } else {
            console.log('📝 候補チームが見つからないため、テストデータを表示')
            // 候補が見つからない場合はテストデータを表示
            const testCandidates: Team[] = [
              {
                id: 'test-team-1',
                teamName: 'マッドハンターのお茶会',
                description: '不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！アリスと一緒に冒険の旅に出かけましょう。お茶会では、様々なテーマで楽しい会話を展開し、新しい友達を作ることができます。毎週末に開催されるお茶会では、季節に合わせたお菓子とお茶を楽しみながら、参加者同士が交流を深めています。',
                gender: 1,
                target_gender: [2],
                max_members: 4,
                member_count: 2,
                approved_photos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                photos: [
                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
                ],
                members: [
                  { id: 'member-1', username: 'アリス', gender: 2 },
                  { id: 'member-2', username: 'マッドハッター', gender: 1 }
                ],
                hobbies: ['お茶', 'お菓子作り', '読書', 'アート']
              },
              {
                id: 'test-team-2',
                teamName: 'チェシャ猫の冒険',
                description: '不思議の国の冒険者たちが集まるチームです。新しい発見と楽しい体験を共有しましょう！チェシャ猫のように自由気ままに、でも仲間思いなメンバーが集まっています。',
                gender: 2,
                target_gender: [1],
                max_members: 3,
                member_count: 1,
                approved_photos: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                photos: [
                  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
                ],
                members: [
                  { id: 'member-3', username: 'チェシャ猫', gender: 1 }
                ],
                hobbies: ['冒険', '写真', '旅行', '料理']
              }
            ]
            setCandidates(testCandidates)
          }
        } else {
          console.error('❌ チームデータ取得失敗:', response.status)
          const errorData = await response.json().catch(() => ({}))
          console.error('エラー詳細:', errorData)

          // エラーの場合もテストデータを表示
          const fallbackCandidates: Team[] = [
            {
              id: 'test-team-1',
              teamName: 'マッドハッターのお茶会',
              description: '不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！アリスと一緒に冒険の旅に出かけましょう。お茶会では、様々なテーマで楽しい会話を展開し、新しい友達を作ることができます。毎週末に開催されるお茶会では、季節に合わせたお菓子とお茶を楽しみながら、参加者同士が交流を深めています。',
              gender: 1,
              target_gender: [2],
              max_members: 4,
              member_count: 2,
              approved_photos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
              photos: [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
              ],
              members: [
                { id: 'member-1', username: 'アリス', gender: 2 },
                { id: 'member-2', username: 'マッドハッター', gender: 1 }
              ],
              hobbies: ['お茶', 'お菓子作り', '読書', 'アート']
            }
          ]
          setCandidates(fallbackCandidates)
        }
      } catch (error) {
        console.error('❌ チームデータ取得エラー:', error)
        setError('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [getAccessToken, isAuthenticated, activeTeam])

  // アクティブチーム変更イベントを監視
  useEffect(() => {
    const unsubscribe = teamEventBus.subscribe(TEAM_EVENTS.ACTIVE_TEAM_CHANGED, async (data) => {
      console.log('🔄 スワイプ画面: アクティブチーム変更イベントを受信:', data);
      // アクティブチームを更新
      await refreshActiveTeam();
      // 候補チームを再取得
      setLoading(true);
      const fetchCandidates = async () => {
        try {
          setError(null);

          // 認証付きAPIを使用
          const accessToken = getAccessToken();
          if (!accessToken) {
            console.error('❌ アクセストークンが取得できません');
            setError('認証トークンが無効です。再度ログインしてください。');
            setLoading(false);
            return;
          }

          console.log('🔍 アクティブチーム変更後のチームデータを取得中...');

          // 実際のスワイプ候補APIを呼び出し
          const response = await fetch('/api/match/swipe', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ アクティブチーム変更後のチームデータ取得成功:', data);

            if (Array.isArray(data) && data.length > 0) {
              setCandidates(data);
            } else {
              console.log('📝 候補チームが見つからないため、テストデータを表示');
              // 候補が見つからない場合はテストデータを表示
              const testCandidates: Team[] = [
                {
                  id: 'test-team-1',
                  teamName: 'マッドハッターのお茶会',
                  description: '不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！アリスと一緒に冒険の旅に出かけましょう。お茶会では、様々なテーマで楽しい会話を展開し、新しい友達を作ることができます。毎週末に開催されるお茶会では、季節に合わせたお菓子とお茶を楽しみながら、参加者同士が交流を深めています。',
                  gender: 1,
                  target_gender: [2],
                  max_members: 4,
                  member_count: 2,
                  approved_photos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                  photos: [
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
                  ],
                  members: [
                    { id: 'member-1', username: 'アリス', gender: 2 },
                    { id: 'member-2', username: 'マッドハッター', gender: 1 }
                  ],
                  hobbies: ['お茶', 'お菓子作り', '読書', 'アート']
                }
              ];
              setCandidates(testCandidates);
            }
          } else {
            console.error('❌ アクティブチーム変更後のチームデータ取得失敗:', response.status);
            // エラーの場合もテストデータを表示
            const fallbackCandidates: Team[] = [
              {
                id: 'test-team-1',
                teamName: 'マッドハッターのお茶会',
                description: '不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！アリスと一緒に冒険の旅に出かけましょう。お茶会では、様々なテーマで楽しい会話を展開し、新しい友達を作ることができます。毎週末に開催されるお茶会では、季節に合わせたお菓子とお茶を楽しみながら、参加者同士が交流を深めています。',
                gender: 1,
                target_gender: [2],
                max_members: 4,
                member_count: 2,
                approved_photos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                photos: [
                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
                ],
                members: [
                  { id: 'member-1', username: 'アリス', gender: 2 },
                  { id: 'member-2', username: 'マッドハッター', gender: 1 }
                ],
                hobbies: ['お茶', 'お菓子作り', '読書', 'アート']
              }
            ];
            setCandidates(fallbackCandidates);
          }
        } catch (error) {
          console.error('❌ アクティブチーム変更後のチームデータ取得エラー:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCandidates();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshActiveTeam]);

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

  // リアルタイム更新のためのポーリング
  useEffect(() => {
    if (candidates.length === 0 || currentTeamIndex >= candidates.length || !user) return;

    const currentTeam = candidates[currentTeamIndex];
    if (!currentTeam) return;

    const pollJudgementStats = async () => {
      try {
        const response = await fetch(`/api/matching/judgements?targetGroupId=${currentTeam.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.statistics) {
            setJudgementStats({
              totalJudgements: data.statistics.total || 0,
              likeCount: data.statistics.likes || 0,
              skipCount: data.statistics.skips || 0,
              pendingCount: data.statistics.pending || 0
            });
          }
        }
      } catch (error) {
        console.error('判定統計の取得に失敗:', error);
      }
    };

    // 初回取得
    pollJudgementStats();

    // 5秒ごとに更新
    const interval = setInterval(pollJudgementStats, 5000);

    return () => clearInterval(interval);
  }, [candidates, currentTeamIndex, user]);

  // スワイプ処理
  const handleSwipe = async (action: 'like' | 'pass' | 'hold') => {
    if (candidates.length === 0) return

    const currentTeam = candidates[currentTeamIndex]

    // テストデータの場合はAPIを呼び出さずにローカルで処理
    if (currentTeam.id.startsWith('test-')) {
      console.log(`🔍 テストデータの${action}アクション:`, currentTeam.id)

      // ローカルストレージに保存
      const swipeHistory = JSON.parse(localStorage.getItem('swipeHistory') || '[]')
      swipeHistory.push({
        teamId: currentTeam.id,
        teamName: currentTeam.teamName,
        description: currentTeam.description,
        member_count: currentTeam.member_count,
        photo: currentTeam.photos && currentTeam.photos.length > 0 ? currentTeam.photos[0] : currentTeam.approved_photos,
        action: action,
        timestamp: new Date().toISOString(),
        isTestData: true
      })
      localStorage.setItem('swipeHistory', JSON.stringify(swipeHistory))
      console.log('テストデータのスワイプ履歴を保存しました:', swipeHistory)

      // 次のチームに進む
      setCurrentTeamIndex(prev => prev + 1)
      return
    }

    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        console.error('❌ スワイプ処理でアクセストークンが取得できません')
        return
      }

      console.log(`🔍 ${action}アクションを送信中:`, currentTeam.id)

      const response = await fetch('/api/match/swipe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: currentTeam.id,
          action: action
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${action}アクション送信成功:`, currentTeam.id, result)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ ${action}アクション送信失敗:`, response.status, errorData)

        // 本人確認未完了のエラーの場合（いいねの場合のみ）
        if (action === 'like' && response.status === 403 && errorData.error === '本人確認が完了していないメンバーがいます') {
          const unverifiedMembers = errorData.details?.unverifiedMembers || [];
          const memberList = unverifiedMembers.join('、');
          alert(`本人確認が完了していないメンバーがいます：${memberList}\n\nチームメンバー全員の本人確認が完了するまで、いいねを送信できません。`);
        }

        // チームが見つからないエラーの場合
        if (response.status === 404 && errorData.error === '指定されたチームが見つかりません') {
          console.warn('テストデータまたは存在しないチームです:', currentTeam.id);
        }
      }
    } catch (error) {
      console.error(`❌ ${action}アクション送信エラー:`, error)
    }

    // 次のチームに進む
    setCurrentTeamIndex(prev => prev + 1)
  }

  // 再試行処理
  const handleRetry = () => {
    setCurrentTeamIndex(0)
    setError(null)
    setLoading(true)
    // ページをリロードして候補を再取得
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">候補を探しています...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-red-500 mb-4">
              <Icon name="alert" className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">エラーが発生しました</p>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-amber-300 text-white px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/me')}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                プロフィールに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-gray-500 mb-4">
              <Icon name="info" className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">候補が見つかりません</p>
            </div>
            <p className="text-gray-600 mb-6">現在、スワイプできる候補のチームがありません。しばらく時間をおいてから再度お試しください。</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-amber-300 text-white px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
              >
                更新
              </button>
              <button
                onClick={() => router.push('/teams')}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                チーム一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentTeamIndex >= candidates.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-green-500 mb-4">
              <Icon name="check" className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">全ての候補を確認しました</p>
            </div>
            <p className="text-gray-600 mb-6">現在表示可能な候補を全て確認しました。新しい候補が追加されるまでお待ちください。</p>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentTeamIndex(0)}
                className="w-full bg-amber-300 text-white px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
              >
                最初から
              </button>
              <button
                onClick={() => router.push('/teams')}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                チーム一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentTeam = candidates[currentTeamIndex]

  return (
    <div className="min-h-screen bg-white">
      {/* 本人確認未完了警告 */}
      {verificationStatus && !verificationStatus.allVerified && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4">
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

      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Wonderland</h1>
          <button
            onClick={() => router.push('/me')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icon name="settings" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 py-8">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={currentTeamIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm mx-auto"
          >
            {/* プロフィールカード */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              {/* チーム写真 */}
              <div className="flex justify-center mb-6">
                <ImageSlider
                  images={currentTeam.photos || []}
                  alt={`${currentTeam.teamName}の写真`}
                  className="w-full"
                />
              </div>

              {/* プロフィール情報 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentTeam.teamName}</h2>

                {/* グループタイプとメンバー数 */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-sm text-gray-600">
                    {currentTeam.member_count || 1}人
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {currentTeam.gender === 0 ? '女性グループ' :
                      currentTeam.gender === 1 ? '男女混合グループ' :
                        currentTeam.gender === 2 ? '男性グループ' : 'その他'}
                  </span>
                </div>

                {/* チームメンバー名 */}
                {currentTeam.members && currentTeam.members.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">メンバー</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentTeam.members.map((member, index) => (
                        <span
                          key={member.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {member.username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ノリタグ */}
                {currentTeam.hobbies && currentTeam.hobbies.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">趣味</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentTeam.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* グループ紹介文（展開可能） */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">グループ紹介</p>
                  <ExpandableText
                    text={currentTeam.description || 'マッドハッターのお茶会で、不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！'}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="mt-8 space-y-4">
              {/* 上段のボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSwipe('pass')}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  報告
                </button>
                <button
                  onClick={() => handleSwipe('pass')}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  ブロック
                </button>
              </div>

              {/* 下段のボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSwipe('pass')}
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  いいえ
                </button>
                <button
                  onClick={() => handleSwipe('hold')}
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  たぶん
                </button>
                <button
                  onClick={() => handleSwipe('like')}
                  disabled={verificationStatus ? !verificationStatus.allVerified : false}
                  className={`flex-1 py-4 px-6 rounded-full text-sm font-medium transition-colors ${verificationStatus ? !verificationStatus.allVerified : false
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  title={verificationStatus && !verificationStatus.allVerified ? '本人確認が完了していないメンバーがいるため、いいねを送信できません' : ''}
                >
                  はい
                </button>
              </div>
            </div>
          </MotionDiv>
        </AnimatePresence>

        {/* 進捗表示 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {currentTeamIndex + 1} / {candidates.length}
          </p>
        </div>
      </div>

      {/* フッターナビゲーション */}
      <FooterNav activeTab="swipe" />

    </div>
  )
} 