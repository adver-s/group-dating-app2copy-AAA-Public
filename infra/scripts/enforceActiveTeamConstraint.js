require('dotenv').config();
const connectAurora = require('./connectAurora');

async function enforceActiveTeamConstraint() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 === アクティブチーム制約強制適用開始 ===');
    
    // 複数のアクティブチームを持つユーザーを検出
    const [usersWithMultipleActiveTeams] = await connection.execute(`
      SELECT 
        user_id,
        COUNT(*) as active_count
      FROM team_members
      WHERE is_active = TRUE
      GROUP BY user_id
      HAVING COUNT(*) > 1
      ORDER BY active_count DESC
    `);
    
    console.log(`📊 複数のアクティブチームを持つユーザー数: ${usersWithMultipleActiveTeams.length}`);
    
    if (usersWithMultipleActiveTeams.length === 0) {
      console.log('✅ 制約違反は検出されませんでした');
      return;
    }
    
    // 各ユーザーに対して制約を適用
    for (const user of usersWithMultipleActiveTeams) {
      console.log(`🔧 ユーザー ${user.user_id} の制約を適用中... (アクティブチーム数: ${user.active_count})`);
      
      // ユーザーのアクティブチームを取得（参加日時順）
      const [activeTeams] = await connection.execute(`
        SELECT 
          team_id,
          joined_at
        FROM team_members
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY joined_at ASC
      `, [user.user_id]);
      
      // 最初のチーム以外を非アクティブに設定
      const teamsToDeactivate = activeTeams.slice(1);
      
      if (teamsToDeactivate.length > 0) {
        const teamIds = teamsToDeactivate.map(team => team.team_id);
        
        await connection.execute(`
          UPDATE team_members 
          SET is_active = FALSE 
          WHERE user_id = ? AND team_id IN (${teamIds.map(() => '?').join(',')})
        `, [user.user_id, ...teamIds]);
        
        console.log(`  ✅ ${teamsToDeactivate.length}個のチームを非アクティブに設定しました`);
        
        // チーム名を表示
        for (const team of teamsToDeactivate) {
          const [teamInfo] = await connection.execute(`
            SELECT name FROM teams WHERE id = ?
          `, [team.team_id]);
          
          if (teamInfo.length > 0) {
            console.log(`    - ${teamInfo[0].name} (${team.team_id})`);
          }
        }
      }
    }
    
    // 制約適用後の検証
    const [remainingViolations] = await connection.execute(`
      SELECT 
        user_id,
        COUNT(*) as active_count
      FROM team_members
      WHERE is_active = TRUE
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    if (remainingViolations.length === 0) {
      console.log('✅ すべての制約違反が修正されました');
    } else {
      console.log(`⚠️ まだ ${remainingViolations.length} ユーザーに制約違反が残っています`);
    }
    
    // 統計情報を表示
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users_with_teams,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as total_active_memberships,
        COUNT(DISTINCT CASE WHEN is_active = TRUE THEN user_id END) as users_with_active_teams
      FROM team_members
    `);
    
    console.log('📊 制約適用後の統計:');
    console.log(`  - チームに所属するユーザー数: ${stats[0].total_users_with_teams}`);
    console.log(`  - アクティブメンバーシップ数: ${stats[0].total_active_memberships}`);
    console.log(`  - アクティブチームを持つユーザー数: ${stats[0].users_with_active_teams}`);
    
    console.log('✅ アクティブチーム制約強制適用が完了しました');
    
  } catch (error) {
    console.error('❌ アクティブチーム制約強制適用エラー:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  enforceActiveTeamConstraint()
    .then(() => {
      console.log('🎉 スクリプトが正常に完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 スクリプトが失敗しました:', error);
      process.exit(1);
    });
}

module.exports = enforceActiveTeamConstraint;
