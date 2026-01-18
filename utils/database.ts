import { PrismaClient } from '@prisma/client';
import { DatabaseError } from './errors/DatabaseError';
import { log } from './logger';

// SQLデータベース用のPrismaクライアント（新しい構造用）
const globalForSQLPrisma = globalThis as unknown as { sqlPrisma?: PrismaClient }

const sqlPrisma =
  globalForSQLPrisma.sqlPrisma ?? new PrismaClient({
    log: ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL_SQL || "file:./apps/api/prisma/dev.sql.db"
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForSQLPrisma.sqlPrisma = sqlPrisma

// SQLデータベース用のクエリ実行関数
export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const startTime = Date.now();

  try {
    log.dbQuery(sql, params);

    // SQLデータベース用のクエリ実行
    const result = await sqlPrisma.$queryRawUnsafe(sql, ...params);
    const duration = Date.now() - startTime;
    log.dbQuery(sql, params, duration);

    return result as any[];
  } catch (error) {
    log.error('Database Error', {
      query: sql,
      params: params
    }, error);

    throw new DatabaseError(`Failed to execute query: ${sql}`, error as Error);
  }
}

export async function testConnection() {
  try {
    await sqlPrisma.$queryRaw`SELECT 1`;
    log.info('Database connection is working');
    return true;
  } catch (error) {
    log.error('Database connection test failed:', error);
    return false;
  }
}

// 互換性のためのpoolエクスポート（実際には使用されない）
export const pool = {
  getConnection: async () => ({
    ping: async () => {},
    release: () => {}
  }),
  end: async () => {}
}; 