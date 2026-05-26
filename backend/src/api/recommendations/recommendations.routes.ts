import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getNutMilkRecommendations, selectNutMilkFlavor } from './recommendations.controller';

const router = Router();

router.get('/nut-milk', authenticate, getNutMilkRecommendations);
router.post('/nut-milk/selection', authenticate, selectNutMilkFlavor);

export default router;
