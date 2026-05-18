import apiClient from './client';
import type { ICreateWorkoutLog, IWorkoutLog, IWeeklyStats } from './types';

export async function createWorkoutLogApi(body: ICreateWorkoutLog): Promise<IWorkoutLog> {
  const res = await apiClient.post<{ success: boolean; data: IWorkoutLog }>(
    '/api/workouts',
    body,
  );
  return res.data.data;
}

export async function getWeeklyStatsApi(): Promise<IWeeklyStats> {
  const res = await apiClient.get<{ success: boolean; data: IWeeklyStats }>(
    '/api/workouts/stats/weekly',
  );
  return res.data.data;
}
