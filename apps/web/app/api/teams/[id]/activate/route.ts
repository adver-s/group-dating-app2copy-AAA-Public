import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/utils/database';
import { TeamActiveConstraint } from '@/utils/team-constraints';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: teamId } = await params;
    const currentUserId = 'ecc20c18-6516-11f0-9176-069696d86c17'; // テスト用ユーザーID

    console.log('🔧 === チームアクティブ化API開始 ===');
    console.log('🔍 User ID:', currentUserId);
    console.log('🔍 Team ID:', teamId);

    // チームが存在するかチェック
    const team = await executeQuery(`
      SELECT id, name, is_active
      FROM teams
      WHERE id = ?
    `, [teamId]) as any[];

    if (!team || team.length === 0) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // 新しい制約システムを使用してチームをアクティブに設定
    try {
      await TeamActiveConstraint.setActiveTeam(currentUserId, teamId);
      
      console.log(`✅ User ${currentUserId} activated team ${teamId}`);
      
      // 更新されたチーム情報を取得
      const updatedTeam = await executeQuery(`
        SELECT t.*, tm.is_active as user_is_active
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE t.id = ? AND tm.user_id = ?
      `, [teamId, currentUserId]) as any[];

      // 制約が正しく適用されているか検証
      const constraintValidation = await TeamActiveConstraint.validateConstraint(currentUserId);
      
      return NextResponse.json({
        success: true,
        message: 'チームをアクティブに設定しました',
        team: updatedTeam[0],
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

  } catch (error) {
    console.error('❌ チームアクティブ化API エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 