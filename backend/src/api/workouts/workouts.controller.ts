import { Request, Response } from 'express';
import * as workoutsService from './workouts.service';
import { createWorkoutLogSchema } from './workouts.validation';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function createWorkoutLog(req: Request, res: Response): Promise<void> {
  const parsed = createWorkoutLogSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  // SECURITY: userId MUST come from JWT (AuthRequest), never from req.body
  const userId = (req as AuthRequest).user.id;
  const log = await workoutsService.createWorkoutLog(userId, parsed.data);
  success(res, log, 201);
}

export async function getWeeklyStats(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const result = await workoutsService.getWeeklyStats(userId);
  success(res, result);
}
