import { z } from 'zod';
import { NUT_MILK_FLAVORS } from '../recommendations/nut-milk.rules';

const nullableUrlSchema = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' ? null : value));

const milkImageShape = Object.fromEntries(
  NUT_MILK_FLAVORS.map((flavor) => [flavor.flavorId, nullableUrlSchema]),
) as Record<string, typeof nullableUrlSchema>;

export const updateMilkPageContentSchema = z.object({
  milkImages: z.object(milkImageShape).partial().optional(),
  download: z
    .object({
      appStoreUrl: nullableUrlSchema,
      playStoreUrl: nullableUrlSchema,
      appStoreQrUrl: nullableUrlSchema,
      playStoreQrUrl: nullableUrlSchema,
      headlineVi: z.string().trim().max(120).nullable().optional(),
      copyVi: z.string().trim().max(500).nullable().optional(),
    })
    .partial()
    .optional(),
});

export type UpdateMilkPageContentInput = z.infer<typeof updateMilkPageContentSchema>;
