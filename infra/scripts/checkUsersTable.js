require('dotenv').config();
const connectAurora = require('./connectAurora');

async function checkUsersTable() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔍 Checking users table structure...');
    
    // Check users table structure
    const [usersColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('👥 Users table structure:');
    usersColumns.forEach(column => {
      console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${column.COLUMN_KEY ? `[${column.COLUMN_KEY}]` : ''}`);
    });
    
    // Check sample users data
    const [users] = await connection.execute('SELECT id, username, email FROM users LIMIT 3');
    console.log('👥 Sample users:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.id}) - ${user.email}`);
    });
    
    console.log('✅ Users table check completed');
    
  } catch (error) {
    console.error('❌ Users table check failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  checkUsersTable();
}

module.exports = { checkUsersTable }; 