import { z } from 'zod';

export const listQuerySchema = z.object({
  category: z.enum(['yoga', 'cardio', 'weights', 'stretching'], {
    errorMap: () => ({ message: 'Danh mục không hợp lệ' }),
  }).optional(),
});

export const exerciseIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID bài tập không hợp lệ'),
});
