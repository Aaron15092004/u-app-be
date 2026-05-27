import { z } from 'zod';

// Strict whitelist — rejects role, email, passwordHash, etc. (mass assignment defence)
// Only explicitly listed fields can be updated via PATCH /api/users/profile.

export const updateProfileSchema = z
  .object({
    name: z.string().min(1, 'Tên không được để trống').max(80).optional(),
    heightCm: z.number().min(80, 'Chiều cao không hợp lệ').max(250).optional(),
    weightKg: z.number().min(20, 'Cân nặng không hợp lệ').max(300).optional(),
    goalType: z.enum(['lose', 'maintain', 'gain']).optional(),
    waterGoal: z
      .number()
      .int('Số ly phải là số nguyên')
      .min(1, 'Số ly tối thiểu là 1')
      .max(20, 'Số ly tối đa là 20')
      .optional(),
    age: z.number().int().min(10, 'Tuổi không hợp lệ').max(120, 'Tuổi không hợp lệ').optional(),
  })
  .strict();

export const updateNotificationsSchema = z
  .object({
    waterReminder: z.boolean().optional(),
    workoutReminder: z.boolean().optional(),
    waterReminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ không hợp lệ (HH:MM)')
      .optional(),
    workoutReminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ không hợp lệ (HH:MM)')
      .optional(),
  })
  .strict();
