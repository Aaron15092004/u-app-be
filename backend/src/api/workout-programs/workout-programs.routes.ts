import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './workout-programs.controller';

const router = Router();

router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.getById);
router.post('/:id/start', authenticate, controller.startProgram);

export default router;
