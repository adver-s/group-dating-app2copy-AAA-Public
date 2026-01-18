import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const matchingId = searchParams.get('matching_id');
    
    if (!matchingId) {
      return NextResponse.json(
        { error: 'マッチングIDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 予定調整解禁チェック:', { matchingId, currentUserId });

    // マッチングフロー情報を取得
    const flow = await executeQuery(`
      SELECT * FROM team_matching_flows WHERE id = ?
    `, [matchingId]) as any[];

    if (flow.length === 0) {
      return NextResponse.json(
        { error: 'マッチングフローが見つかりません' },
        { status: 404 }
      );
    }

    const flowData = flow[0];

    // 各チームのメンバー数を取得
    const fromTeamMembers = await executeQuery(`
      SELECT COUNT(*) as count
      FROM team_members
      WHERE team_id = ?
    `, [flowData.from_group_id]) as any[];

    const toTeamMembers = await executeQuery(`
      SELECT COUNT(*) as count
      FROM team_members
      WHERE team_id = ?
    `, [flowData.to_group_id]) as any[];

    const fromTeamTotal = fromTeamMembers[0]?.count || 0;
    const toTeamTotal = toTeamMembers[0]?.count || 0;

    // 各チームの「会いたい」意思表示数を取得
    const judgements = await executeQuery(`
      SELECT groupId, judgement
      FROM group_member_judgements
      WHERE matchingId = ?
    `, [matchingId]) as any[];

    const fromTeamWantsMeet = judgements.filter(j => 
      j.groupId === flowData.from_group_id && j.judgement === 'wants_meet'
    ).length;

    const toTeamWantsMeet = judgements.filter(j => 
      j.groupId === flowData.to_group_id && j.judgement === 'wants_meet'
    ).length;

    // 解禁条件: 両チーム全員が「会いたい」意思表示
    const isScheduleUnlocked = 
      fromTeamWantsMeet === fromTeamTotal && 
      toTeamWantsMeet === toTeamTotal && 
      fromTeamTotal > 0 && 
      toTeamTotal > 0;

    return NextResponse.json({
      success: true,
      isScheduleUnlocked,
      progress: {
        fromTeam: {
          wantsMeet: fromTeamWantsMeet,
          total: fromTeamTotal,
          percentage: fromTeamTotal > 0 ? Math.round((fromTeamWantsMeet / fromTeamTotal) * 100) : 0
        },
        toTeam: {
          wantsMeet: toTeamWantsMeet,
          total: toTeamTotal,
          percentage: toTeamTotal > 0 ? Math.round((toTeamWantsMeet / toTeamTotal) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ 予定調整解禁チェックエラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 