import { Router } from 'express';
import {
  createMediaAssetUpload,
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAsset,
} from './media-assets.controller';

const router = Router();

router.get('/', listMediaAssets);
router.post('/upload', createMediaAssetUpload);
router.patch('/:id', updateMediaAsset);
router.delete('/:id', deleteMediaAsset);

export default router;
