import { Request, Response } from 'express';
import { saveBMISchema } from './bmi.validation';
import { saveBMIAtomic, getBMIHistory } from './bmi.service';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const saveBMI = async (req: Request, res: Response): Promise<void> => {
  const parseResult = saveBMISchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  const { heightCm, weightKg } = parseResult.data;
  const userId = (req as AuthRequest).user.id;

  try {
    const result = await saveBMIAtomic(userId, heightCm, weightKg);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const history = await getBMIHistory(userId);
    success(res, history);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
