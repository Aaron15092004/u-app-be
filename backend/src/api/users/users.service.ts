import mongoose from 'mongoose';
import User from '../../models/User';
import WorkoutLog from '../../models/WorkoutLog';
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
    waterReminderTime: string;
    workoutReminderTime: string;
  };
}

// ---------------------------------------------------------------------------
// getProfileStats — delegates streak to habits.service.getStreak (no reimplementation)
// Runs streak + workout count + kcal aggregate + notifications lookup in parallel.
// ---------------------------------------------------------------------------

export async function getProfileStats(userId: string): Promise<IProfileStats> {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [streakResult, count, kcalAgg, userDoc] = await Promise.all([
    getStreak(userId),
    WorkoutLog.countDocuments({ userId: userObjId }),
    WorkoutLog.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
    ]),
    User.findById(userObjId).select('notifications').lean(),
  ]);

  return {
    streakDays: streakResult.streakDays,
    totalWorkouts: count,
    totalKcalBurned: (kcalAgg[0]?.total as number) ?? 0,
    notifications: {
      waterReminder: userDoc?.notifications?.waterReminder ?? true,
      workoutReminder: userDoc?.notifications?.workoutReminder ?? true,
      waterReminderTime: userDoc?.notifications?.waterReminderTime ?? '08:00',
      workoutReminderTime: userDoc?.notifications?.workoutReminderTime ?? '07:00',
    },
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
  if (body.waterReminderTime !== undefined)
    update['notifications.waterReminderTime'] = body.waterReminderTime;
  if (body.workoutReminderTime !== undefined)
    update['notifications.workoutReminderTime'] = body.workoutReminderTime;

  const user = await User.findByIdAndUpdate(userObjId, update, {
    new: true,
    runValidators: true,
  })
    .select('notifications')
    .lean();

  if (!user) throw makeError('Không tìm thấy người dùng', 404);

  return user;
}
