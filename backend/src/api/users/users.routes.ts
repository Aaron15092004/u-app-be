import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as usersController from './users.controller';

const router = Router();

// NOTE: /profile/stats MUST be registered before any /profile/:id pattern
// (defensive ordering — no :id pattern currently, but kept for future safety)
router.get('/profile/stats', authenticate, usersController.getStats);
router.patch('/profile', authenticate, usersController.updateProfile);
router.patch('/notifications', authenticate, usersController.updateNotifications);

export default router;
