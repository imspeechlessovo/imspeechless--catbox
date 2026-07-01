import { Router, Response } from 'express';
import { queryAll, insertNum, updateRow, deleteRow, queryOne, MessageRow, AuthorMessageRow, ReplyRow, MessageLikeRow } from '../database';
import { AuthRequest, visitorAuth, authorAuth, requireAccess, requireAuthor, hashIP } from '../auth/middleware';

export const messagesRouter = Router();

// GET messages - public
messagesRouter.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const visitorMessages = queryAll<MessageRow>('messages',
      m => m.visible === 1,
      (a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    ).slice(0, 100);

    const authorMessages = queryAll<AuthorMessageRow>('authorMessages',
      m => m.visible === 1,
      (a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    ).slice(0, 50);

    res.json({
      messages: visitorMessages.map(m => ({ id: m.id, nickname: m.nickname, content: m.content, pinned: !!m.pinned, createdAt: m.created_at, type: 'visitor' as const, likeCount: (m as any).likeCount || 0, replyCount: (m as any).replyCount || 0 })),
      authorMessages: authorMessages.map(m => ({ id: m.id, title: m.title, content: m.content, pinned: !!m.pinned, createdAt: m.created_at, type: 'author' as const, likeCount: (m as any).likeCount || 0, replyCount: (m as any).replyCount || 0 })),
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST message - requires auth (gate or author)
messagesRouter.post('/', visitorAuth, authorAuth, requireAccess, (req: AuthRequest, res: Response) => {
  try {
    let { nickname, content } = req.body as { nickname: string; content: string };
    nickname = String(nickname || '').trim();
    content = String(content || '').trim();
    if (!nickname || nickname.length > 20) return res.status(400).json({ error: 'Nickname 1-20 chars' });
    if (!content || content.length > 200) return res.status(400).json({ error: 'Message 1-200 chars' });
    nickname = sanitize(nickname);
    content = sanitize(content);
    const ip = req.ip || 'unknown';
    const now = new Date().toISOString();
    const msg = insertNum<MessageRow>('messages', { nickname, content, visible: 1, pinned: 0, ip_hash: hashIP(ip), user_agent: req.headers['user-agent'] || null, created_at: now, updated_at: now });
    res.json({ id: msg.id, nickname, content, pinned: false, createdAt: now, type: 'visitor' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to post' }); }
});

// DELETE message - author only
messagesRouter.delete('/:id', visitorAuth, authorAuth, requireAuthor, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    // Try both tables
    const vm = queryAll<MessageRow>('messages', m => m.id === id);
    const am = queryAll<AuthorMessageRow>('authorMessages', m => m.id === id);
    if (vm.length) deleteRow('messages', id);
    else if (am.length) deleteRow('authorMessages', id);
    else return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Delete failed' }); }
});

// PATCH toggle pin - author only
messagesRouter.patch('/:id/pin', visitorAuth, authorAuth, requireAuthor, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const vm = queryAll<MessageRow>('messages', m => m.id === id);
    const am = queryAll<AuthorMessageRow>('authorMessages', m => m.id === id);
    if (vm.length) {
      const pinned = vm[0].pinned ? 0 : 1;
      updateRow<MessageRow>('messages', id, { pinned, updated_at: new Date().toISOString() } as Partial<MessageRow>);
      res.json({ ok: true, pinned: !!pinned });
    } else if (am.length) {
      const pinned = am[0].pinned ? 0 : 1;
      updateRow<AuthorMessageRow>('authorMessages', id, { pinned, updated_at: new Date().toISOString() } as Partial<AuthorMessageRow>);
      res.json({ ok: true, pinned: !!pinned });
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Pin failed' }); }
});


// GET replies for a message
messagesRouter.get('/:id/replies', (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid ID' });
    const replies = queryAll<ReplyRow>('replies',
      r => r.message_id === messageId,
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    res.json(replies.map(r => ({ id: r.id, messageId: r.message_id, nickname: r.nickname, content: r.content, createdAt: r.created_at })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load replies' }); }
});

// POST reply - requires auth
messagesRouter.post('/:id/replies', visitorAuth, authorAuth, requireAccess, (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid ID' });
    let { nickname, content } = req.body as { nickname: string; content: string };
    nickname = String(nickname || 'anonymous').trim();
    content = String(content || '').trim();
    if (!nickname || nickname.length > 20) nickname = 'anonymous';
    if (!content || content.length > 500) return res.status(400).json({ error: 'Reply 1-500 chars' });
    nickname = sanitize(nickname);
    content = sanitize(content);
    const now = new Date().toISOString();
    const ip = req.ip || 'unknown';
    const reply = insertNum<ReplyRow>('replies', { message_id: messageId, nickname, content, ip_hash: hashIP(ip), user_agent: req.headers['user-agent'] || null, created_at: now });
    // Update reply count on parent message
    const vm = queryAll<MessageRow>('messages', m => m.id === messageId);
    const am = queryAll<AuthorMessageRow>('authorMessages', m => m.id === messageId);
    if (vm.length) {
      const currentCount = (vm[0] as any).replyCount || 0;
      updateRow<MessageRow>('messages', messageId, { replyCount: currentCount + 1, updated_at: now } as Partial<MessageRow>);
    } else if (am.length) {
      const currentCount = (am[0] as any).replyCount || 0;
      updateRow<AuthorMessageRow>('authorMessages', messageId, { replyCount: currentCount + 1, updated_at: now } as Partial<AuthorMessageRow>);
    }
    res.json({ id: reply.id, messageId, nickname, content, createdAt: now });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to post reply' }); }
});

// POST like message - requires auth
messagesRouter.post('/:id/like', visitorAuth, authorAuth, requireAccess, (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid ID' });
    const ip = req.ip || 'unknown';
    const ipHash = hashIP(ip);
    // Check if already liked
    const existing = queryAll<MessageLikeRow>('messageLikes', l => l.message_id === messageId && l.ip_hash === ipHash);
    if (existing.length) {
      return res.json({ ok: true, alreadyLiked: true, likeCount: -1 });
    }
    const now = new Date().toISOString();
    insertNum<MessageLikeRow>('messageLikes', { message_id: messageId, ip_hash: ipHash, created_at: now });
    // Update like count
    const vm = queryAll<MessageRow>('messages', m => m.id === messageId);
    const currentCount = vm.length ? ((vm[0] as any).likeCount || 0) : 0;
    if (vm.length) {
      updateRow<MessageRow>('messages', messageId, { likeCount: currentCount + 1, updated_at: now } as Partial<MessageRow>);
    }
    res.json({ ok: true, alreadyLiked: false, likeCount: currentCount + 1 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Like failed' }); }
});

function sanitize(str: string): string {
  return str.replace(/</g, '\uFF1C').replace(/>/g, '\uFF1E').replace(/&/g, '\uFF06').replace(/"/g, '\uFF02').replace(/'/g, '\uFF07');
}