import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import * as service from './workout-sessions.service';

export async function getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const session = await service.getActiveSession(userId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const { programId, dayNumber, dayTitle, exercises } = req.body as {
      programId?: string;
      dayNumber?: number;
      dayTitle: string;
      exercises: service.CreateSessionInput['exercises'];
    };

    if (!dayTitle || typeof dayTitle !== 'string') {
      res.status(400).json({ message: 'dayTitle là bắt buộc' });
      return;
    }
    if (!Array.isArray(exercises)) {
      res.status(400).json({ message: 'exercises phải là mảng' });
      return;
    }

    const session = await service.createSession(userId, {
      programId,
      dayNumber,
      dayTitle,
      exercises,
    });

    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const sessionId = String(req.params.id);
    const { totalDurationSeconds } = req.body as { totalDurationSeconds: number };

    if (typeof totalDurationSeconds !== 'number' || totalDurationSeconds < 0) {
      res.status(400).json({ message: 'totalDurationSeconds phải là số không âm' });
      return;
    }

    const session = await service.completeSession(userId, sessionId, totalDurationSeconds);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
}

export async function abandon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const sessionId = String(req.params.id);
    const session = await service.abandonSession(userId, sessionId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
}

export async function getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.id;
    const streak = await service.getStreak(userId);
    res.json({ data: streak });
  } catch (err) {
    next(err);
  }
}
