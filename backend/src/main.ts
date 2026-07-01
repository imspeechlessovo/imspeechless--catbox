import * as path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { initDb } from './database';
import { countdownRouter } from './modules/countdown';
import { questionsRouter } from './modules/questions';
import { gateRouter } from './modules/gate';
import { messagesRouter } from './modules/messages';
import { cardsRouter } from './modules/cards';
import { authorRouter } from './modules/author';
import { authRouter } from './modules/auth';
import { statsRouter } from './modules/stats';

console.log('🔌 Initializing database...');
initDb();
console.log('✅ Database ready');

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(cookieParser(config.cookieSecret));

app.use('/api/countdown', countdownRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/gate', gateRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/auth', authRouter);
app.use('/api/author', authorRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器出错了，请稍后再试' });
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📋 Environment: ${config.nodeEnv}`);
});
