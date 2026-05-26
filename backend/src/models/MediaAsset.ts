import mongoose, { Document, Schema } from 'mongoose';

export type MediaAssetSource = 'admin_upload' | 'bulk_import' | 'external_url';
export type MediaAssetStatus = 'uploaded' | 'assigned' | 'failed' | 'archived';

export interface IMediaAsset extends Document {
  source: MediaAssetSource;
  batchId?: string;
  status: MediaAssetStatus;
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  bytes?: number;
  mimeType?: string;
  assignedExerciseId?: mongoose.Types.ObjectId;
  uploadedBy?: mongoose.Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    source: {
      type: String,
      enum: ['admin_upload', 'bulk_import', 'external_url'],
      required: true,
    },
    batchId: { type: String, trim: true },
    status: {
      type: String,
      enum: ['uploaded', 'assigned', 'failed', 'archived'],
      default: 'uploaded',
      index: true,
    },
    publicId: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    bytes: { type: Number, min: 0 },
    mimeType: { type: String, trim: true },
    assignedExerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ batchId: 1, createdAt: -1 }, { sparse: true });
MediaAssetSchema.index({ status: 1, createdAt: -1 });
MediaAssetSchema.index({ assignedExerciseId: 1 }, { sparse: true });
MediaAssetSchema.index({ publicId: 1 }, { unique: true });

export default mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
