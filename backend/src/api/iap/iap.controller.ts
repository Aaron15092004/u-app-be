import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { verifyAppleScanPassSchema } from './iap.validation';
import { grantAppleScanPass } from './iap.service';

export const verifyAppleScanPass = async (req: Request, res: Response): Promise<void> => {
  const parseResult = verifyAppleScanPassSchema.safeParse(req.body);
  if (!parseResult.success) {
    error(res, parseResult.error.errors[0]?.message ?? 'Du lieu IAP khong hop le', 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;

  try {
    const result = await grantAppleScanPass(userId, parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Khong the xac thuc giao dich IAP', e.statusCode ?? 500);
  }
};
