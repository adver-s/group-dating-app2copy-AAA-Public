const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'dating_app',
  port: 3306,
  socketPath: '/tmp/mysql.sock'
});
    
    console.log('✅ Database connection successful!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('User count:', rows[0].count);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
