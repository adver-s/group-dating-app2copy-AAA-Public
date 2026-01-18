import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../utils/api'
import { withErrorHandler } from '../../../../middleware/errorHandler'

// メモリ内でテストデータを管理（サーバーサイドではlocalStorageが使用できない）
const testMeetIntents: { [matchId: string]: string[] } = {}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { matchId } = await request.json()
  if (!matchId) {
    return NextResponse.json({ error: 'マッチIDが必要です' }, { status: 400 })
  }

  try {
    // テストデータ用の会いたい意思表示をメモリ内で管理
    if (!testMeetIntents[matchId]) {
      testMeetIntents[matchId] = []
    }

    // 既に会いたい意思表示をしているかチェック
    if (testMeetIntents[matchId].includes(userId)) {
      return NextResponse.json({ error: '既に会いたい意思表示をしています' }, { status: 400 })
    }

    // 会いたい意思表示を追加
    testMeetIntents[matchId].push(userId)

    // テストデータの総メンバー数（4人）
    const totalMembers = 4
    const totalIntents = testMeetIntents[matchId].length

    return NextResponse.json({
      success: true,
      totalIntents,
      totalMembers,
      isCompleted: totalIntents >= totalMembers,
      isTestData: true
    })

  } catch (error) {
    console.error('テスト会いたい意思表示エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return NextResponse.json({ error: 'マッチIDが必要です' }, { status: 400 })
  }

  try {
    // テストデータ用の会いたい意思表示をメモリ内から取得
    const matchIntents = testMeetIntents[matchId] || []
    
    // テストデータの総メンバー数（4人）
    const totalMembers = 4
    const totalIntents = matchIntents.length
    const userHasExpressedIntent = matchIntents.includes(userId)

    return NextResponse.json({
      totalIntents,
      totalMembers,
      userHasExpressedIntent,
      isCompleted: totalIntents >= totalMembers,
      fromGroupIntents: Math.floor(totalIntents / 2),
      toGroupIntents: Math.ceil(totalIntents / 2),
      fromGroupMembers: 2,
      toGroupMembers: 2,
      isTestData: true
    })

  } catch (error) {
    console.error('テスト会いたい意思表示取得エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})
