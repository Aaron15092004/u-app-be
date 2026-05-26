import { Request, Response } from 'express';
import { error } from '../../utils/response';
import {
  createMediaAssetUploadSchema,
  listMediaAssetsSchema,
  updateMediaAssetSchema,
} from './media-assets.validation';

export const listMediaAssets = async (req: Request, res: Response): Promise<void> => {
  const parseResult = listMediaAssetsSchema.safeParse(req.query);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang danh sach media asset se duoc trien khai o Phase 5', 501);
};

export const createMediaAssetUpload = async (req: Request, res: Response): Promise<void> => {
  const parseResult = createMediaAssetUploadSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang upload media asset se duoc trien khai o Phase 5', 501);
};

export const updateMediaAsset = async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateMediaAssetSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  error(res, 'Tinh nang cap nhat media asset se duoc trien khai o Phase 5', 501);
};

export const deleteMediaAsset = async (_req: Request, res: Response): Promise<void> => {
  error(res, 'Tinh nang xoa media asset se duoc trien khai o Phase 5', 501);
};
