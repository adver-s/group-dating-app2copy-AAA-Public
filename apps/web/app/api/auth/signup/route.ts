import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { setLastError } from '../../../../utils/lastError';
import { prisma } from '@/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, birthdate, location, bio, gender, interests } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cognito Subの生成（開発環境用）
    const cognitoSub = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ユーザー名の生成（名前が提供されていない場合は適切なデフォルト名を生成）
    let username = name;
    if (!username || username.trim() === '') {
      // メールアドレスから適切なユーザー名を生成
      const emailPrefix = email.split('@')[0];
      // 数字や特殊文字を除去し、適切なユーザー名にする
      username = emailPrefix.replace(/[^a-zA-Z0-9]/g, '') || 'user';
      // ユーザー名が短すぎる場合は調整
      if (username.length < 3) {
        username = username + Math.random().toString(36).substr(2, 3);
      }
    }

    // ユーザー名の重複回避
    async function generateUniqueUsername(base: string): Promise<string> {
      const sanitized = (base || 'user').toString().trim();
      let candidate = sanitized;
      for (let attempt = 0; attempt < 10; attempt++) {
        // username検索はサポートされなくなりました
        const existing = null; // 仮の実装
        if (!existing) return candidate;
        const suffix = Math.random().toString(36).slice(2, 6);
        candidate = `${sanitized}_${suffix}`;
      }
      return `${sanitized}_${Date.now().toString().slice(-4)}`;
    }

    // データベースにユーザーを登録
    try {
      // 年齢を計算（birthdateから）
      let calculatedAge: number | null = null;
      if (birthdate) {
        const birthDate = new Date(birthdate);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      // genderを数値に正規化
      const parsedGender = (() => {
        if (typeof gender === 'number') return gender;
        if (typeof gender === 'string') {
          const n = parseInt(gender, 10);
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      })();

      const safeUsername = await generateUniqueUsername(username);

      await prisma.user.create({
        data: {
          cognito_sub: cognitoSub,
          email,
          password_hash: passwordHash,
          username: safeUsername,
          avatar_url: null,
          bio: bio ?? null,
          age: calculatedAge,
          gender: parsedGender,
          cancel_rate: 0,
          last_login: null,
          is_active: true,
          is_verified: false
        }
      })
      console.log('✅ User created via Prisma:', cognitoSub);
    } catch (dbError) {
      console.error('❌ Failed to create user via Prisma:', dbError);
      setLastError({
        route: '/api/auth/signup',
        message: (dbError as Error)?.message || 'unknown',
        name: (dbError as Error)?.name,
        stack: (dbError as Error)?.stack,
        data: { email }
      });
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // ユーザー情報を取得（JWT生成用）
    const createdUser = await prisma.user.findUnique({ where: { cognito_sub: cognitoSub } });
    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to retrieve created user' },
        { status: 500 }
      );
    }

    // JWTトークンを生成
    const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';
    const payload = {
      sub: createdUser.id.toString(), // IDを文字列に変換
      email: email,
      name: createdUser.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7日間
    } as const;

    const accessToken = jwt.sign(payload, JWT_SECRET);
    const refreshToken = 'dummy_refresh_token';

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: createdUser.id,
      accessToken,
      refreshToken,
      user: {
        id: createdUser.id,
        email: email,
        name: createdUser.username
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    if (error.message && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 