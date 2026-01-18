require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: {
    rejectUnauthorized: false
  }
};

async function addSampleData() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('📝 サンプルデータを追加中...\n');
    
    // 既存のチームIDを取得
    const [teams] = await connection.execute('SELECT id FROM teams LIMIT 4');
    const teamIds = teams.map(team => team.id);
    
    if (teamIds.length < 2) {
      console.log('❌ チームが不足しています。先にチームを作成してください。');
      return;
    }
    
    // マッチデータを追加
    console.log('🔗 マッチデータを追加中...');
    await connection.execute(`
      INSERT INTO matches (id, team1_id, team2_id, status, created_at, updated_at)
      VALUES 
        (UUID(), ?, ?, 'pending', NOW(), NOW()),
        (UUID(), ?, ?, 'confirmed', NOW(), NOW())
    `, [teamIds[0], teamIds[1], teamIds[2], teamIds[3]]);
    
    // チャットルームを追加
    console.log('💬 チャットルームを追加中...');
    const [matches] = await connection.execute('SELECT id FROM matches LIMIT 2');
    
    for (const match of matches) {
      await connection.execute(`
        INSERT INTO chat_rooms (id, match_id, name, created_at, is_active)
        VALUES (UUID(), ?, 'Chat Room', NOW(), 1)
      `, [match.id]);
    }
    
    // メッセージを追加
    console.log('💭 メッセージを追加中...');
    const [chatRooms] = await connection.execute('SELECT id FROM chat_rooms LIMIT 2');
    const [users] = await connection.execute('SELECT id FROM users LIMIT 2');
    
    for (const room of chatRooms) {
      for (const user of users) {
        await connection.execute(`
          INSERT INTO messages (id, chat_room_id, sender_id, content, message_type, created_at, is_read)
          VALUES (UUID(), ?, ?, ?, 'text', NOW(), 0)
        `, [room.id, user.id, `Hello from user ${user.id}!`]);
      }
    }
    
    await connection.end();
    console.log('\n✅ サンプルデータ追加完了');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addSampleData(); 