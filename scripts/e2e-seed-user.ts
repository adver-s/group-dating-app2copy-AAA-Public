import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

async function main() {
  const prisma = new PrismaClient()
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASS || 'password123'
  const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '') || 'user'
  const username = baseUsername.length < 3 ? baseUsername + Math.random().toString(36).slice(2, 5) : baseUsername
  const hash = await bcrypt.hash(password, 10)
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password_hash: hash, updated_at: new Date(), is_active: true },
    create: {
      id,
      email,
      username,
      password_hash: hash,
      gender: 1,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      is_verified: false,
    },
  })
  console.log('✅ Seeded user:', user.email)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
