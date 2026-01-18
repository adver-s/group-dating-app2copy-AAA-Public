require('dotenv').config();
const connectAurora = require('./connectAurora');

async function checkTeamMembersTable() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔍 Checking team_members table structure...');
    
    // Check team_members table structure
    const [teamMembersColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'team_members' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('👥 Team_members table structure:');
    teamMembersColumns.forEach(column => {
      console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${column.COLUMN_KEY ? `[${column.COLUMN_KEY}]` : ''}`);
    });
    
    // Check sample team_members data
    const [teamMembers] = await connection.execute('SELECT * FROM team_members LIMIT 3');
    console.log('👥 Sample team_members:');
    teamMembers.forEach(member => {
      console.log(`  - Team ${member.team_id}: User ${member.user_id} (active: ${member.is_active_team})`);
    });
    
    console.log('✅ Team_members table check completed');
    
  } catch (error) {
    console.error('❌ Team_members table check failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  checkTeamMembersTable();
}

module.exports = { checkTeamMembersTable }; 