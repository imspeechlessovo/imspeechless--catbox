import { Router } from 'express';
import { config } from '../config';

export const countdownRouter = Router();

countdownRouter.get('/', (_req, res) => {
  res.json({
    releaseTime: config.releaseTime.toISOString(),
    serverTime: new Date().toISOString(),
  });
});
