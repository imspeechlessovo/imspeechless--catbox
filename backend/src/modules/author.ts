import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { queryAll, queryOne, insertNum, insertStr, updateRow, deleteRow, clearTable, AuthorRow, AuthorMessageRow, MessageRow, QuestionRow } from '../database';
import { config } from '../config';
import { AuthRequest, visitorAuth, authorAuth, requireAuthor, rateLimit } from '../auth/middleware';
import { normalizeAnswer } from './gate';

export const authorRouter = Router();

authorRouter.use(visitorAuth);
authorRouter.use(authorAuth);

// ===== Login =====
authorRouter.post('/login', rateLimit(60_000, 5), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) return res.status(400).json({ error: '请输入用户名和密�? });

    const author = queryOne<AuthorRow>('authors', a => a.username === username.trim());
    if (!author) return res.status(401).json({ error: '用户名或密码错误' });

    const valid = await bcrypt.compare(password, author.password_hash);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

    const token = jwt.sign({ authorId: author.id }, config.jwtSecret, { expiresIn: '30d' });

    res.cookie('author_token', token, {
      httpOnly: true, sameSite: 'lax', secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, path: '/',
    });

    res.json({ ok: true, author: { displayName: author.display_name, username: author.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

authorRouter.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('author_token', { path: '/' });
  res.json({ ok: true });
});

// ===== Author Messages =====
authorRouter.get('/messages', requireAuthor, (_req: AuthRequest, res: Response) => {
  try {
    const messages = queryAll<AuthorMessageRow>('authorMessages', undefined,
      (a, b) => { if (a.pinned !== b.pinned) return b.pinned - a.pinned; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }
    );
    res.json(messages.map(m => ({ ...m, pinned: !!m.pinned, visible: !!m.visible })));
  } catch (err) { console.error(err); res.status(500).json({ error: '获取留言失败' }); }
});

authorRouter.post('/messages', requireAuthor, (req: AuthRequest, res: Response) => {
  try {
    const { title, content, pinned, visible } = req.body as Record<string, unknown>;
    const t = String(title || '').trim();
    const c = String(content || '').trim();
    if (!t || t.length > 100) return res.status(400).json({ error: '标题需要在1-100个字符之�? });
    if (!c || c.length > 500) return res.status(400).json({ error: '内容需要在1-500个字符之�? });

    const now = new Date().toISOString();
    const msg = insertNum<AuthorMessageRow>('authorMessages', {
      title: t, content: c,
      pinned: pinned ? 1 : 0,
      visible: visible !== undefined && !visible ? 0 : 1,
      created_at: now, updated_at: now,
    });
    res.json({ ...msg, pinned: !!msg.pinned, visible: !!msg.visible });
  } catch (err) { console.error(err); res.status(500).json({ error: '创建留言失败' }); }
});

authorRouter.patch('/messages/:id', requireAuthor, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) { const t = String(body.title).trim(); if (!t || t.length > 100) return res.status(400).json({ error: '标题需要在1-100个字符之�? }); updates.title = t; }
    if (body.content !== undefined) { const c = String(body.content).trim(); if (!c || c.length > 500) return res.status(400).json({ error: '内容需要在1-500个字符之�? }); updates.content = c; }
    if (body.pinned !== undefined) updates.pinned = body.pinned ? 1 : 0;
    if (body.visible !== undefined) updates.visible = body.visible ? 1 : 0;
    const updated = updateRow<AuthorMessageRow>('authorMessages', id, updates as Partial<AuthorMessageRow>);
    if (!updated) return res.status(404).json({ error: '留言不存�? });
    res.json({ ...updated, pinned: !!updated.pinned, visible: !!updated.visible });
  } catch (err) { console.error(err); res.status(500).json({ error: '更新留言失败' }); }
});

authorRouter.delete('/messages/:id', requireAuthor, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
  deleteRow('authorMessages', id);
  res.json({ ok: true });
});

// ===== Visitor Messages =====
authorRouter.get('/visitor-messages', requireAuthor, (_req: AuthRequest, res: Response) => {
  try {
    const messages = queryAll<MessageRow>('messages', undefined,
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(messages.map(m => ({ ...m, visible: !!m.visible })));
  } catch (err) { console.error(err); res.status(500).json({ error: '获取留言失败' }); }
});

authorRouter.patch('/visitor-messages/:id', requireAuthor, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
  const body = req.body as { visible?: boolean };
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.visible !== undefined) updates.visible = body.visible ? 1 : 0;
  const updated = updateRow<MessageRow>('messages', id, updates as Partial<MessageRow>);
  if (!updated) return res.status(404).json({ error: '留言不存�? });
  res.json({ ...updated, visible: !!updated.visible });
});

authorRouter.delete('/visitor-messages/:id', requireAuthor, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
  deleteRow('messages', id);
  res.json({ ok: true });
});

// ===== Questions =====
authorRouter.get('/questions', requireAuthor, (_req: AuthRequest, res: Response) => {
  try {
    const questions = queryAll<QuestionRow>('questions', undefined, (a, b) => a.sort_order - b.sort_order);
    res.json(questions.map(q => ({ id: q.id, title: q.title, enabled: !!q.enabled, sortOrder: q.sort_order, createdAt: q.created_at, updatedAt: q.updated_at })));
  } catch (err) { console.error(err); res.status(500).json({ error: '获取问题失败' }); }
});

authorRouter.post('/questions', requireAuthor, async (req: AuthRequest, res: Response) => {
  try {
    const { title, answer, sortOrder } = req.body as { title: string; answer: string; sortOrder?: number };
    const t = String(title || '').trim();
    const a = String(answer || '').trim();
    if (!t || t.length > 200) return res.status(400).json({ error: '问题内容需要在1-200个字符之�? });
    if (!a) return res.status(400).json({ error: '请输入答�? });
    const hash = await bcrypt.hash(normalizeAnswer(a), 10);
    const now = new Date().toISOString();
    const q = insertNum<QuestionRow>('questions', { title: t, answer_hash: hash, enabled: 1, sort_order: sortOrder || 0, created_at: now, updated_at: now });
    res.json({ id: q.id, title: q.title, enabled: !!q.enabled, sortOrder: q.sort_order, createdAt: q.created_at, updatedAt: q.updated_at });
  } catch (err) { console.error(err); res.status(500).json({ error: '创建问题失败' }); }
});

authorRouter.patch('/questions/:id', requireAuthor, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) { const t = String(body.title).trim(); if (!t || t.length > 200) return res.status(400).json({ error: '问题内容需要在1-200个字符之�? }); updates.title = t; }
    if (body.answer !== undefined) { const a = String(body.answer).trim(); if (!a) return res.status(400).json({ error: '请输入答�? }); updates.answer_hash = await bcrypt.hash(normalizeAnswer(a), 10); }
    if (body.enabled !== undefined) updates.enabled = body.enabled ? 1 : 0;
    if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);
    const updated = updateRow<QuestionRow>('questions', id, updates as Partial<QuestionRow>);
    if (!updated) return res.status(404).json({ error: '问题不存�? });
    res.json({ id: updated.id, title: updated.title, enabled: !!updated.enabled, sortOrder: updated.sort_order, createdAt: updated.created_at, updatedAt: updated.updated_at });
  } catch (err) { console.error(err); res.status(500).json({ error: '更新问题失败' }); }
});

authorRouter.delete('/questions/:id', requireAuthor, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效的ID' });
  deleteRow('questions', id);
  res.json({ ok: true });
});
