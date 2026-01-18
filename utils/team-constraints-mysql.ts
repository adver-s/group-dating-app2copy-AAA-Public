import { executeQuery } from './database';

/**
 * ユーザーがアクティブグループを1つしか持てないようにする制約を管理するユーティリティ（MySQL版）
 */
export class TeamActiveConstraint {
  /**
   * ユーザーの現在のアクティブグループ数を取得
   */
  static async getActiveTeamCount(userId: string): Promise<number> {
    const result = await executeQuery(`
      SELECT COUNT(*) as count
      FROM team_members
      WHERE user_id = ? AND is_active = TRUE
    `, [userId]) as any[];
    
    return result[0]?.count || 0;
  }

  /**
   * ユーザーのアクティブグループを取得
   */
  static async getActiveTeam(userId: string): Promise<any | null> {
    const result = await executeQuery(`
      SELECT tm.*, t.name as team_name, t.description as team_description
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ? AND tm.is_active = TRUE
      LIMIT 1
    `, [userId]) as any[];
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * グループをアクティブに設定（他のグループは非アクティブに）
   */
  static async setActiveTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      // 現在のユーザーの他のチームをすべて非アクティブに設定
      await executeQuery(`
        UPDATE team_members 
        SET is_active = FALSE
        WHERE user_id = ? AND team_id != ?
      `, [userId, teamId]);

      // 指定されたチームをアクティブに設定
      await executeQuery(`
        UPDATE team_members 
        SET is_active = TRUE
        WHERE user_id = ? AND team_id = ?
      `, [userId, teamId]);

      return true;
    } catch (error) {
      console.error('setActiveTeam error:', error);
      throw error;
    }
  }

  /**
   * グループを非アクティブに設定
   */
  static async setInactiveTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      // ユーザーがこのチームのメンバーかチェック
      const membership = await executeQuery(`
        SELECT * FROM team_members 
        WHERE user_id = ? AND team_id = ?
      `, [userId, teamId]) as any[];

      if (membership.length === 0) {
        throw new Error('このチームのメンバーではありません');
      }

      // チームを非アクティブに設定
      await executeQuery(`
        UPDATE team_members 
        SET is_active = FALSE
        WHERE user_id = ? AND team_id = ?
      `, [userId, teamId]);

      return true;
    } catch (error) {
      console.error('setInactiveTeam error:', error);
      throw error;
    }
  }

  /**
   * 制約違反をチェック（一人のユーザーが複数のアクティブグループを持っていないか）
   */
  static async validateConstraint(userId: string): Promise<{ isValid: boolean; activeCount: number }> {
    const activeCount = await this.getActiveTeamCount(userId);
    return {
      isValid: activeCount <= 1,
      activeCount
    };
  }

  /**
   * 制約を強制適用（複数のアクティブグループがある場合、最初の1つ以外を非アクティブに）
   */
  static async enforceConstraint(userId: string): Promise<boolean> {
    try {
      const activeTeams = await executeQuery(`
        SELECT team_id, joined_at
        FROM team_members
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY joined_at ASC
      `, [userId]) as any[];

      if (activeTeams.length <= 1) {
        return true; // 制約は既に満たされている
      }

      // 最初のチーム以外を非アクティブに設定
      const teamsToDeactivate = activeTeams.slice(1);
      const teamIds = teamsToDeactivate.map(team => team.team_id);

      if (teamIds.length > 0) {
        const placeholders = teamIds.map(() => '?').join(',');
        await executeQuery(`
          UPDATE team_members 
          SET is_active = FALSE
          WHERE user_id = ? AND team_id IN (${placeholders})
        `, [userId, ...teamIds]);
      }

      return true;
    } catch (error) {
      console.error('enforceConstraint error:', error);
      throw error;
    }
  }

  /**
   * 全ユーザーの制約をチェック
   */
  static async checkAllUsers(): Promise<{ userId: string; activeCount: number }[]> {
    const result = await executeQuery(`
      SELECT 
        user_id,
        COUNT(*) as active_count
      FROM team_members
      WHERE is_active = TRUE
      GROUP BY user_id
      HAVING COUNT(*) > 1
      ORDER BY active_count DESC
    `) as any[];
    
    return result;
  }

  /**
   * 全ユーザーの制約を修正
   */
  static async fixAllUsers(): Promise<{ fixedUsers: number; errors: string[] }> {
    const violations = await this.checkAllUsers();
    let fixedUsers = 0;
    const errors: string[] = [];

    for (const violation of violations) {
      try {
        await this.enforceConstraint(violation.userId);
        fixedUsers++;
        console.log(`✅ ユーザー ${violation.userId} の制約を修正しました`);
      } catch (error) {
        const errorMsg = `ユーザー ${violation.userId} の制約修正に失敗: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return { fixedUsers, errors };
  }
}
