import admin from 'firebase-admin';
import DeviceToken from '../models/DeviceToken';

export async function sendNotificationToUser(
  userId: string,
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  const tokens = await DeviceToken.find({ userId });

  for (const deviceToken of tokens) {
    try {
      await admin.messaging().send({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        token: deviceToken.token,
      });
    } catch (err) {
      console.error(`FCM send failed for token ${deviceToken.token}:`, err);
    }
  }
}

export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  await DeviceToken.findOneAndUpdate(
    { token },
    { userId, token, platform, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
