import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// テスト用の提案データを取得
export const GET = async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // テスト用の提案データ（実際のデータベースから取得する代わり）
    const testProposals = [
      {
        id: 'test_proposal_1',
        team: {
          id: 'test_team_1',
          name: '男性グループA',
          description: 'テスト用の男性グループです',
          member_count: 3,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        },
        status: 'sent',
        createdAt: new Date().toISOString()
      },
      {
        id: 'test_proposal_2',
        team: {
          id: 'test_team_2',
          name: '女性グループA',
          description: 'テスト用の女性グループです',
          member_count: 2,
          photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop'
        },
        status: 'sent',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1日前
      }
    ];

    log.info('テスト提案データ取得完了', { count: testProposals.length });
    return NextResponse.json(testProposals);

  } catch (error) {
    log.error('テスト提案データ取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
};
