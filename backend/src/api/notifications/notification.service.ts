import { registerDeviceToken } from '../../services/fcm.service';

export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  await registerDeviceToken(userId, token, platform);
}
