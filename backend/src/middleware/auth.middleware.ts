import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { error } from '../utils/response';
import User from '../models/User';

export interface AuthRequest extends Request {
  user: { id: string; role: 'user' | 'admin' };
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('isActive');
    if (!user || user.isActive === false) {
      error(res, 'Tài khoản đã bị khóa', 401);
      return;
    }
    (req as AuthRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
}

export async function requireProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req as AuthRequest).user?.id;

  if (!userId) {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    return;
  }

  const user = await User.findById(userId).select('profileCompleted');

  if (!user || user.profileCompleted !== true) {
    error(res, 'Vui lòng hoàn thiện hồ sơ', 403);
    return;
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'admin') {
    error(res, 'Chỉ quản trị viên mới có quyền truy cập', 403);
    return;
  }
  next();
}
