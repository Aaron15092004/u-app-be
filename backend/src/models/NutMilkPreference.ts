import mongoose, { Document, Schema } from 'mongoose';

export type NutMilkPreferenceSource = 'bmi_recommendation' | 'manual_profile';
export type NutMilkBmiCategory = 'underweight' | 'normal' | 'overweight' | 'boundary_23';

export interface INutMilkPreference extends Document {
  userId: mongoose.Types.ObjectId;
  selectedFlavorId: string;
  recommendedFlavorId?: string;
  bmiRecordId?: mongoose.Types.ObjectId;
  bmi?: number;
  bmiCategory?: NutMilkBmiCategory;
  needSignals: {
    stressOrSleep: boolean;
    energyMemory: boolean;
  };
  source: NutMilkPreferenceSource;
  selectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NutMilkPreferenceSchema = new Schema<INutMilkPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    selectedFlavorId: { type: String, required: true, trim: true },
    recommendedFlavorId: { type: String, trim: true },
    bmiRecordId: { type: Schema.Types.ObjectId, ref: 'BMIRecord' },
    bmi: { type: Number, min: 0 },
    bmiCategory: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'boundary_23'],
    },
    needSignals: {
      stressOrSleep: { type: Boolean, default: false },
      energyMemory: { type: Boolean, default: false },
    },
    source: {
      type: String,
      enum: ['bmi_recommendation', 'manual_profile'],
      default: 'bmi_recommendation',
    },
    selectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

NutMilkPreferenceSchema.index({ userId: 1, updatedAt: -1 });
NutMilkPreferenceSchema.index({ selectedFlavorId: 1, createdAt: -1 });

export default mongoose.model<INutMilkPreference>(
  'NutMilkPreference',
  NutMilkPreferenceSchema,
);
