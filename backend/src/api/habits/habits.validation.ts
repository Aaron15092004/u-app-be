import { z } from 'zod';

export const HABIT_IDS = ['water', 'vegetables', 'exercise', 'sleep', 'reading', 'nut-milk'] as const;
export type HabitId = typeof HABIT_IDS[number];

export const checkInSchema = z.object({
  habitId: z.enum(HABIT_IDS, { errorMap: () => ({ message: 'Thói quen không hợp lệ' }) }),
}).strict();
