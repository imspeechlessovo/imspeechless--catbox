import { initDb, insertNum, queryOne, updateRow, clearTable, AuthorRow, QuestionRow } from './database';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ');
}

async function main() {
  console.log('Seeding database...');
  initDb();

  clearTable('questions');

  const questions = [
    { title: '\u725b\u6cb9\u679c\u6700\u559c\u6b22\u7684\u4f5c\u54c1\u662f\u4ec0\u4e48', answer: '\u7389\u6eaa', sortOrder: 0 },
  ];

  for (const q of questions) {
    const answerHash = await bcrypt.hash(normalizeAnswer(q.answer), 10);
    const now = new Date().toISOString();
    insertNum<QuestionRow>('questions', {
      title: q.title, answer_hash: answerHash, enabled: 1, sort_order: q.sortOrder,
      created_at: now, updated_at: now,
    });
    console.log('  OK Question: ' + q.title);
  }

  const username = process.env.AUTHOR_USERNAME || 'admin';
  const password = process.env.AUTHOR_PASSWORD || 'admin123';
  const displayName = process.env.AUTHOR_DISPLAY_NAME || '\u4f5c\u8005';

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = queryOne<AuthorRow>('authors', a => a.username === username);
  if (existing) {
    updateRow<AuthorRow>('authors', existing.id, {
      password_hash: passwordHash, display_name: displayName,
      updated_at: new Date().toISOString(),
    } as Partial<AuthorRow>);
  } else {
    const now = new Date().toISOString();
    insertNum<AuthorRow>('authors', {
      username, password_hash: passwordHash, display_name: displayName,
      created_at: now, updated_at: now,
    });
  }
  console.log('  OK Author: ' + displayName + ' (' + username + ')');

  console.log('Seed complete!');
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});