import { Request, Response, NextFunction } from 'express';
import config from '../config';

interface MongooseValidationError extends Error {
  name: 'ValidationError';
  message: string;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err);

  if ((err as MongooseValidationError).name === 'ValidationError') {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if ((err as MongoDuplicateKeyError).code === 11000) {
    res.status(409).json({ success: false, error: 'Resource already exists' });
    return;
  }

  if (config.NODE_ENV === 'production') {
    res.status(500).json({ success: false, error: 'Internal server error' });
  } else {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
}
