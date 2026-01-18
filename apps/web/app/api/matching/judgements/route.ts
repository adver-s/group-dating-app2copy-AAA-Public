import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../utils/api';
import { executeQuery } from '../../../../utils/database';
import {
  generateJudgementId,
  userJudgementHistoryService,
  userJudgementLatestService
} from '../../../../utils/dynamodb';

// 判定履歴を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetGroupId = searchParams.get('target_group_id');
    const userId = searchParams.get('user_id');

    if (!targetGroupId) {
      return NextResponse.json(
        { error: '対象グループIDが必要です' },
        { status: 400 }
      );
    }

    // テストデータの場合は空の配列を返す
    if (targetGroupId.startsWith('test-')) {
      console.log('テストデータの判定を要求されました:', targetGroupId);
      return NextResponse.json([]);
    }

    let judgements = [];

    if (userId) {
      // 特定ユーザーの判定履歴を取得
      judgements = await userJudgementHistoryService.getJudgementsByUser(userId);
      judgements = judgements.filter(j => j.targetGroupId === targetGroupId);
    } else {
      // グループ全体の判定履歴を取得
      judgements = await userJudgementHistoryService.getJudgementsByGroup(targetGroupId);
    }

    // ユーザー情報を追加
    const judgementsWithUserInfo = await Promise.all(
      judgements.map(async (judgement) => {
        const user = await executeQuery(`
          SELECT username, avatar_url
          FROM users
          WHERE id = ?
        `, [judgement.userId]) as any[];

        return {
          ...judgement,
          user_name: user[0]?.username || 'Unknown',
          user_avatar: user[0]?.avatar_url || null
        };
      })
    );

    return NextResponse.json(judgementsWithUserInfo);
  } catch (error) {
    console.error('メンバー判定取得エラー:', error);
    return NextResponse.json(
      { error: 'メンバー判定取得エラー' },
      { status: 500 }
    );
  }
}

// 判定を送信
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 === 判定送信API開始 ===');

    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { targetGroupId, status, phase = 1 } = await req.json();

    console.log(`👥 User ${currentUserId} sending judgement: ${status} for group: ${targetGroupId}`);

    if (!targetGroupId || status === undefined) {
      return NextResponse.json(
        { error: '対象グループIDと判定が必要です' },
        { status: 400 }
      );
    }

    // 有効な判定値かチェック
    const validStatuses = [0, 1, 2]; // 0: 未判定, 1: いいね, 2: スキップ
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '無効な判定値です' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const judgementId = generateJudgementId();

    // 判定履歴テーブルに記録
    await userJudgementHistoryService.createJudgement({
      userId: currentUserId,
      targetGroupId,
      judgementId,
      status,
      phase,
      createdAt: now,
      updatedAt: now
    });

    // 最新判定テーブルを更新
    await userJudgementLatestService.updateLatestJudgement({
      userId: currentUserId,
      targetGroupId,
      status,
      phase,
      updatedAt: now
    });

    console.log(`✅ 判定を記録しました: ${judgementId}`);

    // グループ全体の判定状況を確認
    const groupJudgements = await userJudgementLatestService.getGroupJudgements(targetGroupId);

    // 判定統計を計算
    const totalJudgements = groupJudgements.length;
    const likeCount = groupJudgements.filter(j => j.status === 1).length;
    const skipCount = groupJudgements.filter(j => j.status === 2).length;
    const pendingCount = groupJudgements.filter(j => j.status === 0).length;

    console.log('🔍 グループ判定状況:', {
      targetGroupId,
      totalJudgements,
      likeCount,
      skipCount,
      pendingCount,
      judgements: groupJudgements.map(j => ({ userId: j.userId, status: j.status }))
    });

    // リアルタイム更新のための通知データを準備
    const notificationData = {
      type: 'judgement_update',
      targetGroupId,
      currentUserId,
      judgement: status,
      groupStats: {
        totalJudgements,
        likeCount,
        skipCount,
        pendingCount
      },
      timestamp: now
    };

    // WebSocketやServer-Sent Eventsでリアルタイム通知を送信
    // ここではログ出力のみ（実際の実装ではWebSocketを使用）
    console.log('📡 リアルタイム通知送信:', notificationData);

    return NextResponse.json({
      success: true,
      message: '判定を記録しました',
      judgementId,
      groupStats: {
        totalJudgements,
        likeCount,
        skipCount,
        pendingCount
      },
      notificationData
    });

  } catch (error) {
    console.error('❌ 判定送信API エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 