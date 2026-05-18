import { Request, Response } from 'express';
import * as habitsService from './habits.service';
import { checkInSchema } from './habits.validation';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function checkIn(req: Request, res: Response): Promise<void> {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;
  const result = await habitsService.checkInHabit(userId, parsed.data.habitId);
  success(res, result, 200);
}

export async function getToday(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const result = await habitsService.getTodayHabits(userId);
  success(res, result, 200);
}

export async function getWeekly(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const result = await habitsService.getWeeklyHeatmap(userId);
  success(res, result, 200);
}

export async function getStreak(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const result = await habitsService.getStreak(userId);
  success(res, result, 200);
}
