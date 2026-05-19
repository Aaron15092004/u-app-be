import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  imageUrl: string | null;
  aiProvider: 'openai' | 'logmeal' | 'manual';
  foods: Array<{
    name: string;
    weightG?: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium?: number;
    vitaminC?: number;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FoodLogSchema = new Schema<IFoodLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: null },
    aiProvider: { type: String, enum: ['openai', 'logmeal', 'manual'], default: 'manual' },
    foods: [
      {
        name: { type: String, required: true },
        weightG: Number,
        calories: { type: Number, required: true },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
        sodium: { type: Number, default: 0 },
        vitaminC: { type: Number, default: 0 },
      },
    ],
    totals: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

FoodLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IFoodLog>('FoodLog', FoodLogSchema);
