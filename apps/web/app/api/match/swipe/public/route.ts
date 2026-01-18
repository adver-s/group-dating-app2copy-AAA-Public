import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../utils/database';
import { withErrorHandler } from '../../../../../middleware/errorHandler';

const log = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.log(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  log.info('=== 認証なしスワイプ候補取得API開始 ===');

  try {
    // すべてのアクティブなチームを候補として取得（認証なし）
    const candidates = await executeQuery(`
      SELECT 
        t.id,
        t.name as teamName,
        t.description,
        t.gender,
        t.target_gender_preferences,
        COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
      WHERE t.is_active = TRUE
      GROUP BY t.id, t.name, t.description, t.gender, t.target_gender_preferences
      ORDER BY RAND()
      LIMIT 10
    `) as any[];

    log.info('認証なしスワイプ候補数:', { count: candidates.length });

    // target_gender_preferencesからtarget_genderを抽出
    const processedCandidates = candidates.map(candidate => {
      let targetGender = 1; // デフォルト値
      if (candidate.target_gender_preferences) {
        try {
          const preferences = JSON.parse(candidate.target_gender_preferences);
          targetGender = preferences[0] || 1;
        } catch (e) {
          console.error('target_gender_preferencesのパースエラー:', e);
        }
      }
      
      return {
        ...candidate,
        target_gender: targetGender
      };
    });

    return NextResponse.json(processedCandidates);
  } catch (error) {
    log.error('認証なしスワイプ候補取得エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}); 