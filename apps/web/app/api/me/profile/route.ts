import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '../../../../utils/api'
import { executeQuery } from '../../../../utils/database'

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)

    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userIdInt = parseInt(currentUserId, 10)
    if (Number.isNaN(userIdInt)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    const user = await executeQuery(
      'SELECT id, username, bio, age, gender, created_at, updated_at, is_verified FROM users WHERE id = ?',
      [userIdInt]
    ) as any[]

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const userData = user[0]

    const profileData = {
      id: userData.id,
      username: userData.username,
      bio: userData.bio,
      age: userData.age,
      gender: userData.gender,
      location: null,
      interests: [] as string[],
      birthDate: null,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      isVerified: !!userData.is_verified,
      photo: null
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('プロフィール取得エラー:', error)
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req)

    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userIdInt = parseInt(currentUserId, 10)
    if (Number.isNaN(userIdInt)) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 400 })
    }

    const body = await req.json()
    const { username, bio, age, gender } = body

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (username !== undefined) {
      const existingUser = await executeQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userIdInt]
      ) as any[]

      if (existingUser.length > 0) {
        return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 400 })
      }

      updateFields.push('username = ?')
      updateValues.push(username)
    }

    if (bio !== undefined) {
      updateFields.push('bio = ?')
      updateValues.push(bio)
    }

    if (age !== undefined) {
      updateFields.push('age = ?')
      updateValues.push(age)
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?')
      updateValues.push(gender)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: '更新するフィールドが指定されていません' }, { status: 400 })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(userIdInt)

    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const updatedUser = await executeQuery(
      'SELECT id, username, bio, age, gender, created_at, updated_at, is_verified FROM users WHERE id = ?',
      [userIdInt]
    ) as any[]

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json({ error: '更新後のユーザー情報の取得に失敗しました' }, { status: 500 })
    }

    const userData = updatedUser[0]

    const updatedProfileData = {
      id: userData.id,
      username: userData.username,
      bio: userData.bio,
      age: userData.age,
      gender: userData.gender,
      location: null,
      interests: [] as string[],
      birthDate: null,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      isVerified: !!userData.is_verified,
      photo: null
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfileData
    })
  } catch (error) {
    console.error('プロフィール更新エラー:', error)
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    )
  }
}
