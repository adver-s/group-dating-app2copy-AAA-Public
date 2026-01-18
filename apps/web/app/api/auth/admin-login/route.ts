import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Admin login API called');
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードが必要です' },
        { status: 400 }
      );
    }

    // 管理者ユーザーの検証
    const adminUser = await verifyAdminUser(username, password);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 管理者権限の確認
    if (!isAdminRole(adminUser.role)) {
      return NextResponse.json(
        { error: '管理者権限がありません' },
        { status: 403 }
      );
    }

    // 管理者トークンの生成
    const adminToken = jwt.sign(
      {
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' } // 管理者トークンは短い有効期限
    );

    console.log('✅ Admin login successful:', adminUser.username);

    return NextResponse.json({
      success: true,
      adminToken,
      adminUser: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json(
      { error: '管理者ログインに失敗しました' },
      { status: 500 }
    );
  }
}

// 管理者ユーザーの検証
async function verifyAdminUser(username: string, password: string) {
  try {
    // 開発環境用の簡易管理者ユーザー
    const adminUsers = [
      {
        id: 'admin-123',
        username: 'admin',
        role: 'admin'
      },
      {
        id: 'super-admin-456',
        username: 'superadmin',
        role: 'super_admin'
      }
    ];

    const adminUser = adminUsers.find(user => user.username === username);
    
    if (!adminUser) {
      return null;
    }

    // 開発環境用の簡易パスワード検証
    if (password === 'admin123') {
      return adminUser;
    }

    return null;
  } catch (error) {
    console.error('Admin user verification error:', error);
    return null;
  }
}

// 管理者権限の確認
function isAdminRole(role: string): boolean {
  return ['admin', 'super_admin', 'moderator'].includes(role);
}
