import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProgramProgress extends Document {
  userId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  currentDay: number;
  completedDays: number[];
  status: 'active' | 'completed' | 'paused';
  startedAt: Date;
  lastActiveAt: Date;
}

const UserProgramProgressSchema = new Schema<IUserProgramProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'WorkoutProgram', required: true },
    currentDay: { type: Number, required: true, default: 1 },
    completedDays: { type: [Number], default: [] },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
      required: true,
    },
    startedAt: { type: Date, required: true },
    lastActiveAt: { type: Date, required: true },
  },
  { timestamps: true },
);

UserProgramProgressSchema.index({ userId: 1, programId: 1 }, { unique: true });
UserProgramProgressSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IUserProgramProgress>(
  'UserProgramProgress',
  UserProgramProgressSchema,
);
