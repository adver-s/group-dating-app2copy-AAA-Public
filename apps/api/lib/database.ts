// 統合データベース接続ファイル
// SQL（Prisma）とNoSQL（ローカルJSON）の両方を扱う

import {
    chatMessages,
    chatReadStatus,
    saveChatMessage,
    saveUserJudgementHistory,
    saveUserJudgementLatest,
    updateChatReadStatus,
    userJudgementHistory,
    userJudgementLatest
} from '../utils/local-nosql';
import { prisma } from './prisma';

// SQLデータベース（リレーショナルデータ用）
export { prisma };

// NoSQLデータベース（非構造化データ用）
    export {
        chatMessages,
        chatReadStatus, saveChatMessage, saveUserJudgementHistory,
        saveUserJudgementLatest, updateChatReadStatus, userJudgementHistory,
        userJudgementLatest
    };

// データベース接続テスト関数
export async function testDatabaseConnections() {
  console.log('🧪 データベース接続テストを開始...');

  try {
    // SQLデータベース接続テスト
    await prisma.$connect();
    console.log('✅ SQLデータベース接続成功');

    // NoSQLデータベース接続テスト
    await userJudgementHistory.insert({ test: 'connection', value: 'success' });
    await userJudgementHistory.deleteMany({ test: 'connection' });
    console.log('✅ NoSQLデータベース接続成功');

    console.log('🎉 すべてのデータベース接続が正常です！');
    return true;
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
