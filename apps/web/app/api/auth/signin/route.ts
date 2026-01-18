import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../utils/auth-improved';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Signin API called');
    const body = await req.json();
    const { email, password } = body;

    console.log('🔍 Request body:', { email, password: password ? '***' : 'undefined' });

    // 新しい認証サービスを使用
    const result = await AuthService.authenticate(email, password);

    if (result.success) {
      return NextResponse.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 