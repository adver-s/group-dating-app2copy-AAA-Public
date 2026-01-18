import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../utils/database'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 === 出動中チーム取得API開始 ===')

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('🔍 Token length:', token.length)

    let decoded
    try {
      decoded = jwt.decode(token) as any
      console.log('🔍 Decoded token: Success')
      console.log('🔍 Token payload:', decoded)
    } catch (error) {
      console.error('❌ Token decode error:', error)
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      )
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: 'ユーザーIDが見つかりません' },
        { status: 401 }
      )
    }

    const currentUserId = decoded.sub
    const userIdInt = parseInt(currentUserId, 10)
    if (Number.isNaN(userIdInt)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    console.log('✅ User ID extracted:', userIdInt)

    const allMemberships = await executeQuery(
      `
      SELECT 
        tm.team_id,
        tm.user_id,
        tm.status,
        CASE WHEN tm.status = 0 THEN 1 ELSE 0 END as user_active_team,
        t.name as team_name,
        t.is_active as team_active_team
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ?
    `,
      [userIdInt]
    ) as any[]

    console.log('🔍 ユーザーの全チームメンバーシップ:', allMemberships)

    const activeTeam = await executeQuery(
      `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        t.updated_at,
        t.is_active as team_is_active,
        CASE WHEN tm.status = 0 THEN 1 ELSE 0 END as user_active_team
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.status = 0 AND t.is_active = TRUE
      ORDER BY t.created_at DESC
      LIMIT 1
    `,
      [userIdInt]
    ) as any[]

    console.log('🔍 出動中チーム:', activeTeam)

    if (activeTeam.length === 0) {
      return NextResponse.json({
        success: true,
        activeTeam: null,
        message: '出動中のチームがありません'
      })
    }

    return NextResponse.json({
      success: true,
      activeTeam: activeTeam[0]
    })
  } catch (error) {
    console.error('❌ 出動中チーム取得API エラー:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
