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
  imageAssetId?: string | null;
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

// ---------------------------------------------------------------------------
// Phase 5 Types — Home Dashboard, Profile & Notifications
// ---------------------------------------------------------------------------

export interface ITodaySummary {
  kcalConsumed: number;
  macros: { protein: number; carbs: number; fat: number };
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  bmi: { value: number; category: string } | null;
}

export interface IWaterLog {
  _id: string;
  userId: string;
  loggedAt: string;
  createdAt: string;
}

export interface ITodayWater {
  logs: IWaterLog[];
  count: number;
  waterGoal: number; // WARNING 4 fix — added so water.tsx does not need a second /api/home/today-summary query
}

export interface IUserNotifications {
  waterReminder: boolean;
  workoutReminder: boolean;
  waterReminderTime: string;
  workoutReminderTime: string;
}

export interface IProfileStats {
  streakDays: number;
  totalWorkouts: number;
  totalKcalBurned: number;
  notifications: IUserNotifications; // WARNING 3 fix — added so notifications.tsx initialises form state from server, not hardcoded defaults
}
// ---------------------------------------------------------------------------
// Phase 1 v2.0 Data Foundation Contracts
// ---------------------------------------------------------------------------

export type IV2RedeemSource = 'manual' | 'qr';
export type IV2CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'revoked';
export type IV2RedeemCodeStatus = 'unused' | 'redeemed' | 'revoked' | 'expired';
export type IV2EntitlementType = 'ai_scan_high_quota';
export type IV2EntitlementSource = 'redeem_code';
export type IV2QuotaPolicyMode = 'high_daily_quota';

export interface IV2RedeemCampaignCodeRequest {
  code: string;
  source?: IV2RedeemSource;
}

export interface IV2RedeemHttpsPayload {
  redeemUrl: string;
  codeQueryParam: 'code';
}

export interface IV2ScanQuotaPolicy {
  mode: IV2QuotaPolicyMode;
  dailyLimit: number;
}

export interface IV2UserScanEntitlement {
  _id: string;
  userId: string;
  campaignId: string;
  redeemCodeId: string;
  type: IV2EntitlementType;
  startsAt: string;
  activeUntil: string;
  quotaPolicy: IV2ScanQuotaPolicy;
  source: IV2EntitlementSource;
  createdAt: string;
  updatedAt: string;
}

export interface IV2ScanEntitlementStatus {
  hasActiveEntitlement: boolean;
  activeUntil: string | null;
  campaignId?: string | null;
  redeemCodeId?: string | null;
  quotaPolicy: IV2ScanQuotaPolicy | null;
  entitlement?: IV2UserScanEntitlement | null;
  message?: string;
}

export interface IV2RedeemCampaignCodeResponse {
  status: 'success' | 'invalid' | 'already_used' | 'expired' | 'revoked' | 'unauthenticated';
  message: string;
  entitlement?: IV2UserScanEntitlement | null;
}

export type IV2BarcodeSource = 'local' | 'open_food_facts' | 'manual' | 'admin_import';

export interface IV2BarcodeMinimumNutrition {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IV2BarcodeLookupResult {
  barcode: string;
  found: boolean;
  source: IV2BarcodeSource;
  productId?: string;
  name?: string;
  brand?: string;
  servingSizeG?: number;
  packageSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitaminC?: number;
  isSaveReady: boolean;
  minimumNutrition?: IV2BarcodeMinimumNutrition;
  missingFields?: Array<keyof IV2BarcodeMinimumNutrition>;
  provenance?: {
    provider: IV2BarcodeSource;
    fetchedAt?: string;
    lastVerifiedAt?: string | null;
  };
  message?: string;
}

export type IV2NutMilkBmiRule = 'lt_18_5' | 'range_18_5_22_9' | 'gt_23' | 'any';
export type IV2NutMilkResolvedBmiRule = IV2NutMilkBmiRule | 'boundary_23';
export type IV2NutMilkNeedSignal = 'stress_sleep' | 'energy_memory';
export type IV2NutMilkPreferenceSource = 'bmi_recommendation' | 'manual_profile';

export interface IV2NutMilkFlavorRule {
  flavorId: string;
  nameVi: string;
  bmiRule: IV2NutMilkBmiRule;
  needSignal?: IV2NutMilkNeedSignal;
  positioningVi: string;
}

export interface IV2NutMilkSignals {
  stressOrSleep?: boolean;
  energyOrMemory?: boolean;
}

export interface IV2NutMilkRecommendationResponse {
  bmiRule: IV2NutMilkResolvedBmiRule | null;
  signals: Required<IV2NutMilkSignals>;
  flavors: IV2NutMilkFlavorRule[];
  disclaimer: string;
}

export interface IV2SelectNutMilkFlavorRequest {
  selectedFlavorId: string;
  recommendedFlavorId?: string;
  bmi?: number;
  signals?: IV2NutMilkSignals;
  source?: IV2NutMilkPreferenceSource;
}

export interface IV2NutMilkPreference {
  _id: string;
  userId: string;
  recommendedFlavorId?: string;
  selectedFlavorId: string;
  bmiRecordId?: string;
  bmi?: number;
  bmiCategory?: IBMICategory | 'boundary_23';
  signals?: IV2NutMilkSignals;
  source: IV2NutMilkPreferenceSource;
  createdAt: string;
  updatedAt: string;
}

export type IV2RatingTrigger =
  | 'food_scan_saved'
  | 'workout_completed'
  | 'habit_streak'
  | 'profile_prompt'
  | 'manual';
export type IV2RatingPlatform = 'ios' | 'android' | 'web' | 'unknown';
export type IV2PromptStatus = 'eligible' | 'dismissed' | 'submitted' | 'cooldown';

export interface IV2SubmitAppRatingRequest {
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  trigger: IV2RatingTrigger;
  appVersion?: string;
  platform: IV2RatingPlatform;
  deviceInfo?: Record<string, unknown>;
  storeReviewRequested?: boolean;
}

export interface IV2AppRating {
  _id: string;
  userId: string;
  stars: number;
  comment?: string;
  trigger: IV2RatingTrigger;
  appVersion?: string;
  platform: IV2RatingPlatform;
  deviceInfo?: Record<string, unknown>;
  storeReviewRequested?: boolean;
  storeReviewEligible?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IV2FeedbackPromptStatus {
  promptKey: 'app_rating';
  status: IV2PromptStatus;
  cooldownUntil: string | null;
  triggerCounts: Record<string, number>;
  nativeStoreReviewEligible?: boolean;
  message?: string;
}
