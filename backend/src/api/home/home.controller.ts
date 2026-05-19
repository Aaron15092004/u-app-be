import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { getTodaySummary } from './home.service';

// ---------------------------------------------------------------------------
// GET /api/home/today-summary — dashboard aggregation
// ---------------------------------------------------------------------------

export const getTodaySummaryHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const summary = await getTodaySummary(userId);
    success(res, summary);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
