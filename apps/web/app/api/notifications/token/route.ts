import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token, platform } = body;
    
    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // モック実装：本来はDBにトークンを保存
    return NextResponse.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
} 