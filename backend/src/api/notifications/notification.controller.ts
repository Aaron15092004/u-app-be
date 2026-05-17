import { Request, Response } from 'express';
import * as notificationService from './notification.service';
import { success, error } from '../../utils/response';

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

  // TODO Phase 2: replace 'phase1-test-user' with req.user.id from JWT middleware
  await notificationService.saveDeviceToken('phase1-test-user', token, platform);

  success(res, { registered: true });
}
