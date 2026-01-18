import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// テスト用の保留リストデータを取得
export const GET = async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // テスト用の保留リストデータ
    const testHoldList = [
      {
        id: 'test_hold_1',
        team: {
          id: 'test_team_4',
          name: '男性グループB',
          description: 'テスト用の男性グループBです',
          member_count: 2,
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        },
        status: 'hold',
        createdAt: new Date(Date.now() - 172800000).toISOString() // 2日前
      }
    ];

    log.info('テスト保留リストデータ取得完了', { count: testHoldList.length });
    return NextResponse.json(testHoldList);

  } catch (error) {
    log.error('テスト保留リストデータ取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
};
