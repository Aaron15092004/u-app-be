import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import * as controller from './workout-programs-admin.controller';

const router = Router();

// Apply auth + admin guard to all routes in this router
router.use(authenticate, requireAdmin);

router.get('/', controller.listPrograms);
router.post('/', controller.createProgram);
router.patch('/:id', controller.updateProgram);
router.delete('/:id', controller.deleteProgram);
router.post('/:id/image', uploadSingle, controller.uploadProgramImage);

export default router;
