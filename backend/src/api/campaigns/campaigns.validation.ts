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
