import { Router } from 'express';
import {
  applyExactMediaMatches,
  createMediaAssetBatch,
  createMediaAssetUpload,
  deleteMediaAsset,
  listExercisesMissingImages,
  listMediaAssets,
  previewMediaFilenameMatches,
  updateMediaAsset,
} from './media-assets.controller';

const router = Router();

router.get('/', listMediaAssets);
router.get('/missing-exercises', listExercisesMissingImages);
router.post('/upload', createMediaAssetUpload);
router.post('/batch', createMediaAssetBatch);
router.post('/match', previewMediaFilenameMatches);
router.post('/apply-exact', applyExactMediaMatches);
router.patch('/:id', updateMediaAsset);
router.delete('/:id', deleteMediaAsset);

export default router;
