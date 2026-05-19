import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { logWaterHandler, getTodayWaterHandler, deleteWaterHandler } from './water.controller';

const router = Router();

router.post('/', authenticate, logWaterHandler);
router.get('/today', authenticate, getTodayWaterHandler);
router.delete('/:id', authenticate, deleteWaterHandler);

export default router;
