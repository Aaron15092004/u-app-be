import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth.middleware';
import Exercise from '../../models/Exercise';
import MediaAsset from '../../models/MediaAsset';
import { error, success } from '../../utils/response';
import {
  batchMediaAssetSchema,
  createMediaAssetUploadSchema,
  listMediaAssetsSchema,
  mediaBatchSchema,
  updateMediaAssetSchema,
} from './media-assets.validation';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function filenameStem(value: string): string {
  const last = value.split(/[\\/]/).pop() ?? value;
  return slugify(last.replace(/\.[^.]+$/, ''));
}

export const listMediaAssets = async (req: Request, res: Response): Promise<void> => {
  const parseResult = listMediaAssetsSchema.safeParse(req.query);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  const query: Record<string, unknown> = {};
  if (parseResult.data.status) query.status = parseResult.data.status;
  if (parseResult.data.source) query.source = parseResult.data.source;
  if (parseResult.data.batchId) query.batchId = parseResult.data.batchId;

  const skip = (parseResult.data.page - 1) * parseResult.data.limit;
  const [items, total] = await Promise.all([
    MediaAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseResult.data.limit).lean(),
    MediaAsset.countDocuments(query),
  ]);

  success(res, {
    items,
    total,
    page: parseResult.data.page,
    limit: parseResult.data.limit,
    totalPages: Math.ceil(total / parseResult.data.limit) || 1,
  });
};

export const createMediaAssetUpload = async (req: Request, res: Response): Promise<void> => {
  const parseResult = createMediaAssetUploadSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  const adminId = (req as AuthRequest).user.id;
  const doc = await MediaAsset.create({
    ...parseResult.data,
    uploadedBy: new mongoose.Types.ObjectId(adminId),
  });
  success(res, doc.toObject(), 201);
};

export const updateMediaAsset = async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateMediaAssetSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  const doc = await MediaAsset.findByIdAndUpdate(
    req.params.id,
    { $set: parseResult.data },
    { new: true },
  ).lean();
  if (!doc) {
    error(res, 'Khong tim thay media asset', 404);
    return;
  }
  success(res, doc);
};

export const deleteMediaAsset = async (req: Request, res: Response): Promise<void> => {
  const asset = await MediaAsset.findById(req.params.id).lean();
  if (!asset) {
    error(res, 'Khong tim thay media asset', 404);
    return;
  }
  if (asset.assignedExerciseId) {
    error(res, 'Khong the xoa media dang gan voi bai tap khi chua co safe path', 409);
    return;
  }
  await MediaAsset.deleteOne({ _id: asset._id });
  success(res, { deleted: true });
};

export const listExercisesMissingImages = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
  const query = {
    isActive: true,
    $or: [
      { imageUrl: null },
      { imageUrl: '' },
      { imageUrl: { $exists: false } },
      { imageAssetId: { $exists: false } },
    ],
  };
  const [items, total] = await Promise.all([
    Exercise.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Exercise.countDocuments(query),
  ]);
  success(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
};

export const createMediaAssetBatch = async (req: Request, res: Response): Promise<void> => {
  const parseResult = batchMediaAssetSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le';
    error(res, firstError, 400);
    return;
  }

  const adminId = (req as AuthRequest).user.id;
  const batchId = parseResult.data.batchId ?? `media-${Date.now()}`;
  const docs = await MediaAsset.insertMany(parseResult.data.assets.map((asset) => ({
    source: asset.source ?? 'bulk_import',
    batchId,
    status: 'uploaded',
    publicId: asset.publicId,
    url: asset.url,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
    mimeType: asset.mimeType,
    uploadedBy: new mongoose.Types.ObjectId(adminId),
    metadata: {
      ...(asset.metadata ?? {}),
      originalFilename: asset.originalFilename ?? asset.publicId,
      filenameStem: filenameStem(asset.originalFilename ?? asset.publicId),
      uploadedAt: new Date().toISOString(),
    },
  })));

  success(res, { batchId, items: docs.map((doc) => doc.toObject()), total: docs.length }, 201);
};

export const previewMediaFilenameMatches = async (req: Request, res: Response): Promise<void> => {
  const parseResult = mediaBatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    error(res, parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le', 400);
    return;
  }

  const [assets, exercises] = await Promise.all([
    MediaAsset.find({ batchId: parseResult.data.batchId, status: 'uploaded' }).lean(),
    Exercise.find({ isActive: true }).select('name imageUrl imageAssetId').lean(),
  ]);
  const exerciseByKey = new Map<string, typeof exercises[number]>();
  for (const exercise of exercises) {
    exerciseByKey.set(String(exercise._id), exercise);
    exerciseByKey.set(slugify(exercise.name), exercise);
  }

  const matches = assets.map((asset) => {
    const stem = filenameStem(String(asset.metadata?.originalFilename ?? asset.publicId));
    const exercise = exerciseByKey.get(stem);
    return {
      assetId: String(asset._id),
      file: asset.metadata?.originalFilename ?? asset.publicId,
      stem,
      status: exercise ? 'exact_match' : 'unmatched',
      exercise: exercise ? { _id: String(exercise._id), name: exercise.name } : null,
      canApply: Boolean(exercise),
    };
  });

  success(res, {
    batchId: parseResult.data.batchId,
    total: matches.length,
    exactMatches: matches.filter((item) => item.status === 'exact_match').length,
    unmatched: matches.filter((item) => item.status === 'unmatched').length,
    matches,
  });
};

export const applyExactMediaMatches = async (req: Request, res: Response): Promise<void> => {
  const parseResult = mediaBatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    error(res, parseResult.error.errors[0]?.message ?? 'Du lieu khong hop le', 400);
    return;
  }

  const adminId = (req as AuthRequest).user.id;
  const previewReq = { ...req, body: parseResult.data } as Request;
  const assets = await MediaAsset.find({ batchId: parseResult.data.batchId, status: 'uploaded' }).lean();
  const exercises = await Exercise.find({ isActive: true }).select('name imageUrl imageAssetId').lean();
  const exerciseByKey = new Map<string, typeof exercises[number]>();
  for (const exercise of exercises) {
    exerciseByKey.set(String(exercise._id), exercise);
    exerciseByKey.set(slugify(exercise.name), exercise);
  }

  const applied = [];
  const failed = [];
  for (const asset of assets) {
    const stem = filenameStem(String(asset.metadata?.originalFilename ?? asset.publicId));
    const exercise = exerciseByKey.get(stem);
    if (!exercise) {
      failed.push({ assetId: String(asset._id), file: asset.metadata?.originalFilename ?? asset.publicId, reason: 'unmatched' });
      await MediaAsset.updateOne(
        { _id: asset._id },
        { $set: { status: 'failed', 'metadata.error': 'unmatched_filename' } },
      );
      continue;
    }

    await Exercise.updateOne(
      { _id: exercise._id },
      { $set: { imageUrl: asset.url, imageAssetId: asset._id } },
    );
    await MediaAsset.updateOne(
      { _id: asset._id },
      {
        $set: {
          status: 'assigned',
          assignedExerciseId: exercise._id,
          'metadata.appliedBy': adminId,
          'metadata.appliedAt': new Date().toISOString(),
          'metadata.matchedExerciseId': String(exercise._id),
          'metadata.matchedExerciseName': exercise.name,
        },
      },
    );
    applied.push({ assetId: String(asset._id), exerciseId: String(exercise._id), exerciseName: exercise.name });
  }

  void previewReq;
  success(res, { batchId: parseResult.data.batchId, applied, failed });
};
