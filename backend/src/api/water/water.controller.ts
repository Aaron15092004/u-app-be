import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { logWaterSchema } from './water.validation';
import { logWater, getTodayWater, deleteWaterLog } from './water.service';

// ---------------------------------------------------------------------------
// POST /api/water — log a glass of water
// ---------------------------------------------------------------------------

export const logWaterHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parseResult = logWaterSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const doc = await logWater(userId, parseResult.data.loggedAt);
    success(res, doc, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/water/today — get today's water logs + count + waterGoal
// ---------------------------------------------------------------------------

export const getTodayWaterHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const result = await getTodayWater(userId);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/water/:id — delete own water log (IDOR-safe)
// ---------------------------------------------------------------------------

export const deleteWaterHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const logId = String(req.params.id);

  try {
    await deleteWaterLog(userId, logId);
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
