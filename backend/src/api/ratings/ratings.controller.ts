import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { dismissRatingPromptSchema, listRatingsSchema, submitAppRatingSchema } from './ratings.validation';
import {
  dismissPrompt,
  getPromptStatus,
  getRatingsDashboard,
  listRatings,
  submitRating,
} from './ratings.service';

export const getRatingPromptStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const result = await getPromptStatus(userId);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay trang thai danh gia', e.statusCode ?? 500);
  }
};

export const dismissRatingPrompt = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parseResult = dismissRatingPromptSchema.safeParse(req.body ?? {});
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await dismissPrompt(userId, parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi an nhac danh gia', e.statusCode ?? 500);
  }
};

export const submitAppRating = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parseResult = submitAppRatingSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await submitRating(userId, parseResult.data);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi gui danh gia', e.statusCode ?? 500);
  }
};

export const listAppRatings = async (req: Request, res: Response): Promise<void> => {
  const parseResult = listRatingsSchema.safeParse(req.query);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await listRatings(parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay danh sach danh gia', e.statusCode ?? 500);
  }
};

export const getRatingsDashboardHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getRatingsDashboard();
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay thong ke danh gia', e.statusCode ?? 500);
  }
};
