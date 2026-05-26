import mongoose, { Document, Schema } from 'mongoose';

export type RedeemCodeStatus = 'unused' | 'redeemed' | 'revoked' | 'expired';
export type RedeemCodeRedemptionSource = 'manual' | 'qr';

export interface IRedeemCode extends Document {
  campaignId: mongoose.Types.ObjectId;
  batchId: string;
  codeHash: string;
  codePrefix: string;
  codeLength: number;
  status: RedeemCodeStatus;
  expiresAt: Date | null;
  redeemedBy?: mongoose.Types.ObjectId;
  redeemedAt?: Date;
  redemptionSource?: RedeemCodeRedemptionSource;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RedeemCodeSchema = new Schema<IRedeemCode>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    batchId: { type: String, required: true, trim: true },
    codeHash: { type: String, required: true, trim: true },
    codePrefix: { type: String, required: true, trim: true },
    codeLength: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['unused', 'redeemed', 'revoked', 'expired'],
      default: 'unused',
      index: true,
    },
    expiresAt: { type: Date, default: null },
    redeemedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    redeemedAt: Date,
    redemptionSource: { type: String, enum: ['manual', 'qr'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

RedeemCodeSchema.index({ codeHash: 1 }, { unique: true });
RedeemCodeSchema.index({ campaignId: 1, status: 1, createdAt: -1 });
RedeemCodeSchema.index({ batchId: 1, createdAt: -1 });
RedeemCodeSchema.index({ redeemedBy: 1, redeemedAt: -1 });

export default mongoose.model<IRedeemCode>('RedeemCode', RedeemCodeSchema);
