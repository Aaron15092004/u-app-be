import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem extends Document {
  name: string;           // Vietnamese name (required)
  nameEn?: string;        // English name (optional)
  kcalPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminC: number;
  category?: string;
  source: 'openfoods' | 'manual';
}

const FoodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true },
    nameEn: String,
    kcalPer100g: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    vitaminC: { type: Number, default: 0 },
    category: String,
    source: { type: String, enum: ['openfoods', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

// Text index with no stemming for correct Vietnamese diacritic matching (Pitfall 8)
FoodItemSchema.index(
  { name: 'text', nameEn: 'text' },
  { default_language: 'none' }
);

export default mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);
