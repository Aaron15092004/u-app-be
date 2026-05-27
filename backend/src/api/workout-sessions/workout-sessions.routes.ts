import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './workout-sessions.controller';

const router = Router();

router.get('/active', authenticate, controller.getActive);
router.get('/streak', authenticate, controller.getStreak);
router.post('/', authenticate, controller.create);
router.post('/:id/complete', authenticate, controller.complete);
router.post('/:id/abandon', authenticate, controller.abandon);

export default router;
