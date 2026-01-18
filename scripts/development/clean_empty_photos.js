require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanEmptyPhotos() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('🧹 Cleaning empty photos from team_photos table...');
    
    // Check existing empty photos
    const [emptyPhotos] = await connection.execute(`
      SELECT * FROM team_photos WHERE photo_url = '' OR photo_url IS NULL
    `);
    
    console.log(`📸 Found ${emptyPhotos.length} empty photos:`);
    emptyPhotos.forEach(photo => {
      console.log(`  - Team ${photo.team_id}: "${photo.photo_url}" (order: ${photo.display_order})`);
    });
    
    if (emptyPhotos.length > 0) {
      // Delete empty photos
      const [result] = await connection.execute(`
        DELETE FROM team_photos WHERE photo_url = '' OR photo_url IS NULL
      `);
      
      console.log(`✅ Deleted ${result.affectedRows} empty photos`);
    } else {
      console.log('✅ No empty photos found');
    }
    
    // Check remaining photos
    const [remainingPhotos] = await connection.execute(`
      SELECT * FROM team_photos LIMIT 10
    `);
    
    console.log('📸 Remaining photos:');
    remainingPhotos.forEach(photo => {
      console.log(`  - Team ${photo.team_id}: "${photo.photo_url}" (order: ${photo.display_order})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanEmptyPhotos(); 