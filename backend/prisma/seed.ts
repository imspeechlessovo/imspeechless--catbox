import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default questions
  const questions = [
    { title: '作者在猫箱App里的笔名是什么？', answer: '猫箱', sortOrder: 0 },
    { title: '作者最喜欢的创作类型是什么？', answer: '短篇', sortOrder: 1 },
  ];

  for (const q of questions) {
    const answerHash = await bcrypt.hash(normalizeAnswer(q.answer), 10);
    await prisma.question.upsert({
      where: { id: q.sortOrder + 1 },
      update: {},
      create: {
        title: q.title,
        answerHash,
        sortOrder: q.sortOrder,
        enabled: true,
      },
    });
    console.log(`  ✅ Question: "${q.title}"`);
  }

  // Create author account from env
  const username = process.env.AUTHOR_USERNAME || 'admin';
  const password = process.env.AUTHOR_PASSWORD || 'admin123';
  const displayName = process.env.AUTHOR_DISPLAY_NAME || '作者';

  if (password === 'admin123' || password === 'change-me-to-a-strong-password') {
    console.warn('  ⚠️  WARNING: Using default password. Please set AUTHOR_PASSWORD in .env!');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.author.upsert({
    where: { username },
    update: { passwordHash, displayName },
    create: { username, passwordHash, displayName },
  });
  console.log(`  ✅ Author: "${displayName}" (${username})`);

  console.log('🎉 Seed complete!');
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
