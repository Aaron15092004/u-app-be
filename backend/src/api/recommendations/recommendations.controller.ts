import { Request, Response } from 'express';
import { success, error } from '../../utils/response';
import { getNutMilkRules } from './recommendations.service';
import { getNutMilkRecommendationsSchema, selectNutMilkFlavorSchema } from './recommendations.validation';

export const getNutMilkRecommendations = async (req: Request, res: Response): Promise<void> => {
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

  success(res, getNutMilkRules(parseResult.data));
};

export const selectNutMilkFlavor = async (req: Request, res: Response): Promise<void> => {
  const parseResult = selectNutMilkFlavorSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang luu lua chon sua U se duoc trien khai o Phase 4', 501);
};
