// @ts-nocheck
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { executeQuery } from '@/utils/database'
import { NextRequest, NextResponse } from 'next/server'
// import { normalizeTeam } from '@/utils/normalize-team'

import { AuthenticatedRequest, withAuth } from '@/middleware/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('🔍 GET /api/teams/[id] called')
  return withAuth(async (authenticatedReq: AuthenticatedRequest) => {
    try {
      console.log('🔍 Authentication successful, user:', authenticatedReq.user?.id)
      const resolvedParams = await params
      const id = resolvedParams.id.trim()
      console.log('🔍 Team ID:', id)

      if (!id) {
        console.log('❌ Invalid team ID')
        return NextResponse.json({ error: 'invalid id' }, { status: 400 })
      }

      console.log('🔍 Fetching team from database...')
      const rows = await executeQuery(`
        SELECT 
          id,
          name,
          description,
          gender,
          created_at,
          updated_at,
          is_active
        FROM teams 
        WHERE id = ?
      `, [id])

      if (!rows || rows.length === 0) {
        console.log('❌ Team not found:', id)
        return NextResponse.json({ error: 'not found' }, { status: 404 })
      }

      const team = rows[0]
      console.log('✅ Team found:', team.id, team.name)
      return NextResponse.json({ team }, { status: 200 })
    } catch (e) {
      console.error('❌ GET /api/teams/[id] failed:', e)
      return NextResponse.json({ error: 'internal', detail: String(e) }, { status: 500 })
    }
  })(req)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('🔧 PUT /api/teams/[id] called')
  return withAuth(async (authenticatedReq: AuthenticatedRequest) => {
    try {
      console.log('🔍 Auth OK user:', authenticatedReq.user?.id)
      const resolvedParams = await params
      const id = resolvedParams.id.trim()
      console.log('🔍 Updating Team ID:', id)

      if (!id) {
        console.log('❌ Invalid team ID for PUT')
        return NextResponse.json({ error: 'invalid id' }, { status: 400 })
      }

      const body = await req.json().catch(() => ({} as any))
      console.log('📦 Update body:', body)

      // 受け取る可能性のあるフィールドをサニタイズ
      const {
        name,
        description,
        gender,
        target_gender,
        smoke,
        alcohol,
        max_members,
        is_active_team,
        photos,
        weekdays,
        hobbies,
        prefectures,
      } = body || {}

      const updateFields: string[] = []
      const values: any[] = []

      if (typeof name === 'string') {
        updateFields.push('name = ?')
        values.push(name.trim())
      }
      if (typeof description === 'string') {
        updateFields.push('description = ?')
        values.push(description.trim())
      }
      if (Number.isInteger(gender)) {
        updateFields.push('gender = ?')
        values.push(gender)
      }
      if (Number.isInteger(smoke)) {
        updateFields.push('smoke = ?')
        values.push(smoke)
      }
      if (Number.isInteger(alcohol)) {
        updateFields.push('alcohol = ?')
        values.push(alcohol)
      }
      if (Number.isInteger(max_members)) {
        updateFields.push('max_members = ?')
        values.push(max_members)
      }

      // 基本情報更新
      if (updateFields.length > 0) {
        values.push(id)
        console.log('📝 Updating teams table with:', { updateFields, values })
        await executeQuery(
          `UPDATE teams SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          values,
        )
      } else {
        console.log('ℹ️ No scalar fields to update on teams table')
      }

      // 付帯情報の更新（サブテーブル）
      // 1) ターゲットジェンダー
      if (Array.isArray(target_gender)) {
        console.log('🔁 Updating team_target_genders:', target_gender)
        await executeQuery(`DELETE FROM team_target_genders WHERE team_id = ?`, [id])
        for (const tg of target_gender) {
          const tgId = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await executeQuery(
            `INSERT INTO team_target_genders (id, team_id, target_gender, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [tgId, id, tg],
          )
        }
      }

      // 2) 都道府県
      if (Array.isArray(prefectures)) {
        console.log('🔁 Updating team_prefectures:', prefectures)
        await executeQuery(`DELETE FROM team_prefectures WHERE team_id = ?`, [id])
        for (const pref of prefectures) {
          const prefId = `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await executeQuery(
            `INSERT INTO team_prefectures (id, team_id, prefecture_code, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [prefId, id, pref],
          )
        }
      }

      // 3) 写真（URLの配列）
      if (Array.isArray(photos)) {
        console.log('🔁 Updating team_photos (status=active): count=', photos.length)
        await executeQuery(`DELETE FROM team_photos WHERE team_id = ?`, [id])
        for (const [index, url] of photos.entries()) {
          const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await executeQuery(
            `INSERT INTO team_photos (id, team_id, photo_url, display_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [photoId, id, url, index],
          )
        }
      }

      // 4) 平日可否（weekday/timeSlot）
      if (Array.isArray(weekdays)) {
        console.log('🔁 Updating team_weekdays:', weekdays)
        await executeQuery(`DELETE FROM team_weekdays WHERE team_id = ?`, [id])
        for (const wd of weekdays) {
          const wdId = `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          // 期待: { weekday: number(0-6), timeSlot: 'available'|'maybe'|'unavailable' }
          const weekday = Number(wd.weekday)
          const slotCode = wd.timeSlot === 'available' ? 2 : wd.timeSlot === 'maybe' ? 1 : 0
          await executeQuery(
            `INSERT INTO team_weekdays (id, team_id, weekday, time_slot, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [wdId, id, weekday, slotCode],
          )
        }
      }

      // 5) 趣味タグ（文字列配列）
      if (Array.isArray(hobbies)) {
        console.log('🔁 Updating team_hobbies:', hobbies)
        await executeQuery(`DELETE FROM team_hobbies WHERE team_id = ?`, [id])
        for (const tag of hobbies) {
          await executeQuery(
            `INSERT INTO team_hobbies (team_id, hobby_tag, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [id, tag],
          )
        }
      }

      // 6) 出動状態（ユーザー別のアクティブチーム切替）
      if (typeof is_active_team === 'boolean') {
        console.log('🔁 Updating membership active state:', is_active_team)
        // このユーザーの既存アクティブをオフ → 対象チームをオン
        await executeQuery(
          `UPDATE team_members SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE`,
          [authenticatedReq.user!.id],
        )
        await executeQuery(
          `UPDATE team_members SET is_active = TRUE WHERE user_id = ? AND team_id = ?`,
          [authenticatedReq.user!.id, id],
        )
      }

      // 反映結果を返す
      const rows = await executeQuery(
        `SELECT id, name, description, gender, created_at, updated_at, is_active FROM teams WHERE id = ?`,
        [id],
      )
      const team = rows[0]
      console.log('✅ Team updated:', team?.id, team?.name)
      return NextResponse.json({ success: true, team }, { status: 200 })
    } catch (e) {
      console.error('❌ PUT /api/teams/[id] failed:', e)
      return NextResponse.json({ error: 'internal', detail: String(e) }, { status: 500 })
    }
  })(req)
}