import { executeQuery } from '@/utils/database';
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../../utils/api';

// 招待コードを生成する関数
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 招待コードを取得または生成
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // チームの存在確認と権限チェック
    const teamRows = await executeQuery(`
      SELECT t.id, t.name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ?
    `, [teamId, currentUserId]);

    if (!teamRows || teamRows.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つからないか、メンバーではありません' },
        { status: 404 }
      );
    }

    const team = teamRows[0];

    // 既存の招待コードを確認
    const inviteCodeRows = await executeQuery(`
      SELECT code, expires_at
      FROM invite_codes
      WHERE team_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [teamId]);

    let inviteCode = inviteCodeRows.length > 0 ? inviteCodeRows[0] : null;

    // 招待コードが存在しない場合は新しく生成
    if (!inviteCode) {
      let newCode: string;
      let isUnique = false;

      // ユニークなコードを生成するまで繰り返し
      while (!isUnique) {
        newCode = generateInviteCode();
        const existingCodeRows = await executeQuery(`
          SELECT id
          FROM invite_codes
          WHERE code = ?
        `, [newCode]);

        if (existingCodeRows.length === 0) {
          isUnique = true;
        }
      }

      const inviteCodeId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日後

      const now = new Date().toISOString();
      await executeQuery(`
        INSERT INTO invite_codes (id, code, team_id, created_by, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [inviteCodeId, newCode!, teamId, currentUserId, now, expiresAt]);

      inviteCode = {
        code: newCode!,
        expires_at: expiresAt
      };
    }

    return NextResponse.json({
      inviteCode: inviteCode.code,
      expiresAt: inviteCode.expires_at,
      teamName: team.name
    });

  } catch (error) {
    console.error('招待コード取得エラー:', error);
    return NextResponse.json(
      { error: '招待コードの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 招待コードを再生成
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const currentUserId = getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // チームの存在確認と権限チェック
    const teamRows = await executeQuery(`
      SELECT t.id, t.name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ?
    `, [teamId, currentUserId]);

    if (!teamRows || teamRows.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つからないか、メンバーではありません' },
        { status: 404 }
      );
    }

    const team = teamRows[0];

    // 既存の招待コードを削除
    await executeQuery(`
      DELETE FROM invite_codes
      WHERE team_id = ?
    `, [teamId]);

    // 新しい招待コードを生成
    let newCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      newCode = generateInviteCode();
      const existingCodeRows = await executeQuery(`
        SELECT id
        FROM invite_codes
        WHERE code = ?
      `, [newCode]);
      if (existingCodeRows.length === 0) {
        isUnique = true;
      }
    }

    const inviteCodeId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日後

    const now2 = new Date().toISOString();
    await executeQuery(`
      INSERT INTO invite_codes (id, code, team_id, created_by, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [inviteCodeId, newCode, teamId, currentUserId, now2, expiresAt]);

    return NextResponse.json({
      inviteCode: newCode,
      expiresAt: expiresAt,
      teamName: team.name
    });

  } catch (error) {
    console.error('招待コード再生成エラー:', error);
    return NextResponse.json(
      { error: '招待コードの再生成に失敗しました' },
      { status: 500 }
    );
  }
}
