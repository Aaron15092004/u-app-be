import mongoose, { Document, Schema } from 'mongoose';

export interface IProgramExercise {
  exerciseId?: mongoose.Types.ObjectId;
  exerciseName: string;
  category?: string;
  durationSeconds: number;
  restSeconds: number;
  order: number;
}

export interface IProgramDay {
  dayNumber: number;
  title: string;
  exercises: IProgramExercise[];
}

export interface IWorkoutProgram extends Document {
  title: string;
  titleEn?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  imageUrl?: string | null;
  estimatedWeeks: number;
  days: IProgramDay[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramExerciseSchema = new Schema<IProgramExercise>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
    exerciseName: { type: String, required: true },
    category: String,
    durationSeconds: { type: Number, required: true },
    restSeconds: { type: Number, default: 15 },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const ProgramDaySchema = new Schema<IProgramDay>(
  {
    dayNumber: { type: Number, required: true },
    title: { type: String, required: true },
    exercises: [ProgramExerciseSchema],
  },
  { _id: false }
);

const WorkoutProgramSchema = new Schema<IWorkoutProgram>(
  {
    title: { type: String, required: true },
    titleEn: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    description: String,
    imageUrl: { type: String, default: null },
    estimatedWeeks: { type: Number, required: true },
    days: [ProgramDaySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WorkoutProgramSchema.index({ level: 1, isActive: 1 });

export default mongoose.model<IWorkoutProgram>('WorkoutProgram', WorkoutProgramSchema);
