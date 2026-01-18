const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  console.log('🔍 Creating database...');
  
  try {
    // データベース名を指定せずに接続
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
    });

    // データベース作成
    await connection.execute('CREATE DATABASE IF NOT EXISTS dating_app');
    console.log('✅ Database "dating_app" created successfully');
    
    await connection.end();
    return { success: true, database: 'dating_app' };
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
}

module.exports = createDatabase;
