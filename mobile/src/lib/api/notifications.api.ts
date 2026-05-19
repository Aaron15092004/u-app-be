import apiClient from './client';

export async function registerTokenApi(token: string, platform: 'ios' | 'android'): Promise<void> {
  await apiClient.post('/api/notifications/register-token', { token, platform });
}
