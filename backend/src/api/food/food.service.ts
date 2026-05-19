import mongoose from 'mongoose';
import FoodLog from '../../models/FoodLog';
import FoodItem from '../../models/FoodItem';
import { vietnamDayStart } from '../../utils/date';
import { saveFoodLogSchema } from './food.validation';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error helper (same pattern as bmi.service.ts)
// ---------------------------------------------------------------------------

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ---------------------------------------------------------------------------
// checkScanRateLimit — returns true if user has >= 20 AI scans today (D-72)
// ---------------------------------------------------------------------------

export async function checkScanRateLimit(userId: string): Promise<boolean> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  const count = await FoodLog.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: todayStart, $lt: tomorrowStart },
    aiProvider: { $ne: 'manual' },
  });

  return count >= 20;
}

// ---------------------------------------------------------------------------
// saveFoodLog — creates a FoodLog document
// ---------------------------------------------------------------------------

export async function saveFoodLog(
  userId: string,
  body: z.infer<typeof saveFoodLogSchema>,
): Promise<object> {
  const doc = await FoodLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    date: new Date(),
    ...body,
    imageUrl: body.imageUrl ?? null,
  });
  return doc.toObject();
}

// ---------------------------------------------------------------------------
// getFoodLogsForDate — returns user's food logs for a given date (UTC+7)
// ---------------------------------------------------------------------------

export async function getFoodLogsForDate(userId: string, dateStr: string): Promise<object[]> {
  const dayStart = vietnamDayStart(new Date(dateStr));
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  return FoodLog.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: dayStart, $lt: dayEnd },
  })
    .sort({ createdAt: -1 })
    .lean();
}

// ---------------------------------------------------------------------------
// deleteFoodLog — deletes a FoodLog owned by the given user (IDOR-safe)
// ---------------------------------------------------------------------------

export async function deleteFoodLog(userId: string, logId: string): Promise<void> {
  const result = await FoodLog.deleteOne({
    _id: new mongoose.Types.ObjectId(logId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw makeError('Không tìm thấy bữa ăn', 404);
  }
}

// ---------------------------------------------------------------------------
// searchFoodItems — full-text search on FoodItem collection (T-04-03-05)
// ---------------------------------------------------------------------------

export async function searchFoodItems(query: string): Promise<object[]> {
  if (!query || query.trim().length < 2) return [];

  return FoodItem.find(
    { $text: { $search: query.trim() } },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();
}
