import { Request, Response } from 'express';
import { updateProfileSchema, updateNotificationsSchema } from './users.validation';
import { deleteUserAccount, getProfileStats, updateUserProfile, updateUserNotifications } from './users.service';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const stats = await getProfileStats(userId);
    success(res, stats);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateProfileSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;

  try {
    const user = await updateUserProfile(userId, parseResult.data);
    success(res, user);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

export const updateNotifications = async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateNotificationsSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;

  try {
    const notifications = await updateUserNotifications(userId, parseResult.data);
    success(res, notifications);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};

export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    await deleteUserAccount(userId);
    res.status(204).end();
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
