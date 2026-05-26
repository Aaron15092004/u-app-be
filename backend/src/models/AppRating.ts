import mongoose, { Document, Schema } from 'mongoose';

export type AppRatingPlatform = 'ios' | 'android' | 'web' | 'unknown';
export type AppRatingTrigger =
  | 'food_scan_saved'
  | 'workout_completed'
  | 'habit_streak'
  | 'profile_prompt'
  | 'manual';

export interface IAppRating extends Document {
  userId: mongoose.Types.ObjectId;
  stars: number;
  comment?: string;
  trigger: AppRatingTrigger;
  appVersion?: string;
  platform: AppRatingPlatform;
  deviceInfo: Record<string, unknown>;
  storeReviewRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppRatingSchema = new Schema<IAppRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    trigger: {
      type: String,
      enum: ['food_scan_saved', 'workout_completed', 'habit_streak', 'profile_prompt', 'manual'],
      required: true,
      index: true,
    },
    appVersion: { type: String, trim: true },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'unknown'],
      default: 'unknown',
    },
    deviceInfo: { type: Schema.Types.Mixed, default: {} },
    storeReviewRequested: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AppRatingSchema.index({ userId: 1, createdAt: -1 });
AppRatingSchema.index({ stars: 1, createdAt: -1 });
AppRatingSchema.index({ trigger: 1, createdAt: -1 });

export default mongoose.model<IAppRating>('AppRating', AppRatingSchema);
