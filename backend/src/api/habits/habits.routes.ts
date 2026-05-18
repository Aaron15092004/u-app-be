import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as habitsController from './habits.controller';

const router = Router();

router.post('/check-in', authenticate, habitsController.checkIn);
router.get('/today', authenticate, habitsController.getToday);
router.get('/weekly', authenticate, habitsController.getWeekly);
router.get('/streak', authenticate, habitsController.getStreak);

export default router;
