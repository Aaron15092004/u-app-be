import apiClient from './client';
import type { ISaveBMIResponse, IBMIHistoryEntry } from './types';

export async function saveBMIApi(heightCm: number, weightKg: number): Promise<ISaveBMIResponse> {
  const res = await apiClient.patch<{ success: boolean; data: ISaveBMIResponse }>(
    '/api/bmi',
    { heightCm, weightKg },
  );
  return res.data.data;
}

export async function getBMIHistoryApi(): Promise<IBMIHistoryEntry[]> {
  const res = await apiClient.get<{ success: boolean; data: IBMIHistoryEntry[] }>(
    '/api/bmi/history',
  );
  return res.data.data;
}
