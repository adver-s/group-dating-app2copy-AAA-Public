#!/usr/bin/env node

/**
 * データベース接続テストスクリプト
 * SQL（SQLite）とNoSQL（JSONファイル）の両方をテスト
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function testDatabases() {
  console.log('🚀 データベース接続テストを開始...\n');

  // 1. SQLデータベースのテスト
  console.log('📊 1. SQLデータベーステスト');
  try {
    const sqlPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./apps/api/prisma/dev.sql.db"
        }
      }
    });

    await sqlPrisma.$connect();
    console.log('✅ SQLデータベース接続成功');

    // 各テーブルのテスト
    const userCount = await sqlPrisma.user.count();
    console.log(`📋 ユーザーテーブル件数: ${userCount}`);

    const teamCount = await sqlPrisma.team.count();
    console.log(`📋 チームテーブル件数: ${teamCount}`);

    const memberCount = await sqlPrisma.teamMember.count();
    console.log(`📋 チームメンバーテーブル件数: ${memberCount}`);

    await sqlPrisma.$disconnect();
    console.log('✅ SQLデータベーステスト成功');
  } catch (error) {
    console.error('❌ SQLデータベーステスト失敗:', error.message);
  }
  console.log('');

  // 2. NoSQLデータベースのテスト
  console.log('📊 2. NoSQLデータベーステスト');
  try {
    const dataDir = './apps/api/data';
    const chatMessagesPath = path.join(dataDir, 'chat-messages.json');
    const judgementHistoryPath = path.join(dataDir, 'user-judgement-history.json');

    // テストデータを作成
    const testMessage = {
      id: 'test_msg_' + Date.now(),
      chatRoomId: 'test_room',
      senderId: 'test_user',
      content: 'テストメッセージ',
      type: 'text',
      createdAt: new Date().toISOString()
    };

    const testJudgement = {
      id: 'test_judge_' + Date.now(),
      targetGroupId: 'test_group',
      judgementId: 'test_judgement',
      userId: 'test_user',
      status: 1,
      phase: 1,
      createdAt: new Date().toISOString()
    };

    // チャットメッセージのテスト
    let messages = [];
    if (fs.existsSync(chatMessagesPath)) {
      messages = JSON.parse(fs.readFileSync(chatMessagesPath, 'utf8'));
    }
    messages.push(testMessage);
    fs.writeFileSync(chatMessagesPath, JSON.stringify(messages, null, 2));
    console.log('✅ チャットメッセージ保存成功:', testMessage.id);

    // メッセージ取得のテスト
    const savedMessages = JSON.parse(fs.readFileSync(chatMessagesPath, 'utf8'));
    const roomMessages = savedMessages.filter(function(msg) { return msg.chatRoomId === 'test_room'; });
    console.log(`📋 テストルームのメッセージ件数: ${roomMessages.length}`);

    // ユーザー判定履歴のテスト
    let judgements = [];
    if (fs.existsSync(judgementHistoryPath)) {
      judgements = JSON.parse(fs.readFileSync(judgementHistoryPath, 'utf8'));
    }
    judgements.push(testJudgement);
    fs.writeFileSync(judgementHistoryPath, JSON.stringify(judgements, null, 2));
    console.log('✅ ユーザー判定履歴保存成功:', testJudgement.id);

    // 判定履歴取得のテスト
    const savedJudgements = JSON.parse(fs.readFileSync(judgementHistoryPath, 'utf8'));
    const userJudgements = savedJudgements.filter(function(judge) { return judge.userId === 'test_user'; });
    console.log(`📋 テストユーザーの判定履歴件数: ${userJudgements.length}`);

    // クリーンアップ
    const cleanMessages = savedMessages.filter(function(msg) { return msg.id !== testMessage.id; });
    const cleanJudgements = savedJudgements.filter(function(judge) { return judge.id !== testJudgement.id; });
    fs.writeFileSync(chatMessagesPath, JSON.stringify(cleanMessages, null, 2));
    fs.writeFileSync(judgementHistoryPath, JSON.stringify(cleanJudgements, null, 2));

    console.log('✅ NoSQLデータベーステスト成功');
  } catch (error) {
    console.error('❌ NoSQLデータベーステスト失敗:', error.message);
  }
  console.log('');

  // 3. ファイル構造の確認
  console.log('📊 3. ファイル構造確認');
  console.log(`🗄️ SQLデータベース: apps/api/prisma/dev.sql.db`);
  console.log(`📁 NoSQLデータディレクトリ: apps/api/data/`);
  console.log(`🔧 Prismaスキーマ: apps/api/prisma/schema.prisma`);
  console.log(`📦 データベース接続: apps/api/lib/database.ts`);
  console.log('');

  // 作成されたファイル一覧
  console.log('📋 作成されたファイル:');
  try {
    const files = fs.readdirSync('./apps/api/data');
    files.forEach(function(file) {
      const filePath = path.join('./apps/api/data', file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
  } catch (error) {
    console.log('  - (データファイルなし)');
  }
  console.log('');

  console.log('🎉 データベーステスト完了！');
}

// スクリプト実行
if (require.main === module) {
  testDatabases()
    .then(() => {
      console.log('\n✅ すべてのテストが完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ テスト中にエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { testDatabases };
