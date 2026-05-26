# Phase 5: Home Dashboard, Profile & Notifications - Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 32 new/modified files
**Analogs found:** 30 / 32

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/src/models/WaterLog.ts` | model | CRUD | `backend/src/models/HabitLog.ts` | exact |
| `backend/src/models/User.ts` (MODIFY) | model | CRUD | self — existing schema | exact |
| `backend/src/api/water/water.routes.ts` | route | CRUD | `backend/src/api/workouts/workouts.routes.ts` | exact |
| `backend/src/api/water/water.controller.ts` | controller | CRUD | `backend/src/api/food/food.controller.ts` | exact |
| `backend/src/api/water/water.service.ts` | service | CRUD | `backend/src/api/habits/habits.service.ts` | exact |
| `backend/src/api/water/water.validation.ts` | utility | transform | `backend/src/api/workouts/workouts.validation.ts` | exact |
| `backend/src/api/home/home.routes.ts` | route | request-response | `backend/src/api/workouts/workouts.routes.ts` | exact |
| `backend/src/api/home/home.controller.ts` | controller | request-response | `backend/src/api/bmi/bmi.controller.ts` | exact |
| `backend/src/api/home/home.service.ts` | service | batch | `backend/src/api/workouts/workouts.service.ts` | role-match |
| `backend/src/api/users/users.routes.ts` | route | CRUD | `backend/src/api/bmi/bmi.routes.ts` | exact |
| `backend/src/api/users/users.controller.ts` | controller | CRUD | `backend/src/api/bmi/bmi.controller.ts` | exact |
| `backend/src/api/users/users.service.ts` | service | CRUD | `backend/src/api/bmi/bmi.service.ts` | exact |
| `backend/src/api/config/config.routes.ts` | route | request-response | `backend/src/api/health/health.routes.ts` | role-match |
| `backend/src/api/config/config.controller.ts` | controller | request-response | `backend/src/api/bmi/bmi.controller.ts` | role-match |
| `backend/src/services/fcm.service.ts` (MODIFY) | service | event-driven | self — existing service | exact |
| `backend/src/cron/scheduler.ts` | service | event-driven | no analog — new pattern | none |
| `backend/src/app.ts` (MODIFY) | config | request-response | self — existing app.ts | exact |
| `mobile/src/app/(tabs)/index.tsx` (REWRITE) | component | request-response | `mobile/src/app/(tabs)/habits/index.tsx` | exact |
| `mobile/src/app/(tabs)/_layout.tsx` (MODIFY) | config | — | self — existing _layout.tsx | exact |
| `mobile/src/app/(tabs)/profile/index.tsx` | component | request-response | `mobile/src/app/(tabs)/habits/index.tsx` | role-match |
| `mobile/src/app/(tabs)/profile/_layout.tsx` | config | — | `mobile/src/app/(food)/_layout.tsx` | exact |
| `mobile/src/app/(tabs)/profile/edit.tsx` | component | CRUD | `mobile/src/app/(tabs)/bmi/index.tsx` | role-match |
| `mobile/src/app/(tabs)/profile/notifications.tsx` | component | CRUD | `mobile/src/app/(tabs)/bmi/index.tsx` | role-match |
| `mobile/src/app/(tabs)/profile/help.tsx` | component | — | no analog — static screen | none |
| `mobile/src/app/(home)/_layout.tsx` | config | — | `mobile/src/app/(food)/_layout.tsx` | exact |
| `mobile/src/app/(home)/water.tsx` | component | CRUD | `mobile/src/app/(food)/result.tsx` | role-match |
| `mobile/src/lib/api/home.api.ts` | utility | request-response | `mobile/src/lib/api/habits.api.ts` | exact |
| `mobile/src/lib/api/water.api.ts` | utility | CRUD | `mobile/src/lib/api/food.api.ts` | exact |
| `mobile/src/lib/api/users.api.ts` | utility | CRUD | `mobile/src/lib/api/bmi.api.ts` | exact |
| `mobile/src/lib/api/types.ts` (MODIFY) | utility | transform | self — existing types.ts | exact |
| `mobile/src/components/ui/*.tsx` (16 new) | component | request-response | `mobile/src/app/(tabs)/habits/index.tsx` components | role-match |

---

## Pattern Assignments

### `backend/src/models/WaterLog.ts` (model, CRUD)

**Analog:** `backend/src/models/HabitLog.ts`

**Imports pattern** (HabitLog.ts lines 1-4):
```typescript
import mongoose, { Document, Schema } from 'mongoose';
```

**Core model pattern** (HabitLog.ts lines 1-28):
```typescript
export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  habitId: 'water' | ...;
  date: Date;
  checkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // ... fields
  },
  { timestamps: true }
);

HabitLogSchema.index({ userId: 1, date: -1, habitId: 1 }, { unique: true });

export default mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
```

**WaterLog adaptation:** Schema has only `userId` + `loggedAt`. Index is `{ userId: 1, loggedAt: -1 }` (no uniqueness — multiple glasses per day). No `habitId` field.

```typescript
// D-73 target schema
WaterLogSchema.index({ userId: 1, loggedAt: -1 });  // NOT unique
```

Also compare to `backend/src/models/WorkoutLog.ts` lines 1-30 for a non-unique compound index example:
```typescript
WorkoutLogSchema.index({ userId: 1, date: -1 });  // no unique constraint
```

---

### `backend/src/models/User.ts` (model, CRUD — MODIFY)

**Analog:** self (lines 1-61)

**Current notifications subdocument** (lines 17-21):
```typescript
notifications: {
  waterReminder: boolean;
  workoutReminder: boolean;
  reminderTime: string;           // REMOVE THIS
};
```

**Current schema definition** (lines 46-50):
```typescript
notifications: {
  waterReminder: { type: Boolean, default: true },
  workoutReminder: { type: Boolean, default: true },
  reminderTime: { type: String, default: '08:00' },  // REMOVE
},
```

**D-74 addition to profile block** (lines 10-16 for interface, 39-45 for schema):
- Add `waterGoal?: number` to `IUser.profile` interface
- Add `waterGoal: { type: Number, default: 8 }` inside `profile:` schema block

**D-79 replacements:**
- Remove `reminderTime` from both `IUser.notifications` interface and schema
- Add `waterReminderTime: string` (default `'08:00'`) and `workoutReminderTime: string` (default `'07:00'`)

---

### `backend/src/api/water/water.routes.ts` (route, CRUD)

**Analog:** `backend/src/api/workouts/workouts.routes.ts` (lines 1-10)

**Imports + route registration pattern:**
```typescript
import { Router } from 'express';
import * as workoutsController from './workouts.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, workoutsController.createWorkoutLog);
router.get('/stats/weekly', authenticate, workoutsController.getWeeklyStats);

export default router;
```

**Water route adaptation:**
```typescript
// All three routes follow same authenticate + handler pattern
router.post('/', authenticate, waterController.logWater);           // POST /api/water
router.get('/today', authenticate, waterController.getTodayWater);  // GET /api/water/today
router.delete('/:id', authenticate, waterController.deleteWater);   // DELETE /api/water/:id
```

---

### `backend/src/api/water/water.controller.ts` (controller, CRUD)

**Analog:** `backend/src/api/food/food.controller.ts` (lines 1-128)

**Imports pattern** (food.controller.ts lines 1-16):
```typescript
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { success, error } from '../../utils/response';
import { saveFoodLogSchema, ... } from './food.validation';
import { saveFoodLog, ... } from './food.service';
```

**POST handler with validation** (food.controller.ts lines 49-66):
```typescript
export const saveFoodLogHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  const parseResult = saveFoodLogSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  try {
    const result = await saveFoodLog(userId, parseResult.data);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
```

**DELETE handler with IDOR protection** (food.controller.ts lines 95-106):
```typescript
export const deleteFoodLogHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const logId = String(req.params.id);

  try {
    await deleteFoodLog(userId, logId);    // userId passed — IDOR protection in service
    success(res, { deleted: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
```

**GET handler (no body, no validation)** (workouts.controller.ts lines 20-24):
```typescript
export async function getWeeklyStats(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const result = await workoutsService.getWeeklyStats(userId);
  success(res, result);
}
```

---

### `backend/src/api/water/water.service.ts` (service, CRUD)

**Analog:** `backend/src/api/habits/habits.service.ts` (lines 1-121)

**Imports pattern** (habits.service.ts lines 1-4):
```typescript
import mongoose from 'mongoose';
import HabitLog from '../../models/HabitLog';
import { vietnamDayStart, lastNDaysRange } from '../../utils/date';
```

**countDocuments with UTC+7 date range** (habits.service.ts lines 25-40 + workouts.service.ts pattern):
```typescript
export async function getTodayHabits(userId: string) {
  const logs = await HabitLog.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: vietnamDayStart(new Date()),  // exact day bucket match
  }).select('habitId').lean();
  // ...
}
```

**makeError helper** (habits.service.ts lines 6-9):
```typescript
function makeError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
```

**IDOR-safe delete pattern from food.service.ts:**
```typescript
// Always include userId in the query — never delete by _id alone
await WaterLog.deleteOne({ _id: new mongoose.Types.ObjectId(logId), userId: userObjId });
```

**Today date range pattern** (used in RESEARCH.md Pattern 3):
```typescript
const todayStart = vietnamDayStart(new Date());
const tomorrowStart = new Date(todayStart.getTime() + 86400000);
const count = await WaterLog.countDocuments({
  userId: new mongoose.Types.ObjectId(userId),
  loggedAt: { $gte: todayStart, $lt: tomorrowStart },
});
```

---

### `backend/src/api/water/water.validation.ts` (utility, transform)

**Analog:** `backend/src/api/workouts/workouts.validation.ts` (lines 1-9)

**Zod schema pattern:**
```typescript
import { z } from 'zod';

export const createWorkoutLogSchema = z.object({
  exerciseId: z.string().regex(/^[0-9a-fA-F]{24}$/, '...').optional(),
  exerciseName: z.string().min(1, '...').max(200),
  // ...
}).strict();
// NOTE: NO userId field — userId comes from JWT, never body
```

**Water adaptation:** `logWaterSchema` needs only optional `loggedAt: z.string().datetime().optional()`. IDOR note comment must be preserved.

---

### `backend/src/api/home/home.routes.ts` (route, request-response)

**Analog:** `backend/src/api/workouts/workouts.routes.ts` (lines 1-10)

All GET-only endpoints following `authenticate` + handler pattern:
```typescript
router.get('/today-summary', authenticate, homeController.getTodaySummary);
```

---

### `backend/src/api/home/home.controller.ts` (controller, request-response)

**Analog:** `backend/src/api/bmi/bmi.controller.ts` (lines 28-38)

**Read-only GET handler pattern** (bmi.controller.ts lines 28-38):
```typescript
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user.id;

  try {
    const history = await getBMIHistory(userId);
    success(res, history);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
```

---

### `backend/src/api/home/home.service.ts` (service, batch)

**Analog:** `backend/src/api/workouts/workouts.service.ts` (lines 34-72)

**Multi-collection aggregate pattern** (workouts.service.ts lines 34-72):
```typescript
export async function getWeeklyStats(userId: string): Promise<{...}> {
  const { start } = lastNDaysRange(7);
  const todayStart = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [agg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId, date: { $gte: start } } },
    {
      $group: {
        _id: null,
        exercises: { $sum: 1 },
        kcal: { $sum: '$caloriesBurned' },
        // ...
      },
    },
  ]);

  const [todayAgg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId, date: todayStart } },
    { $group: { _id: null, kcal: { $sum: '$caloriesBurned' } } },
  ]);

  return {
    exercises: agg ? agg.exercises : 0,
    kcal: agg ? agg.kcal : 0,
    // ... null-safe defaults
  };
}
```

**Imports needed for home.service.ts:**
```typescript
import mongoose from 'mongoose';
import FoodLog from '../../models/FoodLog';
import WaterLog from '../../models/WaterLog';
import WorkoutLog from '../../models/WorkoutLog';
import BMIRecord from '../../models/BMIRecord';
import User from '../../models/User';
import { vietnamDayStart } from '../../utils/date';
```

---

### `backend/src/api/users/users.routes.ts` (route, CRUD)

**Analog:** `backend/src/api/bmi/bmi.routes.ts`

**bmi.routes.ts pattern:**
```typescript
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as bmiController from './bmi.controller';

const router = Router();

router.patch('/', authenticate, bmiController.saveBMI);
router.get('/history', authenticate, bmiController.getHistory);

export default router;
```

**Users routes adaptation:**
```typescript
router.get('/profile/stats', authenticate, usersController.getProfileStats);
router.patch('/profile', authenticate, usersController.updateProfile);
router.patch('/notifications', authenticate, usersController.updateNotifications);
```

---

### `backend/src/api/users/users.controller.ts` (controller, CRUD)

**Analog:** `backend/src/api/bmi/bmi.controller.ts` (lines 1-38) — full file

All methods follow the exact same pattern: extract `userId` from `(req as AuthRequest).user.id`, validate with Zod if POST/PATCH, call service, wrap in try/catch with typed error, call `success()`/`error()`.

```typescript
export const saveBMI = async (req: Request, res: Response): Promise<void> => {
  const parseResult = saveBMISchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
    error(res, firstError, 400);
    return;
  }

  const { heightCm, weightKg } = parseResult.data;
  const userId = (req as AuthRequest).user.id;

  try {
    const result = await saveBMIAtomic(userId, heightCm, weightKg);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
};
```

---

### `backend/src/api/users/users.service.ts` (service, CRUD)

**Analog:** `backend/src/api/bmi/bmi.service.ts` (lines 1-167) + `backend/src/api/habits/habits.service.ts` (lines 78-121)

**User.findByIdAndUpdate with dot-notation for nested fields** (bmi.service.ts lines 59-65):
```typescript
updatedUser = await User.findByIdAndUpdate(
  userObjId,
  { 'profile.heightCm': heightCm, 'profile.weightKg': weightKg },
  { new: true, runValidators: true, session },
)
  .select('profile')
  .lean();

if (!updatedUser) throw makeError('Người dùng không tồn tại', 404);
```

**Aggregate for totals** (workouts.service.ts lines 46-57):
```typescript
const [agg] = await WorkoutLog.aggregate([
  { $match: { userId: userObjId, date: { $gte: start } } },
  {
    $group: {
      _id: null,
      exercises: { $sum: 1 },
      kcal: { $sum: '$caloriesBurned' },
    },
  },
]);
```

**getStreak delegation** (habits.service.ts lines 78-121 — `getStreak` function): users.service.ts re-exports/delegates to `getStreak(userId)` from habits.service rather than reimplementing.

---

### `backend/src/api/config/config.routes.ts` (route, request-response)

**Analog:** `backend/src/api/health/health.routes.ts`

Simple single GET route. No `authenticate` needed (shop URL is public info), or optionally authenticated — planner decides.

---

### `backend/src/api/config/config.controller.ts` (controller, request-response)

**Analog:** `backend/src/api/bmi/bmi.controller.ts` (lines 28-38)

Simple GET — read from `process.env.SHOP_URL`, return `success(res, { url })`. No service layer needed.

---

### `backend/src/services/fcm.service.ts` (service, event-driven — MODIFY)

**Analog:** self — existing `backend/src/services/fcm.service.ts` (lines 1-36)

**Current sendNotificationToUser pattern** (lines 1-24):
```typescript
import admin from 'firebase-admin';
import DeviceToken from '../models/DeviceToken';

export async function sendNotificationToUser(
  userId: string,
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  const tokens = await DeviceToken.find({ userId });

  for (const deviceToken of tokens) {
    try {
      await admin.messaging().send({
        notification: { title: notification.title, body: notification.body },
        data: notification.data,
        token: deviceToken.token,
      });
    } catch (err) {
      console.error(`FCM send failed for token ${deviceToken.token}:`, err);
    }
  }
}
```

**New method to add — sendBatchNotificationToUsers:** Takes `userIds: string[]` array, finds all DeviceTokens for those users (single query with `$in`), sends in parallel with `Promise.allSettled`. Same admin.messaging().send() call shape as existing.

**registerDeviceToken pattern** (lines 26-35 — upsert by token):
```typescript
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  await DeviceToken.findOneAndUpdate(
    { token },
    { userId, token, platform, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
```

---

### `backend/src/cron/scheduler.ts` (service, event-driven — NEW)

**Analog:** No cron scheduler exists in the codebase. Use RESEARCH.md Pattern 1 as the reference.

**Key import and structure:**
```typescript
import cron from 'node-cron';
import { sendBatchNotificationToUsers } from '../services/fcm.service';
import User from '../models/User';
import HabitLog from '../models/HabitLog';
import { vietnamDayStart } from '../utils/date';

export function startScheduler(): void {
  // Per-minute water+workout reminders
  cron.schedule('* * * * *', async () => {
    // Compute HH:MM in UTC+7 using manual offset (NOT server local time)
    const now = new Date();
    const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const hh = String(utc7.getUTCHours()).padStart(2, '0');
    const mm = String(utc7.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    // query users and call fcm.sendBatchNotificationToUsers
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Streak alert at 20:00 UTC+7
  cron.schedule('0 20 * * *', async () => {
    // streak alert logic
  }, { timezone: 'Asia/Ho_Chi_Minh' });
}
```

**Bootstrap location:** Call `startScheduler()` in `backend/src/server.ts` after `await connectDB()` and Firebase init.

---

### `backend/src/app.ts` (config — MODIFY)

**Analog:** self (lines 1-30)

**Mount pattern** (lines 18-26):
```typescript
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
// ...
app.use(errorMiddleware);  // MUST remain last
```

**Phase 5 additions:**
```typescript
import homeRouter from './api/home/home.routes';
import waterRouter from './api/water/water.routes';
import usersRouter from './api/users/users.routes';
import configRouter from './api/config/config.routes';

app.use('/api/home', homeRouter);
app.use('/api/water', waterRouter);
app.use('/api/users', usersRouter);
app.use('/api/config', configRouter);
```

---

### `mobile/src/app/(tabs)/index.tsx` (component, request-response — FULL REWRITE)

**Analog:** `mobile/src/app/(tabs)/habits/index.tsx` (lines 1-285)

**Screen structure pattern** (habits/index.tsx lines 44-181):
```typescript
export default function HabitsScreen(): React.JSX.Element {
  const qc = useQueryClient();

  // Queries at top
  const todayQuery = useQuery({
    queryKey: ['habits', 'today'],
    queryFn: getTodayHabitsApi,
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: (habitId: IHabitId) => checkInHabitApi(habitId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['habits', 'today'] });
    },
  });

  // Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* sections */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Loading skeleton pattern** (habits/index.tsx lines 101-106):
```typescript
if (todayQuery.isLoading) {
  return Array.from({ length: 6 }).map((_, i) => (
    <View key={i} style={styles.skeleton} />
  ));
}
```

**Error + retry pattern** (habits/index.tsx lines 108-116):
```typescript
if (todayQuery.isError) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Không thể tải thói quen. Thử lại.</Text>
      <Pressable onPress={() => { void todayQuery.refetch(); }} style={styles.retryBtn}>
        <Text style={styles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}
```

**useAuth for user name** (current index.tsx lines 1-10):
```typescript
import { useAuth } from '../../providers/AuthProvider';
const auth = useAuth();
// auth.user.name for greeting
```

**router.push for navigation** (current index.tsx lines 49-50):
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(food)/scan');
```

**Colors constants** (habits/index.tsx line 23):
```typescript
import { SURFACE, TEXT, TEXT_SECONDARY } from '../../../constants/colors';
// PRIMARY = '#4CAF50', SURFACE = white card bg, TEXT = dark, TEXT_SECONDARY = gray
```

**Home screen specific — two TanStack queries:**
```typescript
const summaryQuery = useQuery({
  queryKey: ['home', 'summary'],
  queryFn: getTodaySummaryApi,
  staleTime: 30_000,
});

const shopUrlQuery = useQuery({
  queryKey: ['config', 'shop-url'],
  queryFn: getShopUrlApi,
  staleTime: 60 * 60 * 1000,
});
```

---

### `mobile/src/app/(tabs)/_layout.tsx` (config — MODIFY)

**Analog:** self (lines 1-46)

**Existing tab registration pattern** (lines 8-43):
```typescript
<Tabs.Screen
  name="bmi"
  options={{
    title: 'BMI',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'body' : 'body-outline'} size={size} color={color} />
    ),
  }}
/>
```

**Profile tab to add after BMI** (D-76):
```typescript
<Tabs.Screen
  name="profile"
  options={{
    title: 'Hồ sơ',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
    ),
  }}
/>
```

---

### `mobile/src/app/(tabs)/profile/_layout.tsx` (config)

**Analog:** `mobile/src/app/(food)/_layout.tsx` (lines 1-5)

```typescript
import { Stack } from 'expo-router';

export default function FoodLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Profile layout is identical — `<Stack screenOptions={{ headerShown: false }} />`. The `index.tsx` is the profile tab; `edit.tsx`, `notifications.tsx`, `help.tsx` are pushed as stack screens.

---

### `mobile/src/app/(home)/_layout.tsx` (config)

**Analog:** `mobile/src/app/(food)/_layout.tsx` (lines 1-5) — identical pattern

```typescript
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

### `mobile/src/app/(tabs)/profile/index.tsx` (component, request-response)

**Analog:** `mobile/src/app/(tabs)/habits/index.tsx` (lines 1-285)

**Multi-query screen structure:**
```typescript
const statsQuery = useQuery({
  queryKey: ['users', 'profile', 'stats'],
  queryFn: getProfileStatsApi,
});
const streakQuery = useQuery({
  queryKey: ['habits', 'streak'],
  queryFn: getStreakApi,  // reuse existing — for badge unlock computation
});
```

**Navigation to sub-screens** (push pattern from food screens):
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(tabs)/profile/edit');
router.push('/(tabs)/profile/notifications');
router.push('/(tabs)/profile/help');
```

**Logout pattern** (existing index.tsx lines 13-31):
```typescript
const confirmLogout = (): void => {
  Alert.alert(
    'Đăng xuất',
    'Bạn có chắc muốn đăng xuất?',
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          await auth.logout();
          setLogoutLoading(false);
        },
      },
    ]
  );
};
```

---

### `mobile/src/app/(tabs)/profile/edit.tsx` (component, CRUD)

**Analog:** `mobile/src/app/(tabs)/bmi/index.tsx` (lines 52-80)

**useMutation for PATCH** (bmi/index.tsx lines 75-88):
```typescript
const mutation = useMutation({
  mutationFn: () => saveBMIApi(heightCm, weightKg),
  onSuccess: (result) => {
    setSaveError(null);
    setToastVisible(true);
    // ...
  },
  onError: () => {
    setSaveError('Không thể lưu. Thử lại.');
  },
});
```

**ScreenHeader usage** (food/result.tsx line 76):
```typescript
import ScreenHeader from '../../components/ui/ScreenHeader';
// ...
<ScreenHeader title="Chỉnh sửa hồ sơ" subtitle="..." showBack={true} />
```

---

### `mobile/src/app/(tabs)/profile/notifications.tsx` (component, CRUD)

**Analog:** `mobile/src/app/(tabs)/bmi/index.tsx` mutation pattern

**PATCH mutation pattern** — same as edit.tsx but for `/api/users/notifications`.

**MMKV for the "notif-rationale-shown" flag** (referenced in RESEARCH.md Pattern 7):
```typescript
import { getMMKV, setMMKV } from '../../../lib/storage/mmkv';
const NOTIF_ASKED_KEY = 'notif_permission_asked';
const alreadyAsked = getMMKV(NOTIF_ASKED_KEY);
```

---

### `mobile/src/app/(home)/water.tsx` (component, CRUD)

**Analog:** `mobile/src/app/(food)/result.tsx` (lines 1-80)

**Zustand store + TanStack query hybrid pattern** (result.tsx lines 18-64):
```typescript
const { scanResult, clearScan } = useFoodScanStore();
// ...
async function handleSave() {
  setIsSaving(true);
  try {
    await saveFoodLogApi({...});
    clearScan();
    Alert.alert('', 'Đã lưu!');
    router.push('...');
  } catch {
    setIsSaving(false);
    Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
  }
}
```

**Water screen uses TanStack Query (not Zustand)** since data is server state. Use `useQuery`+`useMutation` pattern from habits/index.tsx instead of the store-based pattern from result.tsx.

After water mutation `onSettled`:
```typescript
qc.invalidateQueries({ queryKey: ['water', 'today'] });
qc.invalidateQueries({ queryKey: ['home', 'summary'] });  // propagate to home dashboard
```

---

### `mobile/src/lib/api/home.api.ts` (utility, request-response)

**Analog:** `mobile/src/lib/api/habits.api.ts` (lines 1-31)

**GET endpoint pattern** (habits.api.ts lines 12-17):
```typescript
import apiClient from './client';
import type { ITodayHabits } from './types';

export async function getTodayHabitsApi(): Promise<ITodayHabits> {
  const res = await apiClient.get<{ success: boolean; data: ITodayHabits }>(
    '/api/habits/today',
  );
  return res.data.data;
}
```

**home.api.ts needs two functions:**
```typescript
export async function getTodaySummaryApi(): Promise<ITodaySummary> {
  const res = await apiClient.get<{ success: boolean; data: ITodaySummary }>('/api/home/today-summary');
  return res.data.data;
}

export async function getShopUrlApi(): Promise<{ url: string }> {
  const res = await apiClient.get<{ success: boolean; data: { url: string } }>('/api/config/shop-url');
  return res.data.data;
}
```

---

### `mobile/src/lib/api/water.api.ts` (utility, CRUD)

**Analog:** `mobile/src/lib/api/food.api.ts` (lines 1-36)

**POST + DELETE pattern** (food.api.ts lines 14-36):
```typescript
export async function saveFoodLogApi(body: {...}): Promise<IFoodLog> {
  const res = await apiClient.post('/api/food/logs', body);
  return res.data.data as IFoodLog;
}

export async function deleteFoodLogApi(logId: string): Promise<void> {
  await apiClient.delete(`/api/food/logs/${logId}`);
}
```

**GET pattern** (habits.api.ts lines 12-17):
```typescript
export async function getTodayHabitsApi(): Promise<ITodayHabits> {
  const res = await apiClient.get<{ success: boolean; data: ITodayHabits }>('/api/habits/today');
  return res.data.data;
}
```

---

### `mobile/src/lib/api/users.api.ts` (utility, CRUD)

**Analog:** `mobile/src/lib/api/bmi.api.ts` (lines 1-17)

**PATCH pattern** (bmi.api.ts lines 4-10):
```typescript
export async function saveBMIApi(heightCm: number, weightKg: number): Promise<ISaveBMIResponse> {
  const res = await apiClient.patch<{ success: boolean; data: ISaveBMIResponse }>(
    '/api/bmi',
    { heightCm, weightKg },
  );
  return res.data.data;
}
```

**users.api.ts needs three functions:**
- `getProfileStatsApi()` — GET `/api/users/profile/stats`
- `updateProfileApi(body)` — PATCH `/api/users/profile`
- `updateNotificationsApi(body)` — PATCH `/api/users/notifications`

---

### `mobile/src/lib/api/types.ts` (utility, transform — MODIFY)

**Analog:** self (lines 1-176)

**Phase addition pattern** (lines 31-32):
```typescript
// ---------------------------------------------------------------------------
// Phase 4 Types — AI Food Scan
// ---------------------------------------------------------------------------
```

**Phase 5 types block to add at the end:**
```typescript
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
}

export interface IProfileStats {
  streakDays: number;
  totalWorkouts: number;
  totalKcalBurned: number;
}

export interface IUserNotifications {
  waterReminder: boolean;
  workoutReminder: boolean;
  waterReminderTime: string;
  workoutReminderTime: string;
}
```

---

### `mobile/src/components/ui/*.tsx` (16 new components)

**Analog:** All existing components in `mobile/src/components/ui/` — use habits/index.tsx as the primary reference for StyleSheet patterns.

**StyleSheet conventions** (habits/index.tsx lines 183-285):
- Use `StyleSheet.create({})` at bottom of file
- `safeArea: { flex: 1, backgroundColor: '#F5F5F5' }` for root
- `card: { marginHorizontal: 16, backgroundColor: SURFACE, borderRadius: 16, padding: 16 }` for white cards
- `heading: { fontSize: 28, fontWeight: '700', color: TEXT }` for section headers
- Color tokens from `mobile/src/constants/colors.ts`: `PRIMARY`, `SURFACE`, `TEXT`, `TEXT_SECONDARY`

**Component export pattern** (all existing UI components):
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  // typed props
}

export default function ComponentName({ prop }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { /* ... */ },
});
```

**AchievementBadge unlock logic** (D-78, client-side):
```typescript
const MILESTONES = [7, 14, 28, 60];
function isBadgeUnlocked(streakDays: number, milestone: number): boolean {
  return streakDays >= milestone;
}
// Unlocked: { backgroundColor: '#E8F5E9', iconColor: '#4CAF50' }
// Locked:   { backgroundColor: '#F5F5F5', iconColor: '#BDBDBD' }
```

---

## Shared Patterns

### Authentication (all new backend routes)
**Source:** `backend/src/middleware/auth.middleware.ts` (lines 10-27) + `backend/src/api/workouts/workouts.routes.ts` (lines 3-7)
**Apply to:** All Phase 5 route files

```typescript
// Route file import
import { authenticate } from '../../middleware/auth.middleware';

// Every user-data endpoint
router.get('/today-summary', authenticate, controller.method);

// Controller — userId from JWT, NEVER from req.body
const userId = (req as AuthRequest).user.id;
```

**IDOR protection:** For any delete/update that touches per-user data, always scope the query by `userId`:
```typescript
// CORRECT — IDOR safe
await WaterLog.deleteOne({ _id: new mongoose.Types.ObjectId(logId), userId: userObjId });

// WRONG — allows any user to delete any doc
await WaterLog.deleteOne({ _id: new mongoose.Types.ObjectId(logId) });
```

---

### Error Handling (all backend controllers and services)
**Source:** `backend/src/api/food/food.controller.ts` (lines 37-44) + `backend/src/utils/response.ts` (lines 1-9)
**Apply to:** All Phase 5 controller files

```typescript
import { success, error } from '../../utils/response';
// response shape: { success: boolean, data: T } or { success: false, error: string }

// Controller try/catch
try {
  const result = await service.method(userId, data);
  success(res, result, 201);
} catch (err: unknown) {
  const e = err as { statusCode?: number; message?: string };
  error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
}

// Service error helper
function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
```

---

### Zod Validation (all backend PATCH/POST endpoints)
**Source:** `backend/src/api/workouts/workouts.validation.ts` (lines 1-9) + `backend/src/api/food/food.validation.ts` (lines 1-36)
**Apply to:** `water.validation.ts`, `users.validation.ts`

```typescript
import { z } from 'zod';

export const createSchema = z.object({
  field: z.string().min(1, 'Vietnamese error message'),
  // NO userId — comes from JWT
}).strict();
```

Validation call in controller:
```typescript
const parseResult = schema.safeParse(req.body);
if (!parseResult.success) {
  const firstError = parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ';
  error(res, firstError, 400);
  return;
}
```

---

### UTC+7 Date Utilities (all backend services that query by date)
**Source:** `backend/src/utils/date.ts` (lines 1-14) + `backend/src/api/habits/habits.service.ts` (lines 25-30)
**Apply to:** `water.service.ts`, `home.service.ts`, `users.service.ts`, `cron/scheduler.ts`

```typescript
import { vietnamDayStart, lastNDaysRange } from '../../utils/date';

// Day boundary for queries
const todayStart = vietnamDayStart(new Date());
const tomorrowStart = new Date(todayStart.getTime() + 86400000);

// Always use { $gte: todayStart, $lt: tomorrowStart } — not just $gte
```

---

### TanStack Query v5 (all new mobile screens/API modules)
**Source:** `mobile/src/app/(tabs)/habits/index.tsx` (lines 10-95)
**Apply to:** All Phase 5 mobile screens

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query key naming convention: ['feature', 'subkey']
const qc = useQueryClient();
const query = useQuery({ queryKey: ['home', 'summary'], queryFn: getTodaySummaryApi, staleTime: 30_000 });

// Mutation with cross-query invalidation
const mutation = useMutation({
  mutationFn: apiFunction,
  onSettled: () => {
    qc.invalidateQueries({ queryKey: ['feature', 'key'] });
    qc.invalidateQueries({ queryKey: ['home', 'summary'] }); // always invalidate home summary
  },
});
```

---

### API Client Usage (all new mobile API modules)
**Source:** `mobile/src/lib/api/habits.api.ts` (lines 1-31) + `mobile/src/lib/api/food.api.ts` (lines 1-36)
**Apply to:** `home.api.ts`, `water.api.ts`, `users.api.ts`

```typescript
import apiClient from './client';
import type { ITypeName } from './types';

// GET
export async function getFooApi(): Promise<ITypeName> {
  const res = await apiClient.get<{ success: boolean; data: ITypeName }>('/api/route');
  return res.data.data;
}

// POST
export async function createFooApi(body: CreateFooBody): Promise<ITypeName> {
  const res = await apiClient.post('/api/route', body);
  return res.data.data as ITypeName;
}

// PATCH
export async function updateFooApi(body: UpdateFooBody): Promise<ITypeName> {
  const res = await apiClient.patch('/api/route', body);
  return res.data.data as ITypeName;
}

// DELETE
export async function deleteFooApi(id: string): Promise<void> {
  await apiClient.delete(`/api/route/${id}`);
}
```

---

### NativeWind + StyleSheet Conventions (all new mobile components/screens)
**Source:** `mobile/src/app/(tabs)/habits/index.tsx` (lines 183-285)
**Apply to:** All Phase 5 mobile UI files

```typescript
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY, BACKGROUND } from '../../../constants/colors';
// PRIMARY = '#4CAF50', ACCENT (orange) = for workout completion screens only
// SURFACE = white card background
// BACKGROUND = '#F5F5F5' screen background

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },
  scrollContent: { paddingBottom: 32 },
  card: { marginHorizontal: 16, backgroundColor: SURFACE, borderRadius: 16, padding: 16 },
  heading: { fontSize: 28, fontWeight: '700', color: TEXT },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: TEXT },
  bodyText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 },
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/src/cron/scheduler.ts` | service | event-driven | No cron scheduler exists in codebase; use RESEARCH.md Pattern 1 (node-cron) |
| `mobile/src/app/(tabs)/profile/help.tsx` | component | — | No static FAQ/help screen exists; build as simple ScrollView with hardcoded FAQ accordion items and email link via `Linking.openURL('mailto:...')` |

---

## Metadata

**Analog search scope:** `backend/src/api/**`, `backend/src/models/**`, `backend/src/services/**`, `mobile/src/app/(tabs)/**`, `mobile/src/app/(food)/**`, `mobile/src/lib/api/**`, `mobile/src/stores/**`
**Files scanned:** 36
**Pattern extraction date:** 2026-05-19
