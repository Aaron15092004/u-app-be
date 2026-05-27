import type { Request, Response, NextFunction } from 'express';
import * as service from './workout-programs-admin.service';

export async function listPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const programs = await service.adminListPrograms();
    res.json({ data: programs });
  } catch (err) {
    next(err);
  }
}

export async function createProgram(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const program = await service.adminCreateProgram(req.body);
    res.status(201).json({ data: program });
  } catch (err) {
    next(err);
  }
}

export async function updateProgram(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const program = await service.adminUpdateProgram(String(req.params.id), req.body);
    res.json({ data: program });
  } catch (err) {
    next(err);
  }
}

export async function deleteProgram(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.adminDeleteProgram(String(req.params.id));
    res.json({ data: { message: 'Xóa chương trình thành công' } });
  } catch (err) {
    next(err);
  }
}

export async function uploadProgramImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Không có file ảnh được tải lên' });
      return;
    }
    const url = await service.adminUploadProgramImage(String(req.params.id), req.file.buffer);
    res.json({ data: { url } });
  } catch (err) {
    next(err);
  }
}
