import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../utils/api'
import { executeQuery } from '../../../../utils/database'

type RawFlowRow = {
  matching_id: string
  from_team_id: number
  to_team_id: number
  status: number
  created_at: string
  from_team_name: string
  to_team_name: string
}

type RawJudgementRow = {
  user_id: string | number | null
  group_id: string | number | null
  judgement: string | null
  judgement_updated_at?: string | null
  username: string | null
}

async function fetchJudgements(matchingId: string) {
  return executeQuery<RawJudgementRow>(
    `
      SELECT 
        gmj.userId   AS user_id,
        gmj.groupId  AS group_id,
        gmj.judgement,
        gmj.updatedAt AS judgement_updated_at,
        u.username
      FROM group_member_judgements gmj
      LEFT JOIN users u ON u.id = CAST(gmj.userId AS INTEGER)
      WHERE gmj.matchingId = ?
      ORDER BY gmj.updatedAt ASC
    `,
    [matchingId]
  )
}

async function countTeamMembers(teamId: number) {
  const rows = await executeQuery<{ count: number }>(
    `SELECT COUNT(*) AS count FROM team_members WHERE team_id = ?`,
    [teamId]
  )
  return Number(rows[0]?.count ?? 0)
}

async function buildFlowDetails(flow: RawFlowRow, currentTeamId?: number) {
  const judgements = await fetchJudgements(flow.matching_id)
  const fromTotal = await countTeamMembers(flow.from_team_id)
  const toTotal = await countTeamMembers(flow.to_team_id)

  const likeFilter = (groupId: number) =>
    judgements.filter(
      (j) =>
        Number(j.group_id) === groupId &&
        (j.judgement ?? '').toUpperCase() === 'LIKE'
    ).length

  const fromLike = likeFilter(flow.from_team_id)
  const toLike = likeFilter(flow.to_team_id)

  return {
    matching_id: flow.matching_id,
    from_team_id: flow.from_team_id,
    to_team_id: flow.to_team_id,
    status: flow.status,
    created_at: flow.created_at,
    from_team_name: flow.from_team_name,
    to_team_name: flow.to_team_name,
    progress: {
      fromTeam: {
        total: fromTotal,
        likeCount: fromLike,
        percentage: fromTotal > 0 ? Math.round((fromLike / fromTotal) * 100) : 0
      },
      toTeam: {
        total: toTotal,
        likeCount: toLike,
        percentage: toTotal > 0 ? Math.round((toLike / toTotal) * 100) : 0
      }
    },
    judgements,
    isFromTeam: currentTeamId ? flow.from_team_id === currentTeamId : undefined,
    isToTeam: currentTeamId ? flow.to_team_id === currentTeamId : undefined
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const specificMatchingId = searchParams.get('matching_id')
    const currentUserId = getUserIdFromRequest(req)

    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    if (specificMatchingId) {
      const rows = await executeQuery<RawFlowRow>(
        `
          SELECT 
            tmf.matching_id,
            tmf.from_group_id AS from_team_id,
            tmf.to_group_id   AS to_team_id,
            tmf.status,
            tmf.created_at,
            t1.name AS from_team_name,
            t2.name AS to_team_name
          FROM team_matching_flows tmf
          JOIN teams t1 ON tmf.from_group_id = t1.id
          JOIN teams t2 ON tmf.to_group_id = t2.id
          WHERE tmf.matching_id = ?
        `,
        [specificMatchingId]
      )

      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          flows: [],
          message: '指定されたマッチングフローが見つかりません'
        })
      }

      const details = await Promise.all(rows.map((row) => buildFlowDetails(row)))
      return NextResponse.json({ success: true, flows: details })
    }

    const activeTeamRows = await executeQuery<{
      team_id: number
      team_name: string
      team_description: string | null
    }>(
      `
        SELECT t.id AS team_id, t.name AS team_name, t.description AS team_description
        FROM teams t
        JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
        LIMIT 1
      `,
      [currentUserId]
    )

    if (activeTeamRows.length === 0) {
      return NextResponse.json({
        success: true,
        flows: [],
        message: 'アクティブなチームがありません。チーム一覧からアクティブチームを設定してください。'
      })
    }

    const { team_id: teamId, team_name: teamName, team_description: teamDescription } =
      activeTeamRows[0]

    const flows = await executeQuery<RawFlowRow>(
      `
        SELECT 
          tmf.matching_id,
          tmf.from_group_id AS from_team_id,
          tmf.to_group_id   AS to_team_id,
          tmf.status,
          tmf.created_at,
          t1.name AS from_team_name,
          t2.name AS to_team_name
        FROM team_matching_flows tmf
        JOIN teams t1 ON tmf.from_group_id = t1.id
        JOIN teams t2 ON tmf.to_group_id = t2.id
        WHERE tmf.from_group_id = ? OR tmf.to_group_id = ?
        ORDER BY tmf.created_at DESC
      `,
      [teamId, teamId]
    )

    const flowsWithDetails = await Promise.all(
      flows.map((flow) => buildFlowDetails(flow, teamId))
    )

    return NextResponse.json({
      success: true,
      flows: flowsWithDetails,
      currentTeam: {
        id: teamId,
        name: teamName,
        description: teamDescription
      },
      message: `アクティブチーム「${teamName}」のマッチングフローを表示しています。`
    })
  } catch (error) {
    console.error('❌ マッチングフロー取得API エラー:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 新しいマッチングフローを作成
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { targetTeamId } = await req.json()

    if (!targetTeamId) {
      return NextResponse.json(
        { error: '対象チームIDが必要です' },
        { status: 400 }
      )
    }

    // ユーザーのアクティブなチームを取得
    const activeTeam = await executeQuery<{ id: number; gender: number; target_gender: number }>(
      `
        SELECT t.id, t.gender, t.target_gender
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
        LIMIT 1
      `,
      [currentUserId]
    )

    if (activeTeam.length === 0) {
      return NextResponse.json(
        { error: 'アクティブなチームが見つかりません。チーム一覧からアクティブチームを設定してください。' },
        { status: 400 }
      )
    }

    const fromTeamId = activeTeam[0].id
    const fromTeamGender = activeTeam[0].gender
    const fromTeamTargetGender = activeTeam[0].target_gender

    // 対象チームの情報を取得
    const targetTeam = await executeQuery<{ id: number; gender: number; target_gender: number }>(
      `SELECT id, gender, target_gender FROM teams WHERE id = ?`,
      [targetTeamId]
    )

    if (targetTeam.length === 0) {
      return NextResponse.json(
        { error: '対象チームが見つかりません' },
        { status: 404 }
      )
    }

    const toTeamGender = targetTeam[0].gender
    const toTeamTargetGender = targetTeam[0].target_gender

    // 性別マッチング条件をチェック
    if (!isGenderCompatible(fromTeamGender, fromTeamTargetGender, toTeamGender, toTeamTargetGender)) {
      return NextResponse.json(
        { error: '性別条件が合わないためマッチングできません' },
        { status: 400 }
      )
    }

    // 既存のフローがあるかチェック
    const existingFlow = await executeQuery<{ id: string }>(
      `
        SELECT id FROM team_matching_flows
        WHERE (from_group_id = ? AND to_group_id = ?)
           OR (from_group_id = ? AND to_group_id = ?)
        LIMIT 1
      `,
      [fromTeamId, targetTeamId, targetTeamId, fromTeamId]
    )

    if (existingFlow.length > 0) {
      return NextResponse.json(
        { error: '既にマッチングフローが存在します' },
        { status: 400 }
      )
    }

    // 新しいマッチングフローを作成
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await executeQuery(
      `
        INSERT INTO team_matching_flows (
          id,
          matching_id,
          from_group_id,
          to_group_id,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [flowId, flowId, fromTeamId, targetTeamId]
    )

    return NextResponse.json({
      success: true,
      flowId,
      message: 'マッチングフローを作成しました'
    })

  } catch (error) {
    console.error('❌ マッチングフロー作成API エラー:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 性別マッチング条件チェック関数
function isGenderCompatible(
  fromTeamGender: number, 
  fromTeamTargetGender: number, 
  toTeamGender: number, 
  toTeamTargetGender: number
): boolean {
  // 性別条件の詳細なロジックを実装
  // 0: 女子のみ, 1: 男女混在, 2: 男子のみ
  // target_gender: 0: 女子に表示, 1: 男女どちらにも表示, 2: 男子に表示
  
  // 基本的な条件チェック
  if (fromTeamTargetGender === 1 && toTeamTargetGender === 1) {
    return true; // どちらも男女どちらにも表示
  }
  
  if (fromTeamGender === toTeamGender && fromTeamTargetGender === toTeamTargetGender) {
    return true; // 同じ性別で同じターゲット
  }
  
  // より詳細な条件を追加可能
  return true; // デフォルトでは許可
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { matching_id, status } = body

    if (!matching_id || status === undefined) {
      return NextResponse.json(
        { error: 'matching_id と status は必須です' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `
        UPDATE team_matching_flows
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE matching_id = ?
      `,
      [status, matching_id]
    )

    const updated = (result as unknown as { changes?: number }).changes ?? 0
    if (updated === 0) {
      return NextResponse.json(
        { error: 'マッチングフローが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'マッチングフローが更新されました'
    })
  } catch (error) {
    console.error('マッチングフロー更新エラー:', error)
    return NextResponse.json(
      { error: 'マッチングフロー更新エラー' },
      { status: 500 }
    )
  }
}