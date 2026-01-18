import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '../../../../utils/api';
import { withErrorHandler } from '../../../../middleware/errorHandler';

const prisma = new PrismaClient();

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

// チームメンバーの本人確認状況をチェックする関数
async function checkTeamVerificationStatus(teamId: string): Promise<{ allVerified: boolean; unverifiedMembers: string[] }> {
  try {
    // チームの全メンバーを取得
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        team_id: teamId,
        is_active: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            is_verified: true
          }
        }
      }
    });

    const unverifiedMembers = teamMembers
      .filter(member => !member.user.is_verified)
      .map(member => member.user.username);

    const allVerified = unverifiedMembers.length === 0;

    log.info('チーム本人確認状況チェック', {
      teamId,
      totalMembers: teamMembers.length,
      verifiedMembers: teamMembers.filter(m => m.user.is_verified).length,
      unverifiedMembers: unverifiedMembers.length,
      allVerified
    });

    return { allVerified, unverifiedMembers };
  } catch (error) {
    log.error('チーム本人確認状況チェックエラー:', error);
    throw error;
  }
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    log.error('認証エラー: ユーザーIDが取得できません');
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  log.info('スワイプ候補取得開始', { userId: currentUserId });

  try {
    // ユーザーのアクティブなチームを取得
    const userTeamMember = await prisma.teamMember.findFirst({
      where: {
        user_id: currentUserId,
        is_active: true,
        team: {
          is_active: true
        }
      },
      include: {
        team: {
          include: {
            team_target_genders: true
          }
        }
      }
    });

    if (!userTeamMember) {
      log.warn('ユーザーのアクティブなチームが見つかりません', { userId: currentUserId });
      return NextResponse.json({ 
        error: 'アクティブなチームが見つかりません。チームに参加してから再度お試しください。' 
      }, { status: 404 });
    }

    const userTeam = userTeamMember.team;
    const userTargetGenders = userTeam.team_target_genders.map(tg => tg.target_gender);
    
    log.info('ユーザーのチーム情報:', {
      teamId: userTeam.id,
      teamName: userTeam.name,
      gender: userTeam.gender,
      targetGenders: userTargetGenders
    });

    // スワイプ候補を取得（マッチング条件に基づく）
    const candidates = await prisma.team.findMany({
      where: {
        id: { not: userTeam.id },
        is_active: true,
        gender: { in: userTargetGenders }, // ユーザーのターゲットに含まれる性別
        team_target_genders: {
          some: {
            target_gender: userTeam.gender // 相手がユーザーの性別をターゲットにしている
          }
        },
        team_photos: {
          some: {
            status: 'active'
          }
        },
        // 既にスワイプしたチームを除外（後でフィルタリング）
      },
      include: {
        team_photos: {
          where: {
            status: 'active'
          },
          orderBy: {
            display_order: 'asc'
          }
        },
        members: {
          where: {
            is_active: true
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                gender: true
              }
            }
          }
        },
        team_hobbies: true,
        team_target_genders: true
      },
      take: 10
    });

    // 既にスワイプしたチームを除外（テストデータの場合はスキップ）
    let filteredCandidates = candidates;
    let swipedTeamIds: string[] = [];
    
    // 実際のチームデータの場合のみ、既にスワイプしたチームを除外
    if (candidates.length > 0 && !candidates[0].id.startsWith('test_')) {
      const existingFlows = await prisma.team_matching_flows.findMany({
        where: {
          from_group_id: userTeam.id
        },
        select: {
          to_group_id: true
        }
      });

      swipedTeamIds = existingFlows.map(flow => flow.to_group_id);
      filteredCandidates = candidates.filter(candidate => !swipedTeamIds.includes(candidate.id));
    }

    // レスポンス形式を整形
    const candidatesWithPhotos = filteredCandidates.map(candidate => ({
      id: candidate.id,
      teamName: candidate.name,
      description: candidate.description,
      gender: candidate.gender,
      target_gender: candidate.team_target_genders.map(tg => tg.target_gender),
      member_count: candidate.members.length,
      max_members: candidate.max_members,
      approved_photos: candidate.team_photos[0]?.photo_url || '',
      photos: candidate.team_photos.map(photo => photo.photo_url),
      members: candidate.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        gender: member.user.gender
      })),
      hobbies: candidate.team_hobbies.map(hobby => hobby.hobby_tag)
    }));

    log.info('スワイプ候補数:', { 
      total: candidates.length, 
      filtered: candidatesWithPhotos.length,
      swipedCount: swipedTeamIds.length
    });

    if (candidatesWithPhotos.length === 0) {
      log.warn('スワイプ候補が見つかりません', { userTeamId: userTeam.id });
      return NextResponse.json([]);
    }

    return NextResponse.json(candidatesWithPhotos);
  } catch (error) {
    log.error('スワイプ候補取得エラー:', error);
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。' 
    }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const currentUserId = getUserIdFromRequest(req);
  if (!currentUserId) {
    log.error('POST: 認証エラー: ユーザーIDが取得できません');
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { teamId, action } = await req.json();

    if (!teamId || !action || !['like', 'pass', 'hold', 'accept'].includes(action)) {
      log.error('POST: 無効なパラメータ', { teamId, action });
      return NextResponse.json(
        { error: '無効なパラメータです' },
        { status: 400 }
      );
    }

    log.info('スワイプアクション処理開始', { userId: currentUserId, teamId, action });

    // ユーザーのアクティブなチームを取得
    const userTeamMember = await prisma.teamMember.findFirst({
      where: {
        user_id: currentUserId,
        is_active: true,
        team: {
          is_active: true
        }
      },
      include: {
        team: true
      }
    });

    if (!userTeamMember) {
      log.error('POST: アクティブなチームが見つかりません', { userId: currentUserId });
      return NextResponse.json(
        { error: 'アクティブなチームが見つかりません' },
        { status: 400 }
      );
    }

    const userTeam = userTeamMember.team;

    // テストデータの場合は特別処理
    if (teamId.startsWith('test_team_') || teamId.startsWith('test_received_')) {
      log.info('テストデータのスワイプアクション', { teamId, action });
      
      // テストデータのスワイプ結果をローカルストレージに保存（フロントエンドで管理）
      // 実際のアプリでは、データベースに保存する
      
      return NextResponse.json({
        success: true,
        message: `テストデータの${action}アクションを記録しました`,
        action: action,
        isTestData: true,
        teamId: teamId,
        userTeamId: userTeam.id
      });
    }

    // 「いいね」の場合は本人確認状況をチェック
    if (action === 'like') {
      const verificationStatus = await checkTeamVerificationStatus(userTeam.id);
      
      if (!verificationStatus.allVerified) {
        log.warn('本人確認未完了のメンバーがいるため、いいね送信を拒否', {
          teamId: userTeam.id,
          unverifiedMembers: verificationStatus.unverifiedMembers
        });
        
        return NextResponse.json({
          success: false,
          error: '本人確認が完了していないメンバーがいます',
          details: {
            message: 'チームメンバー全員の本人確認が完了するまで、いいねを送信できません',
            unverifiedMembers: verificationStatus.unverifiedMembers
          }
        }, { status: 403 });
      }

      log.info('チームメンバー全員の本人確認完了確認済み', { teamId: userTeam.id });

      // 参照するチームが存在するかを確認
      const targetTeam = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!targetTeam) {
        log.warn('参照するチームが存在しません', { teamId });
        return NextResponse.json({
          success: false,
          error: '参照するチームが見つかりません',
          details: {
            message: '指定されたチームが存在しないか、削除されている可能性があります'
          }
        }, { status: 404 });
      }

      // 既存のマッチングフローをチェック
      const existingFlow = await prisma.team_matching_flows.findFirst({
        where: {
          OR: [
            { from_group_id: userTeam.id, to_group_id: teamId },
            { from_group_id: teamId, to_group_id: userTeam.id }
          ]
        }
      });

      if (!existingFlow) {
        // 新しいマッチングフローを作成
        const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newFlow = await prisma.team_matching_flows.create({
          data: {
            id: flowId,
            from_group_id: userTeam.id,
            to_group_id: teamId,
            status: 0, // 提案中
            updated_at: new Date()
          }
        });
        
        log.info('新しいマッチングフローを作成しました', { 
          flowId: newFlow.id, 
          fromGroup: userTeam.id, 
          toGroup: teamId 
        });
      } else {
        log.info('既存のマッチングフローが存在します', { flowId: existingFlow.id });
      }
    }

    // 「たぶん」の場合は保留リストに追加するロジックを実装
    if (action === 'hold') {
      // 参照するチームが存在するかを確認
      const targetTeam = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!targetTeam) {
        log.warn('参照するチームが存在しません', { teamId });
        return NextResponse.json({
          success: false,
          error: '参照するチームが見つかりません',
          details: {
            message: '指定されたチームが存在しないか、削除されている可能性があります'
          }
        }, { status: 404 });
      }

      // 保留用のマッチングフローまたは別テーブルで管理
      const flowId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const holdFlow = await prisma.team_matching_flows.create({
        data: {
          id: flowId,
          from_group_id: userTeam.id,
          to_group_id: teamId,
          status: 0, // 保留状態
          updated_at: new Date()
        }
      });
      
      log.info('保留フローを作成しました', { 
        flowId: holdFlow.id, 
        fromGroup: userTeam.id, 
        toGroup: teamId 
      });
    }

    // 「accept」の場合はマッチ成立処理
    if (action === 'accept') {
      // 参照するチームが存在するかを確認
      const targetTeam = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!targetTeam) {
        log.warn('参照するチームが存在しません', { teamId });
        return NextResponse.json({
          success: false,
          error: '参照するチームが見つかりません',
          details: {
            message: '指定されたチームが存在しないか、削除されている可能性があります'
          }
        }, { status: 404 });
      }

      // 既存のマッチングフローを確認
      const existingFlow = await prisma.team_matching_flows.findFirst({
        where: {
          OR: [
            { from_group_id: userTeam.id, to_group_id: teamId },
            { from_group_id: teamId, to_group_id: userTeam.id }
          ]
        }
      });

      if (existingFlow) {
        // マッチングフローのステータスを成立に更新
        await prisma.team_matching_flows.update({
          where: { id: existingFlow.id },
          data: { 
            status: 1, // 成立状態
            updated_at: new Date()
          }
        });
        
        log.info('マッチ成立処理完了', { 
          flowId: existingFlow.id, 
          fromGroup: existingFlow.from_group_id, 
          toGroup: existingFlow.to_group_id 
        });
      } else {
        log.warn('マッチングフローが見つかりません', { teamId, userTeamId: userTeam.id });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'スワイプアクションを記録しました',
      action: action
    });

  } catch (error) {
    log.error('POST: スワイプアクション記録エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。' 
      },
      { status: 500 }
    );
  }
});
