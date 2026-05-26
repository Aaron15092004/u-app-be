import { Request, Response } from 'express';
import { success, error } from '../../utils/response';
import { redeemCampaignCodeSchema } from './campaigns.validation';

export const redeemCampaignCode = async (req: Request, res: Response): Promise<void> => {
  const parseResult = redeemCampaignCodeSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang kich hoat ma se duoc trien khai o Phase 2', 501);
};

export const getMyScanEntitlements = async (_req: Request, res: Response): Promise<void> => {
  success(res, {
    hasActiveEntitlement: false,
    activeUntil: null,
    quotaPolicy: null,
    message: 'Trang thai quyen quet se duoc trien khai o Phase 2',
  });
};
