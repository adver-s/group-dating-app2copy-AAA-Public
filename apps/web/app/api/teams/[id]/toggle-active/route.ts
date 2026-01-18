import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';
import { getUserIdFromRequest } from '@/utils/api';
import { TeamActiveConstraint } from '@/utils/team-constraints';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUserId = getUserIdFromRequest(req);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: groupId } = await params;
    console.log('🔧 === グループ出動状態切り替えAPI開始 ===');
    console.log('🔍 User ID:', currentUserId);
    console.log('🔍 Group ID:', groupId);
    
    // チームが存在するかチェック
    const team = await executeQuery(`
      SELECT id, name
      FROM teams
      WHERE id = ?
    `, [groupId]) as any[];

    if (!team || team.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーがこのチームに所属しているかチェック
    const userMembership = await executeQuery(`
      SELECT team_id, is_active
      FROM team_members
      WHERE user_id = ? AND team_id = ?
    `, [currentUserId, groupId]) as any[];

    if (!userMembership || userMembership.length === 0) {
      return NextResponse.json(
        { error: 'このチームのメンバーではありません' },
        { status: 403 }
      );
    }

    const isCurrentlyActive = userMembership[0].is_active === 1;

    if (isCurrentlyActive) {
      // 現在アクティブなチームを非アクティブに切り替え
      try {
        await TeamActiveConstraint.setInactiveTeam(currentUserId, groupId);
        
        console.log(`✅ User ${currentUserId} switched team ${groupId} to inactive`);
        
        // イベントを発行して他のコンポーネントに通知
        // Note: サーバーサイドでは直接イベントを発行できないため、
        // クライアントサイドでイベントを発行するように実装する
        
        return NextResponse.json({
          success: true,
          message: 'チームを待機状態に切り替えました',
          teamName: team[0].name,
          isActive: false,
          eventType: 'team-deactivated'
        });
      } catch (error) {
        console.error('❌ チーム非アクティブ化エラー:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
          { status: 400 }
        );
      }
    } else {
      // 他のチームをアクティブに切り替え（制約により他のチームは自動的に非アクティブになる）
      try {
        await TeamActiveConstraint.setActiveTeam(currentUserId, groupId);
        
        console.log(`✅ User ${currentUserId} switched team ${groupId} to active`);
        
        // 制約が正しく適用されているか検証
        const constraintValidation = await TeamActiveConstraint.validateConstraint(currentUserId);
        
        // 新しいアクティブチームのマッチング状態をクリア
        try {
          const clearResponse = await fetch(`${req.nextUrl.origin}/api/teams/clear-matching-state`, {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('authorization') || '',
              'Content-Type': 'application/json',
            },
          });
          
          if (clearResponse.ok) {
            const clearData = await clearResponse.json();
            console.log('✅ マッチング状態クリア結果:', clearData);
          }
        } catch (clearError) {
          console.warn('⚠️ マッチング状態クリアでエラーが発生しました:', clearError);
        }
        
        // イベントを発行して他のコンポーネントに通知
        // Note: サーバーサイドでは直接イベントを発行できないため、
        // クライアントサイドでイベントを発行するように実装する
        
        return NextResponse.json({
          success: true,
          message: 'チームをアクティブに切り替えました',
          teamName: team[0].name,
          isActive: true,
          eventType: 'team-activated',
          constraintValidation: {
            isValid: constraintValidation.isValid,
            activeCount: constraintValidation.activeCount
          }
        });
      } catch (error) {
        console.error('❌ チームアクティブ化エラー:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('❌ グループ出動状態切り替えAPI エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 