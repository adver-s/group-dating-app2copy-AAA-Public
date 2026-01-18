require('dotenv').config();
const connectAurora = require('./connectAurora');

async function checkUserInterests() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔍 Checking users table interests field...');
    
    // Check users table interests data
    const [users] = await connection.execute('SELECT id, username, interests FROM users LIMIT 5');
    console.log('👥 Users interests data:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.id}):`);
      console.log(`    interests: "${user.interests}"`);
      if (user.interests) {
        try {
          const parsed = JSON.parse(user.interests);
          console.log(`    parsed: ${JSON.stringify(parsed)}`);
        } catch (e) {
          console.log(`    ❌ JSON parse error: ${e.message}`);
        }
      } else {
        console.log(`    (null)`);
      }
    });
    
    console.log('✅ User interests check completed');
    
  } catch (error) {
    console.error('❌ User interests check failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  checkUserInterests();
}

module.exports = { checkUserInterests }; 