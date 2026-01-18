require('dotenv').config();
const connectAurora = require('./connectAurora');

async function createMissingTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Creating missing tables...');
    
    // team_photosテーブルを作成
    try {
      await connection.execute(`
        CREATE TABLE team_photos (
          id VARCHAR(36) PRIMARY KEY,
          team_id VARCHAR(36) NOT NULL,
          photo_url VARCHAR(500) NOT NULL,
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created team_photos table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ team_photos table already exists');
      } else {
        throw error;
      }
    }
    
    // team_weekdaysテーブルを作成
    try {
      await connection.execute(`
        CREATE TABLE team_weekdays (
          id VARCHAR(36) PRIMARY KEY,
          team_id VARCHAR(36) NOT NULL,
          weekday INT NOT NULL,
          time_slot VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created team_weekdays table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ team_weekdays table already exists');
      } else {
        throw error;
      }
    }
    
    // team_hobbiesテーブルを作成
    try {
      await connection.execute(`
        CREATE TABLE team_hobbies (
          id VARCHAR(36) PRIMARY KEY,
          team_id VARCHAR(36) NOT NULL,
          hobby_tag VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created team_hobbies table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ team_hobbies table already exists');
      } else {
        throw error;
      }
    }
    
    // team_prefecturesテーブルを作成
    try {
      await connection.execute(`
        CREATE TABLE team_prefectures (
          id VARCHAR(36) PRIMARY KEY,
          team_id VARCHAR(36) NOT NULL,
          prefecture_code VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created team_prefectures table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ team_prefectures table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ All missing tables created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create missing tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = createMissingTables;

// スクリプトが直接実行された場合
if (require.main === module) {
  createMissingTables().catch(console.error);
} 