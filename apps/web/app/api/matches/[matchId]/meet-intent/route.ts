import { withErrorHandler } from '@/middleware/errorHandler'
import { getUserIdFromRequest } from '@/utils/api'
import { executeQuery } from '@/utils/database'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const currentUserId = await getUserIdFromRequest(request)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { matchId } = await request.json()
  if (!matchId) {
    return NextResponse.json({ error: 'マッチIDが必要です' }, { status: 400 })
  }

  try {
    console.log('🔍 会いたい意思表示API開始:', { matchId, currentUserId })

    // マッチングフローが存在し、正式マッチング（status = 3）かチェック
    const matchingFlow = await executeQuery(`
      SELECT 
        gmf.id,
        gmf.status,
        gmf.from_group_id,
        gmf.to_group_id,
        t1.name as from_team_name,
        t2.name as to_team_name
      FROM team_matching_flows gmf
      JOIN teams t1 ON gmf.from_group_id = t1.id
      JOIN teams t2 ON gmf.to_group_id = t2.id
      WHERE gmf.id = ? AND gmf.status = 3
    `, [matchId]) as any[]

    if (matchingFlow.length === 0) {
      return NextResponse.json(
        { error: '成立したマッチングが見つかりません' },
        { status: 404 }
      )
    }

    const flow = matchingFlow[0]
    console.log('✅ マッチングフロー確認:', flow)

    // ユーザーがこのマッチングに関連するチームのメンバーかチェック
    const userTeam = await executeQuery(`
      SELECT team_id
      FROM team_members
      WHERE user_id = ? AND team_id IN (?, ?) AND is_active = TRUE
    `, [currentUserId, flow.from_group_id, flow.to_group_id]) as any[]

    if (userTeam.length === 0) {
      return NextResponse.json(
        { error: 'このマッチングに関連するチームのメンバーではありません' },
        { status: 403 }
      )
    }

    const userTeamId = userTeam[0].team_id
    console.log('✅ ユーザーのチーム確認:', userTeamId)

    // 既に会いたい意思表示をしているかチェック
    const existingIntent = await executeQuery(`
      SELECT id FROM group_member_judgements
      WHERE matchingId = ? AND userId = ? AND judgement = 'LIKE'
    `, [matchId, currentUserId]) as any[]

    if (existingIntent.length > 0) {
      console.log('✅ 既に会いたい意思表示済み')
    } else {
      // 会いたい意思表示を記録（INSERT OR UPDATE）
      await executeQuery(`
        INSERT INTO group_member_judgements (matchingId, userId, groupId, judgement, updatedAt)
        VALUES (?, ?, ?, 'LIKE', CURRENT_TIMESTAMP)
        ON CONFLICT(matchingId, userId) DO UPDATE SET
          judgement = 'LIKE',
          groupId = excluded.groupId,
          updatedAt = CURRENT_TIMESTAMP
      `, [matchId, currentUserId, userTeamId])
    }

    console.log('✅ 会いたい意思表示記録完了')

    // 全メンバー（重複排除、is_active に依存せずチーム所属者をカウント）
    const allMembers = await executeQuery(`
      SELECT DISTINCT tm.user_id, tm.team_id
      FROM team_members tm
      WHERE tm.team_id IN (?, ?)
    `, [flow.from_group_id, flow.to_group_id]) as any[]

    console.log('🔍 実際の全メンバー:', allMembers)

    // チーム別メンバー数
    const fromGroupMembers = allMembers.filter((m: any) => m.team_id === flow.from_group_id)
      .reduce((set: Set<string>, m: any) => set.add(m.user_id), new Set<string>()).size
    const toGroupMembers = allMembers.filter((m: any) => m.team_id === flow.to_group_id)
      .reduce((set: Set<string>, m: any) => set.add(m.user_id), new Set<string>()).size
    const totalMembers = fromGroupMembers + toGroupMembers

    console.log('🔍 計算されたメンバー数:', { fromGroupMembers, toGroupMembers, totalMembers })

    const allIntents = await executeQuery(`
      SELECT DISTINCT userId, groupId
      FROM group_member_judgements
      WHERE matchingId = ? AND judgement = 'LIKE' AND groupId IN (?, ?)
    `, [matchId, flow.from_group_id, flow.to_group_id]) as any[]

    console.log('🔍 実際の会いたい意思表示:', allIntents)

    const totalIntents = allIntents
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size
    const userHasExpressedIntent = allIntents.some((intent: any) => intent.userId === currentUserId)

    // 各チームの意思表示数を計算（重複排除）
    const fromGroupIntents = allIntents.filter((intent: any) => intent.groupId === flow.from_group_id)
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size
    const toGroupIntents = allIntents.filter((intent: any) => intent.groupId === flow.to_group_id)
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size

    // 両チームの全メンバーがLIKEしたら完了
    const isCompleted = (
      fromGroupIntents === fromGroupMembers &&
      toGroupIntents === toGroupMembers &&
      fromGroupMembers > 0 &&
      toGroupMembers > 0
    )

    console.log('✅ 意思表示状況:', {
      totalIntents,
      totalMembers,
      userHasExpressedIntent,
      isCompleted,
      fromGroupIntents,
      toGroupIntents,
      fromGroupMembers,
      toGroupMembers
    })

    return NextResponse.json({
      success: true,
      totalIntents,
      totalMembers,
      userHasExpressedIntent,
      isCompleted,
      fromGroupIntents,
      toGroupIntents,
      fromGroupMembers,
      toGroupMembers
    })

  } catch (error) {
    console.error('❌ 会いたい意思表示エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUserId = await getUserIdFromRequest(request)
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return NextResponse.json({ error: 'マッチIDが必要です' }, { status: 400 })
  }

  try {
    console.log('🔍 会いたい意思表示状況取得:', { matchId, currentUserId })

    // マッチングフローが存在し、正式マッチング（status = 3）かチェック
    const matchingFlow = await executeQuery(`
      SELECT 
        gmf.id,
        gmf.status,
        gmf.from_group_id,
        gmf.to_group_id
      FROM team_matching_flows gmf
      WHERE gmf.id = ? AND gmf.status = 3
    `, [matchId]) as any[]

    if (matchingFlow.length === 0) {
      return NextResponse.json(
        { error: '成立したマッチングが見つかりません' },
        { status: 404 }
      )
    }

    const flow = matchingFlow[0]

    // 全メンバーの意思表示状況を取得（重複排除）
    const allMembers = await executeQuery(`
      SELECT DISTINCT tm.user_id, tm.team_id
      FROM team_members tm
      WHERE tm.team_id IN (?, ?)
    `, [flow.from_group_id, flow.to_group_id]) as any[]

    console.log('🔍 GET側の実際の全メンバー:', allMembers)

    const fromGroupMembers = allMembers.filter((m: any) => m.team_id === flow.from_group_id)
      .reduce((set: Set<string>, m: any) => set.add(m.user_id), new Set<string>()).size
    const toGroupMembers = allMembers.filter((m: any) => m.team_id === flow.to_group_id)
      .reduce((set: Set<string>, m: any) => set.add(m.user_id), new Set<string>()).size
    const totalMembers = fromGroupMembers + toGroupMembers

    console.log('🔍 GET側の計算されたメンバー数:', { fromGroupMembers, toGroupMembers, totalMembers })

    const allIntents = await executeQuery(`
      SELECT DISTINCT userId, groupId
      FROM group_member_judgements
      WHERE matchingId = ? AND judgement = 'LIKE' AND groupId IN (?, ?)
    `, [matchId, flow.from_group_id, flow.to_group_id]) as any[]

    console.log('🔍 GET側の実際の会いたい意思表示:', allIntents)

    const totalIntents = allIntents
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size
    const userHasExpressedIntent = allIntents.some((intent: any) => intent.userId === currentUserId)

    // 各チームの意思表示数を計算（重複排除）
    const fromGroupIntents = allIntents.filter((intent: any) => intent.groupId === flow.from_group_id)
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size
    const toGroupIntents = allIntents.filter((intent: any) => intent.groupId === flow.to_group_id)
      .reduce((set: Set<string>, i: any) => set.add(i.userId), new Set<string>()).size

    // 両チームの全メンバーがLIKEしたら完了
    const isCompleted = (
      fromGroupIntents === fromGroupMembers &&
      toGroupIntents === toGroupMembers &&
      fromGroupMembers > 0 &&
      toGroupMembers > 0
    )

    console.log('✅ 意思表示状況取得完了:', {
      totalIntents,
      totalMembers,
      userHasExpressedIntent,
      isCompleted,
      fromGroupIntents,
      toGroupIntents,
      fromGroupMembers,
      toGroupMembers
    })

    return NextResponse.json({
      success: true,
      totalIntents,
      totalMembers,
      userHasExpressedIntent,
      isCompleted,
      fromGroupIntents,
      toGroupIntents,
      fromGroupMembers,
      toGroupMembers
    })

  } catch (error) {
    console.error('❌ 会いたい意思表示状況取得エラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
})
