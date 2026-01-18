const mysql = require('mysql2/promise');

// データベース接続設定
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'group_dating_app',
  port: process.env.DB_PORT || 3306
};

async function executeQuery(sql, params = []) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    await connection.end();
  }
}

async function removeEmailPasswordColumns() {
  try {
    console.log('🗑️ === emailカラムとpassword_hashカラムの削除開始 ===');

    // 1. 現在のusersテーブル構造を確認
    console.log('📋 現在のusersテーブル構造を確認中...');
    const currentColumns = await executeQuery(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 現在のカラム一覧:');
    currentColumns.forEach(column => {
      console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${column.COLUMN_KEY ? `[${column.COLUMN_KEY}]` : ''}`);
    });

    // 2. emailカラムとpassword_hashカラムが存在するかチェック
    const hasEmail = currentColumns.some(col => col.COLUMN_NAME === 'email');
    const hasPasswordHash = currentColumns.some(col => col.COLUMN_NAME === 'password_hash');

    console.log(`📋 emailカラム存在: ${hasEmail}`);
    console.log(`📋 password_hashカラム存在: ${hasPasswordHash}`);

    // 3. カラムを削除
    if (hasEmail) {
      console.log('🗑️ emailカラムを削除中...');
      await executeQuery('ALTER TABLE users DROP COLUMN email');
      console.log('✅ emailカラムを削除しました');
    } else {
      console.log('⏭️ emailカラムは既に存在しません');
    }

    if (hasPasswordHash) {
      console.log('🗑️ password_hashカラムを削除中...');
      await executeQuery('ALTER TABLE users DROP COLUMN password_hash');
      console.log('✅ password_hashカラムを削除しました');
    } else {
      console.log('⏭️ password_hashカラムは既に存在しません');
    }

    // 4. 削除後のテーブル構造を確認
    console.log('📋 削除後のusersテーブル構造を確認中...');
    const updatedColumns = await executeQuery(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 更新後のカラム一覧:');
    updatedColumns.forEach(column => {
      console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${column.COLUMN_KEY ? `[${column.COLUMN_KEY}]` : ''}`);
    });

    // 5. サンプルデータを確認
    console.log('📋 現在のユーザーデータを確認中...');
    const users = await executeQuery('SELECT id, username, created_at FROM users LIMIT 5');
    console.log('📋 ユーザーデータ（最新5件）:', users);

    console.log('✅ emailカラムとpassword_hashカラムの削除が完了しました');

  } catch (error) {
    console.error('❌ カラム削除エラー:', error);
    throw error;
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  removeEmailPasswordColumns()
    .then(() => {
      console.log('🎉 処理が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 エラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { removeEmailPasswordColumns }; 