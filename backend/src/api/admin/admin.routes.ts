import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import * as adminController from './admin.controller';

const router = Router();

// Apply authenticate + requireAdmin to ALL routes in this router
router.use(authenticate, requireAdmin);

// Upload
router.post('/upload', uploadSingle, adminController.uploadImage);

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
