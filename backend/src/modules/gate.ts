import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { queryAll, insertStr, QuestionRow, VisitorSessionRow } from '../database';
import { config } from '../config';
import { rateLimit, hashIP } from '../auth/middleware';

export const gateRouter = Router();

gateRouter.post('/verify', rateLimit(60_000, 10), async (req: Request, res: Response) => {
  try {
    const { answers } = req.body as { answers: { questionId: number; answer: string }[] };

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Please submit answers' });
    }

    const questions = queryAll<QuestionRow>('questions',
      q => q.enabled === 1,
      (a, b) => a.sort_order - b.sort_order
    );

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No active questions' });
    }

    for (const q of questions) {
      const submitted = answers.find(a => a.questionId === q.id);
      if (!submitted || !submitted.answer) {
        return res.status(400).json({ error: 'Please answer all questions' });
      }

      const normalized = normalizeAnswer(submitted.answer);
      const correct = await bcrypt.compare(normalized, q.answer_hash);

      if (!correct) {
        return res.json({ passed: false, message: '\u7b54\u6848\u597d\u50cf\u8fd8\u5dee\u4e00\u70b9\uff0c\u518d\u60f3\u60f3\uff1f' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const ip = req.ip || 'unknown';
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    insertStr<VisitorSessionRow>('visitorSessions', {
      id: sessionId,
      token_hash: tokenHash,
      ip_hash: hashIP(ip),
      user_agent: req.headers['user-agent'] || null,
      passed: 1,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    const jwtToken = jwt.sign({ sessionId }, config.jwtSecret, { expiresIn: '7d' });

    res.cookie('visitor_token', jwtToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({ passed: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ');
}