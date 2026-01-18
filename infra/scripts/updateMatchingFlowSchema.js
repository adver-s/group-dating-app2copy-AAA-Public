const connectAurora = require('./connectAurora');

async function updateMatchingFlowSchema() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Updating matching flow schema...');
    
    // 1. group_matching_flowsテーブルのstatusコメントを修正
    try {
      await connection.execute(`
        ALTER TABLE group_matching_flows 
        MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0
        COMMENT '0: 1人目Like, 1: 自グル全員Like, 2: 相手全員承諾, 3: マッチ'
      `);
      console.log('✅ Updated group_matching_flows status comment');
    } catch (error) {
      console.log('⚠️ Could not update group_matching_flows status comment:', error.message);
    }

    // 2. group_member_judgementsテーブルのjudgementカラムを修正
    try {
      await connection.execute(`
        ALTER TABLE group_member_judgements 
        MODIFY COLUMN judgement ENUM('like','dislike','hold','approve') NOT NULL
      `);
      console.log('✅ Updated group_member_judgements judgement enum');
    } catch (error) {
      console.log('⚠️ Could not update group_member_judgements judgement enum:', error.message);
    }

    // 3. インデックスを追加
    try {
      await connection.execute(`
        CREATE INDEX idx_judgements_matching_group 
        ON group_member_judgements (matching_id, group_id, judgement)
      `);
      console.log('✅ Created idx_judgements_matching_group index');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ idx_judgements_matching_group index already exists');
      } else {
        console.log('⚠️ Could not create idx_judgements_matching_group index:', error.message);
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_flows_from_to 
        ON group_matching_flows (from_group_id, to_group_id)
      `);
      console.log('✅ Created idx_flows_from_to index');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ idx_flows_from_to index already exists');
      } else {
        console.log('⚠️ Could not create idx_flows_from_to index:', error.message);
      }
    }

    // 4. 既存のデータを新しいスキーマに合わせて更新
    try {
      // status 0 (1人目Like) のデータを確認
      const [status0Count] = await connection.execute(`
        SELECT COUNT(*) as count FROM group_matching_flows WHERE status = 0
      `);
      console.log(`📊 Current status 0 flows: ${status0Count[0].count}`);

      // 全員Likeの条件を満たすフローをstatus 1に更新
      await connection.execute(`
        UPDATE group_matching_flows gmf
        SET status = 1
        WHERE gmf.status = 0
        AND (
          SELECT COUNT(*)
          FROM group_member_judgements gmj
          WHERE gmj.matching_id = gmf.matching_id
          AND gmj.group_id = gmf.from_group_id
          AND gmj.judgement = 'like'
        ) = (
          SELECT COUNT(*)
          FROM team_members tm
          WHERE tm.team_id = gmf.from_group_id
          AND tm.is_active = TRUE
        )
      `);
      console.log('✅ Updated flows to status 1 (全員Like)');

    } catch (error) {
      console.log('⚠️ Could not update existing flows:', error.message);
    }

    console.log('✅ Matching flow schema update completed');
    
  } catch (error) {
    console.error('❌ Failed to update matching flow schema:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = updateMatchingFlowSchema;

if (require.main === module) {
  updateMatchingFlowSchema()
    .then(() => {
      console.log('🎉 Schema update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema update failed:', error);
      process.exit(1);
    });
} 