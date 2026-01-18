const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPrismaUser() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Prismaでユーザーを検索します...');
    
    const userId = 'user_1754107511944_nv3utk089';
    
    // Prismaでユーザーを検索
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, is_active: true }
    });
    
    if (user) {
      console.log('✅ Prismaでユーザーが見つかりました:', user);
    } else {
      console.log('❌ Prismaでユーザーが見つかりませんでした');
      
      // 全ユーザーを確認
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, username: true },
        take: 5
      });
      
      console.log('🔍 データベース内のユーザー（最初の5件）:', allUsers);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaUser();
