import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名が必要です' },
        { status: 400 }
      );
    }

    const query = `
      SELECT id, username, bio, age, gender, location, created_at
      FROM users
      WHERE username = ? AND is_active = TRUE
      LIMIT 1
    `;
    const params = [username];

    const users = await executeQuery(query, params) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 機密情報を除外
    const safeUser = {
      id: user.id,
      username: user.username,
      bio: user.bio,
      age: user.age,
      gender: user.gender,
      location: user.location,
      createdAt: user.created_at
    };

    return NextResponse.json(safeUser);

  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json(
      { error: 'ユーザー検索に失敗しました' },
      { status: 500 }
    );
  }
}
