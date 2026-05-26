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
        vitamins: z.record(z.string(), z.number()).optional().default({}),
        minerals: z.record(z.string(), z.number()).optional().default({}),
        tags: z.array(z.string()).optional().default([]),
        source: z.enum(['ai_scan', 'barcode', 'manual']).optional(),
        barcode: z.string().regex(/^\d{6,18}$/).optional(),
        provenance: z.record(z.string(), z.unknown()).optional().default({}),
      }),
    )
    .min(1, 'Phải có ít nhất 1 món ăn'),
  totals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0).default(0),
    carbs: z.number().min(0).default(0),
    fat: z.number().min(0).default(0),
  }),
  aiProvider: z.enum(['gemini', 'logmeal', 'manual']),
  imageUrl: z.string().nullable().optional(),
});

export const searchItemsSchema = z.object({
  q: z.string().min(2, 'Từ khóa phải có ít nhất 2 ký tự').max(100),
});

export const barcodeParamSchema = z.object({
  barcode: z.string().regex(/^\d{6,18}$/, 'Ma vach khong hop le'),
});

export const barcodeSaveMinimumNutritionSchema = z.object({
  name: z.string().trim().min(1, 'Ten san pham la bat buoc'),
  calories: z.number().min(0, 'Nang luong khong hop le'),
  protein: z.number().min(0, 'Protein khong hop le'),
  carbs: z.number().min(0, 'Carbs khong hop le'),
  fat: z.number().min(0, 'Fat khong hop le'),
});

export const getFoodLogsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});

export const getFoodLogsRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});
