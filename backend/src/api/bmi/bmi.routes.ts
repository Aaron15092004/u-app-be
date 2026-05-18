import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as bmiController from './bmi.controller';

const router = Router();

router.patch('/', authenticate, bmiController.saveBMI);
router.get('/history', authenticate, bmiController.getHistory);

export default router;
