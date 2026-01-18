const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createDynamoDBTables() {
  try {
    console.log('🚀 DynamoDBテーブルの作成を開始します...');

    // --- 1. ユーザー判定テーブル: 履歴 ---
    const createUserJudgementHistoryTable = {
      TableName: "user-judgement-history",
      KeySchema: [
        { AttributeName: "targetGroupId", KeyType: "HASH" },
        { AttributeName: "judgementId", KeyType: "RANGE" }
      ],
      AttributeDefinitions: [
        { AttributeName: "targetGroupId", AttributeType: "S" },
        { AttributeName: "judgementId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "status", AttributeType: "N" },
        { AttributeName: "phase", AttributeType: "N" },
        { AttributeName: "createdAt", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "user-history-index",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    // --- 2. ユーザー判定テーブル: 最新 ---
    const createUserJudgementLatestTable = {
      TableName: "user-judgement-latest",
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "targetGroupId", KeyType: "RANGE" }
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "targetGroupId", AttributeType: "S" },
        { AttributeName: "status", AttributeType: "N" },
        { AttributeName: "phase", AttributeType: "N" },
        { AttributeName: "updatedAt", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "group-status-index",
          KeySchema: [
            { AttributeName: "targetGroupId", KeyType: "HASH" },
            { AttributeName: "status", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    // --- 3. チャットメッセージテーブル ---
    const createChatMessagesTable = {
      TableName: 'chat-messages',
      KeySchema: [
        { AttributeName: 'chatRoomId', KeyType: 'HASH' },
        { AttributeName: 'timestampId', KeyType: 'RANGE' } // ISO8601ミリ秒 + UUIDサフィックス
      ],
      AttributeDefinitions: [
        { AttributeName: 'chatRoomId', AttributeType: 'S' },
        { AttributeName: 'timestampId', AttributeType: 'S' },
        { AttributeName: 'senderId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'sender-timestamp-index',
          KeySchema: [
            { AttributeName: 'senderId', KeyType: 'HASH' },
            { AttributeName: 'timestampId', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    // --- 4. 既読管理補助テーブル ---
    const createChatReadStatusTable = {
      TableName: 'chat-read-status',
      KeySchema: [
        { AttributeName: 'chatRoomId', KeyType: 'HASH' },
        { AttributeName: 'userId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'chatRoomId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'lastReadAt', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'user-last-read-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'lastReadAt', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    const tablesToCreate = [
      createUserJudgementHistoryTable,
      createUserJudgementLatestTable,
      createChatMessagesTable,
      createChatReadStatusTable
    ];

    // 既存テーブル一覧取得
    const existingTables = await dynamoDBClient.send(new ListTablesCommand({}));
    console.log('📋 既存のテーブル:', existingTables.TableNames);

    // 各テーブル作成
    for (const table of tablesToCreate) {
      if (!existingTables.TableNames.includes(table.TableName)) {
        console.log(`🔧 テーブル "${table.TableName}" を作成中...`);
        await dynamoDBClient.send(new CreateTableCommand(table));
        console.log(`✅ "${table.TableName}" 作成完了`);
      } else {
        console.log(`⏭️ "${table.TableName}" は既に存在`);
      }
    }

    console.log('🎉 DynamoDBテーブルの作成が完了しました！');

  } catch (error) {
    console.error('❌ DynamoDBテーブル作成エラー:', error);
    throw error;
  }
}

module.exports = createDynamoDBTables;

if (require.main === module) {
  createDynamoDBTables()
    .then(() => { console.log('✅ DynamoDBテーブル作成完了'); process.exit(0); })
    .catch((error) => { console.error('❌ DynamoDBテーブル作成失敗:', error); process.exit(1); });
} 