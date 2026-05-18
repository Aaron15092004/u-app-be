import { Router } from 'express';
import * as exercisesController from './exercises.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, exercisesController.list);
router.get('/:id', authenticate, exercisesController.getById);

export default router;
