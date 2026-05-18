import mongoose from 'mongoose';
import WorkoutLog, { IWorkoutLog } from '../../models/WorkoutLog';
import { vietnamDayStart, lastNDaysRange } from '../../utils/date';
import { z } from 'zod';
import { createWorkoutLogSchema } from './workouts.validation';

type CreateWorkoutPayload = z.infer<typeof createWorkoutLogSchema>;

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function createWorkoutLog(
  userId: string,
  payload: CreateWorkoutPayload,
): Promise<IWorkoutLog> {
  const dateBucket = vietnamDayStart(payload.completedAt);

  const log = await WorkoutLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    exerciseId: payload.exerciseId ? new mongoose.Types.ObjectId(payload.exerciseId) : undefined,
    exerciseName: payload.exerciseName,
    durationMinutes: payload.durationMinutes,
    caloriesBurned: payload.caloriesBurned,
    completedAt: new Date(payload.completedAt),
    date: dateBucket,
  });

  return log;
}

export async function getWeeklyStats(userId: string): Promise<{
  days: number;
  exercises: number;
  kcal: number;
  minutes: number;
  todayKcal: number;
  targetKcal: number;
}> {
  const { start } = lastNDaysRange(7);
  const todayStart = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [agg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId, date: { $gte: start } } },
    {
      $group: {
        _id: null,
        exercises: { $sum: 1 },
        kcal: { $sum: '$caloriesBurned' },
        minutes: { $sum: '$durationMinutes' },
        dayBuckets: { $addToSet: '$date' },
      },
    },
  ]);

  const [todayAgg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId, date: todayStart } },
    { $group: { _id: null, kcal: { $sum: '$caloriesBurned' } } },
  ]);

  return {
    days: agg ? agg.dayBuckets.length : 0,
    exercises: agg ? agg.exercises : 0,
    kcal: agg ? agg.kcal : 0,
    minutes: agg ? agg.minutes : 0,
    todayKcal: todayAgg ? todayAgg.kcal : 0,
    targetKcal: 300, // WO-04 hardcoded constant
  };
}
