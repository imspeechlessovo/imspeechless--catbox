import { Router, Response } from 'express';
import { queryAll, insertNum, MessageRow, AuthorMessageRow } from '../database';
import { AuthRequest, visitorAuth, authorAuth, requireAccess, hashIP } from '../auth/middleware';

export const messagesRouter = Router();

messagesRouter.get('/', visitorAuth, authorAuth, requireAccess, (_req: AuthRequest, res: Response) => {
  try {
    const visitorMessages = queryAll<MessageRow>('messages',
      m => m.visible === 1,
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 100);

    const authorMessages = queryAll<AuthorMessageRow>('authorMessages',
      m => m.visible === 1,
      (a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    ).slice(0, 50);

    res.json({
      messages: visitorMessages.map(m => ({ id: m.id, nickname: m.nickname, content: m.content, createdAt: m.created_at, type: 'visitor' as const })),
      authorMessages: authorMessages.map(m => ({ id: m.id, title: m.title, content: m.content, pinned: !!m.pinned, createdAt: m.created_at, type: 'author' as const })),
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: '获取留言失败' });
  }
});

messagesRouter.post('/', visitorAuth, authorAuth, requireAccess, (req: AuthRequest, res: Response) => {
  try {
    let { nickname, content } = req.body as { nickname: string; content: string };
    nickname = String(nickname || '').trim();
    content = String(content || '').trim();

    if (!nickname || nickname.length > 20) return res.status(400).json({ error: '昵称长度需要在1-20个字符之间' });
    if (!content || content.length > 200) return res.status(400).json({ error: '留言长度需要在1-200个字符之间' });

    nickname = sanitize(nickname);
    content = sanitize(content);

    const ip = req.ip || 'unknown';
    const now = new Date().toISOString();
    const msg = insertNum<MessageRow>('messages', {
      nickname, content,
      visible: 1,
      ip_hash: hashIP(ip),
      user_agent: req.headers['user-agent'] || null,
      created_at: now,
      updated_at: now,
    });

    res.json({ id: msg.id, nickname, content, createdAt: now, type: 'visitor' });
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: '留言提交失败' });
  }
});

function sanitize(str: string): string {
  return str.replace(/</g, '\uFF1C').replace(/>/g, '\uFF1E').replace(/&/g, '\uFF06').replace(/"/g, '\uFF02').replace(/'/g, '\uFF07');
}
