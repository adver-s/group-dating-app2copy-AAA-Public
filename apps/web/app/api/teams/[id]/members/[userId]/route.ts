import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';
import { getUserIdFromRequest } from '@/utils/api';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: teamId, userId } = await params;
    console.log('🔧 === メンバー削除API開始 ===');
    console.log('🔍 Team ID:', teamId);
    console.log('🔍 User ID to remove:', userId);
    
    // チームが存在するかチェック
    const team = await executeQuery(`
      SELECT id, name, created_by
      FROM teams
      WHERE id = ?
    `, [teamId]) as any[];

    if (!team || team.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // 削除権限チェック（チーム作成者または削除対象ユーザー本人のみ）
    if (team[0].created_by !== currentUserId && userId !== currentUserId) {
      return NextResponse.json(
        { error: '削除権限がありません' },
        { status: 403 }
      );
    }

    // メンバーが存在するかチェック
    const existingMember = await executeQuery(`
      SELECT id FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [teamId, userId]) as any[];

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'メンバーが見つかりません' },
        { status: 404 }
      );
    }

    // チーム作成者を削除しようとしている場合はエラー
    if (team[0].created_by === userId) {
      return NextResponse.json(
        { error: 'チーム作成者は削除できません' },
        { status: 400 }
      );
    }

    // メンバーを削除
    await executeQuery(`
      DELETE FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [teamId, userId]);
    
    console.log(`✅ User ${userId} removed from team ${teamId}`);

    return NextResponse.json({
      success: true,
      message: 'メンバーを削除しました'
    });

  } catch (error) {
    console.error('Error removing member from team:', error);
    return NextResponse.json(
      { error: 'メンバーの削除に失敗しました' },
      { status: 500 }
    );
  }
}
