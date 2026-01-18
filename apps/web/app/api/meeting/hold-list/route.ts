import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { getUserIdFromRequest } from '../../../../utils/api';

export async function GET(req: NextRequest) {
  try {
    // JWTから現在のユーザーIDを取得
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのチームを取得
    const userTeam = await executeQuery(`
      SELECT t.id as team_id, t.name as team_name, t.description
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]);

    if (!userTeam || (Array.isArray(userTeam) && userTeam.length === 0)) {
      return NextResponse.json([]);
    }

    const teamData = (Array.isArray(userTeam) ? userTeam[0] : userTeam) as any;
    const userTeamId = teamData.team_id;

    // このユーザーが保留にしたチームを取得
    const holdList = await executeQuery(`
      SELECT 
        gmj.id as judgement_id,
        t.id,
        t.name as teamName,
        t.description as description,
        gmj.judgement,
        gmj.created_at,
        COUNT(DISTINCT tm.user_id) as member_count
      FROM group_member_judgements gmj
      JOIN teams t ON gmj.groupId = t.id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
      WHERE gmj.userId = ? AND gmj.judgement = 'hold'
      GROUP BY gmj.id, t.id, t.name, t.description, gmj.judgement, gmj.created_at
      ORDER BY gmj.created_at DESC
    `, [currentUserId]);

    console.log('保留リストのデータ:', holdList);
    return NextResponse.json(holdList);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, team_id, hidden_until } = body;

    if (!user_id || !team_id) {
      return NextResponse.json(
        { error: 'user_id と team_id は必須です' },
        { status: 400 }
      );
    }

    // 既存の判定を更新または新規作成
    const result = await executeQuery(`
      INSERT INTO group_member_judgements (id, userId, groupId, judgement, updatedAt)
      VALUES (?, ?, ?, 'hold', CURRENT_TIMESTAMP)
    `, [`hold_${Date.now()}`, user_id, team_id]);

    return NextResponse.json({
      success: true,
      message: '保留リストに追加されました'
    }, { status: 201 });
  } catch (error) {
    console.error('保留リスト追加エラー:', error);
    return NextResponse.json(
      { error: '保留リスト追加エラー' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const judgementId = searchParams.get('judgement_id');

    if (!judgementId) {
      return NextResponse.json(
        { error: 'judgement_id は必須です' },
        { status: 400 }
      );
    }

    // 保留リストから削除（group_member_judgementsテーブルから削除）
    const result = await executeQuery(`
      DELETE FROM group_member_judgements 
      WHERE id = ? AND userId = ? AND judgement = 'hold'
    `, [judgementId, currentUserId]);

    console.log(`✅ Removed from hold list: ${judgementId}`);

    return NextResponse.json({
      success: true,
      message: '保留リストから削除されました'
    });
  } catch (error) {
    console.error('保留リスト削除エラー:', error);
    return NextResponse.json(
      { error: '保留リスト削除エラー' },
      { status: 500 }
    );
  }
} 