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
    waterGoal?: number;
    age?: number;
  };
  notifications: {
    waterReminder: boolean;
    workoutReminder: boolean;
    waterReminderTime: string;
    workoutReminderTime: string;
  };
  profileCompleted: boolean;
  refreshTokenHash: string | null;
  refreshTokenExpiry: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetTokenExpiry: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    name: { type: String, default: '', trim: true },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    authProviders: [{ provider: String, providerId: String }],
    profile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      heightCm: Number,
      weightKg: Number,
      goalType: { type: String, enum: ['lose', 'maintain', 'gain'] },
      waterGoal: { type: Number, default: 8 },
      age: { type: Number, min: 10, max: 120 },
    },
    notifications: {
      waterReminder: { type: Boolean, default: true },
      workoutReminder: { type: Boolean, default: true },
      waterReminderTime: { type: String, default: '08:00' },
      workoutReminderTime: { type: String, default: '07:00' },
    },
    profileCompleted: { type: Boolean, default: false },
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetTokenExpiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
