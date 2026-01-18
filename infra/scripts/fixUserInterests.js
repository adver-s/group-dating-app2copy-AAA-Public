require('dotenv').config();
const connectAurora = require('./connectAurora');

async function fixUserInterests() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Fixing users table interests field...');
    
    // Update all users to have proper JSON array for interests
    const updateSql = `UPDATE users SET interests = '[]'`
    
    const [result] = await connection.execute(updateSql);
    console.log(`✅ Updated ${result.affectedRows} user records`);
    
    // Check the result
    const [users] = await connection.execute('SELECT id, username, interests FROM users LIMIT 5');
    console.log('👥 Updated users interests data:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.id}):`);
      console.log(`    interests: "${user.interests}"`);
      console.log(`    interests length: ${user.interests ? user.interests.length : 0}`);
      console.log(`    interests type: ${typeof user.interests}`);
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
    
    console.log('✅ User interests fix completed');
    
  } catch (error) {
    console.error('❌ User interests fix failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  fixUserInterests();
}

module.exports = { fixUserInterests }; 