import { z } from 'zod';

// ---- Exercise ----

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Tên bài tập không được để trống').max(200),
  nameEn: z.string().max(200).optional(),
  category: z.enum(['yoga', 'cardio', 'weights', 'stretching'], {
    errorMap: () => ({ message: 'Danh mục không hợp lệ' }),
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Mức độ không hợp lệ' }),
  }),
  durationMinutes: z.number({ invalid_type_error: 'Thời gian phải là số' }).min(1).max(300),
  caloriesBurned: z.number({ invalid_type_error: 'Calo phải là số' }).min(0).max(5000),
  imageUrl: z.string().url('URL ảnh không hợp lệ').nullable().optional(),
  description: z.string().max(2000).optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1),
        instruction: z.string().min(1).max(500),
        durationSeconds: z.number().int().min(0).optional(),
      }),
    )
    .default([]),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const exerciseIdParamSchema = z.object({
  id: z.string().length(24, 'ID không hợp lệ'),
});

// ---- Food Item ----

export const createFoodItemSchema = z.object({
  name: z.string().min(1, 'Tên món ăn không được để trống').max(200),
  nameEn: z.string().max(200).optional(),
  kcalPer100g: z.number({ invalid_type_error: 'Calo phải là số' }).min(0).max(10000),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  sugar: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  vitaminC: z.number().min(0).default(0),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').nullable().optional(),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

export const foodItemIdParamSchema = z.object({
  id: z.string().length(24, 'ID không hợp lệ'),
});

// ---- Users ----

export const userIdParamSchema = z.object({
  id: z.string().length(24, 'ID không hợp lệ'),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
});
