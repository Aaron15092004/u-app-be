import mongoose from 'mongoose';
import FoodLog from '../../models/FoodLog';
import FoodItem from '../../models/FoodItem';
import FoodScanAttempt from '../../models/FoodScanAttempt';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import { vietnamDayStart } from '../../utils/date';
import { saveFoodLogSchema } from './food.validation';
import { z } from 'zod';
import { lookupBarcodeProduct, BarcodeLookupResult } from './barcode-provider.service';

const SCAN_DAILY_LIMIT = 20;
const ENTITLEMENT_SCAN_DAILY_LIMIT = 30;

// ---------------------------------------------------------------------------
// Error helper (same pattern as bmi.service.ts)
// ---------------------------------------------------------------------------

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ---------------------------------------------------------------------------
// secondsUntilVietnamMidnight — for rate limit reset time
// ---------------------------------------------------------------------------

function secondsUntilVietnamMidnight(): number {
  const nowVnMs = Date.now() + 7 * 3600 * 1000;
  const nextMidnightVnMs = (Math.floor(nowVnMs / 86400000) + 1) * 86400000;
  return Math.ceil((nextMidnightVnMs - nowVnMs) / 1000);
}

// ---------------------------------------------------------------------------
// checkScanRateLimit — checks actual AI scan call count (not saved logs)
// Returns { isLimited, usedToday, limit, retryAfterSeconds }
// ---------------------------------------------------------------------------

export interface ScanRateLimitResult {
  isLimited: boolean;
  usedToday: number;
  limit: number;
  retryAfterSeconds: number;
  quotaMode: 'standard_daily_limit' | 'entitlement_30_daily';
  entitlementId: string | null;
  activeUntil: string | null;
}

export async function checkScanRateLimit(userId: string): Promise<ScanRateLimitResult> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const now = new Date();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const entitlement = await UserScanEntitlement.findOne({
    userId: userObjectId,
    activeUntil: { $gt: now },
  })
    .sort({ activeUntil: -1 })
    .lean();

  const limit = entitlement ? ENTITLEMENT_SCAN_DAILY_LIMIT : SCAN_DAILY_LIMIT;

  const usedToday = await FoodScanAttempt.countDocuments({
    userId: userObjectId,
    createdAt: { $gte: todayStart, $lt: tomorrowStart },
  });

  return {
    isLimited: usedToday >= limit,
    usedToday,
    limit,
    retryAfterSeconds: secondsUntilVietnamMidnight(),
    quotaMode: entitlement ? 'entitlement_30_daily' : 'standard_daily_limit',
    entitlementId: entitlement ? String(entitlement._id) : null,
    activeUntil: entitlement ? entitlement.activeUntil.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// recordScanAttempt — creates a scan attempt record (called before Gemini)
// ---------------------------------------------------------------------------

export async function recordScanAttempt(
  userId: string,
  quota?: Pick<ScanRateLimitResult, 'quotaMode' | 'entitlementId'>,
): Promise<void> {
  await FoodScanAttempt.create({
    userId: new mongoose.Types.ObjectId(userId),
    source: quota?.entitlementId ? 'redeem_entitlement' : 'daily_quota',
    entitlementId: quota?.entitlementId ? new mongoose.Types.ObjectId(quota.entitlementId) : undefined,
    quotaMode: quota?.quotaMode === 'entitlement_30_daily' ? 'high_quota' : 'standard',
  });
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
// getFoodLogsForRange — returns daily aggregated nutrition for a date range
// ---------------------------------------------------------------------------

export interface FoodDaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  logCount: number;
}

export async function getFoodLogsForRange(
  userId: string,
  fromStr: string,
  toStr: string,
): Promise<FoodDaySummary[]> {
  const fromStart = vietnamDayStart(new Date(fromStr));
  const toEnd = new Date(vietnamDayStart(new Date(toStr)).getTime() + 86400000);

  const logs = await FoodLog.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: fromStart, $lt: toEnd },
  })
    .sort({ date: 1 })
    .lean();

  // Use Vietnam timezone (+7) for date keys so logs at midnight-7AM local
  // don't bleed into the previous UTC date.
  function toVnDateKey(d: Date): string {
    return new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  }

  const dayMap = new Map<string, FoodDaySummary>();

  for (const log of logs) {
    const dateKey = toVnDateKey(log.date as Date);
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { date: dateKey, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, logCount: 0 });
    }
    const entry = dayMap.get(dateKey)!;
    const t = log.totals as { calories: number; protein: number; carbs: number; fat: number };
    const foods = log.foods as Array<{ fiber?: number }>;
    entry.calories += t.calories ?? 0;
    entry.protein += t.protein ?? 0;
    entry.carbs += t.carbs ?? 0;
    entry.fat += t.fat ?? 0;
    entry.fiber += foods.reduce((s, f) => s + (f.fiber ?? 0), 0);
    entry.logCount += 1;
  }

  // Fill every day in range (including zero-data days)
  const result: FoodDaySummary[] = [];
  const cursor = new Date(fromStart);
  while (cursor < toEnd) {
    const key = toVnDateKey(cursor);
    result.push(dayMap.get(key) ?? { date: key, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, logCount: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
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

function localBarcodeResult(barcode: string, item: {
  _id: unknown;
  name: string;
  brand?: string;
  servingSizeG?: number;
  packageSize?: string;
  kcalPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitaminC?: number;
  barcodeSource?: 'manual' | 'open_food_facts' | 'admin_import';
  barcodeLastVerifiedAt?: Date;
}): BarcodeLookupResult {
  return {
    barcode,
    found: true,
    source: item.barcodeSource === 'open_food_facts' ? 'open_food_facts' : 'local',
    productId: String(item._id),
    name: item.name,
    brand: item.brand,
    servingSizeG: item.servingSizeG,
    packageSize: item.packageSize,
    calories: item.kcalPer100g,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sugar: item.sugar,
    sodium: item.sodium,
    vitaminC: item.vitaminC,
    isSaveReady: true,
    minimumNutrition: {
      name: item.name,
      calories: item.kcalPer100g,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    },
    missingFields: [],
    provenance: {
      provider: item.barcodeSource === 'open_food_facts' ? 'open_food_facts' : 'local',
      fetchedAt: new Date().toISOString(),
      lastVerifiedAt: item.barcodeLastVerifiedAt?.toISOString() ?? null,
    },
    message: 'Da tim thay san pham trong du lieu noi bo',
  };
}

export async function lookupFoodItemByBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const local = await FoodItem.findOne({ barcodes: barcode }).lean();
  if (local) {
    return localBarcodeResult(barcode, local);
  }

  const external = await lookupBarcodeProduct(barcode);
  if (external.found && external.isSaveReady && external.minimumNutrition) {
    const now = new Date();
    await FoodItem.updateOne(
      { barcodes: barcode },
      {
        $setOnInsert: {
          name: external.minimumNutrition.name,
          nameEn: external.name,
          barcodes: [barcode],
          brand: external.brand,
          packageSize: external.packageSize,
          servingSizeG: external.servingSizeG,
          kcalPer100g: external.minimumNutrition.calories,
          protein: external.minimumNutrition.protein,
          carbs: external.minimumNutrition.carbs,
          fat: external.minimumNutrition.fat,
          fiber: external.fiber ?? 0,
          sugar: external.sugar ?? 0,
          sodium: external.sodium ?? 0,
          vitaminC: external.vitaminC ?? 0,
          barcodeSource: 'open_food_facts',
          barcodeLastVerifiedAt: now,
          source: 'openfoods',
          imageUrl: null,
        },
      },
      { upsert: true },
    );
    return {
      ...external,
      provenance: {
        ...external.provenance,
        lastVerifiedAt: now.toISOString(),
      },
    };
  }

  return external;
}
