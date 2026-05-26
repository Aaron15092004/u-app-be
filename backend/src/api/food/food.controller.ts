import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import {
  checkScanRateLimit,
  recordScanAttempt,
  saveFoodLog,
  getFoodLogsForDate,
  getFoodLogsForRange,
  deleteFoodLog,
  searchFoodItems,
} from './food.service';
import {
  saveFoodLogSchema,
  getFoodLogsSchema,
  getFoodLogsRangeSchema,
  searchItemsSchema,
  barcodeParamSchema,
} from './food.validation';
import * as aiFoodService from '../../services/ai-food.service';
import { uploadImageBuffer } from '../../utils/cloudinary';
import { lookupBarcodeProduct } from './barcode-provider.service';

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
    const rateLimit = await checkScanRateLimit(userId);
    if (rateLimit.isLimited) {
      const hours = Math.floor(rateLimit.retryAfterSeconds / 3600);
      const minutes = Math.floor((rateLimit.retryAfterSeconds % 3600) / 60);
      const timeStr = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
      res.status(429).json({
        success: false,
        error: `Bạn đã dùng hết ${rateLimit.limit} lượt quét hôm nay. Lượt quét được đặt lại sau ${timeStr}.`,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        usedToday: rateLimit.usedToday,
        limit: rateLimit.limit,
        quotaMode: rateLimit.quotaMode,
        entitlementId: rateLimit.entitlementId,
        activeUntil: rateLimit.activeUntil,
      });
      return;
    }

    const result = await aiFoodService.analyzeImage(req.file.buffer);

    // Only count the attempt after Gemini succeeds — failed scans (bad image, API error)
    // do not consume the user's daily quota.
    await recordScanAttempt(userId, rateLimit);

    success(res, {
      ...result,
      usedToday: rateLimit.usedToday + 1,
      limit: rateLimit.limit,
      quotaMode: rateLimit.quotaMode,
      entitlementId: rateLimit.entitlementId,
      activeUntil: rateLimit.activeUntil,
    }, 200);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    const msg = e.message ?? 'Lỗi server';
    // Surface friendly messages for common Gemini errors
    if (msg.includes('Không nhận dạng được') || msg.includes('Không đọc được')) {
      error(res, msg, 422);
    } else if (msg.includes('GEMINI_API_KEY')) {
      error(res, 'Tính năng quét ảnh chưa được cấu hình. Vui lòng liên hệ hỗ trợ.', 503);
    } else {
      error(res, msg, e.statusCode ?? 500);
    }
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
// PATCH /api/food/logs/:id/image — upload photo for an existing log
// ---------------------------------------------------------------------------

export const patchFoodLogImage = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const logId = String(req.params.id);

  if (!req.file) {
    error(res, 'Vui lòng chọn ảnh', 400);
    return;
  }

  try {
    const imageUrl = await uploadImageBuffer(req.file.buffer).catch((e: unknown) => {
      const msg = (e as Error)?.message ?? String(e);
      console.error('[Cloudinary] image upload failed:', msg);
      return null as string | null;
    });

    if (!imageUrl) {
      error(res, 'Không thể tải ảnh lên, vui lòng thử lại', 500);
      return;
    }

    const FoodLog = (await import('../../models/FoodLog')).default;
    const mongoose = await import('mongoose');
    const doc = await FoodLog.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(logId), userId: new mongoose.Types.ObjectId(userId) },
      { $set: { imageUrl } },
      { new: true },
    ).lean();

    if (!doc) {
      error(res, 'Không tìm thấy bữa ăn', 404);
      return;
    }

    success(res, { imageUrl });
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
// GET /api/food/logs/range?from=YYYY-MM-DD&to=YYYY-MM-DD — daily aggregates
// ---------------------------------------------------------------------------

export const getFoodLogsRangeHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parseResult = getFoodLogsRangeSchema.safeParse({
    from: String(req.query.from ?? ''),
    to: String(req.query.to ?? ''),
  });
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const days = await getFoodLogsForRange(userId, parseResult.data.from, parseResult.data.to);
    success(res, days);
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

// ---------------------------------------------------------------------------
// GET /api/food/items/barcode/:barcode — external barcode lookup MVP
// ---------------------------------------------------------------------------

export const getFoodItemByBarcode = async (req: Request, res: Response): Promise<void> => {
  const parseResult = barcodeParamSchema.safeParse({ barcode: String(req.params.barcode ?? '') });
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await lookupBarcodeProduct(parseResult.data.barcode);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi tra cuu ma vach', e.statusCode ?? 500);
  }
};
