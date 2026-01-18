const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestUser() {
  let connection;
  
  try {
    console.log('🔍 テストユーザーの作成を開始します...');
    
    // データベース接続
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'dating_app',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('✅ データベース接続成功');
    
    // テストユーザーのID（verifications.jsonで使用されているID）
    const testUserId = 'user_1754107511944_nv3utk089';
    
    // 既存ユーザーの確認
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [testUserId]
    );
    
    if (existingUser.length > 0) {
      console.log('⚠️ テストユーザーは既に存在します');
      return;
    }
    
    // テストユーザーの作成
    await connection.execute(
      `INSERT INTO users (
        id, email, username, password_hash, 
        created_at, updated_at, is_active, is_verified
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), 1, 0)`,
      [
        testUserId,
        'test@example.com',
        'testuser',
        'dummy-hash'
      ]
    );
    
    console.log('✅ テストユーザーを作成しました:', testUserId);
    
  } catch (error) {
    console.error('❌ ユーザー作成エラー:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプト実行
createTestUser();
