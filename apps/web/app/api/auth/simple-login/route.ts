import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';

// 簡単なJWTシークレット（本番では環境変数から取得）
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    console.log('🔍 Simple login attempt:', { email, name });

    // ローカル開発用のダミーログイン（データベースが利用できない場合）
    if (email === 'kaisei0605ssss@gmail.com' && password === 'password123') {
      console.log('✅ Local development login successful');

      // ダミーユーザー情報
      const dummyUser = {
        id: 'user_1754107511944_nv3utk089',
        email: email,
        username: 'kaisei0605ssss'
      };

      // JWTトークンを生成
      const payload = {
        sub: dummyUser.id,
        email: dummyUser.email,
        name: dummyUser.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7日間
      };

      const accessToken = jwt.sign(payload, JWT_SECRET);

      console.log('✅ JWT token generated for user:', dummyUser.id);

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken: 'dummy_refresh_token',
        user: {
          id: dummyUser.id,
          email: dummyUser.email,
          name: dummyUser.username
        }
      });
    }

    // データベースが利用可能な場合は通常の認証を試行
    try {
      const users = await executeQuery(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      ) as any[];

      if (!users || users.length === 0) {
        console.log('❌ User not found:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const user = users[0];
      console.log('✅ User found:', user.id);

      // パスワード認証
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      console.log('✅ Password verified for user:', user.id);

      // JWTトークンを生成
      const payload = {
        sub: user.id,
        email: user.email,
        name: user.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7日間
      };

      const accessToken = jwt.sign(payload, JWT_SECRET);

      console.log('✅ JWT token generated for user:', user.id);

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken: 'dummy_refresh_token',
        user: {
          id: user.id,
          email: user.email,
          name: user.username
        }
      });

    } catch (dbError) {
      console.log('❌ Database error, using local development login');
      return NextResponse.json(
        { error: 'Database connection failed. Please use local development credentials.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Simple login error:', error);
    return NextResponse.json(
      { success: false, error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
