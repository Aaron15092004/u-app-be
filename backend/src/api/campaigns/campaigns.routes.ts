import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { redeemCampaignCode, getMyScanEntitlements } from './campaigns.controller';

const router = Router();

router.post('/redeem', authenticate, redeemCampaignCode);
router.get('/me/entitlements', authenticate, getMyScanEntitlements);

export default router;
