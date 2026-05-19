import mongoose from 'mongoose';
import FoodLog from '../../models/FoodLog';
import WaterLog from '../../models/WaterLog';
import WorkoutLog from '../../models/WorkoutLog';
import BMIRecord from '../../models/BMIRecord';
import User from '../../models/User';
import { vietnamDayStart } from '../../utils/date';

// ---------------------------------------------------------------------------
// ITodaySummary response shape
// ---------------------------------------------------------------------------

export interface ITodaySummary {
  kcalConsumed: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  bmi: { value: number; category: string } | null;
}

// ---------------------------------------------------------------------------
// getTodaySummary — aggregates data from 5 collections for the Home Dashboard
// ---------------------------------------------------------------------------

export async function getTodaySummary(userId: string): Promise<ITodaySummary> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Run all 5 queries in parallel for performance
  const [foodAgg, waterCount, workoutAgg, latestBMI, user] = await Promise.all([
    // 1. FoodLog aggregate: sum kcal + macros for today
    FoodLog.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gte: todayStart, $lt: tomorrowStart },
        },
      },
      {
        $group: {
          _id: null,
          kcal: { $sum: '$totals.calories' },
          protein: { $sum: '$totals.protein' },
          carbs: { $sum: '$totals.carbs' },
          fat: { $sum: '$totals.fat' },
        },
      },
    ]),
    // 2. WaterLog: count glasses today
    WaterLog.countDocuments({
      userId: userObjId,
      loggedAt: { $gte: todayStart, $lt: tomorrowStart },
    }),
    // 3. WorkoutLog aggregate: sum durationMinutes for today bucket
    WorkoutLog.aggregate([
      {
        $match: {
          userId: userObjId,
          date: todayStart, // WorkoutLog stores date as the UTC+7 day bucket (exact match)
        },
      },
      {
        $group: {
          _id: null,
          minutes: { $sum: '$durationMinutes' },
        },
      },
    ]),
    // 4. BMIRecord: most recent record
    BMIRecord.findOne({ userId: userObjId })
      .sort({ recordedAt: -1 })
      .select('bmi category')
      .lean(),
    // 5. User: waterGoal from profile
    User.findById(userObjId).select('profile.waterGoal').lean(),
  ]);

  // Extract values with safe defaults
  const foodResult = foodAgg[0] as { kcal?: number; protein?: number; carbs?: number; fat?: number } | undefined;
  const kcalConsumed = foodResult?.kcal ?? 0;
  const macros = {
    protein: foodResult?.protein ?? 0,
    carbs: foodResult?.carbs ?? 0,
    fat: foodResult?.fat ?? 0,
  };

  const workoutResult = workoutAgg[0] as { minutes?: number } | undefined;
  const workoutMinutes = workoutResult?.minutes ?? 0;

  const bmiRecord = latestBMI as { bmi?: number; category?: string } | null;
  const bmi =
    bmiRecord && bmiRecord.bmi != null && bmiRecord.category
      ? { value: bmiRecord.bmi, category: bmiRecord.category }
      : null;

  const waterGoal = (user as { profile?: { waterGoal?: number } } | null)?.profile?.waterGoal ?? 8;

  return {
    kcalConsumed,
    macros,
    waterGlasses: waterCount,
    waterGoal,
    workoutMinutes,
    bmi,
  };
}
