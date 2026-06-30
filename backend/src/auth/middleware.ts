import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { queryOne, VisitorSessionRow, AuthorRow } from '../database';
import * as crypto from 'crypto';

export interface AuthRequest extends Request {
  visitorPassed?: boolean;
  authorId?: number;
  authorDisplayName?: string;
}

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + config.jwtSecret).digest('hex');
}

export async function visitorAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.visitor_token;
  if (!token) {
    req.visitorPassed = false;
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sessionId: string };
    const session = queryOne<VisitorSessionRow>('visitorSessions',
      s => s.id === payload.sessionId
    );

    if (session && session.passed && new Date(session.expires_at) > new Date()) {
      req.visitorPassed = true;
    } else {
      req.visitorPassed = false;
    }
  } catch {
    req.visitorPassed = false;
  }

  next();
}

export async function authorAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.author_token;
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { authorId: number };
    const author = queryOne<AuthorRow>('authors',
      a => a.id === payload.authorId
    );

    if (author) {
      req.authorId = author.id;
      req.authorDisplayName = author.display_name;
    }
  } catch {
    // token invalid
  }

  next();
}

export function requireAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.authorId || req.visitorPassed) {
    return next();
  }
  return res.status(401).json({ error: '请先通过答题门禁或登录作者账号' });
}

export function requireAuthor(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.authorId) {
    return next();
  }
  return res.status(401).json({ error: '需要作者登录' });
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: '请求太频繁，请稍后再试' });
    }

    entry.count++;
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

export { hashIP };
