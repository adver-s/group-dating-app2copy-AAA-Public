import { withErrorHandler } from '@/middleware/errorHandler';
import { getUserIdFromRequest } from '@/utils/api';
import { executeQuery } from '@/utils/database';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: teamId } = await params;
  const currentUserId = getUserIdFromRequest(req);

  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // チームの存在確認
    const teamRows = await executeQuery(`
      SELECT id, name
      FROM teams 
      WHERE id = ?
    `, [teamId]);

    if (!teamRows || teamRows.length === 0) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
    }

    // ターゲットジェンダー情報を取得
    const targetGenders = await executeQuery(`
      SELECT target_gender
      FROM team_target_genders
      WHERE team_id = ?
    `, [teamId]);

    const targetGenderValues = targetGenders.map(tg => tg.target_gender);

    return NextResponse.json({
      targetGenders: targetGenderValues,
      teamId: teamId
    });

  } catch (error) {
    console.error('Error fetching target genders:', error);
    return NextResponse.json({ error: 'ターゲットジェンダー情報の取得に失敗しました' }, { status: 500 });
  }
});

export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: teamId } = await params;
  const currentUserId = getUserIdFromRequest(req);

  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetGenders } = body;

    if (!Array.isArray(targetGenders)) {
      return NextResponse.json({ error: 'ターゲットジェンダーは配列で指定してください' }, { status: 400 });
    }

    // 既存のターゲットジェンダーを削除
    await executeQuery(`
      DELETE FROM team_target_genders
      WHERE team_id = ?
    `, [teamId]);

    // 新しいターゲットジェンダーを追加
    for (const targetGender of targetGenders) {
      const targetGenderId = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await executeQuery(`
        INSERT INTO team_target_genders (id, team_id, target_gender, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [targetGenderId, teamId, targetGender]);
    }

    return NextResponse.json({
      success: true,
      targetGenders: targetGenders
    });

  } catch (error) {
    console.error('Error updating target genders:', error);
    return NextResponse.json({ error: 'ターゲットジェンダーの更新に失敗しました' }, { status: 500 });
  }
});
