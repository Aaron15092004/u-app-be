import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { error, success } from '../../utils/response';
import { getMilkPageContent, updateMilkPageContent } from '../config/app-content.service';
import { updateMilkPageContentSchema } from '../config/app-content.validation';

export const getMilkPageAdmin = async (_req: Request, res: Response): Promise<void> => {
  const content = await getMilkPageContent();
  success(res, content);
};

export const updateMilkPageAdmin = async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateMilkPageContentSchema.safeParse(req.body);
  if (!parseResult.success) {
    error(res, parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le', 400);
    return;
  }

  const adminId = (req as AuthRequest).user.id;
  const content = await updateMilkPageContent(parseResult.data, adminId);
  success(res, content);
};
