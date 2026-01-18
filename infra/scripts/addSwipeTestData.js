require('dotenv').config();
const connectAurora = require('./connectAurora');

async function addSwipeTestData() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Adding swipe test data...');
    
    // テスト用ユーザーID
    const currentUserId = 'ecc20c18-6516-11f0-9176-069696d86c17';
    
    // 出動中チームIDを取得
    const activeTeamResult = await connection.execute(`
      SELECT t.id as team_id
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND tm.is_active_team = TRUE
      LIMIT 1
    `, [currentUserId]);
    
    if (!activeTeamResult[0] || activeTeamResult[0].length === 0) {
      console.log('❌ 出動中チームが見つかりません');
      return;
    }
    
    const activeTeamId = activeTeamResult[0][0].team_id;
    console.log('✅ 出動中チームID:', activeTeamId);
    
    // 他のチームIDを取得（スワイプ対象）
    const otherTeamsResult = await connection.execute(`
      SELECT id, name
      FROM teams
      WHERE id != ? AND is_active = TRUE
      LIMIT 5
    `, [activeTeamId]);
    
    if (!otherTeamsResult[0] || otherTeamsResult[0].length === 0) {
      console.log('❌ スワイプ対象のチームが見つかりません');
      return;
    }
    
    console.log('✅ スワイプ対象チーム:', otherTeamsResult[0].map(t => ({ id: t.id, name: t.name })));
    
    // スワイプアクションを追加
    const actions = ['like', 'pass', 'hold'];
    let addedCount = 0;
    
    for (const team of otherTeamsResult[0]) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      try {
        await connection.execute(`
          INSERT INTO swipe_actions (id, user_id, target_team_id, action, created_at)
          VALUES (UUID(), ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
        `, [currentUserId, team.id, action, Math.floor(Math.random() * 7)]);
        
        console.log(`✅ スワイプアクション追加: ${team.name} -> ${action}`);
        addedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️ 既に存在: ${team.name} -> ${action}`);
        } else {
          console.error(`❌ エラー: ${team.name} -> ${action}`, error.message);
        }
      }
    }
    
    // 他のチームから出動中チームへのいいねも追加
    const otherUsersResult = await connection.execute(`
      SELECT u.id, u.username
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      JOIN teams t ON tm.team_id = t.id
      WHERE t.id != ? AND tm.is_active = TRUE
      LIMIT 3
    `, [activeTeamId]);
    
    for (const user of otherUsersResult[0]) {
      try {
        await connection.execute(`
          INSERT INTO swipe_actions (id, user_id, target_team_id, action, created_at)
          VALUES (UUID(), ?, ?, 'like', DATE_SUB(NOW(), INTERVAL ? DAY))
        `, [user.id, activeTeamId, Math.floor(Math.random() * 3)]);
        
        console.log(`✅ 他のチームからのいいね追加: ${user.username} -> 出動中チーム`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️ 既に存在: ${user.username} -> 出動中チーム`);
        } else {
          console.error(`❌ エラー: ${user.username} -> 出動中チーム`, error.message);
        }
      }
    }
    
    console.log(`✅ 合計 ${addedCount} 件のスワイプテストデータを追加しました`);
    
  } catch (error) {
    console.error('❌ Failed to add swipe test data:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = addSwipeTestData;

// スクリプトが直接実行された場合
if (require.main === module) {
  addSwipeTestData().catch(console.error);
} 