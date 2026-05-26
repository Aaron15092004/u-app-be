import mongoose, { Document, Schema } from 'mongoose';

export type FeedbackPromptKey = 'app_rating';
export type FeedbackPromptStatus = 'eligible' | 'dismissed' | 'submitted' | 'cooldown';

export interface IFeedbackPromptState extends Document {
  userId: mongoose.Types.ObjectId;
  promptKey: FeedbackPromptKey;
  status: FeedbackPromptStatus;
  lastPromptedAt?: Date;
  dismissedAt?: Date;
  submittedAt?: Date;
  cooldownUntil?: Date;
  triggerCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackPromptStateSchema = new Schema<IFeedbackPromptState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    promptKey: { type: String, enum: ['app_rating'], default: 'app_rating' },
    status: {
      type: String,
      enum: ['eligible', 'dismissed', 'submitted', 'cooldown'],
      default: 'eligible',
      index: true,
    },
    lastPromptedAt: Date,
    dismissedAt: Date,
    submittedAt: Date,
    cooldownUntil: Date,
    triggerCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

FeedbackPromptStateSchema.index({ userId: 1, promptKey: 1 }, { unique: true });
FeedbackPromptStateSchema.index({ cooldownUntil: 1 }, { sparse: true });

export default mongoose.model<IFeedbackPromptState>(
  'FeedbackPromptState',
  FeedbackPromptStateSchema,
);
