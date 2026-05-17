import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string | null;
  name: string;
  avatar: string | null;
  role: 'user' | 'admin';
  authProviders: Array<{ provider: string; providerId: string }>;
  profile: {
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
    goalType?: 'lose' | 'maintain' | 'gain';
  };
  notifications: {
    waterReminder: boolean;
    workoutReminder: boolean;
    reminderTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    authProviders: [{ provider: String, providerId: String }],
    profile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      heightCm: Number,
      weightKg: Number,
      goalType: { type: String, enum: ['lose', 'maintain', 'gain'] },
    },
    notifications: {
      waterReminder: { type: Boolean, default: true },
      workoutReminder: { type: Boolean, default: true },
      reminderTime: { type: String, default: '08:00' },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);
