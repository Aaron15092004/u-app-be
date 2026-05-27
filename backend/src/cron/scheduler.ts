import cron from 'node-cron';
import mongoose from 'mongoose';
import User from '../models/User';
import HabitLog from '../models/HabitLog';
import { sendBatchNotificationToUsers } from '../services/fcm.service';
import { getStreak } from '../api/habits/habits.service';
import { vietnamDayStart } from '../utils/date';

async function dispatchWaterReminders(currentTime: string): Promise<void> {
  const users = await User.find({
    $and: [
      { 'notifications.waterReminder': true },
      {
        $or: [
          { 'notifications.waterReminderTimes': currentTime },
          { 'notifications.waterReminderTime': currentTime },
        ],
      },
    ],
  })
    .select('_id')
    .lean();

  if (users.length === 0) return;

  const userIds = users.map((u) => (u._id as mongoose.Types.ObjectId).toString());
  await sendBatchNotificationToUsers(userIds, {
    title: 'Nhắc uống nước',
    body: 'Đã đến giờ uống nước rồi! Hãy uống một ly nhé.',
    data: { type: 'water_reminder' },
  });
}

async function dispatchWorkoutReminders(currentTime: string): Promise<void> {
  const users = await User.find({
    'notifications.workoutReminder': true,
    'notifications.workoutReminderTime': currentTime,
  })
    .select('_id')
    .lean();

  if (users.length === 0) return;

  const userIds = users.map((u) => (u._id as mongoose.Types.ObjectId).toString());
  await sendBatchNotificationToUsers(userIds, {
    title: 'Nhắc tập luyện',
    body: 'Đã đến giờ tập luyện. Bắt đầu ngay để giữ streak nhé!',
    data: { type: 'workout_reminder' },
  });
}

async function dispatchNutMilkReminders(currentTime: string): Promise<void> {
  const users = await User.find({
    'notifications.nutMilkReminder': true,
    'notifications.nutMilkReminderTime': currentTime,
  })
    .select('_id')
    .lean();

  if (users.length === 0) return;

  const userIds = users.map((u) => (u._id as mongoose.Types.ObjectId).toString());
  await sendBatchNotificationToUsers(userIds, {
    title: 'Nhắc uống sữa Ủ',
    body: 'Đã đến giờ uống sữa Ủ theo lựa chọn phù hợp với thể trạng của bạn.',
    data: { type: 'nut_milk_reminder' },
  });
}

async function dispatchStreakAlerts(): Promise<void> {
  const users = await User.find({}).select('_id').lean();

  const atRiskUserIds: string[] = [];

  for (const user of users) {
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const { streakDays } = await getStreak(userId);

    if (streakDays === 0) continue;

    const todayLogs = await HabitLog.find({
      userId: user._id,
      date: vietnamDayStart(new Date()),
    })
      .select('habitId')
      .lean();

    if (todayLogs.length < 3) {
      atRiskUserIds.push(userId);
    }
  }

  await sendBatchNotificationToUsers(atRiskUserIds, {
    title: 'Sắp mất streak!',
    body: 'Bạn sắp mất streak! Hoàn thành thói quen trước nửa đêm.',
    data: { type: 'streak_alert' },
  });
}

export function startScheduler(): void {
  console.log('[scheduler] Starting cron jobs (Asia/Ho_Chi_Minh)');

  // Per-minute reminder dispatcher — uses manual UTC+7 offset math (Pitfall 2)
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const now = new Date();
        const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const hh = String(utc7.getUTCHours()).padStart(2, '0');
        const mm = String(utc7.getUTCMinutes()).padStart(2, '0');
        const currentTime = `${hh}:${mm}`;
        await dispatchWaterReminders(currentTime);
        await dispatchWorkoutReminders(currentTime);
        await dispatchNutMilkReminders(currentTime);
      } catch (err) {
        console.error('[scheduler] per-minute job error:', err);
      }
    },
    { timezone: 'Asia/Ho_Chi_Minh' }
  );

  // Daily 20:00 streak alert
  cron.schedule(
    '0 20 * * *',
    async () => {
      try {
        await dispatchStreakAlerts();
      } catch (err) {
        console.error('[scheduler] streak alert error:', err);
      }
    },
    { timezone: 'Asia/Ho_Chi_Minh' }
  );
}
