// ローカルNoSQLデータベースの代用クラス（JSONファイルベース）
import { promises as fs } from 'fs';
import path from 'path';

interface NoSQLItem {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

class LocalNoSQL {
  private tableName: string;
  private filePath: string;
  private data: NoSQLItem[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
    this.filePath = path.join(process.cwd(), 'apps/api/data', `${tableName}.json`);
    this.loadData();
  }

  private async loadData() {
    try {
      await fs.access(this.filePath);
      const data = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(data);
    } catch (error) {
      this.data = [];
    }
  }

  private async saveData() {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error(`Error saving data for table ${this.tableName}:`, error);
    }
  }

  async insert(item: NoSQLItem): Promise<NoSQLItem> {
    await this.loadData();
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.data.push(newItem);
    await this.saveData();
    return newItem;
  }

  async findById(id: string): Promise<NoSQLItem | null> {
    await this.loadData();
    return this.data.find(item => item.id === id) || null;
  }

  async findMany(query: any = {}): Promise<NoSQLItem[]> {
    await this.loadData();
    return this.data.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  async findOne(query: any = {}): Promise<NoSQLItem | null> {
    const results = await this.findMany(query);
    return results[0] || null;
  }

  async update(id: string, updates: Partial<NoSQLItem>): Promise<NoSQLItem | null> {
    await this.loadData();
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveData();
    return this.data[index];
  }

  async upsert(query: any, updates: Partial<NoSQLItem>): Promise<NoSQLItem> {
    const existing = await this.findOne(query);
    if (existing) {
      return await this.update(existing.id!, updates);
    } else {
      return await this.insert({ ...query, ...updates });
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.loadData();
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    if (this.data.length < initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  async deleteMany(query: any = {}): Promise<number> {
    await this.loadData();
    const initialLength = this.data.length;
    this.data = this.data.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] === value) return false;
      }
      return true;
    });
    const deletedCount = initialLength - this.data.length;
    if (deletedCount > 0) {
      await this.saveData();
    }
    return deletedCount;
  }

  async getAll(): Promise<NoSQLItem[]> {
    await this.loadData();
    return [...this.data];
  }

  async clear(): Promise<void> {
    this.data = [];
    await this.saveData();
  }
}

// 各テーブルのインスタンスを作成
export const userJudgementHistory = new LocalNoSQL('user-judgement-history');
export const userJudgementLatest = new LocalNoSQL('user-judgement-latest');
export const chatMessages = new LocalNoSQL('chat-messages');
export const chatReadStatus = new LocalNoSQL('chat-read-status');

// 便利な関数
export async function saveUserJudgementHistory(targetGroupId: string, judgementId: string, userId: string, status: number, phase: number) {
  return await userJudgementHistory.insert({
    targetGroupId,
    judgementId,
    userId,
    status,
    phase
  });
}

export async function saveUserJudgementLatest(userId: string, targetGroupId: string, status: number, phase: number) {
  return await userJudgementLatest.upsert(
    { userId, targetGroupId },
    { status, phase }
  );
}

export async function saveChatMessage(chatRoomId: string, message: any) {
  const timestampId = `${new Date().toISOString()}-${crypto.randomUUID()}`;
  return await chatMessages.insert({
    chatRoomId,
    timestampId,
    senderId: message.senderId,
    content: message.content,
    type: message.type || 'text'
  });
}

export async function updateChatReadStatus(chatRoomId: string, userId: string, lastReadAt: string) {
  return await chatReadStatus.upsert(
    { chatRoomId, userId },
    { lastReadAt }
  );
}
