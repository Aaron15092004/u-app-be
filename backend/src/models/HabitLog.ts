import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  habitId: 'water' | 'vegetables' | 'exercise' | 'sleep' | 'reading' | 'nut-milk';
  date: Date;
  checkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: {
      type: String,
      enum: ['water', 'vegetables', 'exercise', 'sleep', 'reading', 'nut-milk'],
      required: true,
    },
    date: { type: Date, required: true },
    checkedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

HabitLogSchema.index({ userId: 1, date: -1, habitId: 1 }, { unique: true });

export default mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
