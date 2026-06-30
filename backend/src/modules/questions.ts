import { Router } from 'express';
import { queryAll, QuestionRow } from '../database';

export const questionsRouter = Router();

questionsRouter.get('/', (_req, res) => {
  try {
    const questions = queryAll<QuestionRow>('questions',
      q => q.enabled === 1,
      (a, b) => a.sort_order - b.sort_order
    );
    res.json(questions.map(q => ({ id: q.id, title: q.title, sortOrder: q.sort_order })));
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: '获取问题失败' });
  }
});
