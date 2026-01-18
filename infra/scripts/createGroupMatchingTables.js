require('dotenv').config();
const connectAurora = require('./connectAurora');

async function createGroupMatchingTables() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Creating group matching tables...');
    
    // Create group_matching_flows table
    const createGroupMatchingFlowsTableSQL = `
      CREATE TABLE IF NOT EXISTS group_matching_flows (
        id VARCHAR(36) PRIMARY KEY,
        matching_id VARCHAR(36) UNIQUE NOT NULL COMMENT '各マッチングの固有ID',
        from_group_id VARCHAR(36) NOT NULL COMMENT '最初にリクエストを送るグループのID',
        to_group_id VARCHAR(36) NOT NULL COMMENT '相手グループのID',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: アリにスワイプ済み(グループ内判定), 1: グループ全員アリ(相手判定), 2: 相手全員OK(トーク段階), 3: 正式マッチング',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matching_id (matching_id),
        INDEX idx_from_group_id (from_group_id),
        INDEX idx_to_group_id (to_group_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createGroupMatchingFlowsTableSQL);
    console.log('✅ Group matching flows table created successfully');

    // Create group_member_judgements table
    const createGroupMemberJudgementsTableSQL = `
      CREATE TABLE IF NOT EXISTS group_member_judgements (
        id VARCHAR(36) PRIMARY KEY,
        matching_id VARCHAR(36) NOT NULL COMMENT 'group_matching_flowsのmatching_id',
        user_id VARCHAR(36) NOT NULL COMMENT '判定を行うユーザーID',
        target_group_id VARCHAR(36) NOT NULL COMMENT '判定対象のグループID',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: 未判定, 1: アリ, 2: パス, 3: 非表示, 4: ブロック, 5: エターナル',
        hidden_until TIMESTAMP NULL COMMENT '非表示期間の終了時刻',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matching_id (matching_id),
        INDEX idx_user_id (user_id),
        INDEX idx_target_group_id (target_group_id),
        INDEX idx_status (status),
        INDEX idx_hidden_until (hidden_until),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createGroupMemberJudgementsTableSQL);
    console.log('✅ Group member judgements table created successfully');

    console.log('✅ All group matching tables created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create group matching tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createGroupMatchingTables()
    .then(() => {
      console.log('✅ Group matching tables creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Group matching tables creation failed:', error);
      process.exit(1);
    });
}

module.exports = createGroupMatchingTables; 