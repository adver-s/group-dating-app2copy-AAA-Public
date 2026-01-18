require('dotenv').config();
const connectAurora = require('./connectAurora');

async function checkTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔍 Checking database tables...');
    
    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    console.log('📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    // Check teams table structure
    const [teamsColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'teams' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    if (teamsColumns.length > 0) {
      console.log('✅ Teams table structure:');
      teamsColumns.forEach(column => {
        console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    } else {
      console.log('⚠️ Teams table not found');
    }
    
    // Check users table data
    const [users] = await connection.execute('SELECT id, username, email FROM users LIMIT 5');
    console.log('👥 Sample users:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.id})`);
    });
    
    // Check teams table data
    const [teams] = await connection.execute('SELECT id, name, created_by FROM teams LIMIT 5');
    console.log('🏢 Sample teams:');
    teams.forEach(team => {
      console.log(`  - ${team.name} (${team.id}) created by ${team.created_by}`);
    });
    
    // Check team_photos table structure
    const [teamPhotosColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'team_photos' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    if (teamPhotosColumns.length > 0) {
      console.log('📸 Team_photos table structure:');
      teamPhotosColumns.forEach(column => {
        console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${column.COLUMN_KEY ? `[${column.COLUMN_KEY}]` : ''}`);
      });
    } else {
      console.log('⚠️ Team_photos table not found');
    }
    
    // Check team_photos table data
    const [teamPhotos] = await connection.execute('SELECT * FROM team_photos LIMIT 5');
    console.log('📸 Sample team_photos:');
    teamPhotos.forEach(photo => {
      console.log(`  - Team ${photo.team_id}: ${photo.photo_url} (order: ${photo.display_order})`);
    });
    
    // Check swipe_actions table data
    const [swipeActions] = await connection.execute('SELECT * FROM swipe_actions LIMIT 5');
    console.log('💕 Sample swipe actions:');
    swipeActions.forEach(action => {
      console.log(`  - User ${action.user_id} ${action.action} team ${action.target_team_id}`);
    });
    
    console.log('✅ Database check completed successfully');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = checkTables; 