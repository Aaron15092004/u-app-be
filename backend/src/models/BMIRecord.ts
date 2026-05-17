import mongoose, { Document, Schema } from 'mongoose';

export interface IBMIRecord extends Document {
  userId: mongoose.Types.ObjectId;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BMIRecordSchema = new Schema<IBMIRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    bmi: { type: Number, required: true },
    category: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'obese'],
      required: true,
    },
    recordedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

BMIRecordSchema.index({ userId: 1, recordedAt: -1 });

export default mongoose.model<IBMIRecord>('BMIRecord', BMIRecordSchema);
