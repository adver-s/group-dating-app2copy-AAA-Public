const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateVerifications() {
  let connection;
  
  try {
    console.log('🔍 本人確認データの移行を開始します...');
    
    // データベース接続
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'dating_app',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('✅ データベース接続成功');
    
    // JSONファイルの読み込み
    const verificationsFile = path.join(process.cwd(), 'data', 'verifications.json');
    
    if (!fs.existsSync(verificationsFile)) {
      console.log('⚠️ verifications.jsonファイルが見つかりません');
      return;
    }
    
    const verifications = JSON.parse(fs.readFileSync(verificationsFile, 'utf8'));
    console.log(`📋 ${verifications.length}件の本人確認データを移行します`);
    
    // 既存データの確認
    const [existingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM identity_verifications'
    );
    console.log(`📊 既存のデータベースレコード数: ${existingData[0].count}`);
    
    // データの移行
    for (const verification of verifications) {
      try {
        // 重複チェック
        const [existing] = await connection.execute(
          'SELECT id FROM identity_verifications WHERE id = ?',
          [verification.id]
        );
        
        if (existing.length > 0) {
          console.log(`⚠️ 既に存在するレコードをスキップ: ${verification.id}`);
          continue;
        }
        
        // データベースに挿入
        await connection.execute(
          `INSERT INTO identity_verifications (
            id, user_id, document_type, document_number, 
            document_image, status, submitted_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            verification.id,
            verification.userId,
            verification.documentType,
            verification.documentNumber,
            verification.documentImage,
            verification.status,
            new Date(verification.submittedAt),
            new Date(verification.submittedAt),
            new Date()
          ]
        );
        
        console.log(`✅ 移行完了: ${verification.id}`);
        
      } catch (error) {
        console.error(`❌ 移行エラー (${verification.id}):`, error.message);
      }
    }
    
    // 移行後の確認
    const [finalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM identity_verifications'
    );
    console.log(`📊 移行後のデータベースレコード数: ${finalCount[0].count}`);
    
    console.log('🎉 本人確認データの移行が完了しました');
    
  } catch (error) {
    console.error('❌ 移行エラー:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプト実行
migrateVerifications();
