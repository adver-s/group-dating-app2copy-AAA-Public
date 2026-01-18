import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../utils/api'
import { withErrorHandler } from '../../../../middleware/errorHandler'

// メモリ内で決定済み合コンを管理
const confirmedMeetings: any[] = []

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { matchId, scheduleData } = await request.json()
  if (!matchId || !scheduleData) {
    return NextResponse.json({ error: 'マッチIDと予定データが必要です' }, { status: 400 })
  }

  try {
    // 決定済み合コンのデータを作成
    const confirmedMeeting = {
      id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId: matchId,
      teamName: 'サンプルチーム', // 実際の実装では相手チーム名を取得
      teamImage: '/sample-team.jpg', // 実際の実装では相手チーム画像を取得
      purpose: scheduleData.purpose || '定番飲み会',
      datetime: scheduleData.datetime,
      location: scheduleData.location,
      participantCount: 4, // 実際の実装では参加人数を計算
      confirmedAt: new Date().toISOString(),
      isTestData: true
    }

    // 決定済み合コンリストに追加
    confirmedMeetings.push(confirmedMeeting)

    return NextResponse.json({
      success: true,
      confirmedMeeting,
      isTestData: true
    })

  } catch (error) {
    console.error('予定調整完了エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    // 決定済み合コン一覧を返す
    return NextResponse.json({
      confirmedMeetings,
      isTestData: true
    })

  } catch (error) {
    console.error('決定済み合コン取得エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})
