import apiClient from './client';
import type { IScanFoodResponse, IFoodLogItem, IFoodLog, IFoodItem } from './types';

export async function scanFoodApi(imageUri: string): Promise<IScanFoodResponse> {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'meal.jpg' } as unknown as Blob);
  const res = await apiClient.post('/api/food/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data.data as IScanFoodResponse;
}

export async function saveFoodLogApi(body: {
  foods: IFoodLogItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'openai' | 'logmeal' | 'manual';
  imageUrl?: string | null;
}): Promise<IFoodLog> {
  const res = await apiClient.post('/api/food/logs', body);
  return res.data.data as IFoodLog;
}

export async function getFoodLogsApi(date: string): Promise<IFoodLog[]> {
  const res = await apiClient.get('/api/food/logs', { params: { date } });
  return res.data.data as IFoodLog[];
}

export async function searchFoodItemsApi(q: string): Promise<IFoodItem[]> {
  const res = await apiClient.get('/api/food/items', { params: { q } });
  return res.data.data as IFoodItem[];
}

export async function deleteFoodLogApi(logId: string): Promise<void> {
  await apiClient.delete(`/api/food/logs/${logId}`);
}
