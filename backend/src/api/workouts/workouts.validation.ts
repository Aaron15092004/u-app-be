import { z } from 'zod';

export const createWorkoutLogSchema = z.object({
  exerciseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID bài tập không hợp lệ').optional(),
  exerciseName: z.string().min(1, 'Tên bài tập là bắt buộc').max(200),
  durationMinutes: z.number().int('Phải là số nguyên').positive('Thời gian phải > 0').max(600),
  caloriesBurned: z.number().int().nonnegative().max(10000),
  completedAt: z.string().datetime({ message: 'Thời điểm hoàn thành không hợp lệ' }),
}).strict();
// NOTE: NO userId field — userId comes from JWT, never body
