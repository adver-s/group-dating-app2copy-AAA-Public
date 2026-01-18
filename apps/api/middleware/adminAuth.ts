import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'local-dev-secret-key';

export interface AdminAuthenticatedRequest extends NextRequest {
  adminUser?: {
    id: string;
    username: string;
    role: string;
  };
}

export function withAdminAuth(handler: (req: AdminAuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Authorization headerからトークンを取得
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Missing or invalid Authorization header for admin access');
        return NextResponse.json(
          { error: 'Authorization header is required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        console.warn('Empty token in Authorization header for admin access');
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 401 }
        );
      }

      // トークンの検証
      const user = await verifyAdminToken(token);
      
      if (!user) {
        console.warn('Invalid token provided for admin access');
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // 管理者権限の確認
      if (!isAdminRole(user.role)) {
        console.warn(`User ${user.id} attempted admin access with role: ${user.role}`);
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // 認証済みリクエストオブジェクトを作成
      const authenticatedReq = req as AdminAuthenticatedRequest;
      authenticatedReq.adminUser = user;

      return await handler(authenticatedReq);
    } catch (error) {
      console.error('Admin authentication error:', error);
      return NextResponse.json(
        { error: 'Admin authentication failed' },
        { status: 401 }
      );
    }
  };
}

// 管理者トークン検証関数
async function verifyAdminToken(token: string): Promise<{ id: string; username: string; role: string } | null> {
  try {
    // JWT検証
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || decoded.type !== 'admin') {
      return null;
    }

    return {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
}

// 管理者権限の確認
function isAdminRole(role: string): boolean {
  return ['admin', 'super_admin', 'moderator'].includes(role);
}

// 特定の管理者権限を要求する関数
export function requireAdminRole(requiredRole: string) {
  return function(handler: (req: AdminAuthenticatedRequest) => Promise<NextResponse>) {
    return withAdminAuth(async (req: AdminAuthenticatedRequest) => {
      const adminUser = req.adminUser;
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Admin user not found' },
          { status: 401 }
        );
      }

      // 権限レベルの確認
      const roleHierarchy = {
        'user': 0,
        'moderator': 1,
        'admin': 2,
        'super_admin': 3
      };

      const userLevel = roleHierarchy[adminUser.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

      if (userLevel < requiredLevel) {
        console.warn(`User ${adminUser.id} attempted access requiring role: ${requiredRole}, but has: ${adminUser.role}`);
        return NextResponse.json(
          { error: `Access requires ${requiredRole} role` },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}
