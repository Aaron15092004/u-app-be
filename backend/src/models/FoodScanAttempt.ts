import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodScanAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  source?: 'daily_quota' | 'redeem_entitlement';
  entitlementId?: mongoose.Types.ObjectId;
  quotaMode?: 'standard' | 'high_quota';
  createdAt: Date;
}

const FoodScanAttemptSchema = new Schema<IFoodScanAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: {
      type: String,
      enum: ['daily_quota', 'redeem_entitlement'],
      default: 'daily_quota',
    },
    entitlementId: { type: Schema.Types.ObjectId, ref: 'UserScanEntitlement' },
    quotaMode: { type: String, enum: ['standard', 'high_quota'], default: 'standard' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FoodScanAttemptSchema.index({ userId: 1, createdAt: -1 });
FoodScanAttemptSchema.index({ entitlementId: 1, createdAt: -1 }, { sparse: true });
// Auto-delete after 7 days — we only need today's count
FoodScanAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 86400 });

export default mongoose.model<IFoodScanAttempt>('FoodScanAttempt', FoodScanAttemptSchema);
