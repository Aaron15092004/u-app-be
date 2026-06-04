import mongoose, { Document, Schema } from 'mongoose';

export interface IAppContent extends Document {
  key: string;
  value: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppContentSchema = new Schema<IAppContent>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    value: { type: Schema.Types.Mixed, required: true, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model<IAppContent>('AppContent', AppContentSchema);
