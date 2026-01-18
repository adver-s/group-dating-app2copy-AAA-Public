import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

    // 現在のDB構造ではnotificationsテーブルが存在しないため、
    // ダミーデータを返す
    const dummyNotifications = [
      {
        id: '1',
        userId: userId,
        type: 'match',
        title: '新しいマッチが成立しました',
        message: 'Team Alphaとマッチしました！',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        userId: userId,
        type: 'chat',
        title: '新しいメッセージ',
        message: 'チャットルーム1に新しいメッセージがあります',
        isRead: false,
        createdAt: new Date(Date.now() - 300000).toISOString()
      }
    ];
    
    return NextResponse.json(dummyNotifications);
  } catch (error) {
    console.error('通知取得エラー:', error);
    return NextResponse.json(
      { error: '通知取得エラー' },
      { status: 500 }
    );
  }
} 