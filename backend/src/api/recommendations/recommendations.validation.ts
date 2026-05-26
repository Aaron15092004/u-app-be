import { z } from 'zod';
import { NUT_MILK_FLAVORS } from './nut-milk.rules';

export const nutMilkNeedSignalsSchema = z
  .object({
    stressOrSleep: z.boolean().optional(),
    energyOrMemory: z.boolean().optional(),
  })
  .strict();

export const getNutMilkRecommendationsSchema = z.object({
  bmi: z.coerce.number().positive().max(80).optional(),
  stressOrSleep: z.coerce.boolean().optional(),
  energyOrMemory: z.coerce.boolean().optional(),
});

export const selectNutMilkFlavorSchema = z.object({
  selectedFlavorId: z.enum(NUT_MILK_FLAVORS.map((flavor) => flavor.flavorId) as [string, ...string[]]),
  recommendedFlavorId: z.enum(NUT_MILK_FLAVORS.map((flavor) => flavor.flavorId) as [string, ...string[]]).optional(),
  bmi: z.number().positive().max(80).optional(),
  signals: nutMilkNeedSignalsSchema.optional(),
  source: z.enum(['bmi_recommendation', 'manual_profile']).default('bmi_recommendation'),
});

export type SelectNutMilkFlavorInput = z.infer<typeof selectNutMilkFlavorSchema>;
