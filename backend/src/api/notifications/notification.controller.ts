import { Request, Response } from 'express';
import * as notificationService from './notification.service';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function registerToken(req: Request, res: Response): Promise<void> {
  const { token, platform } = req.body as { token?: string; platform?: string };

  if (!token || !platform) {
    error(res, 'token and platform are required', 400);
    return;
  }

  if (platform !== 'ios' && platform !== 'android') {
    error(res, 'platform must be ios or android', 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;
  await notificationService.saveDeviceToken(userId, token, platform);

  success(res, { registered: true });
}
