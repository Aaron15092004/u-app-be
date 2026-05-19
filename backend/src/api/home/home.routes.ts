import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getTodaySummaryHandler } from './home.controller';

const router = Router();

router.get('/today-summary', authenticate, getTodaySummaryHandler);

export default router;
