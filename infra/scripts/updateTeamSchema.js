require('dotenv').config();
const connectAurora = require('./connectAurora');

async function updateTeamSchema() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Updating team schema...');
    
    // team_membersテーブルにis_active_teamカラムを追加
    try {
      await connection.execute(`
        ALTER TABLE team_members 
        ADD COLUMN is_active_team BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_active_team column to team_members table');
      } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_active_team column already exists');
      } else {
        throw error;
      }
    }

    // teamsテーブルにis_active_teamカラムを追加（チーム全体の状態管理用）
    try {
      await connection.execute(`
        ALTER TABLE teams 
        ADD COLUMN is_active_team BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_active_team column to teams table');
      } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_active_team column already exists in teams table');
      } else {
        throw error;
      }
    }

    // 既存のデータで最初のチームを出動中に設定
    const [existingTeams] = await connection.execute(`
      SELECT DISTINCT t.id, t.name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = 'ecc20c18-6516-11f0-9176-069696d86c17'
      ORDER BY t.created_at ASC
      LIMIT 1
    `);
    
    if (existingTeams.length > 0) {
      const firstTeam = existingTeams[0];
      
      // このチームを出動中に設定
      await connection.execute(`
        UPDATE team_members 
        SET is_active_team = TRUE 
        WHERE team_id = ?
      `, [firstTeam.id]);
      
      await connection.execute(`
        UPDATE teams 
        SET is_active_team = TRUE 
        WHERE id = ?
      `, [firstTeam.id]);
      
      console.log(`✅ Set team "${firstTeam.name}" as active team`);
    }
    
    // 他のチームは待機中に設定
    await connection.execute(`
      UPDATE team_members 
      SET is_active_team = FALSE 
      WHERE team_id != ?
    `, [existingTeams[0]?.id || '']);
    
    await connection.execute(`
      UPDATE teams 
      SET is_active_team = FALSE 
      WHERE id != ?
    `, [existingTeams[0]?.id || '']);
    
    console.log('✅ Set other teams as inactive');
    
    // 結果を確認
    const [activeTeams] = await connection.execute(`
      SELECT t.name, COUNT(tm.user_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.is_active_team = TRUE
      GROUP BY t.id, t.name
    `);
    
    console.log('📊 Active teams:');
    activeTeams.forEach(team => {
      console.log(`  - ${team.name} (${team.member_count} members)`);
    });
    
    const [inactiveTeams] = await connection.execute(`
      SELECT t.name, COUNT(tm.user_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.is_active_team = FALSE
      GROUP BY t.id, t.name
    `);
    
    console.log('📊 Inactive teams:');
    inactiveTeams.forEach(team => {
      console.log(`  - ${team.name} (${team.member_count} members)`);
    });

    console.log('✅ Team schema update completed successfully');
    
  } catch (error) {
    console.error('❌ Team schema update failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = updateTeamSchema;

// スクリプトが直接実行された場合
if (require.main === module) {
  updateTeamSchema().catch(console.error);
} 