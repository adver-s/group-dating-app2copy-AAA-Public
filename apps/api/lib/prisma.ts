import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// 統一されたPrismaクライアント（SQLite用）
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL_SQL || "file:./apps/api/prisma/dev.sql.db"
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
