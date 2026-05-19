import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as notificationController from './notification.controller';

// Authenticated per Phase 5 — RESEARCH.md Open Question 1
const router = Router();

router.post('/register-token', authenticate, notificationController.registerToken);

export default router;
