const connectAurora = require('./connectAurora');

async function createUserTable() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- DB内部用の連番ID(0~)
        cognito_sub CHAR(36) NOT NULL UNIQUE, -- 外部連携,ログイン用のID
        username VARCHAR(30) NOT NULL,
        avatar_url VARCHAR(500), -- NOT NULLをつけるかUNIQUEをつけるか
        bio VARCHAR(100),
        age TINYINT UNSIGNED,
        gender TINYINT UNSIGNED NOT NULL COMMENT '0: 女子, 1: 男子',
        cancelRate TINYINT UNSIGNED DEFAULT 0 COMMENT '0-100の非負整数',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        INDEX idx_username (username),
        INDEX idx_age (age),
        INDEX idx_gender (gender),
        CHECK (gender IN (0,1))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createUsersTableSQL);
    console.log('✅ Users table created successfully');

    // Create teams table
    const createTeamsTableSQL = `
      CREATE TABLE IF NOT EXISTS teams (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- DB内部用の連番ID(0~)
        uuid CHAR(36) NOT NULL UNIQUE, -- 外部公開用のUUID
        name VARCHAR(30) NOT NULL,
        description VARCHAR(200),
        gender TINYINT UNSIGNED NOT NULL COMMENT '0: 女子のみ, 1: 男女混在, 2: 男子のみ',
        target_gender TINYINT UNSIGNED NOT NULL COMMENT '0: 女子に表示, 1: 男女どちらにも表示, 2: 男子に表示',
        smoke TINYINT UNSIGNED COMMENT '0: 吸わない, 1: 吸う',
        alcohol TINYINT UNSIGNED COMMENT '0: 飲まない, 1: 一部飲まない, 2: 飲む',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_name (name),
        INDEX idx_gender (gender),
        INDEX idx_target_gender (target_gender),
        INDEX idx_smoke (smoke),
        INDEX idx_alcohol (alcohol),
        CHECK (gender IN (0,1,2)),
        CHECK (target_gender IN (0,1,2)),
        CHECK (smoke IN (0,1)),
        CHECK (alcohol IN (0,1,2))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamsTableSQL);
    console.log('✅ Teams table created successfully');

    // Create team_members table
    const createTeamMembersTableSQL = `
      CREATE TABLE IF NOT EXISTS team_members (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- DB内部用の連番ID(0~)
        team_id BIGINT UNSIGNED NOT NULL, -- teamsテーブルのid
        user_id BIGINT UNSIGNED NOT NULL, -- usersテーブルのid
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: 在籍中, 1: 脱退済, 2: 凍結中',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status_changed_at TIMESTAMP NULL COMMENT '凍結・脱退が変更された日時、NULLは在籍中',
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_active_member (team_id, user_id, status),
        INDEX idx_team_id (team_id),
        INDEX idx_user_id (user_id),
        CHECK (status IN (0,1,2))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamMembersTableSQL);
    console.log('✅ Team members table created successfully');

    // Create a partial unique index for active members
    const createUniqueIndexSQL = `
      CREATE UNIQUE INDEX uniq_active_member
      ON team_members (team_id, user_id)
      WHERE status = 0;
    `;

    await connection.execute(createUniqueIndexSQL);
    console.log('✅ Team members table & partial unique index created successfully');

    // Create team_photos table for multiple photos
    const createTeamPhotosTableSQL = `
      CREATE TABLE IF NOT EXISTS team_photos (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_id BIGINT UNSIGNED NOT NULL, -- teamsテーブルのid
        photo_url VARCHAR(500) NOT NULL,
        display_order TINYINT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_team_display_order (team_id, display_order),
        INDEX idx_team_display_order (team_id, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamPhotosTableSQL);
    console.log('✅ Team photos table created successfully');

    // Create team_weekdays table for weekday preferences
    const createTeamWeekdaysTableSQL = `
      CREATE TABLE IF NOT EXISTS team_weekdays (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_id BIGINT UNSIGNED NOT NULL, -- teamsテーブルのid
        weekday TINYINT NOT NULL COMMENT '0: 月曜日, 1: 火曜日, 2: 水曜日, 3: 木曜日, 4: 金曜日, 5: 土曜日, 6: 日曜日',
        time_slot TINYINT NOT NULL COMMENT '0: 昼, 1: 夕方, 2: 夜',
        status TINYINT NOT NULL COMMENT '0: ○, 1: △',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_weekday_time (team_id, weekday, time_slot),
        INDEX idx_team_id (team_id),
        INDEX idx_weekday_time (weekday, time_slot),
        CHECK (weekday IN (0,1,2,3,4,5,6)),
        CHECK (time_slot IN (0,1,2)),
        CHECK (status IN (0,1))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamWeekdaysTableSQL);
    console.log('✅ Team weekdays table created successfully');

    // Create team_hobbies table for hobby preferences
    const createTeamHobbiesTableSQL = `
      CREATE TABLE IF NOT EXISTS team_hobbies (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_id BIGINT UNSIGNED NOT NULL,
        hobby_tag TINYINT UNSIGNED NOT NULL, -- 後でCOMMENTで説明を追加
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_hobby (team_id, hobby_tag),
        INDEX idx_team_id (team_id),
        INDEX idx_hobby_tag (hobby_tag),
        CHECK (hobby_tag >= 0 AND hobby_tag <= 19)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamHobbiesTableSQL);
    console.log('✅ Team hobbies table created successfully');

    // Create team_prefectures table for prefecture preferences
    const createTeamPrefecturesTableSQL = `
      CREATE TABLE IF NOT EXISTS team_prefectures (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_id BIGINT UNSIGNED NOT NULL,
        prefecture_code TINYINT UNSIGNED NOT NULL COMMENT '0: 北海道, 1: 青森県, ..., 46: 沖縄県',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: ○, 1: △',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_prefecture (team_id, prefecture_code),
        INDEX idx_team_id (team_id),
        INDEX idx_prefecture_code (prefecture_code),
        CHECK (prefecture_code >= 0 AND prefecture_code <= 46),
        CHECK (status IN (0,1))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTeamPrefecturesTableSQL);
    console.log('✅ Team prefectures table created successfully');

    // Create group_matching_flows table
    const createGroupMatchingFlowsTableSQL = `
      CREATE TABLE IF NOT EXISTS group_matching_flows (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 内部参照用
        uuid CHAR(36) NOT NULL UNIQUE,                 -- 外部参照・S3参照用
        from_group_id BIGINT UNSIGNED NOT NULL COMMENT '最初にリクエストを送るグループのID',
        to_group_id BIGINT UNSIGNED NOT NULL COMMENT '相手グループのID',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '0: アリにスワイプ済み, 1: グループ全員アリ, 2: 相手全員OK, 3: 正式マッチング, 4: 日程調整完了, 5: キャンセル',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (from_group_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (to_group_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_from_to_groups (from_group_id, to_group_id),
        INDEX idx_from_group_id (from_group_id),
        INDEX idx_to_group_id (to_group_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        CHECK (status IN (0,1,2,3,4,5))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createGroupMatchingFlowsTableSQL);
    console.log('✅ Group matching flows table created successfully');

    // Create user_hidden_groups table
    const createUserHiddenGroupsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_hidden_groups (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        hidden_group_id BIGINT UNSIGNED NOT NULL,
        status TINYINT UNSIGNED NOT NULL COMMENT '0: hidden, 1: blocked, 2: eternal',
        hidden_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '非表示開始時刻',
        hidden_until TIMESTAMP NULL COMMENT '非表示終了時刻（NULLは永続）',
        reason VARCHAR(200) NULL COMMENT '非表示理由の詳細',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hidden_group_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_group_status (user_id, hidden_group_id, status),
        INDEX idx_user_id (user_id),
        INDEX idx_hidden_group_id (hidden_group_id),
        INDEX idx_status (status),
        INDEX idx_hidden_until (hidden_until),
        INDEX idx_hidden_start (hidden_start),
        CHECK (status IN (0, 1, 2)),
        CHECK (hidden_until IS NULL OR hidden_until > hidden_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createUserHiddenGroupsTableSQL);
    console.log('✅ User hidden groups table created successfully');

    // Create chat_rooms table for chat metadata
    const createChatRoomsTableSQL = `
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        matching_flow_id BIGINT UNSIGNED NOT NULL,
        last_message_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (matching_flow_id) REFERENCES group_matching_flows(id) ON DELETE CASCADE,
        INDEX idx_matching_flow_id (matching_flow_id),
        INDEX idx_last_message_at (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createChatRoomsTableSQL);
    console.log('✅ Chat rooms table created successfully');

    console.log('✅ All database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating database tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = createUserTable; 