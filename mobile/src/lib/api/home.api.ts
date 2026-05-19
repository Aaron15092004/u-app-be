import apiClient from './client';
import type { ITodaySummary } from './types';

export async function getTodaySummaryApi(): Promise<ITodaySummary> {
  const res = await apiClient.get<{ success: boolean; data: ITodaySummary }>(
    '/api/home/today-summary',
  );
  return res.data.data;
}

export async function getShopUrlApi(): Promise<{ url: string }> {
  const res = await apiClient.get<{ success: boolean; data: { url: string } }>(
    '/api/config/shop-url',
  );
  return res.data.data;
}
