import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './workout-programs.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.seedDefaultsIfEmpty();
    const rawLevel = req.query.level;
    const level =
      typeof rawLevel === 'string'
        ? rawLevel
        : Array.isArray(rawLevel)
          ? String(rawLevel[0])
          : undefined;
    const userId = (req as AuthRequest).user?.id;
    const programs = await service.listProgramsWithDayCount(level, userId);
    res.json({ data: programs });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.id;
    const program = await service.getProgramById(String(req.params.id), userId);
    if (!program) {
      res.status(404).json({ message: 'Chương trình không tìm thấy' });
      return;
    }
    res.json({ data: program });
  } catch (err) {
    next(err);
  }
}

export async function startProgram(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const programId = String(req.params.id);
    const progress = await service.startProgram(userId, programId);
    res.status(201).json({ data: progress });
  } catch (err) {
    next(err);
  }
}
