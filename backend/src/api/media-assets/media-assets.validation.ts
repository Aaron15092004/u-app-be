import { z } from 'zod';

export const mediaAssetStatusSchema = z.enum(['uploaded', 'assigned', 'failed', 'archived']);
export const mediaAssetSourceSchema = z.enum(['admin_upload', 'bulk_import', 'external_url']);

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
  publicId: z.string().trim().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string().trim().min(1).max(100),
  bytes: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateMediaAssetSchema = z.object({
  status: mediaAssetStatusSchema.optional(),
  assignedExerciseId: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ListMediaAssetsInput = z.infer<typeof listMediaAssetsSchema>;
export type CreateMediaAssetUploadInput = z.infer<typeof createMediaAssetUploadSchema>;
export type UpdateMediaAssetInput = z.infer<typeof updateMediaAssetSchema>;
