import { Router, Request, Response } from 'express';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadImage } from '../../services/cloudinary.service';
import { success, error } from '../../utils/response';

// TODO: remove this test route before production deployment
const router = Router();

router.post('/', uploadSingle, async (req: Request, res: Response) => {
  if (!req.file) {
    error(res, 'No image provided', 400);
    return;
  }

  const result = await uploadImage(req.file.buffer, { folder: 'u-app/test' });
  success(res, { imageUrl: result.url });
});

export default router;
