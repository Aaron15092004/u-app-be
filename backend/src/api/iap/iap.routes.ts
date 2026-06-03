import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { verifyAppleScanPass } from './iap.controller';

const router = Router();

router.post('/apple/scan-pass/verify', authenticate, verifyAppleScanPass);

export default router;
