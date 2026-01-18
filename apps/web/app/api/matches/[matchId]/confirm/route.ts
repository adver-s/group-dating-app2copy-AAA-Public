import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';
import { getUserIdFromRequest } from '@/utils/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    console.log('🔍 === マッチング承諾API開始 ===');
    console.log('🔍 Match ID:', matchId);
    console.log('🔍 User ID:', currentUserId);

    // マッチングフローが存在するかチェック
    const matchingFlow = await executeQuery(`
      SELECT 
        tmf.id,
        tmf.from_group_id,
        tmf.to_group_id,
        tmf.status,
        t1.name as from_team_name,
        t2.name as to_team_name
      FROM team_matching_flows tmf
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      WHERE tmf.id = ?
    `, [matchId]) as any[];

    if (matchingFlow.length === 0) {
      return NextResponse.json(
        { error: 'マッチングフローが見つかりません' },
        { status: 404 }
      );
    }

    const flow = matchingFlow[0];
    console.log('🔍 マッチングフロー:', flow);

    // ユーザーがこのマッチングに関連するチームのメンバーかチェック
    const userTeam = await executeQuery(`
      SELECT t.id as team_id, t.name as team_name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      AND (t.id = ? OR t.id = ?)
      LIMIT 1
    `, [currentUserId, flow.from_group_id, flow.to_group_id]) as any[];

    if (userTeam.length === 0) {
      return NextResponse.json(
        { error: 'このマッチングに関連するチームのメンバーではありません' },
        { status: 403 }
      );
    }

    console.log('✅ ユーザーのチーム確認完了:', userTeam[0]);

    // マッチングフローのステータスを3（成立）に更新
    await executeQuery(`
      UPDATE team_matching_flows 
      SET status = 3, match_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [matchId]);

    console.log('✅ マッチング成立:', matchId);

    // チャットルームを作成（将来的な拡張のため）
    const chatRoomId = `chat_${matchId}`;
    try {
      await executeQuery(`
        INSERT INTO chat_rooms (id, match_id, name, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          match_id = excluded.match_id,
          name = excluded.name
      `, [chatRoomId, matchId, `${flow.from_team_name} × ${flow.to_team_name}`]);
      
      console.log('✅ チャットルーム作成:', chatRoomId);
    } catch (error) {
      console.log('⚠️ チャットルーム作成スキップ（テーブルが存在しない可能性）:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'マッチングが成立しました！',
      data: {
        matchId,
        chatRoomId,
        teamNames: `${flow.from_team_name} × ${flow.to_team_name}`
      }
    });

  } catch (error) {
    console.error('❌ マッチング承諾API エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 