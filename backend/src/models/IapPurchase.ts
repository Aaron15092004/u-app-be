import mongoose, { Document, Schema } from 'mongoose';

export interface IIapPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'apple';
  productId: string;
  transactionId: string;
  purchaseToken?: string | null;
  rawPayload?: Record<string, unknown>;
  entitlementId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IapPurchaseSchema = new Schema<IIapPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['apple'], required: true },
    productId: { type: String, required: true, trim: true },
    transactionId: { type: String, required: true, trim: true },
    purchaseToken: { type: String, default: null },
    rawPayload: { type: Schema.Types.Mixed, default: null },
    entitlementId: { type: Schema.Types.ObjectId, ref: 'UserScanEntitlement' },
  },
  { timestamps: true },
);

IapPurchaseSchema.index({ provider: 1, transactionId: 1 }, { unique: true });
IapPurchaseSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IIapPurchase>('IapPurchase', IapPurchaseSchema);
