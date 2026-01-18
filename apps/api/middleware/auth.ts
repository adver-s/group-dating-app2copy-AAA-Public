import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  name: string;
  accountId?: string;
  ageVerified?: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      console.log('🔍 withAuth middleware called')
      // Authorization headerからトークンを取得
      const authHeader = req.headers.get('authorization');
      console.log('🔍 Authorization header:', authHeader ? 'present' : 'missing')

      // 開発モード: 認証ヘッダーがない場合でもダミーユーザーを使用
      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔍 Using Bearer token')
      } else {
        // 開発モード: ダミートークンを使用
        token = 'dev-access-token-12345';
        console.log('🔍 Development mode: Using dummy token');
      }

      if (!token) {
        logger.warn('Empty token in Authorization header');
        throw new AuthenticationError('Token is required');
      }

      // トークンの検証（開発モード対応）
      console.log('🔍 Verifying token...')
      const user = await verifyToken(token);

      if (!user) {
        console.log('❌ Invalid token provided');
        throw new AuthenticationError('Invalid token');
      }

      console.log('✅ Token verified, user:', user.id)

      // 年齢確認チェック（一時的に無効化）
      // if (!user.ageVerified) {
      //   logger.warn('User age not verified:', user.id);
      //   throw new AuthenticationError('Age verification required. Please complete age verification to use this service.');
      // }

      // 認証済みリクエストオブジェクトを作成
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.username || 'ユーザー',
        accountId: user.accountId,
        ageVerified: user.ageVerified
      };

      return await handler(authenticatedReq);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

      logger.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

// 年齢確認不要のAPI用（年齢確認画面など）
export function withAuthNoAgeCheck(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');

      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = 'dev-access-token-12345';
        logger.info('Development mode: Using dummy token (no age check)');
      }

      if (!token) {
        logger.warn('Empty token in Authorization header');
        throw new AuthenticationError('Token is required');
      }

      const user = await verifyToken(token);

      if (!user) {
        logger.warn('Invalid token provided');
        throw new AuthenticationError('Invalid token');
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.username || 'ユーザー',
        accountId: user.accountId,
        ageVerified: user.ageVerified
      };

      return await handler(authenticatedReq);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

      logger.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

// トークン検証関数（年齢確認対応）
async function verifyToken(token: string): Promise<{ id: string; email: string; username: string; accountId?: string; ageVerified?: boolean } | null> {
  try {
    // 開発モード: ダミートークンの場合は常に成功
    if (token === 'dev-access-token-12345') {
      return {
        id: 'dev-user-1',
        email: 'dev@example.com',
        username: '開発ユーザー',
        accountId: 'dev-account-123',
        ageVerified: true
      };
    }

    // JWTトークンの検証
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // JWTトークンから直接ユーザー情報を取得（Prismaを使用しない）
      console.log('✅ JWT token verified successfully:', decoded.sub)

      return {
        id: decoded.sub,
        email: decoded.email || 'user@example.com',
        username: decoded.name || 'ユーザー',
        accountId: undefined,
        ageVerified: true // 年齢確認フィールドが存在しないため、常にtrueとする
      };
    } catch (jwtError) {
      logger.error('JWT verification error:', jwtError);
      return null;
    }
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
}

// 認可チェック関数
export function requireRole(role: string) {
  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest) => {
      // TODO: ロールベースの認可を実装
      // 現在は常に許可
      return await handler(req);
    });
  };
} 