import { Router } from 'express';
import * as healthController from './health.controller';

const router = Router();

router.get('/', healthController.check);

export default router;
