import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { executeQuery } from '../../../../utils/database';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await executeQuery(
      'SELECT id, username, bio, age, gender, location, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 興味・関心を取得（user_interestsテーブルがある場合）
    let interests: string[] = [];
    try {
      const userInterests = await executeQuery(
        'SELECT interest FROM user_interests WHERE user_id = ?',
        [userId]
      ) as any[];
      interests = userInterests.map(ui => ui.interest);
    } catch (error) {
      // user_interestsテーブルが存在しない場合は空配列のまま
      console.log('user_interestsテーブルが存在しません');
    }

    const userData = {
      ...user[0],
      interests
    };

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 自分の情報のみ更新可能
    if (currentUserId !== userId) {
      return NextResponse.json({ error: '自分の情報のみ更新可能です' }, { status: 403 });
    }

    const body = await req.json();
    const { username, bio, age, gender, location, interests } = body;

    // 更新可能なフィールドを定義
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
      // ユーザー名の重複チェック
      const existingUser = await executeQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      ) as any[];

      if (existingUser.length > 0) {
        return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 400 });
      }

      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (age !== undefined) {
      updateFields.push('age = ?');
      updateValues.push(age);
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }

    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: '更新するフィールドが指定されていません' }, { status: 400 });
    }

    // updated_atフィールドを追加
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    // ユーザー情報を更新
    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 興味・関心の更新（interestsテーブルがある場合）
    if (interests !== undefined && Array.isArray(interests)) {
      try {
        // 既存の興味・関心を削除
        await executeQuery('DELETE FROM user_interests WHERE user_id = ?', [userId]);

        // 新しい興味・関心を追加
        for (const interest of interests) {
          await executeQuery(
            'INSERT INTO user_interests (user_id, interest) VALUES (?, ?)',
            [userId, interest]
          );
        }
      } catch (error) {
        console.log('user_interestsテーブルが存在しないため、興味・関心の更新をスキップしました');
      }
    }

    // 更新後のユーザー情報を取得
    const updatedUser = await executeQuery(
      'SELECT id, username, bio, age, gender, location, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    ) as any[];

    return NextResponse.json({
      success: true,
      message: 'ユーザー情報を更新しました',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('ユーザー情報更新エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    );
  }
} 