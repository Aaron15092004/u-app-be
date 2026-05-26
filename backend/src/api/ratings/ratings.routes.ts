import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getRatingPromptStatus, submitAppRating } from './ratings.controller';

const router = Router();

router.get('/status', authenticate, getRatingPromptStatus);
router.post('/', authenticate, submitAppRating);

export default router;
