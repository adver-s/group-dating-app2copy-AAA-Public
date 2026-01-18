import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const body = await req.json();
    const { userId, intent } = body;

    // マッチングフローを取得
    const flow = await executeQuery(`
      SELECT * FROM team_matching_flows WHERE id = ?
    `, [matchId]) as any[];

    if (flow.length === 0) {
      return NextResponse.json(
        { error: 'マッチングフローが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーの判定を記録または更新
    const judgementId = `${matchId}_${userId}`

    await executeQuery(`
      INSERT INTO group_member_judgements (id, matching_flow_id, userId, intent, judged_at, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(matching_flow_id, userId) DO UPDATE SET
        intent = excluded.intent,
        judged_at = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
    `, [judgementId, matchId, userId, intent]);

    // 全メンバーの判定状況を確認
    const judgements = await executeQuery(`
      SELECT intent FROM group_member_judgements 
      WHERE matching_flow_id = ?
    `, [matchId]);

    const allJudgements = Array.isArray(judgements) ? judgements : [];
    const allApproved = allJudgements.every((j: any) => j.intent === 'approve');
    const anyRejected = allJudgements.some((j: any) => j.intent === 'reject');

    // 全員が承認した場合、マッチングフローを完了に更新
    if (allApproved) {
      await executeQuery(`
        UPDATE team_matching_flows 
        SET status = 3, match_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [matchId]);
    }

    // 誰かが拒否した場合、マッチングフローを拒否に更新
    if (anyRejected) {
      await executeQuery(`
        UPDATE team_matching_flows 
        SET status = 4, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [matchId]);
    }

    return NextResponse.json({
      message: '判定が記録されました',
      flowStatus: allApproved ? 'completed' : anyRejected ? 'rejected' : 'pending'
    });
  } catch (error) {
    console.error('Error recording intent:', error);
    return NextResponse.json(
      { error: '判定の記録に失敗しました' },
      { status: 500 }
    );
  }
} 