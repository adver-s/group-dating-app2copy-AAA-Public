export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getUserIdFromRequest } from '@/utils/api';
import { prisma } from '@/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 認証チェック
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // アクティブチーム制約を確認・適用
    const { TeamActiveConstraint } = await import('@/utils/team-constraints')

    // 現在のアクティブチーム数を確認
    const activeCount = await TeamActiveConstraint.getActiveTeamCount(currentUserId)
    console.log(`📊 ユーザー ${currentUserId} のアクティブチーム数: ${activeCount}`)

    // 複数のアクティブチームがある場合は制約を強制適用
    if (activeCount > 1) {
      console.log(`⚠️ 複数のアクティブチームが検出されました。制約を強制適用します。`)
      await TeamActiveConstraint.enforceConstraint(currentUserId)
      console.log(`✅ 制約を強制適用しました`)
    }

    // ユーザーが所属するチームを取得（Prisma使用）
    const userTeams = await prisma.teamMember.findMany({
      where: {
        user_id: parseInt(currentUserId),
        team: {
          is_active: true
        }
      },
      include: {
        team: {
          include: {
            _count: {
              select: {
                team_members: {
                  where: {
                    status: 0
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'desc' },
        { team: { created_at: 'desc' } }
      ]
    })

    // アクティブと待機グループに分類
    const activeGroups = userTeams
      .filter(teamMember => teamMember.status === 0)
      .map(teamMember => ({
        id: teamMember.team.id,
        name: teamMember.team.name,
        description: teamMember.team.description,
        created_at: teamMember.team.created_at,
        updated_at: teamMember.team.updated_at,
        is_active: teamMember.team.is_active,
        user_active_team: true,
        member_count: teamMember.team._count.team_members
      }))

    const waitingGroups = userTeams
      .filter(teamMember => teamMember.status !== 0)
      .map(teamMember => ({
        id: teamMember.team.id,
        name: teamMember.team.name,
        description: teamMember.team.description,
        created_at: teamMember.team.created_at,
        updated_at: teamMember.team.updated_at,
        is_active: teamMember.team.is_active,
        user_active_team: false,
        member_count: teamMember.team._count.team_members
      }))

    console.log(`📊 アクティブグループ: ${activeGroups.length}個, 待機グループ: ${waitingGroups.length}個`)

    return NextResponse.json({
      activeGroups,
      waitingGroups
    })
  } catch (e) {
    console.error('GET /api/teams failed:', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 === チーム作成API開始 ===')

    // 認証チェック
    const currentUserId = getUserIdFromRequest(req)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    console.log('🔍 リクエストボディ:', body)

    const {
      name,
      description = '',
      gender = 1,
      targetGender = [1],
      hobbies = [],
      preferredPrefs = [],
      availabilities = [],
      images = [],
      memberUserIds = [],
      makeActive = false
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'グループ名は必須です' }, { status: 400 })
    }

    // ユーザーの既存チーム数を確認
    const existingTeams = await prisma.teamMember.findMany({
      where: {
        user_id: parseInt(currentUserId),
        status: 0,
        team: {
          is_active: true
        }
      }
    })

    const isFirstTeam = existingTeams.length === 0
    const shouldBeActive = isFirstTeam || makeActive

    // チームUUIDの生成
    const teamUuid = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // チームを作成（トランザクション使用）
    const result = await prisma.$transaction(async (tx) => {
      // チームを作成
      const team = await tx.team.create({
        data: {
          uuid: teamUuid,
          name: name.trim(),
          description: description.trim(),
          gender: gender,
          target_gender: targetGender[0] || 1,
          smoke: null,
          alcohol: null,
          is_active: true,
        }
      })

      // 作成者をチームメンバーとして追加
      await tx.teamMember.create({
        data: {
          team_id: team.id,
          user_id: parseInt(currentUserId),
          status: shouldBeActive ? 0 : 1
        }
      })

      // ノリタグを追加
      if (hobbies && hobbies.length > 0) {
        for (const hobby of hobbies) {
          await tx.teamHobby.create({
            data: {
              team_id: team.id,
              hobby_tag: hobby,
            }
          })
        }
      }

      // 都道府県を追加
      if (preferredPrefs && preferredPrefs.length > 0) {
        for (const prefecture of preferredPrefs) {
          await tx.teamPrefecture.create({
            data: {
              team_id: team.id,
              prefecture_code: prefecture,
              status: 0,
            }
          })
        }
      }

      // 利用可能時間を追加
      if (availabilities && availabilities.length > 0) {
        for (const availability of availabilities) {
          await tx.teamWeekday.create({
            data: {
              team_id: team.id,
              weekday: availability.weekday,
              time_slot: availability.timeslot,
              status: 0,
            }
          })
        }
      }

      // 画像を追加
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await tx.teamPhoto.create({
            data: {
              team_id: team.id,
              photo_url: images[i],
              display_order: i,
              created_at: new Date(),
            }
          })
        }
      }

      return team
    })

    console.log('✅ チーム作成完了:', result.id)

    return NextResponse.json({
      groupId: result.uuid,
      success: true,
      message: 'チームが正常に作成されました'
    }, { status: 201 })

  } catch (e) {
    console.error('❌ POST /api/teams failed:', e)
    return NextResponse.json({
      error: 'チーム作成に失敗しました',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 })
  }
}
