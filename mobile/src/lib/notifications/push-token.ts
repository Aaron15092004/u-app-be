import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AxiosInstance } from 'axios';

export async function registerPushToken(
  apiClient: AxiosInstance
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId });

    await apiClient.post('/api/notifications/register-token', {
      token: expoPushToken.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    return { success: true, token: expoPushToken.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('Push token registration failed (non-blocking):', message);
    return { success: false, error: message };
  }
}
