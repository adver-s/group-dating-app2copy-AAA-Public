import jwt from 'jsonwebtoken';

// 新しいデータベース接続を使用
import { prisma } from '../apps/api/lib/database';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key-change-in-production';

export interface User {
  id: number;
  cognito_sub: string;
  username: string;
  email?: string;
  ageVerified?: boolean;
  accountId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  error?: string;
}

export class AuthService {
  /**
   * ユーザー認証
   */
  static async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔍 認証開始:', email);

      // 入力検証
      if (!email || !password) {
        return {
          success: false,
          error: 'メールアドレスとパスワードが必要です'
        };
      }

      // 開発環境用の簡易認証
      if (process.env.NODE_ENV === 'development') {
        return await this.handleDevelopmentAuth(email, password);
      }

      // 本番環境用の認証（将来的に実装）
      return await this.handleProductionAuth(email, password);

    } catch (error) {
      console.error('認証エラー:', error);
      return {
        success: false,
        error: '認証に失敗しました'
      };
    }
  }

  /**
   * 開発環境用認証
   */
  private static async handleDevelopmentAuth(email: string, password: string): Promise<AuthResult> {
    // 開発用パスワード
    const validPasswords = ['password123', 'test123', 'dev123'];

    if (!validPasswords.includes(password)) {
      return {
        success: false,
        error: 'パスワードが正しくありません'
      };
    }

    try {
      // ユーザーをデータベースから取得または作成
      const user = await this.getOrCreateUser(email);

      if (!user) {
        return {
          success: false,
          error: 'ユーザーの作成に失敗しました'
        };
      }

      // JWTトークンを生成
      const accessToken = this.generateToken(user);

      return {
        success: true,
        user,
        accessToken
      };

    } catch (error) {
      console.error('開発認証エラー:', error);
      return {
        success: false,
        error: '認証処理中にエラーが発生しました'
      };
    }
  }

  /**
   * 本番環境用認証（将来的に実装）
   */
  private static async handleProductionAuth(email: string, password: string): Promise<AuthResult> {
    // TODO: 本番環境用の認証ロジックを実装
    return {
      success: false,
      error: '本番認証はまだ実装されていません'
    };
  }

  /**
   * ユーザーを取得または作成
   */
  private static async getOrCreateUser(email: string): Promise<User | null> {
    try {
      // 既存ユーザーを検索（cognito_subで検索）
      let user = await prisma.user.findFirst({
        where: {
          // 開発環境ではemailをcognito_subとして扱う
          cognito_sub: email
        }
      });

      if (user) {
        console.log('✅ 既存ユーザーでログイン:', user.id);
        return {
          id: user.id,
          cognito_sub: user.cognito_sub,
          username: user.username,
          email: email,
          ageVerified: true, // 開発環境では年齢確認済みとする
          accountId: user.id.toString()
        };
      }

      // Cognito Subの生成（開発環境用）
      const cognitoSub = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = email.split('@')[0];

      // 新規ユーザーを作成
      user = await prisma.user.create({
        data: {
          cognito_sub: cognitoSub,
          username: username,
          avatar_url: null,
          bio: null,
          age: null,
          gender: 0,
          cancel_rate: 0,
          last_login: null,
          is_active: true,
          is_verified: false,
        }
      });

      console.log('✅ 新規ユーザーを作成:', user.id);

      return {
        id: user.id,
        cognito_sub: user.cognito_sub,
        username: user.username,
        email: email,
        ageVerified: true,
        accountId: user.id.toString()
      };

    } catch (error) {
      console.error('ユーザー取得/作成エラー:', error);
      return null;
    }
  }

  /**
   * JWTトークンを生成
   */
  private static generateToken(user: User): string {
    const payload = {
      sub: user.id.toString(), // IDを文字列に変換
      email: user.email || user.cognito_sub,
      username: user.username,
      ageVerified: user.ageVerified || false,
      accountId: user.accountId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24時間
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  /**
   * トークンを検証
   */
  static verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return {
        id: parseInt(decoded.sub) || decoded.sub,
        cognito_sub: decoded.email || decoded.sub,
        username: decoded.username,
        email: decoded.email,
        ageVerified: decoded.ageVerified,
        accountId: decoded.accountId
      };
    } catch (error) {
      console.error('トークン検証エラー:', error);
      return null;
    }
  }

  /**
   * ユーザー情報を取得
   */
  static async getUserById(userId: string | number): Promise<User | null> {
    try {
      const id = typeof userId === 'string' ? parseInt(userId) : userId;
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        cognito_sub: user.cognito_sub,
        username: user.username,
        email: user.cognito_sub, // 開発環境ではcognito_subをemailとして扱う
        ageVerified: true,
        accountId: user.id.toString()
      };

    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      return null;
    }
  }

  /**
   * 年齢確認状態を更新
   */
  static async updateAgeVerification(userId: string | number, verified: boolean): Promise<boolean> {
    try {
      const id = typeof userId === 'string' ? parseInt(userId) : userId;
      await prisma.user.update({
        where: { id },
        data: { is_verified: verified }
      });
      return true;
    } catch (error) {
      console.error('年齢確認更新エラー:', error);
      return false;
    }
  }
}
