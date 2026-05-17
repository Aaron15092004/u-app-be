import { Router } from 'express';
import * as notificationController from './notification.controller';

// TODO Phase 2: add JWT auth middleware to this route
const router = Router();

router.post('/register-token', notificationController.registerToken);

export default router;
