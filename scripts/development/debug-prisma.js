const { PrismaClient } = require('@prisma/client');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testPrisma() {
  try {
    console.log('Testing Prisma connection...');
    const userCount = await prisma.user.count();
    console.log('✅ Prisma connection successful!');
    console.log('User count:', userCount);
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
