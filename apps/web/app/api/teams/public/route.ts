import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';
import { withErrorHandler } from '../../../../middleware/errorHandler';

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  log.info('=== 認証なしチーム一覧取得API開始 ===');

  try {
    // すべてのアクティブなチームを取得（認証なし）
    const allTeams = await executeQuery(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.gender,
        t.target_gender_preferences,
        t.created_at,
        t.updated_at,
        t.is_active,
        COUNT(tm2.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = TRUE
      WHERE t.is_active = TRUE
      GROUP BY t.id, t.name, t.description, t.gender, t.target_gender_preferences, t.created_at, t.updated_at, t.is_active
      ORDER BY t.created_at DESC
    `) as any[];

    log.info('全チーム数:', { count: allTeams.length });

    // target_gender_preferencesからtarget_genderを抽出
    const processedTeams = allTeams.map(team => {
      let targetGender = 1; // デフォルト値
      if (team.target_gender_preferences) {
        try {
          const preferences = JSON.parse(team.target_gender_preferences);
          targetGender = preferences[0] || 1;
        } catch (e) {
          console.error('target_gender_preferencesのパースエラー:', e);
        }
      }
      
      return {
        ...team,
        target_gender: targetGender,
        status: 'active' // 認証なしなので全てactiveとして表示
      };
    });

    return NextResponse.json({
      success: true,
      activeGroups: processedTeams,
      waitingGroups: []
    });

  } catch (error) {
    log.error('認証なしチーム一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'チーム一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}); 