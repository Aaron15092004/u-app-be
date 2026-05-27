import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { dismissRatingPrompt, getRatingPromptStatus, submitAppRating } from './ratings.controller';

const router = Router();

router.get('/status', authenticate, getRatingPromptStatus);
router.post('/dismiss', authenticate, dismissRatingPrompt);
router.post('/', authenticate, submitAppRating);

export default router;
