import apiClient from './client';
import type { IProfileStats, IUserNotifications } from './types';

export async function getProfileStatsApi(): Promise<IProfileStats> {
  const res = await apiClient.get<{ success: boolean; data: IProfileStats }>(
    '/api/users/profile/stats',
  );
  return res.data.data;
}

export async function updateProfileApi(body: {
  name?: string;
  heightCm?: number;
  weightKg?: number;
  goalType?: 'lose' | 'maintain' | 'gain';
  waterGoal?: number;
}): Promise<{ name: string; email: string; profile: object }> {
  const res = await apiClient.patch<{ success: boolean; data: { name: string; email: string; profile: object } }>(
    '/api/users/profile',
    body,
  );
  return res.data.data;
}

export async function updateNotificationsApi(
  body: Partial<IUserNotifications>,
): Promise<{ notifications: IUserNotifications }> {
  const res = await apiClient.patch<{ success: boolean; data: { notifications: IUserNotifications } }>(
    '/api/users/notifications',
    body,
  );
  return res.data.data;
}
