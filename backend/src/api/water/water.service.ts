import mongoose from 'mongoose';
import WaterLog from '../../models/WaterLog';
import User from '../../models/User';
import { vietnamDayStart } from '../../utils/date';

// ---------------------------------------------------------------------------
// Error helper (same pattern as food.service.ts lines 12-16)
// ---------------------------------------------------------------------------

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ---------------------------------------------------------------------------
// logWater — creates a WaterLog; userId always from JWT (IDOR protection)
// ---------------------------------------------------------------------------

export async function logWater(userId: string, loggedAt?: string): Promise<object> {
  const doc = await WaterLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
  });
  return doc.toObject();
}

// ---------------------------------------------------------------------------
// getTodayWater — returns today's logs + count + waterGoal for the user
// WARNING 4 fix: waterGoal embedded so mobile water screen needs no second roundtrip
// ---------------------------------------------------------------------------

export async function getTodayWater(
  userId: string,
): Promise<{ logs: object[]; count: number; waterGoal: number }> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Run two queries in parallel for performance
  const [logs, user] = await Promise.all([
    WaterLog.find({
      userId: userObjId,
      loggedAt: { $gte: todayStart, $lt: tomorrowStart },
    })
      .sort({ loggedAt: -1 })
      .lean(),
    User.findById(userObjId).select('profile.waterGoal').lean(),
  ]);

  // Fallback to default 8 for legacy users or missing User edge case
  const waterGoal = (user as { profile?: { waterGoal?: number } } | null)?.profile?.waterGoal ?? 8;

  return { logs, count: logs.length, waterGoal };
}

// ---------------------------------------------------------------------------
// deleteWaterLog — IDOR-safe delete using { _id, userId } filter
// ---------------------------------------------------------------------------

export async function deleteWaterLog(userId: string, logId: string): Promise<void> {
  const result = await WaterLog.deleteOne({
    _id: new mongoose.Types.ObjectId(logId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw makeError('Không tìm thấy bản ghi nước', 404);
  }
}
