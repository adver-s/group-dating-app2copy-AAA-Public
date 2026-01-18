const connectAurora = require('./connectAurora');

async function testConnection() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection...');
    connection = await connectAurora();
    
    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Basic query test passed:', rows[0]);
    
    // Test table existence
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    console.log('📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    // Test user table structure
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    if (userColumns.length > 0) {
      console.log('✅ Users table structure:');
      userColumns.forEach(column => {
        console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    } else {
      console.log('⚠️ Users table not found');
    }
    
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = testConnection; 