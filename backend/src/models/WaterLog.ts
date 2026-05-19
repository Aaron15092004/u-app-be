import mongoose, { Document, Schema } from 'mongoose';

export interface IWaterLog extends Document {
  userId: mongoose.Types.ObjectId;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    loggedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

WaterLogSchema.index({ userId: 1, loggedAt: -1 });

export default mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
