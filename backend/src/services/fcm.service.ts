import admin from 'firebase-admin';
import mongoose from 'mongoose';
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

export async function sendBatchNotificationToUsers(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  if (userIds.length === 0) return;

  const objIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const tokens = await DeviceToken.find({ userId: { $in: objIds } }).lean();

  await Promise.allSettled(
    tokens.map((t) =>
      admin
        .messaging()
        .send({
          notification: { title: notification.title, body: notification.body },
          data: notification.data,
          token: t.token,
        })
        .catch((err) => console.error(`FCM batch fail for token ${t.token}:`, err))
    )
  );
}
