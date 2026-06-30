import { Router } from 'express';
import { AuthRequest, visitorAuth, authorAuth } from '../auth/middleware';

export const authRouter = Router();

authRouter.get('/status', visitorAuth, authorAuth, (req: AuthRequest, res) => {
  res.json({
    isVisitorPassed: !!req.visitorPassed,
    isAuthor: !!req.authorId,
    author: req.authorId
      ? { displayName: req.authorDisplayName || '' }
      : null,
  });
});
