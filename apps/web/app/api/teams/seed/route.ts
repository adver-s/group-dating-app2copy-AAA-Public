export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/api/lib/database'

export async function POST() {
  try {
    console.log('🔧 === シード処理開始 ===')
    
    // 既存ならスキップ
    const exists = await prisma.team.count()
    console.log('既存のチーム数:', exists)
    if (exists > 0) return NextResponse.json({ ok: true, skipped: true })

    console.log('ユーザー1を作成中...')
    const u1 = await prisma.user.create({ 
      data: { 
        username: 'Alice', 
        email: 'alice@example.com',
        password_hash: 'hashed_password',
        avatar_url: null 
      } 
    })
    console.log('ユーザー1作成完了:', u1.id)

    console.log('ユーザー2を作成中...')
    const u2 = await prisma.user.create({ 
      data: { 
        username: 'Bob', 
        email: 'bob@example.com',
        password_hash: 'hashed_password',
        avatar_url: null 
      } 
    })
    console.log('ユーザー2作成完了:', u2.id)

    console.log('チームを作成中...')
    const team = await prisma.team.create({ 
      data: { 
        name: 'Demo Team',
        description: 'A demo team for testing'
      } 
    })
    console.log('チーム作成完了:', team.id)

    console.log('チームメンバー1を作成中...')
    await prisma.teamMember.create({
      data: { team_id: team.id, user_id: u1.id, is_active: true }
    })
    console.log('チームメンバー1作成完了')

    console.log('チームメンバー2を作成中...')
    await prisma.teamMember.create({
      data: { team_id: team.id, user_id: u2.id, is_active: true }
    })
    console.log('チームメンバー2作成完了')

    console.log('🔧 === シード処理完了 ===')
    return NextResponse.json({ ok: true, teamId: team.id })
  } catch (e) {
    console.error('❌ POST /api/teams/seed failed:', e)
    console.error('エラーの詳細:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
}
