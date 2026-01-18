export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '../../../../middleware/errorHandler';
import { getUserIdFromRequest } from '../../../../utils/api';
import { removeFromHold } from '../../../../utils/hold-store';
import { prisma } from '@/prisma';

// ログ機能
const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// 共通ユーティリティの利用に切り替え

// GETエンドポイント：スワイプ候補取得
export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    log.error('認証エラー: ユーザーIDが取得できません');
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  log.info('スワイプ候補取得開始', { userId: currentUserId });

  try {
    // ユーザーのアクティブなチームを取得
    const userTeam = await await prisma.$queryRawUnsafe(`
      SELECT t.id as team_id, t.name as team_name, t.description, t.gender
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]) as any[];

    if (!userTeam || userTeam.length === 0) {
      log.warn('ユーザーのアクティブなチームが見つかりません', { userId: currentUserId });
      return NextResponse.json({
        error: 'アクティブなチームが見つかりません。チームに参加してから再度お試しください。'
      }, { status: 404 });
    }

    const userTeamId = userTeam[0].team_id;
    const userTeamGender = userTeam[0].gender;
    log.info('ユーザーのチーム情報:', { teamId: userTeamId, gender: userTeamGender });

   // ユーザーのチームのターゲットジェンダーを取得（teams.target_genderテーブルから）
   // ターゲットジェンダーをteamsテーブルから取得
   const userTeamData = await prisma.team.findUnique({
     where: { id: parseInt(userTeamId) }
   });
   const userTargetGendersRaw = userTeamData?.target_gender ? [userTeamData.target_gender] : [];

   // もしteams.target_genderにデータがない場合は、teamsテーブルのgenderから妥当なデフォルトを設定
   // 性別コード: 0=女子のみ, 1=男女混合, 2=男子のみ
   let userTargetGenders: number[];
   if (userTargetGendersRaw.length > 0) {
     userTargetGenders = userTargetGendersRaw.map(tg => tg);
    } else {
      // デフォルト: 自チームが男子のみ→[女子のみ, 男女混合]、女子のみ→[男子のみ, 男女混合]、男女混合→[女子のみ, 男女混合, 男子のみ]
      if (userTeamGender === 2) {
        userTargetGenders = [0, 1];
      } else if (userTeamGender === 0) {
        userTargetGenders = [1, 2];
      } else {
        userTargetGenders = [0, 1, 2];
      }
    }
    log.info('ユーザーチームのターゲットジェンダー:', userTargetGenders);

    // ユーザーが所属する全チームIDを取得（自己チームの完全除外用）
    const myTeams = await await prisma.$queryRawUnsafe(`
      SELECT DISTINCT team_id FROM team_members WHERE user_id = ?
    `, [currentUserId]) as any[];
    const myTeamIds: string[] = Array.from(new Set(myTeams.map((r: any) => r.team_id).filter(Boolean)));

    const selfTeamsNotInClause = myTeamIds.length > 0
      ? `AND t.id NOT IN (${myTeamIds.map(() => '?').join(',')})`
      : '';

    // スワイプ候補を取得（マッチング条件に基づく）
    const candidates = await await prisma.$queryRawUnsafe(`
      SELECT
        t.id,
        t.name as teamName,
        t.description,
        t.gender,
        COUNT(tm.user_id) as member_count,
        t.max_members,
        GROUP_CONCAT(tp.photo_url) as approved_photos
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
      LEFT JOIN team_photos tp ON t.id = tp.team_id AND tp.status = 'active'
      WHERE t.id != ?
        AND t.is_active = TRUE
        ${selfTeamsNotInClause}
        AND t.id NOT IN (
          SELECT DISTINCT tmf.to_group_id
          FROM team_matching_flows tmf
          WHERE tmf.from_group_id = ?
        )
        AND EXISTS (
          SELECT 1 FROM team_photos tp2
          WHERE tp2.team_id = t.id
        )
        AND (
          -- ユーザーのチームが相手の性別をターゲットにしている
          t.gender IN (${userTargetGenders.map(() => '?').join(',')})
          AND
          -- 相手のチームがユーザーの性別をターゲットにしている
          (
            EXISTS (
              SELECT 1 FROM teams.target_gender ttg
              WHERE ttg.team_id = t.id
              AND ttg.target_gender = ?
            )
            OR
            -- teams.target_genderにデータがない場合は、同性・異性どちらでもマッチング可能
            (
              NOT EXISTS (SELECT 1 FROM teams.target_gender WHERE team_id = t.id)
            )
          )
        )
      GROUP BY t.id, t.name, t.description, t.gender, t.max_members
      ORDER BY RANDOM()
      LIMIT 10
    `, [
      userTeamId, // t.id != ?
      ...myTeamIds, // AND t.id NOT IN (...)
      userTeamId, // subquery from_group_id
      ...userTargetGenders,
      userTeamGender,
    ]) as any[];

    // BigIntをJSON化可能な値へ正規化
    const normalizeRow = (row: any) => {
      const normalized: any = {}
      for (const key of Object.keys(row)) {
        const value = row[key]
        normalized[key] = typeof value === 'bigint' ? Number(value) : value
      }
      return normalized
    }

    // 画像URLを配列に変換 + 正規化
    const candidatesWithPhotos = candidates.map(raw => {
      const candidate = normalizeRow(raw)
      return {
        ...candidate,
        photos: candidate.approved_photos ? String(candidate.approved_photos).split(',') : [],
        target_gender: userTargetGenders
      }
    });

    log.info('スワイプ候補数:', { count: candidatesWithPhotos.length });

    if (candidatesWithPhotos.length === 0) {
      log.warn('スワイプ候補が見つかりません。テストデータを返します。', { userTeamId });

      // テストデータを返す
      const testCandidates = [
        {
          id: 'test-team-1',
          teamName: 'マッドハンターのお茶会',
          description: '不思議な時間を過ごしませんか？お茶とお菓子を囲んで、楽しい会話を楽しみましょう！アリスと一緒に冒険の旅に出かけましょう。',
          gender: 1,
          target_gender: [2],
          max_members: 4,
          member_count: 2,
          approved_photos: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
          photos: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
          ],
          members: [
            { id: 'member-1', username: 'アリス', gender: 2 },
            { id: 'member-2', username: 'マッドハッター', gender: 1 }
          ],
          hobbies: ['お茶', 'お菓子作り', '読書', 'アート']
        },
        {
          id: 'test-team-2',
          teamName: 'チェシャ猫の冒険',
          description: '不思議の国の冒険者たちが集まるチームです。新しい発見と楽しい体験を共有しましょう！チェシャ猫のように自由気ままに、でも仲間思いなメンバーが集まっています。',
          gender: 2,
          target_gender: [1],
          max_members: 3,
          member_count: 1,
          approved_photos: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
          photos: [
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
          ],
          members: [
            { id: 'member-3', username: 'チェシャ猫', gender: 1 }
          ],
          hobbies: ['冒険', '写真', '旅行', '料理']
        },
        {
          id: 'test-team-3',
          teamName: '白うさぎの時計屋',
          description: '時間に追われる現代人に、ゆったりとした時間の流れを提供します。時計の修理とお茶の時間を楽しみましょう！',
          gender: 1,
          target_gender: [2],
          max_members: 2,
          member_count: 1,
          approved_photos: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center',
          photos: [
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center'
          ],
          members: [
            { id: 'member-4', username: '白うさぎ', gender: 2 }
          ],
          hobbies: ['時計修理', 'お茶', 'ガーデニング', 'クラシック音楽']
        }
      ];

      log.info('テストデータを返します:', { count: testCandidates.length });
      return NextResponse.json(testCandidates);
    }

    return NextResponse.json(candidatesWithPhotos);
  } catch (error) {
    log.error('スワイプ候補取得エラー:', error);
    return NextResponse.json({
      error: 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。'
    }, { status: 500 });
  }
});

// POSTエンドポイント：スワイプアクション処理
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { teamId, action } = body as { teamId?: string; action?: 'like'|'pass'|'hold' }
    if (!teamId || !action) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 開発環境用：holdからlike/passする場合はholdストアから削除
    if (action === 'like' || action === 'pass') {
      removeFromHold(teamId)
    }

    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      log.error('認証エラー: ユーザーIDが取得できません');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    log.info('スワイプアクション処理開始', { userId: currentUserId, teamId, action });

    // ユーザーのアクティブなチームを取得
    const userTeam = await await prisma.$queryRawUnsafe(`
      SELECT t.id as team_id, t.name as team_name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [currentUserId]) as any[];

    if (userTeam.length === 0) {
      log.error('POST: アクティブなチームが見つかりません', { userId: currentUserId });
      return NextResponse.json(
        { error: 'アクティブなチームが見つかりません' },
        { status: 400 }
      );
    }

    const userTeamId = userTeam[0].team_id;
    log.info('ユーザーのチームID:', userTeamId);

    // 対象チームの存在確認
    const targetTeam = await await prisma.$queryRawUnsafe(`
      SELECT id, name, is_active
      FROM teams
      WHERE id = ? AND is_active = TRUE
      LIMIT 1
    `, [teamId]) as any[];

    if (targetTeam.length === 0) {
      log.warn('参照するチームが存在しません', { teamId });
      return NextResponse.json(
        { error: '指定されたチームが見つかりません' },
        { status: 404 }
      );
    }

    log.info('対象チーム情報:', { teamId, teamName: targetTeam[0].name });

    // 「いいね」の場合はマッチングフローを作成
    let flowId = null;
    if (action === 'like') {
      // 既存のマッチングフローをチェック（正しいテーブル名とフィールド名を使用）
      const existingFlow = await await prisma.$queryRawUnsafe(`
        SELECT id, from_group_id, to_group_id, status
        FROM team_matching_flows
        WHERE (from_group_id = ? AND to_group_id = ?)
           OR (from_group_id = ? AND to_group_id = ?)
        LIMIT 1
      `, [userTeamId, teamId, teamId, userTeamId]) as any[];

      if (existingFlow.length === 0) {
        // 新しいマッチングフローを作成
        flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await await prisma.$queryRawUnsafe(`
          INSERT INTO team_matching_flows (id, matching_id, from_group_id, to_group_id, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [flowId, flowId, userTeamId, teamId]);

        log.info('新しいマッチングフローを作成しました', { flowId, fromGroup: userTeamId, toGroup: teamId });
      } else {
        flowId = existingFlow[0].id;
        log.info('既存のマッチングフローが存在します', { flowId, existingFlow: existingFlow[0] });
      }
    }

    // ユーザーの判定を記録（正しいカラム名を使用）
    if (flowId) {
      // いいねの場合：実際のマッチングフローIDを使用
      await await prisma.$queryRawUnsafe(`
        INSERT INTO group_member_judgements (matchingId, userId, groupId, judgement, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(matchingId, userId) DO UPDATE SET
          judgement = excluded.judgement,
          groupId = excluded.groupId,
          updatedAt = CURRENT_TIMESTAMP
      `, [flowId, currentUserId, userTeamId, 'LIKE']);

      log.info('判定を記録しました（いいね）', { flowId, action });
    } else if (action === 'pass' || action === 'hold') {
      // pass/holdの場合：ダミーのマッチングIDを使用して判定のみ記録
      const dummyMatchingId = `${action}_${userTeamId}_${teamId}`;

      await await prisma.$queryRawUnsafe(`
        INSERT INTO group_member_judgements (matchingId, userId, groupId, judgement, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(matchingId, userId) DO UPDATE SET
          judgement = excluded.judgement,
          groupId = excluded.groupId,
          updatedAt = CURRENT_TIMESTAMP
      `, [dummyMatchingId, currentUserId, userTeamId, 'PASS']);

      log.info('判定を記録しました（pass/hold）', { dummyMatchingId, action });
    }

    return NextResponse.json({
      success: true,
      message: 'スワイプアクションを記録しました',
      data: { action, flowId }
    });

  } catch (error) {
    log.error('POST: スワイプアクション記録エラー:', error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      log.error('エラー詳細:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。'
      },
      { status: 500 }
    );
  }
}
