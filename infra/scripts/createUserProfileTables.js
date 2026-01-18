require('dotenv').config();
const connectAurora = require('./connectAurora');

async function createUserProfileTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    console.log('🔧 Creating user profile tables...')

    // user_profiles テーブルの作成
    const createUserProfilesTable = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100),
        age INT,
        location VARCHAR(100),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    await connection.execute(createUserProfilesTable)
    console.log('✅ user_profiles table created')

    // user_interests テーブルの作成
    const createUserInterestsTable = `
      CREATE TABLE IF NOT EXISTS user_interests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        interest_tag VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_interest (user_id, interest_tag),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    await connection.execute(createUserInterestsTable)
    console.log('✅ user_interests table created')

    // サンプルデータの挿入（既存のユーザーに対して）
    const sampleUserId = 'ecc20c18-6516-11f0-9176-069696d86c17'
    
    // プロフィールデータの挿入
    const insertProfileSql = `
      INSERT INTO user_profiles (user_id, name, age, location, bio)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        age = VALUES(age),
        location = VALUES(location),
        bio = VALUES(bio)
    `

    await connection.execute(insertProfileSql, [
      sampleUserId,
      '田中 太郎',
      25,
      '東京',
      'お酒とカラオケが大好きです！新しい出会いを楽しみにしています。'
    ])

    // 趣味データの挿入
    const interests = ['カラオケ', 'お酒', '旅行', '料理']
    
    for (const interest of interests) {
      const insertInterestSql = `
        INSERT INTO user_interests (user_id, interest_tag)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE interest_tag = VALUES(interest_tag)
      `
      await connection.execute(insertInterestSql, [sampleUserId, interest])
    }

    console.log('✅ Sample user profile data inserted')

    console.log('🎉 User profile tables setup completed!')
  } catch (error) {
    console.error('❌ Error creating user profile tables:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  createUserProfileTables()
}

module.exports = { createUserProfileTables } 