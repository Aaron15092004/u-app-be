import { z } from 'zod';

export const saveFoodLogSchema = z.object({
  foods: z
    .array(
      z.object({
        name: z.string().min(1),
        weightG: z.number().optional(),
        calories: z.number().min(0),
        protein: z.number().min(0).default(0),
        carbs: z.number().min(0).default(0),
        fat: z.number().min(0).default(0),
        fiber: z.number().min(0).default(0),
        sugar: z.number().min(0).default(0),
        sodium: z.number().min(0).default(0),
        vitaminC: z.number().min(0).default(0),
      }),
    )
    .min(1, 'Phải có ít nhất 1 món ăn'),
  totals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0).default(0),
    carbs: z.number().min(0).default(0),
    fat: z.number().min(0).default(0),
  }),
  aiProvider: z.enum(['openai', 'logmeal', 'manual']),
  imageUrl: z.string().nullable().optional(),
});

export const searchItemsSchema = z.object({
  q: z.string().min(2, 'Từ khóa phải có ít nhất 2 ký tự').max(100),
});

export const getFoodLogsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});
