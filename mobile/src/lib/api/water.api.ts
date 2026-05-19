import apiClient from './client';
import type { IWaterLog, ITodayWater } from './types';

export async function logWaterApi(loggedAt?: string): Promise<IWaterLog> {
  const res = await apiClient.post<{ success: boolean; data: IWaterLog }>(
    '/api/water',
    loggedAt ? { loggedAt } : {},
  );
  return res.data.data;
}

export async function getTodayWaterApi(): Promise<ITodayWater> {
  const res = await apiClient.get<{ success: boolean; data: ITodayWater }>(
    '/api/water/today',
  );
  return res.data.data;
}

export async function deleteWaterApi(id: string): Promise<void> {
  await apiClient.delete(`/api/water/${id}`);
}
