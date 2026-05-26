import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import {
  campaignIdParamSchema,
  codeIdParamSchema,
  createCampaignSchema,
  generateCampaignCodesSchema,
  listCampaignCodesSchema,
  listCampaignsSchema,
  redeemCampaignCodeSchema,
} from './campaigns.validation';
import {
  createCampaign,
  generateCampaignCodes,
  getMyScanEntitlements as getMyScanEntitlementsService,
  listCampaignCodes,
  listCampaigns,
  redeemCampaignCode as redeemCampaignCodeService,
  revokeCampaign,
  revokeCode,
} from './campaigns.service';

export const redeemCampaignCode = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parseResult = redeemCampaignCodeSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await redeemCampaignCodeService(userId, parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi kich hoat ma', e.statusCode ?? 500);
  }
};

export const getMyScanEntitlements = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  try {
    const result = await getMyScanEntitlementsService(userId);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay trang thai goi quet', e.statusCode ?? 500);
  }
};

export const createCampaignHandler = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as AuthRequest).user.id;
  const parseResult = createCampaignSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await createCampaign(parseResult.data, adminId);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi tao campaign', e.statusCode ?? 500);
  }
};

export const listCampaignsHandler = async (req: Request, res: Response): Promise<void> => {
  const parseResult = listCampaignsSchema.safeParse(req.query);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await listCampaigns(parseResult.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay campaign', e.statusCode ?? 500);
  }
};

export const generateCampaignCodesHandler = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as AuthRequest).user.id;
  const params = campaignIdParamSchema.safeParse({ id: String(req.params.id ?? '') });
  const body = generateCampaignCodesSchema.safeParse(req.body);
  if (!params.success || !body.success) {
    const firstError = !params.success
      ? params.error.errors[0]?.message
      : !body.success
        ? body.error.errors[0]?.message
        : undefined;
    error(res, firstError ?? 'Du lieu khong hop le', 400);
    return;
  }

  try {
    const result = await generateCampaignCodes(params.data.id, body.data, adminId);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi tao ma campaign', e.statusCode ?? 500);
  }
};

export const listCampaignCodesHandler = async (req: Request, res: Response): Promise<void> => {
  const params = campaignIdParamSchema.safeParse({ id: String(req.params.id ?? '') });
  const query = listCampaignCodesSchema.safeParse(req.query);
  if (!params.success || !query.success) {
    const firstError = !params.success
      ? params.error.errors[0]?.message
      : !query.success
        ? query.error.errors[0]?.message
        : undefined;
    error(res, firstError ?? 'Du lieu khong hop le', 400);
    return;
  }

  try {
    const result = await listCampaignCodes(params.data.id, query.data);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi lay danh sach ma', e.statusCode ?? 500);
  }
};

export const revokeCampaignHandler = async (req: Request, res: Response): Promise<void> => {
  const params = campaignIdParamSchema.safeParse({ id: String(req.params.id ?? '') });
  if (!params.success) {
    error(res, params.error.errors[0]?.message ?? 'Du lieu khong hop le', 400);
    return;
  }

  try {
    const result = await revokeCampaign(params.data.id);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi thu hoi campaign', e.statusCode ?? 500);
  }
};

export const revokeCodeHandler = async (req: Request, res: Response): Promise<void> => {
  const params = codeIdParamSchema.safeParse({ codeId: String(req.params.codeId ?? '') });
  if (!params.success) {
    error(res, params.error.errors[0]?.message ?? 'Du lieu khong hop le', 400);
    return;
  }

  try {
    const result = await revokeCode(params.data.codeId);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Loi thu hoi ma', e.statusCode ?? 500);
  }
};

export const exportCampaignCodesCsvHandler = async (_req: Request, res: Response): Promise<void> => {
  error(
    res,
    'CSV co raw code chi duoc xuat ngay sau khi tao batch de dam bao bao mat',
    410,
  );
};
