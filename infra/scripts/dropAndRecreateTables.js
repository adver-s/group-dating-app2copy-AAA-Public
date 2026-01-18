const connectAurora = require('./connectAurora');

async function dropAndRecreateTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🗑️ Dropping existing tables...');
    
    // Drop tables in reverse order (due to foreign key constraints)
    const tablesToDrop = [
      'swipe_actions',
      'messages',
      'chat_rooms',
      'matches',
      'team_members',
      'teams',
      'users'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}: ${error.message}`);
      }
    }
    
    console.log('✅ All tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = dropAndRecreateTables; 