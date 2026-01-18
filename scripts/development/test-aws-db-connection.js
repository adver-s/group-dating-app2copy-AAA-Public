const mysql = require('mysql2/promise');

// AWS RDS接続情報
const dbConfig = {
  host: 'dating-app-cluster-instance-1.c7m0swiq43ob.ap-northeast-1.rds.amazonaws.com',
  port: 3306,
  user: 'admin',
  password: 'Kaisei0605!',
  database: 'dating_app',
  // SSL設定（AWS RDSの場合）
  ssl: {
    rejectUnauthorized: false
  },
  // 接続タイムアウト設定
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
  // 接続プール設定
  connectionLimit: 10,
  queueLimit: 0
};

async function testConnection() {
  let connection;
  
  try {
    console.log('🔄 AWS RDSデータベースに接続中...');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`User: ${dbConfig.user}`);
    
    // 接続作成
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ データベース接続成功！');
    
    // データベース情報を取得
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${rows[0].version}`);
    
    // データベース一覧を取得
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📚 利用可能なデータベース:');
    databases.forEach(db => {
      console.log(`  - ${db.Database}`);
    });
    
    // dating_appデータベースのテーブル一覧を取得
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 dating_appデータベースのテーブル:');
    if (tables.length === 0) {
      console.log('  - テーブルが見つかりません（データベースが空の可能性があります）');
    } else {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
    }
    
    // 接続状態を確認
    const [status] = await connection.execute('SELECT 1 as status');
    console.log('🔍 接続状態確認:', status[0].status === 1 ? '正常' : '異常');
    
    console.log('\n🎉 AWS RDSデータベース接続テスト完了！');
    
  } catch (error) {
    console.error('❌ データベース接続エラー:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error SQL State:', error.sqlState);
    
    // 一般的なエラーの対処法を表示
    console.log('\n🔧 考えられる対処法:');
    if (error.code === 'ECONNREFUSED') {
      console.log('- データベースが起動していない可能性があります');
      console.log('- セキュリティグループの設定を確認してください');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- ユーザー名またはパスワードが間違っています');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('- データベース名が間違っているか、データベースが存在しません');
    } else if (error.code === 'ENOTFOUND') {
      console.log('- ホスト名が解決できません。DNS設定を確認してください');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 データベース接続を閉じました');
    }
  }
}

// スクリプト実行
testConnection();
