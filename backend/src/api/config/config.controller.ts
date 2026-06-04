// Public endpoint — URL is non-sensitive.
// D-82: Shop URL sourced from process.env.SHOP_URL only — NEVER from req.body/req.query/req.params (T-05-02-04)
import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { getMilkPageContent } from './app-content.service';

export const getShopUrl = (_req: Request, res: Response): void => {
  const url = process.env.SHOP_URL || 'https://www.facebook.com/profile.php?id=61589742576832';
  success(res, { url });
};

export const getMilkPage = async (_req: Request, res: Response): Promise<void> => {
  const content = await getMilkPageContent();
  success(res, content);
};
