import { Request, Response, Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import * as adminController from './admin.controller';
import mediaAssetsRouter from '../media-assets/media-assets.routes';
import {
  createCampaignHandler,
  exportCampaignCodesCsvHandler,
  generateCampaignCodesHandler,
  listCampaignCodesHandler,
  listCampaignsHandler,
  revokeCampaignHandler,
  revokeCodeHandler,
} from '../campaigns/campaigns.controller';
import { listAppRatings } from '../ratings/ratings.controller';

const router = Router();

const phaseScaffold = (feature: string) => (_req: Request, res: Response) => {
  res.status(501).json({ success: false, error: `${feature} se duoc trien khai trong phase sau` });
};

// Apply authenticate + requireAdmin to ALL routes in this router
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Upload
router.post('/upload', uploadSingle, adminController.uploadImage);

// v2 campaign code MVP (Phase 2)
router.get('/campaigns', listCampaignsHandler);
router.post('/campaigns', createCampaignHandler);
router.patch('/campaigns/:id/revoke', revokeCampaignHandler);
router.post('/campaigns/:id/codes/generate', generateCampaignCodesHandler);
router.get('/campaigns/:id/codes', listCampaignCodesHandler);
router.get('/campaigns/:id/codes/export.csv', exportCampaignCodesCsvHandler);
router.patch('/campaigns/codes/:codeId/revoke', revokeCodeHandler);

// v2 internal feedback ratings (Phase 2 MVP)
router.get('/ratings', listAppRatings);

// v2 media asset scaffolds (Phase 5)
router.use('/media-assets', mediaAssetsRouter);

// Exercises
router.get('/exercises', adminController.listExercises);
router.post('/exercises', adminController.createExercise);
router.patch('/exercises/:id', adminController.updateExercise);
router.delete('/exercises/:id', adminController.deleteExercise);

// Food Items
router.get('/food-items', adminController.listFoodItems);
router.post('/food-items', adminController.createFoodItem);
router.patch('/food-items/:id', adminController.updateFoodItem);
router.delete('/food-items/:id', adminController.deleteFoodItem);

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:id/ban', adminController.banUser);
router.delete('/users/:id', adminController.deleteUser);

export default router;
