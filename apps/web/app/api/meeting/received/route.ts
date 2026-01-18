export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '../../../../middleware/errorHandler';
import { getUserIdFromRequest } from '../../../../utils/api';
import { executeQuery } from '../../../../utils/database';

// ログ機能
const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// GETエンドポイント：受信した提案リスト取得（DB）
export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // ユーザーのアクティブな全チーム
  const userTeams = await executeQuery(`
    SELECT tm.team_id
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
  `, [currentUserId]) as any[];

  if (!userTeams || userTeams.length === 0) {
    return NextResponse.json([]);
  }

  const teamIds: string[] = Array.from(new Set(userTeams.map((r: any) => r.team_id).filter(Boolean)));
  const placeholders = teamIds.map(() => '?').join(',');

  // 受信した提案
  const receivedProposals = await executeQuery(`
    SELECT
      tmf.id,
      tmf.from_group_id,
      tmf.to_group_id,
      tmf.status,
      tmf.created_at,
      t.name as from_team_name,
      t.description as from_team_description,
      COUNT(tm2.id) as member_count
    FROM team_matching_flows tmf
    JOIN teams t ON tmf.from_group_id = t.id
    LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
    WHERE tmf.to_group_id IN (${placeholders}) AND tmf.status = 0
    GROUP BY tmf.id, tmf.from_group_id, tmf.to_group_id, tmf.status, tmf.created_at, t.name, t.description
    ORDER BY tmf.created_at DESC
  `, teamIds) as any[];

  // 写真1枚
  const proposalsWithPhotos = await Promise.all(
    receivedProposals.map(async (proposal) => {
      const teamPhotos = await executeQuery(`
        SELECT photo_url, display_order
        FROM team_photos
        WHERE team_id = ? AND status = 'active'
        ORDER BY display_order ASC
        LIMIT 1
      `, [proposal.from_group_id]) as any[];

      return {
        ...proposal,
        teamPhotos
      };
    })
  );

  // BigInt -> Number 正規化
  const normalize = (obj: any) => {
    const out: any = {}
    for (const k of Object.keys(obj)) {
      out[k] = typeof obj[k] === 'bigint' ? Number(obj[k]) : obj[k]
    }
    return out
  }

  // レスポンス形式を整形
  const formattedProposals = proposalsWithPhotos.map(p => {
    const proposal = normalize(p)
    return {
      id: proposal.id,
      teamId: proposal.from_group_id,
      teamName: proposal.from_team_name || 'Unknown Team',
      description: proposal.from_team_description || '',
      image: proposal.teamPhotos[0]?.photo_url || '',
      status: 'received',
      createdAt: proposal.created_at,
      userLikesCount: proposal.member_count || 0,
      userApprovalsCount: proposal.member_count || 0,
      allApproved: true
    }
  });

  log.info('受信した提案リスト取得完了', { count: formattedProposals.length });
  return NextResponse.json(formattedProposals);
});

// POSTエンドポイント：受信した提案リスト取得（詳細版）
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      log.error('認証エラー: ユーザーIDが取得できません');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // bodyがある場合は承認/拒否の操作とみなす
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { proposalId, action } = body as { proposalId?: string; action?: 'accept'|'reject' };

    if (proposalId && action) {
      // ユーザーのアクティブな全チーム（権限チェック用）
      const userTeams = await executeQuery(`
        SELECT tm.team_id
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      `, [currentUserId]) as any[];

      const teamIds: string[] = Array.from(new Set(userTeams.map((r: any) => r.team_id).filter(Boolean)));
      if (teamIds.length === 0) {
        return NextResponse.json({ error: '操作可能なチームがありません' }, { status: 403 });
      }

      // 対象フローの検証（自分のいずれかのチーム宛であること）
      const flowRows = await executeQuery(`
        SELECT id, from_group_id, to_group_id, status
        FROM team_matching_flows
        WHERE id = ?
        LIMIT 1
      `, [proposalId]) as any[];

      if (flowRows.length === 0) {
        return NextResponse.json({ error: 'お誘いが見つかりません' }, { status: 404 });
      }

      const flow = flowRows[0];
      if (!teamIds.includes(flow.to_group_id)) {
        return NextResponse.json({ error: 'このお誘いを操作する権限がありません' }, { status: 403 });
      }

      if (action === 'accept') {
        // 成立に更新（マッチ一覧は status=3 を参照）
        await executeQuery(`
          UPDATE team_matching_flows
          SET status = 3, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [proposalId]);

        return NextResponse.json({ success: true, matchData: { id: proposalId } });
      }

      if (action === 'reject') {
        // 却下（任意のステータス値。ここでは 2 を却下とする）
        await executeQuery(`
          UPDATE team_matching_flows
          SET status = 2, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [proposalId]);
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
    }

    // フォールバック: 受信した提案リストを返す（従来の詳細版取得）
    // ユーザーのアクティブな全チームを取得
    const userTeams = await executeQuery(`
      SELECT tm.team_id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
    `, [currentUserId]) as any[];

    if (!userTeams || userTeams.length === 0) {
      return NextResponse.json([]);
    }

    const teamIds: string[] = Array.from(new Set(userTeams.map((r: any) => r.team_id).filter(Boolean)));

    // 受信した提案（他のチームから自分の所属するいずれかのチームへの提案）
    const placeholders = teamIds.map(() => '?').join(',');
    const receivedProposals = await executeQuery(`
      SELECT
        tmf.id,
        tmf.from_group_id,
        tmf.to_group_id,
        tmf.status,
        tmf.created_at,
        t.name as from_team_name,
        t.description as from_team_description,
        COUNT(tm2.id) as member_count
      FROM team_matching_flows tmf
      JOIN teams t ON tmf.from_group_id = t.id
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
      WHERE tmf.to_group_id IN (${placeholders}) AND tmf.status = 0
      GROUP BY tmf.id, tmf.from_group_id, tmf.to_group_id, tmf.status, tmf.created_at, t.name, t.description
      ORDER BY tmf.created_at DESC
    `, teamIds) as any[];

    // 各提案の写真を取得
    const proposalsWithPhotos = await Promise.all(
      receivedProposals.map(async (proposal) => {
        const teamPhotos = await executeQuery(`
          SELECT photo_url, display_order
          FROM team_photos
          WHERE team_id = ? AND status = 'active'
          ORDER BY display_order ASC
          LIMIT 1
        `, [proposal.from_group_id]) as any[];

        return {
          ...proposal,
          teamPhotos
        };
      })
    );

    // BigInt -> Number 正規化
    const normalize = (obj: any) => {
      const out: any = {}
      for (const k of Object.keys(obj)) {
        out[k] = typeof obj[k] === 'bigint' ? Number(obj[k]) : obj[k]
      }
      return out
    }

    // レスポンス形式を整形（正規化込み）
    const formattedProposals = proposalsWithPhotos.map(p => {
      const proposal = normalize(p)
      return {
        id: proposal.id,
        teamId: proposal.from_group_id,
        teamName: proposal.from_team_name || 'Unknown Team',
        description: proposal.from_team_description || '',
        image: proposal.teamPhotos[0]?.photo_url || 'https://via.placeholder.com/120x120/E5B8F7/FFFFFF?text=Team',
        status: 'received',
        createdAt: proposal.created_at,
        userLikesCount: proposal.member_count || 0,
        userApprovalsCount: proposal.member_count || 0,
        allApproved: true
      }
    });

    log.info('受信した提案リスト取得完了', { count: formattedProposals.length });
    return NextResponse.json(formattedProposals);

  } catch (error) {
    log.error('受信した提案リスト/操作エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PATCHエンドポイント：提案への応答
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { proposalId, action } = body as { proposalId?: string; action?: 'accept'|'reject' }
    if (!proposalId || !action) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 開発環境用：accept時はダミーのマッチデータを返す
    if (action === 'accept') {
      return NextResponse.json({ success: true, matchData: { proposalId, roomId: 'room_' + proposalId } })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/meeting/received error', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

