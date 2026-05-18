import apiClient from './client';
import type { IHabitId, ITodayHabits, IWeeklyHabit, IStreak } from './types';

export async function checkInHabitApi(habitId: IHabitId): Promise<{ habitId: IHabitId; date: string; checkedAt: string }> {
  const res = await apiClient.post<{ success: boolean; data: { habitId: IHabitId; date: string; checkedAt: string } }>(
    '/api/habits/check-in',
    { habitId },
  );
  return res.data.data;
}

export async function getTodayHabitsApi(): Promise<ITodayHabits> {
  const res = await apiClient.get<{ success: boolean; data: ITodayHabits }>(
    '/api/habits/today',
  );
  return res.data.data;
}

export async function getWeeklyHabitsApi(): Promise<IWeeklyHabit[]> {
  const res = await apiClient.get<{ success: boolean; data: IWeeklyHabit[] }>(
    '/api/habits/weekly',
  );
  return res.data.data;
}

export async function getStreakApi(): Promise<IStreak> {
  const res = await apiClient.get<{ success: boolean; data: IStreak }>(
    '/api/habits/streak',
  );
  return res.data.data;
}
