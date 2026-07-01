import { Router, Response } from 'express';
import { queryAll, insertNum, updateRow, StatsRow } from '../database';
import { AuthRequest, visitorAuth, authorAuth, requireAuthor } from '../auth/middleware';

export const statsRouter = Router();

statsRouter.use(visitorAuth);
statsRouter.use(authorAuth);

// GET /api/stats - anyone can view
statsRouter.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const rows = queryAll<StatsRow>('stats', undefined, (a, b) => b.week - a.week);
    res.json(rows.map(r => ({
      id: r.id, week: r.week, dateRange: r.dateRange,
      views: r.views, messages: r.messages,
      likes: r.likes, chatUsers: r.chatUsers,
      createdAt: r.created_at, updatedAt: r.updated_at,
    })));
  } catch (err) {
    console.error('Stats GET error:', err);
    res.status(500).json({ error: 'error' });
  }
});

// POST /api/stats - author only: add or update a week's data
statsRouter.post('/', requireAuthor, (req: AuthRequest, res: Response) => {
  try {
    const { week, dateRange, views, messages, likes, chatUsers } = req.body as {
      week: number; dateRange: string; views: number; messages: number; likes: number; chatUsers: number;
    };

    if (!week || week < 1) return res.status(400).json({ error: 'week required' });
    if (!dateRange || !dateRange.trim()) return res.status(400).json({ error: 'date range required' });
    if (views === undefined || views < 0) return res.status(400).json({ error: 'views required' });
    if (messages === undefined || messages < 0) return res.status(400).json({ error: 'messages required' });
    if (likes === undefined || likes < 0) return res.status(400).json({ error: 'likes required' });
    if (chatUsers === undefined || chatUsers < 0) return res.status(400).json({ error: 'chatUsers required' });

    const existing = queryAll<StatsRow>('stats', s => s.week === week)[0];
    const now = new Date().toISOString();

    if (existing) {
      const updated = updateRow<StatsRow>('stats', existing.id, {
        dateRange: dateRange.trim(),
        views: Number(views),
        messages: Number(messages),
        likes: Number(likes),
        chatUsers: Number(chatUsers),
        updated_at: now,
      } as Partial<StatsRow>);
      return res.json({
        id: updated!.id, week: updated!.week, dateRange: updated!.dateRange,
        views: updated!.views, messages: updated!.messages,
        likes: updated!.likes, chatUsers: updated!.chatUsers,
        createdAt: updated!.created_at, updatedAt: updated!.updated_at,
      });
    }

    const row = insertNum<StatsRow>('stats', {
      week: Number(week), dateRange: dateRange.trim(),
      views: Number(views), messages: Number(messages),
      likes: Number(likes), chatUsers: Number(chatUsers),
      created_at: now, updated_at: now,
    });
    res.json({
      id: row.id, week: row.week, dateRange: row.dateRange,
      views: row.views, messages: row.messages,
      likes: row.likes, chatUsers: row.chatUsers,
      createdAt: row.created_at, updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Stats POST error:', err);
    res.status(500).json({ error: 'error' });
  }
});

export default statsRouter;