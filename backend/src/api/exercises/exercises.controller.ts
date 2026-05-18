import { Request, Response } from 'express';
import * as exercisesService from './exercises.service';
import { listQuerySchema, exerciseIdParamSchema } from './exercises.validation';
import { success, error } from '../../utils/response';

export async function list(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const exercises = await exercisesService.listExercises(parsed.data.category);
  success(res, exercises);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const parsed = exerciseIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const exercise = await exercisesService.getExerciseById(parsed.data.id);
  success(res, exercise);
}
