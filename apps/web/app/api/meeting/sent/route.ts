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

// GETエンドポイント：送信した提案リスト取得（DB）
export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // ユーザーのアクティブなチームを取得
  const userTeamMember = await executeQuery(`
    SELECT
      tm.team_id,
      t.name as team_name,
      t.description as team_description
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
    ORDER BY t.created_at DESC
    LIMIT 1
  `, [currentUserId]) as any[];

  if (userTeamMember.length === 0) {
    return NextResponse.json([]);
  }

  const userTeam = userTeamMember[0];

  // 送信した提案
  const sentProposals = await executeQuery(`
    SELECT
      tmf.id,
      tmf.from_group_id,
      tmf.to_group_id,
      tmf.status,
      tmf.created_at,
      t.name as to_team_name,
      t.description as to_team_description,
      COUNT(tm2.id) as member_count
    FROM team_matching_flows tmf
    JOIN teams t ON tmf.to_group_id = t.id
    LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
    WHERE tmf.from_group_id = ? AND tmf.status IN (0, 1)
    GROUP BY tmf.id, tmf.from_group_id, tmf.to_group_id, tmf.status, tmf.created_at, t.name, t.description
    ORDER BY tmf.created_at DESC
  `, [userTeam.team_id]) as any[];

  // 写真1枚
  const proposalsWithPhotos = await Promise.all(
    sentProposals.map(async (proposal) => {
      const teamPhotos = await executeQuery(`
        SELECT photo_url, display_order
        FROM team_photos
        WHERE team_id = ?
        ORDER BY display_order ASC
        LIMIT 1
      `, [proposal.to_group_id]) as any[];

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
      teamId: proposal.to_group_id,
      teamName: proposal.to_team_name || 'Unknown Team',
      description: proposal.to_team_description || '',
      image: proposal.teamPhotos[0]?.photo_url || '',
      status: proposal.status === 1 ? 'matched' : 'liked',
      createdAt: proposal.created_at,
      userLikesCount: proposal.member_count || 0,
      userApprovalsCount: proposal.member_count || 0,
      allApproved: proposal.status === 1
    }
  });

  log.info('送信した提案リスト取得完了', { count: formattedProposals.length });
  return NextResponse.json(formattedProposals);
});

// POSTエンドポイント：送信した提案リスト取得（詳細版）
export async function POST(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      log.error('認証エラー: ユーザーIDが取得できません');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのアクティブなチームを取得
    const userTeamMember = await executeQuery(`
      SELECT
        tm.team_id,
        t.name as team_name,
        t.description as team_description
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      ORDER BY t.created_at DESC
      LIMIT 1
    `, [currentUserId]) as any[];

    if (userTeamMember.length === 0) {
      return NextResponse.json([]);
    }

    const userTeam = userTeamMember[0];

    // 送信した提案（自分のチームから他のチームへの提案）
    const sentProposals = await executeQuery(`
      SELECT
        tmf.id,
        tmf.from_group_id,
        tmf.to_group_id,
        tmf.status,
        tmf.created_at,
        t.name as to_team_name,
        t.description as to_team_description,
        COUNT(tm2.id) as member_count
      FROM team_matching_flows tmf
      JOIN teams t ON tmf.to_group_id = t.id
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
      WHERE tmf.from_group_id = ? AND tmf.status IN (0, 1)
      GROUP BY tmf.id, tmf.from_group_id, tmf.to_group_id, tmf.status, tmf.created_at, t.name, t.description
      ORDER BY tmf.created_at DESC
    `, [userTeam.team_id]) as any[];

    // 各提案の写真を取得
    const proposalsWithPhotos = await Promise.all(
      sentProposals.map(async (proposal) => {
        const teamPhotos = await executeQuery(`
          SELECT photo_url, display_order
          FROM team_photos
          WHERE team_id = ?
          ORDER BY display_order ASC
          LIMIT 1
        `, [proposal.to_group_id]) as any[];

        return {
          ...proposal,
          teamPhotos
        };
      })
    );

    // BigInt -> Number 正規化関数
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
        teamId: proposal.to_group_id,
        teamName: proposal.to_team_name || 'Unknown Team',
        description: proposal.to_team_description || '',
        image: proposal.teamPhotos[0]?.photo_url || 'https://via.placeholder.com/120x120/F3CABB/FFFFFF?text=Team',
        status: proposal.status === 1 ? 'matched' : 'liked',
        createdAt: proposal.created_at,
        userLikesCount: proposal.member_count || 0,
        userApprovalsCount: proposal.member_count || 0,
        allApproved: proposal.status === 1
      }
    });

    log.info('送信した提案リスト取得完了', { count: formattedProposals.length });
    return NextResponse.json(formattedProposals);

  } catch (error) {
    log.error('送信した提案リスト取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
