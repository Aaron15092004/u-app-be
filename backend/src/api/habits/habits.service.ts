import mongoose from 'mongoose';
import HabitLog from '../../models/HabitLog';
import { vietnamDayStart, lastNDaysRange } from '../../utils/date';
import { HABIT_IDS, HabitId } from './habits.validation';

function makeError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export async function checkInHabit(userId: string, habitId: HabitId) {
  const result = await HabitLog.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      date: vietnamDayStart(new Date()),
      habitId,
    },
    { $setOnInsert: { checkedAt: new Date() } },
    { upsert: true, new: true },
  );
  return { habitId: result.habitId, date: result.date, checkedAt: result.checkedAt };
}

export async function getTodayHabits(userId: string) {
  const logs = await HabitLog.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: vietnamDayStart(new Date()),
  })
    .select('habitId')
    .lean();
  const completed = logs.map((l) => l.habitId);
  return {
    completed,
    progress: {
      count: completed.length,
      percent: Math.round((completed.length / HABIT_IDS.length) * 100),
    },
  };
}

export async function getWeeklyHeatmap(userId: string) {
  const { start } = lastNDaysRange(7);
  const agg = await HabitLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start },
      },
    },
    {
      $group: {
        _id: '$date',
        habits: { $addToSet: '$habitId' },
      },
    },
    {
      $project: {
        _id: 1,
        count: { $size: '$habits' },
      },
    },
  ]);

  const byDate = new Map(agg.map((a) => [new Date(a._id).getTime(), a.count as number]));
  const result: { date: string; qualified: boolean }[] = [];
  const todayStart = vietnamDayStart(new Date());

  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 86400000);
    const count = byDate.get(d.getTime()) ?? 0;
    result.push({ date: d.toISOString().slice(0, 10), qualified: count >= 3 });
  }

  return result;
}

export async function getStreak(userId: string) {
  // Streak rule (D-49, D-50): consecutive days with >=3 distinct habits (UTC+7 buckets).
  // Today is included IF it already has >=3 habits; otherwise start counting from yesterday.
  const todayStart = vietnamDayStart(new Date());
  const lookbackStart = new Date(todayStart.getTime() - 365 * 86400000);
  const userObjId = new mongoose.Types.ObjectId(userId);

  const agg = await HabitLog.aggregate([
    {
      $match: {
        userId: userObjId,
        date: { $gte: lookbackStart },
      },
    },
    {
      $group: {
        _id: '$date',
        habits: { $addToSet: '$habitId' },
      },
    },
    {
      $project: {
        _id: 1,
        count: { $size: '$habits' },
      },
    },
  ]);

  const qualifiedDays = new Set(
    agg.filter((a) => (a.count as number) >= 3).map((a) => new Date(a._id).getTime()),
  );

  const todayQualified = qualifiedDays.has(todayStart.getTime());
  const startOffset = todayQualified ? 0 : 1;

  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const dayTs = todayStart.getTime() - i * 86400000;
    if (qualifiedDays.has(dayTs)) streak++;
    else break;
  }

  return { streakDays: streak };
}
