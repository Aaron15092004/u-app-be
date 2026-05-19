export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profileCompleted: boolean;
}

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { user: IAuthUser; accessToken: string; refreshToken: string; }
export interface RegisterRequest { email: string; password: string; }
export interface RegisterResponse { user: IAuthUser; accessToken: string; refreshToken: string; }
export interface RefreshRequest { refreshToken: string; }
export interface RefreshResponse { accessToken: string; refreshToken: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; password: string; }
export interface GoogleSignInRequest { idToken: string; }
export interface AppleSignInRequest { identityToken: string; nonce?: string; }
export interface CompleteProfileRequest {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: 'lose' | 'maintain' | 'gain';
}
export interface CompleteProfileResponse { user: IAuthUser; }

// ---------------------------------------------------------------------------
// Phase 3 Types
// ---------------------------------------------------------------------------

// Exercise
export type ICategory = 'yoga' | 'cardio' | 'weights' | 'stretching';
export type IDifficulty = 'easy' | 'medium' | 'hard';
export interface IExerciseStep {
  order: number;
  instruction: string;
  durationSeconds?: number;
}
export interface IExercise {
  _id: string;
  name: string;
  nameEn?: string;
  category: ICategory;
  difficulty: IDifficulty;
  durationMinutes: number;
  caloriesBurned: number;
  imageUrl: string | null;
  description?: string;
  steps: IExerciseStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Workout
export interface ICreateWorkoutLog {
  exerciseId?: string;
  exerciseName: string;
  durationMinutes: number;
  caloriesBurned: number;
  completedAt: string;
}
export interface IWorkoutLog {
  _id: string;
  userId: string;
  exerciseId?: string;
  exerciseName: string;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  completedAt: string;
}
export interface IWeeklyStats {
  days: number;
  exercises: number;
  kcal: number;
  minutes: number;
  todayKcal: number;
  targetKcal: number;
}

// Habit
export type IHabitId = 'water' | 'vegetables' | 'exercise' | 'sleep' | 'reading' | 'nut-milk';
export interface ITodayHabits {
  completed: IHabitId[];
  progress: { count: number; percent: number };
}
export interface IWeeklyHabit { date: string; qualified: boolean; }
export interface IStreak { streakDays: number; }

// BMI
export type IBMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export interface IBMIRecord {
  _id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: IBMICategory;
  recordedAt: string;
}
export interface ISaveBMIResponse {
  bmiRecord: IBMIRecord;
  user: { heightCm: number; weightKg: number };
}
export interface IBMIHistoryEntry {
  date: string;
  bmi: number;
  category: IBMICategory;
}

// ---------------------------------------------------------------------------
// Phase 4 Types — AI Food Scan
// ---------------------------------------------------------------------------

export interface IFoodLogItem {
  name: string;
  weightG?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminC: number;
  tags?: string[];
}

export interface IFoodLog {
  _id: string;
  userId: string;
  date: string;
  aiProvider: 'openai' | 'logmeal' | 'manual';
  imageUrl: string | null;
  foods: IFoodLogItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  createdAt: string;
}

export interface IFoodItem {
  _id: string;
  name: string;
  nameEn?: string;
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

export interface IScanFoodResponse {
  foods: Array<{
    name: string;
    weightG: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    vitaminC: number;
    tags: string[];
  }>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string | null;
}
