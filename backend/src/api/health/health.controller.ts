import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HealthCheckLog from '../../models/HealthCheckLog';
import { success, error } from '../../utils/response';
import config from '../../config';

export async function check(req: Request, res: Response): Promise<void> {
  let dbWrite = false;

  try {
    const doc = new HealthCheckLog({ checkedAt: new Date(), host: 'health' });
    await doc.save();
    await HealthCheckLog.findById(doc._id);
    await HealthCheckLog.deleteOne({ _id: doc._id });
    dbWrite = true;
  } catch (err) {
    console.error('Health DB write check failed:', err);
    dbWrite = false;
  }

  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected && !dbWrite) {
    error(res, 'Database not connected', 503);
    return;
  }

  success(res, {
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    dbWrite,
    version: process.env.npm_package_version ?? '1.0.0',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
