import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import * as adminService from './admin.service';
import {
  createExerciseSchema,
  updateExerciseSchema,
  exerciseIdParamSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  foodItemIdParamSchema,
  userIdParamSchema,
  listQuerySchema,
} from './admin.validation';

// ---- Dashboard Stats ----

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();
    success(res, stats);
  } catch (err: unknown) {
    const e = err as { message?: string };
    error(res, e.message ?? 'Lỗi server', 500);
  }
}

// ---- Upload ----

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    error(res, 'Vui lòng chọn ảnh', 400);
    return;
  }

  const allowedFolders = new Set(['exercises', 'food-items', 'programs', 'nut-milk', 'app-download']);
  const requestedFolder = String(req.query.folder ?? 'exercises');
  const folder = allowedFolders.has(requestedFolder) ? requestedFolder : 'exercises';

  try {
    const result = await adminService.uploadAdminImage(
      req.file.buffer,
      folder as 'exercises' | 'food-items' | 'programs' | 'nut-milk' | 'app-download',
    );
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { message?: string };
    error(res, e.message ?? 'Lỗi upload ảnh', 500);
  }
}

// ---- Exercises ----

export async function listExercises(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const result = await adminService.listExercises(
      parsed.data.page,
      parsed.data.limit,
      parsed.data.search,
    );
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function createExercise(req: Request, res: Response): Promise<void> {
  const parsed = createExerciseSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const exercise = await adminService.createExercise(parsed.data);
    success(res, exercise, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function updateExercise(req: Request, res: Response): Promise<void> {
  const paramParsed = exerciseIdParamSchema.safeParse(req.params);
  if (!paramParsed.success) {
    error(res, paramParsed.error.errors[0].message, 400);
    return;
  }

  const bodyParsed = updateExerciseSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    error(res, bodyParsed.error.errors[0].message, 400);
    return;
  }

  try {
    const exercise = await adminService.updateExercise(paramParsed.data.id, bodyParsed.data);
    success(res, exercise);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function deleteExercise(req: Request, res: Response): Promise<void> {
  const parsed = exerciseIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    await adminService.deleteExercise(parsed.data.id);
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

// ---- Food Items ----

export async function listFoodItems(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const result = await adminService.listFoodItems(
      parsed.data.page,
      parsed.data.limit,
      parsed.data.search,
    );
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function createFoodItem(req: Request, res: Response): Promise<void> {
  const parsed = createFoodItemSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const item = await adminService.createFoodItem(parsed.data);
    success(res, item, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function updateFoodItem(req: Request, res: Response): Promise<void> {
  const paramParsed = foodItemIdParamSchema.safeParse(req.params);
  if (!paramParsed.success) {
    error(res, paramParsed.error.errors[0].message, 400);
    return;
  }

  const bodyParsed = updateFoodItemSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    error(res, bodyParsed.error.errors[0].message, 400);
    return;
  }

  try {
    const item = await adminService.updateFoodItem(paramParsed.data.id, bodyParsed.data);
    success(res, item);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function deleteFoodItem(req: Request, res: Response): Promise<void> {
  const parsed = foodItemIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    await adminService.deleteFoodItem(parsed.data.id);
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

// ---- Users ----

export async function listUsers(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const result = await adminService.listUsers(
      parsed.data.page,
      parsed.data.limit,
      parsed.data.search,
    );
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function banUser(req: Request, res: Response): Promise<void> {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const requesterId = (req as AuthRequest).user.id;

  try {
    const result = await adminService.banUser(parsed.data.id, requesterId);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const parsed = userIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const requesterId = (req as AuthRequest).user.id;

  try {
    await adminService.deleteUser(parsed.data.id, requesterId);
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}
