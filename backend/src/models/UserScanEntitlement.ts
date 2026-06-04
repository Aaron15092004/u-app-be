import mongoose, { Document, Schema } from 'mongoose';

export type ScanEntitlementType = 'ai_scan_high_quota';
export type ScanEntitlementSource = 'redeem_code';
export type ScanQuotaPolicyMode = 'high_daily_quota';

export interface IUserScanEntitlement extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  redeemCodeId?: mongoose.Types.ObjectId;
  type: ScanEntitlementType;
  startsAt: Date;
  activeUntil: Date;
  quotaPolicy: {
    mode: ScanQuotaPolicyMode;
    dailyLimit: number;
  };
  source: ScanEntitlementSource;
  createdAt: Date;
  updatedAt: Date;
}

const UserScanEntitlementSchema = new Schema<IUserScanEntitlement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    redeemCodeId: { type: Schema.Types.ObjectId, ref: 'RedeemCode' },
    type: { type: String, enum: ['ai_scan_high_quota'], default: 'ai_scan_high_quota' },
    startsAt: { type: Date, required: true },
    activeUntil: { type: Date, required: true },
    quotaPolicy: {
      mode: { type: String, enum: ['high_daily_quota'], default: 'high_daily_quota' },
      dailyLimit: { type: Number, required: true, min: 1 },
    },
    source: { type: String, enum: ['redeem_code'], default: 'redeem_code' },
  },
  { timestamps: true },
);

UserScanEntitlementSchema.index({ userId: 1, type: 1, activeUntil: -1 });
UserScanEntitlementSchema.index({ redeemCodeId: 1 }, { unique: true, sparse: true });
UserScanEntitlementSchema.index({ campaignId: 1, createdAt: -1 });

export default mongoose.model<IUserScanEntitlement>(
  'UserScanEntitlement',
  UserScanEntitlementSchema,
);
