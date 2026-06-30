import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import multer from 'multer';
import { Jimp } from 'jimp';
import {
  queryAll, queryOne, insertNum, updateRow, deleteRow, clearTable,
  CardRow, LikeRow, DownloadRow,
} from '../database';
import { rateLimit, visitorAuth, authorAuth, requireAuthor, requireAccess } from '../auth/middleware';

export const cardsRouter = Router();

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs');

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG/JPG/WEBP images allowed'));
    }
  },
});

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'card-salt').digest('hex');
}

// ===== IP-based like limit (in-memory, resets daily) =====
const dailyLikeMap = new Map<string, number>();
let lastResetDate = new Date().toDateString();

function getDailyLikes(ip: string): number {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyLikeMap.clear();
    lastResetDate = today;
  }
  return dailyLikeMap.get(ip) || 0;
}

function incrementDailyLikes(ip: string): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyLikeMap.clear();
    lastResetDate = today;
  }
  dailyLikeMap.set(ip, (dailyLikeMap.get(ip) || 0) + 1);
}

// ===== Create card =====
cardsRouter.post('/', visitorAuth, authorAuth, requireAuthor, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { name, intro, tags, password } = req.body as Record<string, string>;
    const file = req.file;

    const cardName = String(name || '').trim();
    if (!cardName || cardName.length > 30) {
      return res.status(400).json({ error: 'Character name required, max 30 chars' });
    }
    if (!password || String(password).trim().length < 1) {
      return res.status(400).json({ error: 'Management password required' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Image required' });
    }

    // Validate magic bytes
    const buf = file.buffer;
    const header = buf.slice(0, 4).toString('hex');
    const validHeaders: Record<string, string> = {
      'image/png': '89504e47',
      'image/jpeg': 'ffd8ffe0',
      'image/webp': '52494646',
    };
    const expected = validHeaders[file.mimetype];
    if (!expected || !header.startsWith(expected.slice(0, 6))) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    // Generate filenames
    const ext = path.extname(file.originalname) || '.png';
    const safeName = cardName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 20);
    const filename = `${safeName}_${Date.now()}${ext}`;
    const thumbFilename = `thumb_${filename}`;

    // Save original
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);

    // Generate thumbnail (400px wide)
    try {
      const image = await Jimp.read(file.buffer);
      image.resize({ w: 400 });
      const thumbBuffer = await image.getBuffer(file.mimetype as 'image/png' | 'image/jpeg');
      fs.writeFileSync(path.join(THUMB_DIR, thumbFilename), thumbBuffer);
    } catch {
      // If thumbnail fails, use original as thumbnail
      fs.writeFileSync(path.join(THUMB_DIR, thumbFilename), file.buffer);
    }

    // Process tags
    let tagStr = '';
    if (tags) {
      try {
        const t = JSON.parse(tags);
        tagStr = JSON.stringify((Array.isArray(t) ? t : []).slice(0, 5));
      } catch {
        tagStr = JSON.stringify(String(tags).split(/[,锛孿s]+/).filter(Boolean).slice(0, 5));
      }
    }

    const passwordHash = await bcrypt.hash(String(password).trim(), 10);
    const now = new Date().toISOString();

    const card = insertNum<CardRow>('cards', {
      name: cardName,
      intro: String(intro || '').trim().slice(0, 100),
      tags: tagStr,
      image_path: filename,
      thumb_path: thumbFilename,
      password_hash: passwordHash,
      total_likes: 0,
      total_downloads: 0,
      created_at: now,
      updated_at: now,
    });

    res.json({
      id: card.id, name: card.name, intro: card.intro,
      tags: JSON.parse(card.tags || '[]'),
      totalLikes: 0, totalDownloads: 0, createdAt: now,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    console.error('Create card error:', msg);
    res.status(500).json({ error: msg });
  }
});

// ===== List cards with rankings =====
cardsRouter.get('/', (req: Request, res: Response) => {
  try {
    const rank = (req.query.rank as string) || 'total';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const allCards = queryAll<CardRow>('cards');
    const allLikes = queryAll<LikeRow>('likes');

    // Compute scores
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString();

    const scored = allCards.map(card => {
      let score = 0;
      if (rank === 'total') {
        score = card.total_likes;
      } else if (rank === 'daily') {
        score = allLikes.filter(l => l.card_id === card.id && l.created_at >= todayStart).length;
      } else if (rank === 'weekly') {
        score = allLikes.filter(l => l.card_id === card.id && l.created_at >= weekStartStr).length;
      }
      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const paged = scored.slice((page - 1) * limit, page * limit);

    const items = paged.map((item, idx) => ({
      rank: (page - 1) * limit + idx + 1,
      id: item.card.id,
      name: item.card.name,
      intro: item.card.intro,
      tags: JSON.parse(item.card.tags || '[]'),
      thumbPath: `/uploads/thumbs/${item.card.thumb_path}`,
      score: item.score,
      totalLikes: item.card.total_likes,
      totalDownloads: item.card.total_downloads,
    }));

    res.json({ items, total, page, limit, rank });
  } catch (err) {
    console.error('List cards error:', err);
    res.status(500).json({ error: 'Failed to load cards' });
  }
});

// ===== Get single card =====
cardsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const card = queryOne<CardRow>('cards', c => c.id === id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const likes = queryAll<LikeRow>('likes', l => l.card_id === id);

    // Today's likes
    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
    const todayLikes = likes.filter(l => l.created_at >= todayStart).length;

    // Week's likes
    const weekStart = new Date();
    weekStart.setDate(new Date().getDate() - new Date().getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekLikes = likes.filter(l => l.created_at >= weekStart.toISOString()).length;

    res.json({
      id: card.id,
      name: card.name,
      intro: card.intro,
      tags: JSON.parse(card.tags || '[]'),
      imagePath: `/uploads/${card.image_path}`,
      thumbPath: `/uploads/thumbs/${card.thumb_path}`,
      totalLikes: card.total_likes,
      todayLikes,
      weekLikes,
      totalDownloads: card.total_downloads,
      createdAt: card.created_at,
    });
  } catch (err) {
    console.error('Get card error:', err);
    res.status(500).json({ error: 'Failed to load card' });
  }
});

// ===== Like =====
cardsRouter.post('/:id/like', rateLimit(1000, 20), visitorAuth, authorAuth, requireAccess, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const ip = req.ip || 'unknown';
    const ipKey = hashIP(ip);

    // Check daily limit
    const used = getDailyLikes(ipKey);
    if (used >= 100) {
      return res.status(429).json({ error: '\u4eca\u65e5\u70b9\u8d5e\u5df2\u8fbe\u4e0a\u9650\uff0c\u660e\u5929\u518d\u6765\u5427~' });
    }

    incrementDailyLikes(ipKey);

    // Record like
    insertNum<LikeRow>('likes', {
      card_id: id,
      ip_hash: ipKey,
      created_at: new Date().toISOString(),
    });

    // Update total likes (best effort)
    const card = queryOne<CardRow>('cards', c => c.id === id);
    if (card) {
      updateRow<CardRow>('cards', id, { total_likes: card.total_likes + 1 } as Partial<CardRow>);
    }

    res.json({ ok: true, totalLikes: (card?.total_likes || 0) + 1 });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Like failed' });
  }
});

// ===== Download =====
cardsRouter.get('/:id/download', visitorAuth, authorAuth, requireAccess, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const card = queryOne<CardRow>('cards', c => c.id === id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const filePath = path.join(UPLOAD_DIR, card.image_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Image not found' });

    // Record download
    const ip = req.ip || 'unknown';
    insertNum<DownloadRow>('downloads', {
      card_id: id,
      ip_hash: hashIP(ip),
      created_at: new Date().toISOString(),
    });

    // Update counter
    updateRow<CardRow>('cards', id, {
      total_downloads: card.total_downloads + 1,
    } as Partial<CardRow>);

    const ext = path.extname(card.image_path);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(card.name)}${ext}"`);
    res.setHeader('Content-Type', 'image/*');
    res.sendFile(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

// ===== Manage: verify password =====
cardsRouter.post('/:id/manage', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { password } = req.body as { password: string };
    if (!password) return res.status(400).json({ error: 'Password required' });

    const card = queryOne<CardRow>('cards', c => c.id === id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const valid = await bcrypt.compare(password, card.password_hash);
    if (!valid) return res.status(403).json({ error: 'Wrong password' });

    // Generate a one-time management token
    const token = crypto.randomBytes(16).toString('hex');
    // Store in memory (simple approach)
    manageTokens.set(token, { cardId: id, expires: Date.now() + 3600000 });

    res.json({ ok: true, token });
  } catch (err) {
    console.error('Manage auth error:', err);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// In-memory manage tokens
const manageTokens = new Map<string, { cardId: number; expires: number }>();

function checkManageToken(req: Request, cardId: number): boolean {
  const token = (req.headers['x-manage-token'] as string) || '';
  const entry = manageTokens.get(token);
  if (!entry || entry.expires < Date.now() || entry.cardId !== cardId) return false;
  return true;
}

// ===== Update card =====
cardsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    if (!checkManageToken(req, id)) return res.status(403).json({ error: 'Unauthorized' });

    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (!n || n.length > 30) return res.status(400).json({ error: 'Name max 30 chars' });
      updates.name = n;
    }
    if (body.intro !== undefined) {
      updates.intro = String(body.intro).trim().slice(0, 100);
    }
    if (body.tags !== undefined) {
      const t = body.tags;
      if (Array.isArray(t)) {
        updates.tags = JSON.stringify(t.slice(0, 5));
      } else {
        updates.tags = JSON.stringify(String(t).split(/[,锛孿s]+/).filter(Boolean).slice(0, 5));
      }
    }

    const updated = updateRow<CardRow>('cards', id, updates as Partial<CardRow>);
    if (!updated) return res.status(404).json({ error: 'Card not found' });

    res.json({
      id: updated.id, name: updated.name, intro: updated.intro,
      tags: JSON.parse(updated.tags || '[]'),
    });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ===== Delete card =====
cardsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    if (!checkManageToken(req, id)) return res.status(403).json({ error: 'Unauthorized' });

    const card = queryOne<CardRow>('cards', c => c.id === id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Delete image files
    const imgPath = path.join(UPLOAD_DIR, card.image_path);
    const thumbPath = path.join(THUMB_DIR, card.thumb_path);
    try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch {}
    try { if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); } catch {}

    // Delete records
    deleteRow('cards', id);
    // Clean related likes/downloads
    const likes = queryAll<LikeRow>('likes', l => l.card_id === id);
    const downloads = queryAll<DownloadRow>('downloads', d => d.card_id === id);
    for (const l of likes) deleteRow('likes', l.id);
    for (const d of downloads) deleteRow('downloads', d.id);

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});