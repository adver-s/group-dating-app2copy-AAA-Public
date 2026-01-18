const mysql = require('mysql2/promise');
const getDbSecrets = require('./getDbSecrets');

async function connectAurora() {
  try {
    const dbSecrets = await getDbSecrets();
    
    const connection = await mysql.createConnection({
      host: dbSecrets.host,
      port: dbSecrets.port || 3306,
      user: dbSecrets.username,
      password: dbSecrets.password,
      database: dbSecrets.dbname,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to Aurora database successfully');
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to Aurora database:', error.message);
    throw error;
  }
}

module.exports = connectAurora; 