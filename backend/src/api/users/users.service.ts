import mongoose from 'mongoose';
import User from '../../models/User';
import WorkoutLog from '../../models/WorkoutLog';
import WorkoutSession from '../../models/WorkoutSession';
import AppRating from '../../models/AppRating';
import BMIRecord from '../../models/BMIRecord';
import DeviceToken from '../../models/DeviceToken';
import FeedbackPromptState from '../../models/FeedbackPromptState';
import FoodLog from '../../models/FoodLog';
import FoodScanAttempt from '../../models/FoodScanAttempt';
import HabitLog from '../../models/HabitLog';
import NutMilkPreference from '../../models/NutMilkPreference';
import UserProgramProgress from '../../models/UserProgramProgress';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import WaterLog from '../../models/WaterLog';
import { getStreak } from '../habits/habits.service';
import { updateProfileSchema, updateNotificationsSchema } from './users.validation';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

const DEFAULT_WATER_REMINDER_TIMES = [
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
];

// ---------------------------------------------------------------------------
// IProfileStats response shape
// NOTE: notifications block is included so mobile Plan 07 can initialise
// its notification settings form from saved server state (WARNING 3 fix).
// ---------------------------------------------------------------------------

export interface IProfileStats {
  streakDays: number;
  totalWorkouts: number;
  totalKcalBurned: number;
  notifications: {
    waterReminder: boolean;
    workoutReminder: boolean;
    nutMilkReminder: boolean;
    waterReminderTime: string;
    waterReminderTimes: string[];
    workoutReminderTime: string;
    nutMilkReminderTime: string;
  };
  dailyTargets: { kcal: number; protein: number; carbs: number; fat: number };
}

// ---------------------------------------------------------------------------
// calculateDailyTargets — Mifflin-St Jeor BMR → TDEE → macro split
// ---------------------------------------------------------------------------

function calculateDailyTargets(
  weightKg?: number, heightCm?: number, age?: number, goalType?: string,
): { kcal: number; protein: number; carbs: number; fat: number } {
  if (!weightKg) return { kcal: 2000, protein: 100, carbs: 250, fat: 67 };
  const h = heightCm ?? 165;
  const a = age ?? 25;
  const bmr = 10 * weightKg + 6.25 * h - 5 * a + 5;
  const tdee = bmr * 1.55;
  const kcal = Math.round(
    goalType === 'lose' ? tdee - 500 : goalType === 'gain' ? tdee + 300 : tdee,
  );
  const safe = Math.max(1200, kcal);
  const protein = Math.round(weightKg * 1.8);
  const fat = Math.round(safe * 0.28 / 9);
  const carbs = Math.max(50, Math.round((safe - protein * 4 - fat * 9) / 4));
  return { kcal: safe, protein, carbs, fat };
}

// ---------------------------------------------------------------------------
// getProfileStats — delegates streak to habits.service.getStreak (no reimplementation)
// Runs streak + workout count + kcal aggregate + notifications lookup in parallel.
// ---------------------------------------------------------------------------

export async function getProfileStats(userId: string): Promise<IProfileStats> {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [streakResult, count, kcalAgg, userDoc, loggedSessionIds] = await Promise.all([
    getStreak(userId),
    WorkoutLog.countDocuments({ userId: userObjId }),
    WorkoutLog.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
    ]),
    User.findById(userObjId).select('notifications profile').lean(),
    WorkoutLog.distinct('sourceSessionId', {
      userId: userObjId,
      sourceSessionId: { $exists: true, $ne: null },
    }),
  ]);

  const legacyCompletedSessions = await WorkoutSession.find(
    {
      userId: userObjId,
      status: 'completed',
      _id: { $nin: loggedSessionIds },
    },
    { totalDurationSeconds: 1, exercises: 1 },
  ).lean();
  const legacyWorkoutCount = legacyCompletedSessions.length;
  const legacyKcal = legacyCompletedSessions.reduce((sum, session) => {
    const plannedDurationSeconds = (session.exercises ?? []).reduce(
      (inner, exercise) => inner + Math.max(0, exercise.durationSeconds ?? 0),
      0,
    );
    const effectiveDurationSeconds = Math.max(
      session.totalDurationSeconds ?? 0,
      plannedDurationSeconds,
    );
    const durationMinutes = Math.max(1, Math.round(effectiveDurationSeconds / 60));
    return sum + Math.max(1, Math.round(durationMinutes * 5));
  }, 0);

  const prof = (userDoc as { profile?: { weightKg?: number; heightCm?: number; age?: number; goalType?: string }; notifications?: object } | null)?.profile;
  const dailyTargets = calculateDailyTargets(prof?.weightKg, prof?.heightCm, prof?.age, prof?.goalType);
  const savedWaterTimes = userDoc?.notifications?.waterReminderTimes;
  const waterReminderTimes =
    Array.isArray(savedWaterTimes) && savedWaterTimes.length > 0
      ? savedWaterTimes
      : DEFAULT_WATER_REMINDER_TIMES;

  return {
    streakDays: streakResult.streakDays,
    totalWorkouts: count + legacyWorkoutCount,
    totalKcalBurned: ((kcalAgg[0]?.total as number) ?? 0) + legacyKcal,
    notifications: {
      waterReminder: userDoc?.notifications?.waterReminder ?? true,
      workoutReminder: userDoc?.notifications?.workoutReminder ?? true,
      nutMilkReminder: userDoc?.notifications?.nutMilkReminder ?? true,
      waterReminderTime: userDoc?.notifications?.waterReminderTime ?? waterReminderTimes[0] ?? '08:00',
      waterReminderTimes,
      workoutReminderTime: userDoc?.notifications?.workoutReminderTime ?? '07:00',
      nutMilkReminderTime: userDoc?.notifications?.nutMilkReminderTime ?? '20:00',
    },
    dailyTargets,
  };
}

// ---------------------------------------------------------------------------
// updateUserProfile — Zod whitelist schema only; dot-notation update to avoid
// overwriting nested fields not in the request body.
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  userId: string,
  body: z.infer<typeof updateProfileSchema>,
) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const update: Record<string, unknown> = {};

  if (body.name !== undefined) update['name'] = body.name;
  if (body.heightCm !== undefined) update['profile.heightCm'] = body.heightCm;
  if (body.weightKg !== undefined) update['profile.weightKg'] = body.weightKg;
  if (body.goalType !== undefined) update['profile.goalType'] = body.goalType;
  if (body.waterGoal !== undefined) update['profile.waterGoal'] = body.waterGoal;
  if (body.age !== undefined) update['profile.age'] = body.age;

  const user = await User.findByIdAndUpdate(userObjId, update, {
    new: true,
    runValidators: true,
  })
    .select('name email profile')
    .lean();

  if (!user) throw makeError('Không tìm thấy người dùng', 404);

  return user;
}

// ---------------------------------------------------------------------------
// updateUserNotifications — Zod whitelist schema only; dot-notation update.
// ---------------------------------------------------------------------------

export async function updateUserNotifications(
  userId: string,
  body: z.infer<typeof updateNotificationsSchema>,
) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const update: Record<string, unknown> = {};

  if (body.waterReminder !== undefined) update['notifications.waterReminder'] = body.waterReminder;
  if (body.workoutReminder !== undefined)
    update['notifications.workoutReminder'] = body.workoutReminder;
  if (body.nutMilkReminder !== undefined)
    update['notifications.nutMilkReminder'] = body.nutMilkReminder;
  if (body.waterReminderTime !== undefined)
    update['notifications.waterReminderTime'] = body.waterReminderTime;
  if (body.waterReminderTimes !== undefined) {
    update['notifications.waterReminderTimes'] = body.waterReminderTimes;
    update['notifications.waterReminderTime'] = body.waterReminderTimes[0];
  }
  if (body.workoutReminderTime !== undefined)
    update['notifications.workoutReminderTime'] = body.workoutReminderTime;
  if (body.nutMilkReminderTime !== undefined)
    update['notifications.nutMilkReminderTime'] = body.nutMilkReminderTime;

  const user = await User.findByIdAndUpdate(userObjId, update, {
    new: true,
    runValidators: true,
  })
    .select('notifications')
    .lean();

  if (!user) throw makeError('Không tìm thấy người dùng', 404);

  return user;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjId).select('role').lean();
  if (!user) throw makeError('Không tìm thấy người dùng', 404);
  if (user.role === 'admin') throw makeError('Không thể xóa tài khoản quản trị trong app', 403);

  await Promise.all([
    AppRating.deleteMany({ userId: userObjId }),
    BMIRecord.deleteMany({ userId: userObjId }),
    DeviceToken.deleteMany({ userId: userObjId }),
    FeedbackPromptState.deleteMany({ userId: userObjId }),
    FoodLog.deleteMany({ userId: userObjId }),
    FoodScanAttempt.deleteMany({ userId: userObjId }),
    HabitLog.deleteMany({ userId: userObjId }),
    NutMilkPreference.deleteMany({ userId: userObjId }),
    UserProgramProgress.deleteMany({ userId: userObjId }),
    UserScanEntitlement.deleteMany({ userId: userObjId }),
    WaterLog.deleteMany({ userId: userObjId }),
    WorkoutLog.deleteMany({ userId: userObjId }),
    WorkoutSession.deleteMany({ userId: userObjId }),
  ]);

  await User.deleteOne({ _id: userObjId });
}
