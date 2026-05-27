import { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { corsOptions } from '../config/cors';

export function loadExpress(app: Express): void {
  app.set('trust proxy', 1);
  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path.startsWith('/api/health'),
      message: {
        success: false,
        error: 'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.',
      },
    })
  );
}
