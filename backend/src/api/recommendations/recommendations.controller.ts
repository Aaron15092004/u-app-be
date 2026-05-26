import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { getNutMilkRules, saveNutMilkSelection } from './recommendations.service';
import { getNutMilkRecommendationsSchema, selectNutMilkFlavorSchema } from './recommendations.validation';

export const getNutMilkRecommendations = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parseResult = getNutMilkRecommendationsSchema.safeParse({
    bmi: req.query.bmi,
    stressOrSleep: req.query.stressOrSleep,
    energyOrMemory: req.query.energyOrMemory,
  });

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await getNutMilkRules(userId, parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay goi y sua U', e.statusCode ?? 500);
  }
};

export const selectNutMilkFlavor = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parseResult = selectNutMilkFlavorSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await saveNutMilkSelection(userId, parseResult.data);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi luu lua chon sua U', e.statusCode ?? 500);
  }
};
