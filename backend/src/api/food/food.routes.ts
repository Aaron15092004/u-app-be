import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import {
  scanFood,
  saveFoodLogHandler,
  patchFoodLogImage,
  getFoodLogs,
  getFoodLogsRangeHandler,
  deleteFoodLogHandler,
  searchItems,
  getFoodItemByBarcode,
} from './food.controller';

const router = Router();

// All routes require JWT authentication (T-04-03-01)
router.post('/scan', authenticate, uploadSingle, scanFood);
router.post('/logs', authenticate, saveFoodLogHandler);
router.patch('/logs/:id/image', authenticate, uploadSingle, patchFoodLogImage);
router.get('/logs', authenticate, getFoodLogs);
router.get('/logs/range', authenticate, getFoodLogsRangeHandler);
router.delete('/logs/:id', authenticate, deleteFoodLogHandler);
router.get('/items/barcode/:barcode', authenticate, getFoodItemByBarcode);
router.get('/items', authenticate, searchItems);

export default router;
