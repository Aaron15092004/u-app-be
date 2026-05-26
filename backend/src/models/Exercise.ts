import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  nameEn?: string;
  category: 'yoga' | 'cardio' | 'weights' | 'stretching';
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  caloriesBurned: number;
  imageUrl: string | null;
  imageAssetId?: mongoose.Types.ObjectId;
  description?: string;
  steps: Array<{
    order: number;
    instruction: string;
    durationSeconds?: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    nameEn: String,
    category: { type: String, enum: ['yoga', 'cardio', 'weights', 'stretching'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    durationMinutes: { type: Number, required: true },
    caloriesBurned: { type: Number, required: true },
    imageUrl: { type: String, default: null },
    imageAssetId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    description: String,
    steps: [
      {
        order: Number,
        instruction: String,
        durationSeconds: Number,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ExerciseSchema.index({ category: 1, isActive: 1 });
ExerciseSchema.index({ imageAssetId: 1 }, { sparse: true });

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
