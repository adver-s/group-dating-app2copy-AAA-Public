const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const mysql = require('mysql2/promise');

async function getDbSecrets() {
  const client = new SecretsManagerClient({ region: 'ap-northeast-1' });
  const command = new GetSecretValueCommand({
    SecretId: 'dating-app-db-secrets'
  });
  
  try {
    const response = await client.send(command);
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Error getting secrets:', error);
    throw error;
  }
}

async function createSwipeActionsTable() {
  try {
    console.log('🔧 Creating swipe_actions table...');
    
    const secrets = await getDbSecrets();
    const connection = await mysql.createConnection({
      host: secrets.host,
      user: secrets.username,
      password: secrets.password,
      database: secrets.dbname,
      port: secrets.port,
      ssl: { rejectUnauthorized: false }
    });

    // スワイプアクションテーブルを作成
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS swipe_actions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        target_team_id VARCHAR(36) NOT NULL,
        action ENUM('like', 'pass', 'hold', 'remove_from_hold') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_target_team_id (target_team_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_team_id) REFERENCES teams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ swipe_actions table created successfully!');

    // サンプルデータを挿入
    const sampleData = [
      {
        id: 'swipe1',
        user_id: 'user1',
        target_team_id: 'team1',
        action: 'like'
      },
      {
        id: 'swipe2',
        user_id: 'user1',
        target_team_id: 'team2',
        action: 'hold'
      },
      {
        id: 'swipe3',
        user_id: 'user2',
        target_team_id: 'team1',
        action: 'like'
      }
    ];

    for (const data of sampleData) {
      try {
        await connection.execute(`
          INSERT INTO swipe_actions (id, user_id, target_team_id, action)
          VALUES (?, ?, ?, ?)
        `, [data.id, data.user_id, data.target_team_id, data.action]);
      } catch (error) {
        console.log(`⚠️ Skipped sample data (might already exist): ${data.id}`);
      }
    }

    console.log('✅ Sample swipe actions data inserted!');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error creating swipe_actions table:', error);
    throw error;
  }
}

// スクリプトを実行
if (require.main === module) {
  createSwipeActionsTable()
    .then(() => {
      console.log('🎉 Swipe actions table creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Swipe actions table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createSwipeActionsTable }; 