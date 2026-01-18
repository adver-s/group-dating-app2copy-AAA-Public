import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

// DynamoDBクライアントの初期化
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// ユーザー判定関連の型定義
export interface UserJudgement {
  userId: string;
  targetGroupId: string;
  judgementId: string;
  status: number; // 0: 未判定, 1: いいね, 2: スキップ
  phase: number; // 判定フェーズ
  createdAt: string;
  updatedAt: string;
}

export interface UserJudgementLatest {
  userId: string;
  targetGroupId: string;
  status: number;
  phase: number;
  updatedAt: string;
}

// チャット関連の型定義
export interface ChatMessage {
  chatRoomId: string;
  timestampId: string; // ISO8601ミリ秒 + UUIDサフィックス
  senderId: string;
  message: string;
  messageType: 'text' | 'image' | 'system';
  createdAt: string;
}

export interface ChatReadStatus {
  chatRoomId: string;
  userId: string;
  lastReadAt: string;
  unreadCount: number;
}

// ユーザー判定履歴テーブル操作
export class UserJudgementHistoryService {
  private tableName = 'user-judgement-history';

  async createJudgement(judgement: UserJudgement): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: judgement,
    });
    await docClient.send(command);
  }

  async getJudgementsByUser(userId: string): Promise<UserJudgement[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'user-history-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // 最新順
    });
    
    const result = await docClient.send(command);
    return result.Items as UserJudgement[];
  }

  async getJudgementsByGroup(targetGroupId: string): Promise<UserJudgement[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'targetGroupId = :targetGroupId',
      ExpressionAttributeValues: {
        ':targetGroupId': targetGroupId,
      },
      ScanIndexForward: false,
    });
    
    const result = await docClient.send(command);
    return result.Items as UserJudgement[];
  }
}

// ユーザー判定最新テーブル操作
export class UserJudgementLatestService {
  private tableName = 'user-judgement-latest';

  async updateLatestJudgement(judgement: UserJudgementLatest): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: judgement,
    });
    await docClient.send(command);
  }

  async getLatestJudgement(userId: string, targetGroupId: string): Promise<UserJudgementLatest | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        userId,
        targetGroupId,
      },
    });
    
    const result = await docClient.send(command);
    return result.Item as UserJudgementLatest || null;
  }

  async getGroupJudgements(targetGroupId: string, status?: number): Promise<UserJudgementLatest[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'group-status-index',
      KeyConditionExpression: status !== undefined 
        ? 'targetGroupId = :targetGroupId AND #status = :status'
        : 'targetGroupId = :targetGroupId',
      ExpressionAttributeNames: status !== undefined ? {
        '#status': 'status',
      } : undefined,
      ExpressionAttributeValues: {
        ':targetGroupId': targetGroupId,
        ...(status !== undefined && { ':status': status }),
      },
    });
    
    const result = await docClient.send(command);
    return result.Items as UserJudgementLatest[];
  }
}

// チャットメッセージテーブル操作
export class ChatMessageService {
  private tableName = 'chat-messages';

  async sendMessage(message: ChatMessage): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: message,
    });
    await docClient.send(command);
  }

  async getMessages(chatRoomId: string, limit = 50): Promise<ChatMessage[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'chatRoomId = :chatRoomId',
      ExpressionAttributeValues: {
        ':chatRoomId': chatRoomId,
      },
      ScanIndexForward: false, // 最新順
      Limit: limit,
    });
    
    const result = await docClient.send(command);
    return (result.Items as ChatMessage[]).reverse(); // 時系列順に並び替え
  }

  async getMessagesBySender(senderId: string, limit = 50): Promise<ChatMessage[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'sender-timestamp-index',
      KeyConditionExpression: 'senderId = :senderId',
      ExpressionAttributeValues: {
        ':senderId': senderId,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    const result = await docClient.send(command);
    return result.Items as ChatMessage[];
  }
}

// チャット既読状態テーブル操作
export class ChatReadStatusService {
  private tableName = 'chat-read-status';

  async updateReadStatus(readStatus: ChatReadStatus): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: readStatus,
    });
    await docClient.send(command);
  }

  async getReadStatus(chatRoomId: string, userId: string): Promise<ChatReadStatus | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        chatRoomId,
        userId,
      },
    });
    
    const result = await docClient.send(command);
    return result.Item as ChatReadStatus || null;
  }

  async getUserReadStatuses(userId: string): Promise<ChatReadStatus[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'user-last-read-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
    });
    
    const result = await docClient.send(command);
    return result.Items as ChatReadStatus[];
  }
}

// インスタンスのエクスポート
export const userJudgementHistoryService = new UserJudgementHistoryService();
export const userJudgementLatestService = new UserJudgementLatestService();
export const chatMessageService = new ChatMessageService();
export const chatReadStatusService = new ChatReadStatusService();

// ユーティリティ関数
export function generateTimestampId(): string {
  const timestamp = new Date().toISOString();
  const uuid = crypto.randomUUID();
  return `${timestamp}_${uuid}`;
}

export function generateJudgementId(): string {
  return `judgement_${Date.now()}_${crypto.randomUUID()}`;
}
