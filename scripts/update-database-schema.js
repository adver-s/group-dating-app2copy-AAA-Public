require('dotenv').config();
const connectAurora = require('../infra/scripts/connectAurora');

async function updateDatabaseSchema() {
  let connection;
  
  try {
    connection = await connectAurora();
    console.log('🔧 Updating database schema...');

    // 1. usersテーブルにroleカラムを追加
    console.log('📝 Adding role column to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
        COMMENT 'user, moderator, admin, super_admin'
      `);
      console.log('✅ Role column added to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Role column already exists');
      } else {
        throw error;
      }
    }

    // 2. admin_action_logsテーブルを作成
    console.log('📝 Creating admin_action_logs table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS admin_action_logs (
          id VARCHAR(36) PRIMARY KEY,
          admin_user_id VARCHAR(36) NOT NULL COMMENT '管理者ユーザーID',
          action_type VARCHAR(50) NOT NULL COMMENT 'verification_approve, verification_reject, photo_approve, photo_reject, user_suspend, report_resolve',
          target_user_id VARCHAR(36) NULL COMMENT '対象ユーザーID',
          target_resource_type VARCHAR(50) NULL COMMENT 'verification, photo, user, report',
          target_resource_id VARCHAR(36) NULL COMMENT '対象リソースID',
          action_details JSON NULL COMMENT 'アクション詳細',
          ip_address VARCHAR(45) NULL COMMENT 'IPアドレス',
          user_agent TEXT NULL COMMENT 'ユーザーエージェント',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_admin_user (admin_user_id),
          INDEX idx_action_type (action_type),
          INDEX idx_target_user (target_user_id),
          INDEX idx_created_at (created_at),
          
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Admin_action_logs table created');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠️ Admin_action_logs table already exists');
      } else {
        throw error;
      }
    }

    // 3. user_photosテーブルを作成
    console.log('📝 Creating user_photos table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_photos (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL COMMENT 'ユーザーID',
          photo_url VARCHAR(500) NOT NULL COMMENT '画像URL',
          photo_type VARCHAR(50) NOT NULL DEFAULT 'avatar' COMMENT 'avatar, gallery',
          display_order SMALLINT UNSIGNED DEFAULT 0 COMMENT '表示順序',
          status VARCHAR(20) DEFAULT 'pending_review' COMMENT 'pending_review, active, rejected',
          moderation_result JSON NULL COMMENT 'AWS Rekognition審査結果',
          review_notes TEXT NULL COMMENT '手動審査コメント',
          reviewed_at TIMESTAMP NULL COMMENT '審査日時',
          reviewed_by VARCHAR(36) NULL COMMENT '審査者ID',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_photo_type (photo_type),
          INDEX idx_display_order (display_order),
          
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ User_photos table created');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠️ User_photos table already exists');
      } else {
        throw error;
      }
    }

    // 4. reportsテーブルを作成
    console.log('📝 Creating reports table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS reports (
          id VARCHAR(36) PRIMARY KEY,
          reporter_id VARCHAR(36) NOT NULL COMMENT '通報者ID',
          reported_user_id VARCHAR(36) NOT NULL COMMENT '通報されたユーザーID',
          report_type VARCHAR(50) NOT NULL COMMENT 'inappropriate_photo, harassment, fake_profile, spam, other',
          report_reason TEXT NOT NULL COMMENT '通報理由',
          status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending' COMMENT '対応状況',
          admin_notes TEXT NULL COMMENT '管理者メモ',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_reporter (reporter_id),
          INDEX idx_reported_user (reported_user_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          
          FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Reports table created');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠️ Reports table already exists');
      } else {
        throw error;
      }
    }

    // 5. 管理者ユーザーを作成
    console.log('📝 Creating admin user...');
    const adminId = require('crypto').randomUUID();
    const adminUsername = 'admin';
    
    try {
      await connection.execute(`
        INSERT INTO users (id, username, role, is_active, created_at, updated_at)
        VALUES (?, ?, 'admin', 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          role = VALUES(role),
          is_active = VALUES(is_active)
      `, [adminId, adminUsername]);
      console.log('✅ Admin user created/updated');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: admin123`);
      console.log(`   Role: admin`);
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
    }

    console.log('🎉 Database schema update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// スクリプトを実行
updateDatabaseSchema()
  .then(() => {
    console.log('🎉 Database schema update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database schema update failed:', error);
    process.exit(1);
  }); 