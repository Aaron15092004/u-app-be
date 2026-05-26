import { z } from 'zod';

export const redeemCampaignCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Ma kich hoat phai co it nhat 6 ky tu')
    .max(64, 'Ma kich hoat khong duoc vuot qua 64 ky tu')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Ma kich hoat chi duoc gom chu, so, dau cach va dau gach ngang'),
  source: z.enum(['manual', 'qr']).default('manual'),
});

export const campaignStatusSchema = z.enum(['draft', 'active', 'paused', 'ended', 'revoked']);

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, 'Ten campaign la bat buoc').max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  status: campaignStatusSchema.default('draft'),
  startsAt: z.string().datetime('Ngay bat dau khong hop le'),
  endsAt: z.string().datetime('Ngay ket thuc khong hop le'),
  entitlementDurationDays: z.number().int().min(1).max(365),
  highQuotaDailyLimit: z.number().int().min(1).max(500).default(30),
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
  message: 'Ngay ket thuc phai sau ngay bat dau',
  path: ['endsAt'],
});

export const listCampaignsSchema = z.object({
  status: campaignStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const generateCampaignCodesSchema = z.object({
  quantity: z.number().int().min(1).max(5000),
  batchLabel: z.string().trim().min(1).max(80).optional(),
  codeLength: z.number().int().min(8).max(24).default(12),
  codeExpiresAt: z.string().datetime('Ngay het han ma khong hop le').nullable().optional(),
  redeemBaseUrl: z.string().url('Redeem URL khong hop le').optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Campaign id khong hop le'),
});

export const codeIdParamSchema = z.object({
  codeId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Ma id khong hop le'),
});

export const listCampaignCodesSchema = z.object({
  status: z.enum(['unused', 'redeemed', 'revoked', 'expired']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const entitlementQuotaPolicySchema = z.object({
  mode: z.literal('high_daily_quota'),
  dailyLimit: z.number().int().positive(),
});

export const scanEntitlementStatusSchema = z.object({
  hasActiveEntitlement: z.boolean(),
  activeUntil: z.string().datetime().nullable(),
  quotaPolicy: entitlementQuotaPolicySchema.nullable(),
});

export type RedeemCampaignCodeInput = z.infer<typeof redeemCampaignCodeSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type GenerateCampaignCodesInput = z.infer<typeof generateCampaignCodesSchema>;
