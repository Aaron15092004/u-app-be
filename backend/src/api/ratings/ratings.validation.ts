import { z } from 'zod';

export const ratingTriggerSchema = z.enum(['food_scan', 'barcode_scan', 'workout_complete', 'bmi_result', 'profile']);
export const ratingPlatformSchema = z.enum(['ios', 'android', 'web']);

export const submitAppRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  trigger: ratingTriggerSchema,
  appVersion: z.string().trim().max(50).optional(),
  platform: ratingPlatformSchema,
  deviceInfo: z.record(z.string(), z.string()).optional(),
  storeReviewPrompted: z.boolean().optional(),
});

export const feedbackPromptStatusSchema = z.object({
  promptKey: z.literal('app_rating'),
  status: z.enum(['eligible', 'dismissed', 'submitted', 'cooldown']),
  cooldownUntil: z.string().datetime().nullable(),
  triggerCounts: z.record(z.string(), z.number().int().min(0)).default({}),
});

export type SubmitAppRatingInput = z.infer<typeof submitAppRatingSchema>;
