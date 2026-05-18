import { Router } from 'express';
import * as workoutsController from './workouts.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, workoutsController.createWorkoutLog);
router.get('/stats/weekly', authenticate, workoutsController.getWeeklyStats);

export default router;
