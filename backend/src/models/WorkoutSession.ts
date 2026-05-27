import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionExercise {
  name: string;
  category?: string;
  durationSeconds: number;
  restSeconds: number;
  order: number;
  completedAt?: Date;
}

export interface IWorkoutSession extends Document {
  userId: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  dayNumber?: number;
  dayTitle: string;
  exercises: ISessionExercise[];
  status: 'in_progress' | 'completed' | 'abandoned';
  totalDurationSeconds?: number;
  startedAt: Date;
  completedAt?: Date;
}

const SessionExerciseSchema = new Schema<ISessionExercise>(
  {
    name: { type: String, required: true },
    category: String,
    durationSeconds: { type: Number, required: true },
    restSeconds: { type: Number, required: true, default: 0 },
    order: { type: Number, required: true },
    completedAt: Date,
  },
  { _id: false },
);

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'WorkoutProgram' },
    dayNumber: Number,
    dayTitle: { type: String, required: true },
    exercises: { type: [SessionExerciseSchema], default: [] },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      required: true,
    },
    totalDurationSeconds: Number,
    startedAt: { type: Date, required: true },
    completedAt: Date,
  },
  { timestamps: true },
);

WorkoutSessionSchema.index({ userId: 1, status: 1 });
WorkoutSessionSchema.index({ userId: 1, startedAt: -1 });

export default mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);
