import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem extends Document {
  name: string;           // Vietnamese name (required)
  nameEn?: string;        // English name (optional)
  barcodes: string[];
  brand?: string;
  servingSizeG?: number;
  packageSize?: string;
  barcodeSource?: 'manual' | 'open_food_facts' | 'admin_import';
  barcodeLastVerifiedAt?: Date;
  kcalPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminC: number;
  imageUrl: string | null;
  category?: string;
  source: 'openfoods' | 'manual';
}

const FoodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true },
    nameEn: String,
    barcodes: { type: [String], default: [] },
    brand: String,
    servingSizeG: { type: Number, min: 0 },
    packageSize: String,
    barcodeSource: {
      type: String,
      enum: ['manual', 'open_food_facts', 'admin_import'],
    },
    barcodeLastVerifiedAt: Date,
    kcalPer100g: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    vitaminC: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },
    category: String,
    source: { type: String, enum: ['openfoods', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

// Text index with no stemming for correct Vietnamese diacritic matching (Pitfall 8)
FoodItemSchema.index(
  { name: 'text', nameEn: 'text', brand: 'text' },
  { default_language: 'none' }
);
FoodItemSchema.index({ barcodes: 1 }, { sparse: true });

export default mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);
