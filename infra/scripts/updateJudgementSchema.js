const connectAurora = require('./connectAurora');

async function updateJudgementSchema() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('🔧 Updating judgement schema...');
    
    // 1. group_member_judgementsテーブルのjudgementカラムを修正
    try {
      await connection.execute(`
        ALTER TABLE group_member_judgements 
        MODIFY COLUMN judgement ENUM('like','dislike','hold','approve','wants_meet') NOT NULL
      `);
      console.log('✅ Updated group_member_judgements judgement enum with wants_meet');
    } catch (error) {
      console.log('⚠️ Could not update group_member_judgements judgement enum:', error.message);
    }

    // 2. 既存のlikeデータをwants_meetに更新（オプション）
    try {
      const [likeCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM group_member_judgements WHERE judgement = 'like'
      `);
      console.log(`📊 Current like judgements: ${likeCount[0].count}`);

      if (likeCount[0].count > 0) {
        await connection.execute(`
          UPDATE group_member_judgements 
          SET judgement = 'wants_meet' 
          WHERE judgement = 'like'
        `);
        console.log('✅ Updated existing like judgements to wants_meet');
      }
    } catch (error) {
      console.log('⚠️ Could not update existing like judgements:', error.message);
    }

    console.log('✅ Judgement schema update completed');
    
  } catch (error) {
    console.error('❌ Failed to update judgement schema:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = updateJudgementSchema;

if (require.main === module) {
  updateJudgementSchema()
    .then(() => {
      console.log('🎉 Judgement schema update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Judgement schema update failed:', error);
      process.exit(1);
    });
}
