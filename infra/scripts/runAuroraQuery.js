
const connectAurora = require('./connectAurora');

async function runAuroraQuery(query, params = []) {
  let connection;

  try {
    connection = await connectAurora();

    console.log('🔍 Executing query:', query);
    console.log('📝 Parameters:', params);

    const [rows] = await connection.execute(query, params);

    console.log('✅ Query executed successfully');
    console.log('📊 Results:', rows);

    return rows;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertSampleData() {
  try {
    console.log('📝 Inserting sample data...');

    // Insert sample users
    const sampleUsers = [
      ['user1', 'user1@example.com', 'Tokyo', 25, 0], // 女子
      ['user2', 'user2@example.com', 'Osaka', 28, 1], // 男子
      ['user3', 'user3@example.com', 'Kyoto', 26, 0], // 女子
      ['user4', 'user4@example.com', 'Fukuoka', 27, 1] // 男子
    ];

    for (const [username, email, location, age, gender] of sampleUsers) {
      await runAuroraQuery(`
        INSERT INTO users (id, cognito_sub, username, bio, age, gender, cancelRate)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        bio = VALUES(bio), age = VALUES(age), gender = VALUES(gender), cancelRate = VALUES(cancelRate)
      `, [username, username, `${username}の自己紹介です`, age, gender, Math.floor(Math.random() * 20)]); // 0-19のキャンセル率
    }

    console.log('✅ Sample users inserted successfully');

    // Insert sample teams
    const sampleTeams = [
      ['Team Alpha', 'A fun group from Tokyo', 0, 1, 0, 1, 'user1'], // 女子のみ、女子に表示
      ['Team Beta', 'Adventure seekers from Osaka', 1, 1, 1, 2, 'user2'], // 男女混在、男女どちらにも表示
      ['Team Gamma', 'Food lovers from Kyoto', 0, 0, 0, 0, 'user3'], // 女子のみ、女子に表示
      ['Team Delta', 'Sports enthusiasts from Fukuoka', 2, 2, 1, 1, 'user4'] // 男子のみ、男子に表示
    ];

    for (const [name, description, gender, target_gender, smoke, alcohol, createdBy] of sampleTeams) {
      await runAuroraQuery(`
        INSERT INTO teams (id, name, description, gender, target_gender, smoke, alcohol, created_by)
        SELECT UUID(), ?, ?, ?, ?, ?, ?, u.id
        FROM users u
        WHERE u.username = ?
        ON DUPLICATE KEY UPDATE
        name = VALUES(name), description = VALUES(description), gender = VALUES(gender), target_gender = VALUES(target_gender), smoke = VALUES(smoke), alcohol = VALUES(alcohol)
      `, [name, description, gender, target_gender, smoke, alcohol, createdBy]);
    }

    console.log('✅ Sample teams inserted successfully');

    // Add team members
    await runAuroraQuery(`
      INSERT INTO team_members (id, team_id, user_id, role)
      SELECT 
        UUID(),
        t.id,
        u.id,
        'leader'
      FROM teams t
      JOIN users u ON t.created_by = u.id
      ON DUPLICATE KEY UPDATE role = 'leader'
    `);

    console.log('✅ Team members inserted successfully');

    // Insert sample group matching flows
    const sampleFlows = [
      ['flow1', 'user1', 'user2', 1], // グループ全員アリ
      ['flow2', 'user3', 'user4', 0], // アリにスワイプ済み
      ['flow3', 'user1', 'user3', 2], // 相手全員OK
      ['flow4', 'user2', 'user4', 3]  // 正式マッチング
    ];

    for (const [flowId, fromUser, toUser, status] of sampleFlows) {
      await runAuroraQuery(`
        INSERT INTO group_matching_flows (id, matching_id, from_group_id, to_group_id, status)
        SELECT 
          UUID(),
          ?,
          t1.id,
          t2.id,
          ?
        FROM teams t1
        JOIN teams t2 ON t2.created_by = (SELECT id FROM users WHERE username = ?)
        WHERE t1.created_by = (SELECT id FROM users WHERE username = ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `, [flowId, status, toUser, fromUser]);
    }

    console.log('✅ Group matching flows inserted successfully');

    // Insert sample group member judgements
    const sampleJudgements = [
      ['flow1', 'user1', 'user2', 1, null], // アリ
      ['flow1', 'user2', 'user1', 1, null], // アリ
      ['flow2', 'user3', 'user4', 0, null], // 未判定
      ['flow2', 'user4', 'user3', 2, null], // パス
      ['flow3', 'user1', 'user3', 1, null], // アリ
      ['flow3', 'user3', 'user1', 3, '2024-12-31 23:59:59'], // 非表示（年末まで）
      ['flow4', 'user2', 'user4', 5, null], // エターナル
      ['flow4', 'user4', 'user2', 4, null]  // ブロック
    ];

    for (const [flowId, userId, targetUserId, status, hiddenUntil] of sampleJudgements) {
      await runAuroraQuery(`
        INSERT INTO group_member_judgements (id, matching_id, user_id, target_group_id, status, hidden_until)
        SELECT 
          UUID(),
          ?,
          u.id,
          t.id,
          ?,
          ?
        FROM users u
        JOIN teams t ON t.created_by = (SELECT id FROM users WHERE username = ?)
        WHERE u.username = ?
        ON DUPLICATE KEY UPDATE status = VALUES(status), hidden_until = VALUES(hidden_until)
      `, [flowId, status, hiddenUntil, targetUserId, userId]);
    }

    console.log('✅ Group member judgements inserted successfully');

    // Insert sample team photos
    const teamPhotos = [
      ['Team Alpha', ['/sample1.jpg', '/sample2.jpg']],
      ['Team Beta', ['/sample3.jpg', '/sample4.jpg']],
      ['Team Gamma', ['/sample5.jpg', '/sample6.jpg']],
      ['Team Delta', ['/sample7.jpg', '/sample1.jpg']]
    ];

    for (const [teamName, photos] of teamPhotos) {
      const team = await runAuroraQuery(`
        SELECT id FROM teams WHERE name = ?
      `, [teamName]);

      if (team.length > 0) {
        const teamId = team[0].id;

        // Delete existing photos
        await runAuroraQuery(`
          DELETE FROM team_photos WHERE team_id = ?
        `, [teamId]);

        // Insert new photos
        for (let i = 0; i < photos.length; i++) {
          await runAuroraQuery(`
            INSERT INTO team_photos (id, team_id, photo_url, display_order)
            VALUES (UUID(), ?, ?, ?)
          `, [teamId, photos[i], i]);
        }
      }
    }

    console.log('✅ Team photos added successfully');

    // Insert sample team weekdays (using INT values)
    const teamWeekdays = [
      ['Team Alpha', [0, 0], [4, 2]], // 月曜日昼、金曜日夜
      ['Team Beta', [5, 1], [6, 0]], // 土曜日夕方、日曜日昼
      ['Team Gamma', [2, 1], [3, 2]], // 水曜日夕方、木曜日夜
      ['Team Delta', [4, 2], [5, 0]] // 金曜日夜、土曜日昼
    ];

    for (const [teamName, weekdayData1, weekdayData2] of teamWeekdays) {
      const team = await runAuroraQuery(`
        SELECT id FROM teams WHERE name = ?
      `, [teamName]);

      if (team.length > 0) {
        const teamId = team[0].id;

        // Delete existing weekdays
        await runAuroraQuery(`
          DELETE FROM team_weekdays WHERE team_id = ?
        `, [teamId]);

        // Insert new weekdays
        await runAuroraQuery(`
          INSERT INTO team_weekdays (id, team_id, weekday, time_slot)
          VALUES (UUID(), ?, ?, ?)
        `, [teamId, weekdayData1[0], weekdayData1[1]]);

        await runAuroraQuery(`
          INSERT INTO team_weekdays (id, team_id, weekday, time_slot)
          VALUES (UUID(), ?, ?, ?)
        `, [teamId, weekdayData2[0], weekdayData2[1]]);
      }
    }

    console.log('✅ Team weekdays added successfully');

    // Insert sample team hobbies
    const teamHobbies = [
      ['Team Alpha', ['cafe', 'travel']],
      ['Team Beta', ['sports', 'outdoor']],
      ['Team Gamma', ['cooking', 'restaurant']],
      ['Team Delta', ['gaming', 'music']]
    ];

    for (const [teamName, hobbies] of teamHobbies) {
      const team = await runAuroraQuery(`
        SELECT id FROM teams WHERE name = ?
      `, [teamName]);

      if (team.length > 0) {
        const teamId = team[0].id;

        // Delete existing hobbies
        await runAuroraQuery(`
          DELETE FROM team_hobbies WHERE team_id = ?
        `, [teamId]);

        // Insert new hobbies
        for (const hobby of hobbies) {
          await runAuroraQuery(`
            INSERT INTO team_hobbies (id, team_id, hobby_tag)
            VALUES (UUID(), ?, ?)
          `, [teamId, hobby]);
        }
      }
    }

    console.log('✅ Team hobbies added successfully');

    // Insert sample team prefectures (using INT codes)
    const teamPrefectures = [
      ['Team Alpha', [13, 14]], // 東京都、神奈川県
      ['Team Beta', [27, 26]], // 大阪府、京都府
      ['Team Gamma', [26, 27]], // 京都府、大阪府
      ['Team Delta', [40, 43]] // 福岡県、熊本県
    ];

    for (const [teamName, prefectures] of teamPrefectures) {
      const team = await runAuroraQuery(`
        SELECT id FROM teams WHERE name = ?
      `, [teamName]);

      if (team.length > 0) {
        const teamId = team[0].id;

        // Delete existing prefectures
        await runAuroraQuery(`
          DELETE FROM team_prefectures WHERE team_id = ?
        `, [teamId]);

        // Insert new prefectures
        for (const prefecture of prefectures) {
          await runAuroraQuery(`
            INSERT INTO team_prefectures (id, team_id, prefecture_code)
            VALUES (UUID(), ?, ?)
          `, [teamId, prefecture]);
        }
      }
    }

    console.log('✅ Team prefectures added successfully');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    throw error;
  }
}

module.exports = {
  runAuroraQuery,
  insertSampleData
}; 