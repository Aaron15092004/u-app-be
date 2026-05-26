import { z } from 'zod';

export const ratingTriggerSchema = z.enum([
  'food_scan_saved',
  'workout_completed',
  'habit_streak',
  'profile_prompt',
  'manual',
]);
export const ratingPlatformSchema = z.enum(['ios', 'android', 'web', 'unknown']);

export const submitAppRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  trigger: ratingTriggerSchema,
  appVersion: z.string().trim().max(50).optional(),
  platform: ratingPlatformSchema,
  deviceInfo: z.record(z.string(), z.unknown()).optional(),
  storeReviewRequested: z.boolean().optional(),
});

export const feedbackPromptStatusSchema = z.object({
  promptKey: z.literal('app_rating'),
  status: z.enum(['eligible', 'dismissed', 'submitted', 'cooldown']),
  cooldownUntil: z.string().datetime().nullable(),
  triggerCounts: z.record(z.string(), z.number().int().min(0)).default({}),
});

export const listRatingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmitAppRatingInput = z.infer<typeof submitAppRatingSchema>;
export type ListRatingsInput = z.infer<typeof listRatingsSchema>;
