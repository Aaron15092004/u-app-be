import { z } from 'zod';

export const mediaAssetStatusSchema = z.enum(['uploaded', 'assigned', 'orphaned', 'deleted']);
export const mediaAssetSourceSchema = z.enum(['admin_upload', 'bulk_import', 'cloudinary_existing']);

export const listMediaAssetsSchema = z.object({
  status: mediaAssetStatusSchema.optional(),
  source: mediaAssetSourceSchema.optional(),
  batchId: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createMediaAssetUploadSchema = z.object({
  source: mediaAssetSourceSchema.default('admin_upload'),
  batchId: z.string().trim().min(1).max(120).optional(),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  cloudinaryPublicId: z.string().trim().min(1).max(255).optional(),
  url: z.string().url().optional(),
});

export const updateMediaAssetSchema = z.object({
  status: mediaAssetStatusSchema.optional(),
  assignedExerciseId: z.string().trim().min(1).optional(),
  altText: z.string().trim().max(255).optional(),
});

export type ListMediaAssetsInput = z.infer<typeof listMediaAssetsSchema>;
export type CreateMediaAssetUploadInput = z.infer<typeof createMediaAssetUploadSchema>;
export type UpdateMediaAssetInput = z.infer<typeof updateMediaAssetSchema>;
