import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'revoked';

export interface ICampaign extends Document {
  name: string;
  description: string | null;
  status: CampaignStatus;
  startsAt: Date;
  endsAt: Date;
  entitlementDurationDays: number;
  highQuotaDailyLimit: number;
  createdBy?: mongoose.Types.ObjectId;
  codeCount: number;
  redeemedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'ended', 'revoked'],
      default: 'draft',
      index: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    entitlementDurationDays: { type: Number, required: true, min: 1 },
    highQuotaDailyLimit: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    codeCount: { type: Number, default: 0, min: 0 },
    redeemedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

CampaignSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
CampaignSchema.index({ createdAt: -1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
