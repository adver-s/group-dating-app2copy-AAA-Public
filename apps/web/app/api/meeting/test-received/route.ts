import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// テスト用の受信提案データを取得
export const GET = async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // テスト用の受信提案データ
    const testReceivedProposals = [
      {
        id: 'test_received_1',
        team: {
          id: 'test_team_3',
          name: '男女混合グループA',
          description: 'テスト用の男女混合グループです',
          member_count: 4,
          photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop'
        },
        status: 'received',
        createdAt: new Date().toISOString()
      }
    ];

    log.info('テスト受信提案データ取得完了', { count: testReceivedProposals.length });
    return NextResponse.json(testReceivedProposals);

  } catch (error) {
    log.error('テスト受信提案データ取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
};
