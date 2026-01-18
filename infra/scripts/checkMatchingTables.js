require('dotenv').config();
const connectAurora = require('./connectAurora');

async function checkMatchingTables() {
  let connection;
  
  try {
    connection = await connectAurora();

    console.log('=== group_matching_flows テーブルの確認 ===');
    const flows = await connection.execute(`
      SELECT 
        matching_id,
        from_group_id,
        to_group_id,
        status,
        created_at,
        updated_at
      FROM group_matching_flows 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('group_matching_flows:', flows[0]);

    console.log('\n=== group_member_judgements テーブルの確認 ===');
    const judgements = await connection.execute(`
      SELECT 
        id,
        matching_id,
        user_id,
        judgement,
        judgement_updated_at,
        created_at
      FROM group_member_judgements 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('group_member_judgements:', judgements[0]);

    console.log('\n=== 最新のスワイプアクション（1月26日）の確認 ===');
    const recentActions = await connection.execute(`
      SELECT 
        gmf.matching_id,
        gmf.from_group_id,
        gmf.to_group_id,
        gmf.created_at as flow_created_at,
        gmj.judgement,
        gmj.judgement_updated_at,
        gmj.user_id
      FROM group_matching_flows gmf
      LEFT JOIN group_member_judgements gmj ON gmf.matching_id = gmj.matching_id
      WHERE gmf.created_at >= '2025-01-26'
      ORDER BY gmf.created_at DESC
    `);
    console.log('最新のスワイプアクション:', recentActions[0]);

    await connection.end();
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMatchingTables(); 