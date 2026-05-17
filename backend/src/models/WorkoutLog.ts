import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkoutLog extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  exerciseName: string;
  date: Date;
  durationMinutes: number;
  caloriesBurned: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutLogSchema = new Schema<IWorkoutLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
    exerciseName: { type: String, required: true },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    caloriesBurned: { type: Number, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

WorkoutLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema);
