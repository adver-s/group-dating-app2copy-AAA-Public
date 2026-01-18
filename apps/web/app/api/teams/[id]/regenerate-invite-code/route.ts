import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../../utils/api'
import { executeQuery } from '@/utils/database'

// 招待コードを生成する関数
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params
    const currentUserId = getUserIdFromRequest(req)

    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // チームの存在確認と権限チェック
    const teamRows = await executeQuery(
      `
        SELECT t.id, t.name
        FROM teams t
        JOIN team_members tm ON tm.team_id = t.id
        WHERE t.id = ? AND tm.user_id = ?
        LIMIT 1
      `,
      [teamId, currentUserId]
    )

    if (teamRows.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      )
    }

    const team = teamRows[0]

    // 既存の招待コードを削除
    await executeQuery(`DELETE FROM invite_codes WHERE team_id = ?`, [teamId])

    // 新しい招待コードを生成
    let newCode = ''
    let isUnique = false
    while (!isUnique) {
      newCode = generateInviteCode()
      const existing = await executeQuery(`SELECT id FROM invite_codes WHERE code = ?`, [newCode])
      if (existing.length === 0) {
        isUnique = true
      }
    }

    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await executeQuery(
      `
        INSERT INTO invite_codes (
          id,
          code,
          team_id,
          created_by,
          created_at,
          expires_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `,
      [inviteId, newCode, teamId, currentUserId, expiresAt]
    )

    console.log(`✅ 招待コード再生成成功: Team ${teamId}, New Code: ${newCode}`)

    return NextResponse.json({
      inviteCode: newCode,
      expiresAt,
      teamName: team.name
    })

  } catch (error) {
    console.error('招待コード再生成エラー:', error)
    return NextResponse.json(
      { error: '招待コードの再生成に失敗しました' },
      { status: 500 }
    )
  }
}
