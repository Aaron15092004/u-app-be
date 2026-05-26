import { Request, Response } from 'express';
import { success, error } from '../../utils/response';
import { submitAppRatingSchema } from './ratings.validation';

export const getRatingPromptStatus = async (_req: Request, res: Response): Promise<void> => {
  success(res, {
    promptKey: 'app_rating',
    status: 'eligible',
    cooldownUntil: null,
    triggerCounts: {},
    message: 'Luon prompt se duoc trien khai o Phase 6',
  });
};

export const submitAppRating = async (req: Request, res: Response): Promise<void> => {
  const parseResult = submitAppRatingSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang gui danh gia se duoc trien khai o Phase 6', 501);
};
