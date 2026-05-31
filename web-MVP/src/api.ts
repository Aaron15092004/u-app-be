import axios, { AxiosError } from 'axios';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.EXPO_PUBLIC_API_URL ||
  'https://u-app-be.onrender.com';

const ACCESS_TOKEN_KEY = 'u_web_access_token';
const REFRESH_TOKEN_KEY = 'u_web_refresh_token';
const USER_KEY = 'u_web_user';

export type GoalType = 'lose' | 'maintain' | 'gain';
export type HabitId = 'water' | 'vegetables' | 'exercise' | 'sleep' | 'reading' | 'nut-milk';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profileCompleted: boolean;
  profile?: {
    heightCm?: number;
    weightKg?: number;
    age?: number;
    goalType?: GoalType;
    waterGoal?: number;
  };
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface NotificationSettings {
  waterReminder: boolean;
  workoutReminder: boolean;
  nutMilkReminder: boolean;
  waterReminderTime: string;
  waterReminderTimes: string[];
  workoutReminderTime: string;
  nutMilkReminderTime: string;
}

export interface ProfileStats {
  streakDays: number;
  totalWorkouts: number;
  totalKcalBurned: number;
  notifications: NotificationSettings;
  dailyTargets: { kcal: number; protein: number; carbs: number; fat: number };
}

export interface TodaySummary {
  kcalConsumed: number;
  macros: { protein: number; carbs: number; fat: number };
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  bmi: { value: number; category: string } | null;
}

export interface FoodItem {
  name: string;
  weightG?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitaminC?: number;
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
  tags?: string[];
  source?: 'ai_scan' | 'barcode' | 'manual';
  barcode?: string;
  provenance?: Record<string, unknown>;
}

export interface ScanResult {
  foods: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'gemini' | 'logmeal' | 'manual';
  imageUrl: string | null;
  commentVi?: string;
  usedToday?: number;
  limit?: number;
  quotaMode?: string;
}

export interface FoodLog extends ScanResult {
  _id: string;
  date: string;
  createdAt: string;
}

export interface MilkFlavor {
  flavorId: string;
  nameVi: string;
  bmiRule: string;
  positioningVi: string;
}

export interface MilkRecommendation {
  bmiRule: string | null;
  flavors: MilkFlavor[];
  currentPreference?: { selectedFlavorId: string } | null;
  disclaimer: string;
}

export interface ProgramSummary {
  _id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  imageUrl?: string | null;
  totalDays: number;
  estimatedWeeks: number;
  avgDayMinutes: number;
  userProgress?: { currentDay: number; completedDays: number[]; status: string } | null;
}

export interface ProgramDetail extends ProgramSummary {
  days: Array<{
    dayNumber: number;
    title: string;
    totalDurationSeconds: number;
    totalDurationMinutes: number;
    exercises: Array<{
      exerciseId?: string;
      exerciseName: string;
      category?: string;
      durationSeconds: number;
      restSeconds: number;
      order: number;
      imageUrl?: string | null;
    }>;
  }>;
}

export interface EntitlementStatus {
  hasActiveEntitlement: boolean;
  activeUntil: string | null;
  quotaPolicy: { mode: string; dailyLimit: number } | null;
  message?: string;
}

export interface RatingStatus {
  status: 'eligible' | 'dismissed' | 'submitted' | 'cooldown';
  cooldownUntil: string | null;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getStoredAuth(): AuthState {
  const rawUser = localStorage.getItem(USER_KEY);
  return {
    user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null,
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeAuth(data: { user: AuthUser; accessToken: string; refreshToken: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function updateStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function errorMessage(err: unknown): string {
  const e = err as AxiosError<{ error?: string; message?: string }>;
  return e.response?.data?.error || e.response?.data?.message || e.message || 'Có lỗi xảy ra.';
}

export async function login(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  return storeAuth(res.data.data);
}

export async function googleLogin(idToken: string) {
  const res = await api.post('/api/auth/google', { idToken });
  return storeAuth(res.data.data);
}

export async function register(email: string, password: string) {
  const res = await api.post('/api/auth/register', { email, password });
  return storeAuth(res.data.data);
}

export async function forgotPassword(email: string) {
  const res = await api.post('/api/auth/forgot-password', { email });
  return res.data.data as { message: string };
}

export async function resetPassword(token: string, password: string) {
  const res = await api.post('/api/auth/reset-password', { token, password });
  return res.data.data as { message: string };
}

export async function completeProfile(body: {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: GoalType;
}) {
  const res = await api.patch('/api/auth/complete-profile', body);
  updateStoredUser(res.data.data.user);
  return res.data.data.user as AuthUser;
}

export async function updateProfile(body: Partial<AuthUser['profile']> & { name?: string }) {
  const res = await api.patch('/api/users/profile', body);
  return res.data.data;
}

export const getTodaySummary = () => api.get('/api/home/today-summary').then((r) => r.data.data as TodaySummary);
export const getProfileStats = () => api.get('/api/users/profile/stats').then((r) => r.data.data as ProfileStats);
export const getShopUrl = () => api.get('/api/config/shop-url').then((r) => r.data.data as { url: string });
export const logWater = () => api.post('/api/water', {}).then((r) => r.data.data);
export const saveBmi = (heightCm: number, weightKg: number) => api.patch('/api/bmi', { heightCm, weightKg }).then((r) => r.data.data);
export const getBmiHistory = () => api.get('/api/bmi/history').then((r) => r.data.data);
export const getHabitsToday = () => api.get('/api/habits/today').then((r) => r.data.data);
export const checkInHabit = (habitId: HabitId) => api.post('/api/habits/check-in', { habitId }).then((r) => r.data.data);
export const getWeeklyHabits = () => api.get('/api/habits/weekly').then((r) => r.data.data);
export const getHabitStreak = () => api.get('/api/habits/streak').then((r) => r.data.data);
export const getMilkRecommendations = (params?: { bmi?: number }) => api.get('/api/recommendations/nut-milk', { params }).then((r) => r.data.data as MilkRecommendation);
export const selectMilk = (body: { selectedFlavorId: string; recommendedFlavorId?: string; bmi?: number; source: 'bmi_recommendation' | 'manual_profile' }) =>
  api.post('/api/recommendations/nut-milk/selection', body).then((r) => r.data.data);
export const getEntitlement = () => api.get('/api/campaigns/me/entitlements').then((r) => r.data.data as EntitlementStatus);
export const redeemCode = (code: string) => api.post('/api/campaigns/redeem', { code, source: 'manual' }).then((r) => r.data.data);
export const getRatingStatus = () => api.get('/api/ratings/status').then((r) => r.data.data as RatingStatus);
export const submitRating = (stars: number, comment: string, trigger = 'manual') =>
  api.post('/api/ratings', { stars, comment: comment || undefined, trigger, platform: 'web', storeReviewRequested: false }).then((r) => r.data.data);
export const dismissRating = (trigger = 'manual') => api.post('/api/ratings/dismiss', { trigger }).then((r) => r.data.data);

export async function scanFood(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append('image', file, file.name || 'meal.jpg');
  const res = await api.post('/api/food/scan', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.data as ScanResult;
}

export const saveFoodLog = (result: ScanResult) =>
  api.post('/api/food/logs', {
    foods: result.foods,
    totals: result.totals,
    aiProvider: result.aiProvider,
    imageUrl: null,
  }).then((r) => r.data.data as FoodLog);

export const getFoodLogs = (date: string) => api.get('/api/food/logs', { params: { date } }).then((r) => r.data.data as FoodLog[]);
export const getFoodLogsRange = (from: string, to: string) => api.get('/api/food/logs/range', { params: { from, to } }).then((r) => r.data.data as Array<{
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  logCount: number;
}>);
export const deleteFoodLog = (id: string) => api.delete(`/api/food/logs/${id}`);
export const searchFoodItems = (q: string) => api.get('/api/food/items', { params: { q } }).then((r) => r.data.data);
export const lookupBarcode = (barcode: string) => api.get(`/api/food/items/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data.data);
export const listPrograms = (level?: string) => api.get('/api/workout-programs', { params: level && level !== 'all' ? { level } : {} }).then((r) => r.data.data as ProgramSummary[]);
export const getProgram = (id: string) => api.get(`/api/workout-programs/${id}`).then((r) => r.data.data as ProgramDetail);
export const startProgram = (id: string) => api.post(`/api/workout-programs/${id}/start`).then((r) => r.data.data);
export const createSession = (body: { programId?: string; dayNumber?: number; dayTitle: string; exercises: unknown[] }) =>
  api.post('/api/workout-sessions', body).then((r) => r.data.data);
export const completeSession = (id: string, totalDurationSeconds: number) =>
  api.post(`/api/workout-sessions/${id}/complete`, { totalDurationSeconds });
export const getWorkoutStreak = () => api.get('/api/workout-sessions/streak').then((r) => r.data.data);
export const getWeeklyWorkoutStats = () => api.get('/api/workouts/stats/weekly').then((r) => r.data.data);
export const updateNotifications = (body: Partial<NotificationSettings>) => api.patch('/api/users/notifications', body).then((r) => r.data.data);
