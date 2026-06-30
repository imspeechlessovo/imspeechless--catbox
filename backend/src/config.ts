import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
  databaseUrl: process.env.DATABASE_URL || '',
  releaseTime: new Date('2026-07-11T15:57:15+08:00'),
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

