// Public endpoint — URL is non-sensitive.
import { Router } from 'express';
import { getMilkPage, getShopUrl } from './config.controller';

const router = Router();

// No authenticate — shop URL is public per RESEARCH.md "Open Question 1"
router.get('/shop-url', getShopUrl);
router.get('/milk-page', getMilkPage);

export default router;
