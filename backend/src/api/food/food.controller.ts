import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import {
  checkScanRateLimit,
  saveFoodLog,
  getFoodLogsForDate,
  deleteFoodLog,
  searchFoodItems,
} from './food.service';
import {
  saveFoodLogSchema,
  getFoodLogsSchema,
  searchItemsSchema,
} from './food.validation';
import * as aiFoodService from '../../services/ai-food.service';

// ---------------------------------------------------------------------------
// POST /api/food/scan — AI image analysis with rate limit (D-72, T-04-03-01/02)
// ---------------------------------------------------------------------------

export const scanFood = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  if (!req.file) {
    error(res, 'Vui lòng chọn ảnh', 400);
    return;
  }

  try {
    const rateLimited = await checkScanRateLimit(userId);
    if (rateLimited) {
      error(res, 'Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai.', 429);
      return;
    }

    const result = await aiFoodService.analyzeImage(req.file.buffer);
    success(res, result, 200);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// POST /api/food/logs — save a food log entry (T-04-03-01/03)
// ---------------------------------------------------------------------------

export const saveFoodLogHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parseResult = saveFoodLogSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await saveFoodLog(userId, parseResult.data);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/food/logs?date=YYYY-MM-DD — get logs for a date (T-04-03-04)
// ---------------------------------------------------------------------------

export const getFoodLogs = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parseResult = getFoodLogsSchema.safeParse({ date: String(req.query.date ?? '') });
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const logs = await getFoodLogsForDate(userId, parseResult.data.date);
    success(res, logs);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/food/logs/:id — delete own food log (T-04-03-04 IDOR protection)
// ---------------------------------------------------------------------------

export const deleteFoodLogHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const logId = String(req.params.id);

  try {
    await deleteFoodLog(userId, logId);
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/food/items?q= — search Vietnamese food items (T-04-03-05)
// ---------------------------------------------------------------------------

export const searchItems = async (req: Request, res: Response): Promise<void> => {
  const parseResult = searchItemsSchema.safeParse({ q: String(req.query.q ?? '') });
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const items = await searchFoodItems(parseResult.data.q);
    success(res, items);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
