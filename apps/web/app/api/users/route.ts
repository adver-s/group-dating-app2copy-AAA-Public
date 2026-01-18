import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';

export async function GET(req: NextRequest) {
  try {
    // ユーザー一覧を取得（基本情報のみ）
    const users = await executeQuery(`
      SELECT 
        u.id,
        u.username,
        u.avatar_url,
        u.bio,
        u.age,
        u.gender,
        u.cancelRate,
        u.created_at,
        u.last_login,
        u.is_active,
        u.is_verified
      FROM users u
      WHERE u.is_active = TRUE
      ORDER BY u.created_at DESC
    `);

    // 各ユーザーの好み情報を取得
    const usersWithPreferences = await Promise.all(
      (users as any[]).map(async (user) => {
        const preferences = await executeQuery(`
          SELECT preference_type, preference_value
          FROM user_preferences
          WHERE user_id = ?
          ORDER BY preference_type, preference_value
        `, [user.id]);

        // 好みを種類別にグループ化
        const groupedPreferences = (preferences as any[]).reduce((acc, pref) => {
          if (!acc[pref.preference_type]) {
            acc[pref.preference_type] = [];
          }
          acc[pref.preference_type].push(pref.preference_value);
          return acc;
        }, {});

        return {
          ...user,
          preferences: groupedPreferences
        };
      })
    );
    
    return NextResponse.json(usersWithPreferences);
  } catch (error) {
    console.error('DB接続エラー:', error);
    return NextResponse.json(
      { error: 'データベースエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
    const { username, bio, age, gender, preferences } = body;
    
    // ユーザーを作成
    const result = await executeQuery(`
      INSERT INTO users (id, cognito_sub, username, bio, age, gender)
      VALUES (UUID(), ?, ?, ?, ?, ?)
    `, [username, username, bio, age, gender]);
    
    const userId = (result as any).insertId;
    
    // 好み情報を挿入
    if (preferences) {
      for (const [type, values] of Object.entries(preferences)) {
        if (Array.isArray(values)) {
          for (const value of values) {
            await executeQuery(`
              INSERT INTO user_preferences (id, user_id, preference_type, preference_value)
              VALUES (UUID(), ?, ?, ?)
            `, [userId, type, value]);
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'ユーザーが作成されました',
      userId: userId
    }, { status: 201 });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
} 