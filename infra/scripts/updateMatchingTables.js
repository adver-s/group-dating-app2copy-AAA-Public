require('dotenv').config();
const connectAurora = require('./connectAurora');

async function updateMatchingTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Updating matching tables to unified structure...');
    
    // Drop existing tables if they exist
    await connection.execute('DROP TABLE IF EXISTS group_member_judgements');
    await connection.execute('DROP TABLE IF EXISTS group_matching_flows');
    console.log('✅ Dropped existing tables');
    
    // Create group_matching_flows table with updated structure
    const createGroupMatchingFlowsTableSQL = `
      CREATE TABLE IF NOT EXISTS group_matching_flows (
        matching_id VARCHAR(36) PRIMARY KEY COMMENT '各マッチングの固有ID',
        from_group_id VARCHAR(36) NOT NULL COMMENT 'リクエストを送るグループID',
        to_group_id VARCHAR(36) NOT NULL COMMENT '相手グループID',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: アリにスワイプ済み, 1: グループ全員アリ, 2: 相手全員OK, 3: 正式マッチング',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
        status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'status更新日時',
        INDEX idx_from_group_id (from_group_id),
        INDEX idx_to_group_id (to_group_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createGroupMatchingFlowsTableSQL);
    console.log('✅ Group matching flows table created successfully');

    // Create group_member_judgements table with updated structure
    const createGroupMemberJudgementsTableSQL = `
      CREATE TABLE IF NOT EXISTS group_member_judgements (
        id VARCHAR(36) PRIMARY KEY,
        matching_id VARCHAR(36) NOT NULL COMMENT 'group_matching_flowsのmatching_id',
        user_id VARCHAR(36) NOT NULL COMMENT '判定を行うユーザーID',
        group_id VARCHAR(36) NOT NULL COMMENT 'ユーザーが所属するグループID',
        judgement ENUM('like', 'dislike', 'hold') NOT NULL COMMENT '判定内容',
        judgement_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'judgement更新日時',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_matching_id (matching_id),
        INDEX idx_user_id (user_id),
        INDEX idx_group_id (group_id),
        INDEX idx_judgement (judgement),
        INDEX idx_judgement_updated_at (judgement_updated_at),
        UNIQUE KEY unique_user_matching (user_id, matching_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createGroupMemberJudgementsTableSQL);
    console.log('✅ Group member judgements table created successfully');

    // Create keep_list table
    const createKeepListTableSQL = `
      CREATE TABLE IF NOT EXISTS keep_list (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL COMMENT 'キープしたユーザーID',
        kept_group_id VARCHAR(36) NOT NULL COMMENT 'キープされたグループID',
        kept_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'キープ日時',
        INDEX idx_user_id (user_id),
        INDEX idx_kept_group_id (kept_group_id),
        INDEX idx_kept_at (kept_at),
        UNIQUE KEY unique_user_group (user_id, kept_group_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createKeepListTableSQL);
    console.log('✅ Keep list table created successfully');

    // Create hidden table
    const createHiddenTableSQL = `
      CREATE TABLE IF NOT EXISTS hidden (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL COMMENT '非表示にしたユーザーID',
        hidden_group_id VARCHAR(36) NOT NULL COMMENT '非表示にされたグループID',
        status ENUM('active', 'expired') DEFAULT 'active' COMMENT '非表示状態',
        hidden_until TIMESTAMP NULL COMMENT '非表示期間の終了時刻',
        hidden_start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '非表示開始日時',
        INDEX idx_user_id (user_id),
        INDEX idx_hidden_group_id (hidden_group_id),
        INDEX idx_status (status),
        INDEX idx_hidden_until (hidden_until),
        INDEX idx_hidden_start_at (hidden_start_at),
        UNIQUE KEY unique_user_group (user_id, hidden_group_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createHiddenTableSQL);
    console.log('✅ Hidden table created successfully');

    console.log('✅ All matching tables updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update matching tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  updateMatchingTables()
    .then(() => {
      console.log('✅ Matching tables update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Matching tables update failed:', error);
      process.exit(1);
    });
}

module.exports = updateMatchingTables; 