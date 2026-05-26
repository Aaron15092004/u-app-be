# Phase 3: Core Health Tracking - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 30 (backend: 13, mobile screens: 6, mobile components: 12, mobile store: 1, config: 1, layout: 1)
**Analogs found:** 28 / 30

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/src/api/exercises/exercises.routes.ts` | route | request-response | `backend/src/api/auth/auth.routes.ts` | exact |
| `backend/src/api/exercises/exercises.controller.ts` | controller | CRUD | `backend/src/api/auth/auth.controller.ts` | exact |
| `backend/src/api/exercises/exercises.service.ts` | service | CRUD | `backend/src/api/auth/auth.service.ts` | role-match |
| `backend/src/api/exercises/exercises.validation.ts` | utility | transform | `backend/src/api/auth/auth.validation.ts` | exact |
| `backend/src/api/workouts/workouts.routes.ts` | route | request-response | `backend/src/api/auth/auth.routes.ts` | exact |
| `backend/src/api/workouts/workouts.controller.ts` | controller | CRUD | `backend/src/api/auth/auth.controller.ts` | exact |
| `backend/src/api/workouts/workouts.service.ts` | service | CRUD + batch | `backend/src/api/auth/auth.service.ts` | role-match |
| `backend/src/api/workouts/workouts.validation.ts` | utility | transform | `backend/src/api/auth/auth.validation.ts` | exact |
| `backend/src/api/habits/habits.routes.ts` | route | request-response | `backend/src/api/auth/auth.routes.ts` | exact |
| `backend/src/api/habits/habits.controller.ts` | controller | CRUD | `backend/src/api/auth/auth.controller.ts` | exact |
| `backend/src/api/habits/habits.service.ts` | service | CRUD + event-driven | `backend/src/api/auth/auth.service.ts` | role-match |
| `backend/src/api/habits/habits.validation.ts` | utility | transform | `backend/src/api/auth/auth.validation.ts` | exact |
| `backend/src/api/bmi/bmi.routes.ts` | route | request-response | `backend/src/api/auth/auth.routes.ts` | exact |
| `backend/src/api/bmi/bmi.controller.ts` | controller | CRUD | `backend/src/api/auth/auth.controller.ts` | exact |
| `backend/src/api/bmi/bmi.service.ts` | service | CRUD + batch | `backend/src/api/auth/auth.service.ts` | role-match |
| `backend/src/api/bmi/bmi.validation.ts` | utility | transform | `backend/src/api/auth/auth.validation.ts` | exact |
| `backend/src/scripts/seed-exercises.ts` | utility | batch | `backend/src/models/Exercise.ts` (model only) | partial |
| `backend/src/app.ts` (modify) | config | request-response | itself | self |
| `mobile/src/app/(tabs)/exercises/index.tsx` | screen | CRUD | `mobile/src/app/(tabs)/index.tsx` | role-match |
| `mobile/src/app/(tabs)/exercises/[id].tsx` | screen | request-response | `mobile/src/app/(onboarding)/screen-3.tsx` | role-match |
| `mobile/src/app/(tabs)/exercises/[id]/timer.tsx` | screen | event-driven | `mobile/src/app/(onboarding)/screen-3.tsx` | partial |
| `mobile/src/app/(tabs)/exercises/[id]/complete.tsx` | screen | request-response | `mobile/src/app/(onboarding)/screen-3.tsx` | role-match |
| `mobile/src/app/(tabs)/habits/index.tsx` | screen | CRUD | `mobile/src/app/(tabs)/index.tsx` | role-match |
| `mobile/src/app/(tabs)/bmi/index.tsx` | screen | CRUD | `mobile/src/app/(tabs)/index.tsx` | role-match |
| `mobile/src/app/(tabs)/_layout.tsx` (modify) | config | request-response | itself (lines 1-12) | self |
| `mobile/src/components/ui/ExerciseCard.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | exact |
| `mobile/src/components/ui/CategoryFilterChip.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | exact |
| `mobile/src/components/ui/WeeklyStatCard.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | role-match |
| `mobile/src/components/ui/DailyChallengeCard.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | role-match |
| `mobile/src/components/ui/TimerDisplay.tsx` | component | event-driven | `mobile/src/components/ui/PrimaryButton.tsx` | partial |
| `mobile/src/components/ui/TimerControls.tsx` | component | event-driven | `mobile/src/components/ui/PrimaryButton.tsx` | role-match |
| `mobile/src/components/ui/HabitRow.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | exact |
| `mobile/src/components/ui/HabitHeatmap.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | role-match |
| `mobile/src/components/ui/StreakBadge.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | role-match |
| `mobile/src/components/ui/BMIResultCard.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | role-match |
| `mobile/src/components/ui/BMIScaleBar.tsx` | component | request-response | `mobile/src/components/ui/GoalCard.tsx` | partial |
| `mobile/src/components/ui/BMIChart.tsx` | component | request-response | no analog (new library) | none |
| `mobile/src/stores/timerStore.ts` | store | event-driven | `mobile/src/lib/auth/auth-store.ts` | role-match |
| `mobile/src/lib/api/exercises.api.ts` | utility | request-response | `mobile/src/lib/api/auth.api.ts` | exact |
| `mobile/src/lib/api/workouts.api.ts` | utility | request-response | `mobile/src/lib/api/auth.api.ts` | exact |
| `mobile/src/lib/api/habits.api.ts` | utility | request-response | `mobile/src/lib/api/auth.api.ts` | exact |
| `mobile/src/lib/api/bmi.api.ts` | utility | request-response | `mobile/src/lib/api/auth.api.ts` | exact |

---

## Pattern Assignments

### `backend/src/api/exercises/exercises.routes.ts` (route, request-response)

**Analog:** `backend/src/api/auth/auth.routes.ts`

**Imports + route pattern** (lines 1-17):
```typescript
import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
// Protected routes require authenticate middleware:
router.patch('/complete-profile', authenticate, authController.completeProfile);

export default router;
```

**Apply to exercises.routes.ts as:**
```typescript
import { Router } from 'express';
import * as exercisesController from './exercises.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, exercisesController.list);       // GET /api/exercises?category=yoga
router.get('/:id', authenticate, exercisesController.getById); // GET /api/exercises/:id

export default router;
```

---

### `backend/src/api/exercises/exercises.controller.ts` (controller, CRUD)

**Analog:** `backend/src/api/auth/auth.controller.ts`

**Imports pattern** (lines 1-5):
```typescript
import { Request, Response } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema } from './auth.validation';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
```

**Handler shape — Zod validate then service call** (lines 7-17):
```typescript
export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }
  const { email, password } = parsed.data;
  const result = await authService.registerWithEmail(email, password);
  success(res, result, 201);
}
```

**AuthRequest user extraction pattern** (lines 44-47):
```typescript
export async function logout(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  await authService.revokeRefreshToken(userId);
  res.status(204).end();
}
```

**Apply to exercises.controller.ts:** `list` handler validates query param `category` with Zod enum schema, passes to service; `getById` extracts `req.params.id`, passes to service; both use `success(res, result)`.

---

### `backend/src/api/exercises/exercises.service.ts` (service, CRUD)

**Analog:** `backend/src/api/auth/auth.service.ts`

**Error factory pattern** (lines 70-74):
```typescript
function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
```

**Mongoose findById pattern** (lines 300-316):
```typescript
const user = await User.findByIdAndUpdate(
  userId,
  { name: payload.name, 'profile.heightCm': payload.heightCm },
  { new: true, runValidators: true }
);
if (!user) {
  throw makeError('Người dùng không tồn tại', 404);
}
```

**Apply to exercises.service.ts:** `list(category?)` calls `Exercise.find({ isActive: true, ...(category ? { category } : {}) })`. `getById(id)` calls `Exercise.findById(id)` and throws `makeError('Bài tập không tồn tại', 404)` if null.

---

### `backend/src/api/exercises/exercises.validation.ts` (utility, transform)

**Analog:** `backend/src/api/auth/auth.validation.ts`

**Zod schema pattern** (lines 1-20):
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng').max(254),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128),
});

export const completeProfileSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập họ và tên của bạn').max(100).trim(),
  heightCm: z.number().min(50).max(300),
  goalType: z.enum(['lose', 'maintain', 'gain']),
});
```

**Apply to exercises.validation.ts:**
```typescript
import { z } from 'zod';

export const listQuerySchema = z.object({
  category: z.enum(['yoga', 'cardio', 'weights', 'stretching']).optional(),
});
```

---

### `backend/src/api/workouts/workouts.routes.ts` + `workouts.controller.ts` + `workouts.validation.ts`

**Analog:** `backend/src/api/auth/auth.routes.ts` + `auth.controller.ts` + `auth.validation.ts`

Same patterns as exercises. Routes:
- `POST /` (authenticate) — log completed workout
- `GET /stats/weekly` (authenticate) — 7-day aggregation

**workouts.validation.ts** will need:
```typescript
export const createWorkoutLogSchema = z.object({
  exerciseId: z.string().optional(),
  exerciseName: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  caloriesBurned: z.number().int().nonnegative(),
  completedAt: z.string().datetime(), // ISO string from client
});
```

**workouts.service.ts** — Mongoose aggregation pattern. Study WorkoutLog model (userId/date/-1 index) for the weekly stats aggregation pipeline.

---

### `backend/src/api/habits/habits.routes.ts` + `habits.controller.ts` + `habits.service.ts` + `habits.validation.ts`

**Analog:** Same auth trio.

Routes:
- `POST /check-in` (authenticate) — upsert HabitLog for today
- `GET /today` (authenticate) — today's completed habits for userId
- `GET /weekly` (authenticate) — 7-day heatmap data
- `GET /streak` (authenticate) — computed streak count

**Key service pattern from auth.service.ts** — upsert pattern via `findByIdAndUpdate` with `{ new: true }`. For habit check-in use `HabitLog.findOneAndUpdate({ userId, date, habitId }, { checkedAt }, { upsert: true, new: true })` honoring the unique index.

**habits.validation.ts:**
```typescript
export const checkInSchema = z.object({
  habitId: z.enum(['water', 'vegetables', 'exercise', 'sleep', 'reading', 'nut-milk']),
});
```

---

### `backend/src/api/bmi/bmi.routes.ts` + `bmi.controller.ts` + `bmi.service.ts` + `bmi.validation.ts`

**Analog:** Same auth trio.

Routes:
- `PATCH /` (authenticate) — create BMIRecord + update User.profile (D-54)
- `GET /history` (authenticate) — 30-day history for chart (D-55)

**bmi.service.ts** — `updateProfile` pattern in `auth.service.ts` lines 290-321 shows the `findByIdAndUpdate` with dot-notation fields:
```typescript
const user = await User.findByIdAndUpdate(
  userId,
  {
    'profile.heightCm': payload.heightCm,
    'profile.weightKg': payload.weightKg,
  },
  { new: true, runValidators: true }
);
```

**bmi.validation.ts:**
```typescript
export const saveBMISchema = z.object({
  heightCm: z.number().min(100).max(220),  // D-56
  weightKg: z.number().min(30).max(200),   // D-56
});
```

---

### `backend/src/scripts/seed-exercises.ts` (utility, batch)

**Analog:** None — no existing seed scripts. Use Node.js + Mongoose direct connection pattern.

**Bootstrap pattern from `backend/src/models/Exercise.ts`** (lines 1-46) for model import and schema understanding.

**Idempotency pattern (D-44):** Check count before inserting:
```typescript
import mongoose from 'mongoose';
import Exercise from '../models/Exercise';

async function seed(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI!);
  const count = await Exercise.countDocuments();
  if (count >= 100) {
    console.log('Seed already done, skipping.');
    await mongoose.disconnect();
    return;
  }
  await Exercise.insertMany(exercises);
  console.log(`Seeded ${exercises.length} exercises.`);
  await mongoose.disconnect();
}

seed().catch(console.error);
```

**`backend/package.json` scripts pattern** (line 9): Add `"seed": "tsx src/scripts/seed-exercises.ts"` alongside existing `"dev": "tsx watch src/server.ts"`.

---

### `backend/src/app.ts` (modify — add 4 routers)

**Analog:** itself (lines 1-20)

**Current router mount pattern** (lines 3-16):
```typescript
import authRouter from './api/auth/auth.routes';
// ...
app.use('/api/auth', authRouter);
app.use(errorMiddleware);  // always last
```

**Apply:** Insert before `app.use(errorMiddleware)`:
```typescript
import exercisesRouter from './api/exercises/exercises.routes';
import workoutsRouter from './api/workouts/workouts.routes';
import habitsRouter from './api/habits/habits.routes';
import bmiRouter from './api/bmi/bmi.routes';

app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/bmi', bmiRouter);
```

---

### `mobile/src/app/(tabs)/_layout.tsx` (modify — add 3 tabs)

**Analog:** itself (lines 1-12)

**Current pattern** (lines 1-12):
```typescript
import React from 'react';
import { Tabs } from 'expo-router';
import { PRIMARY } from '../../constants/colors';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: PRIMARY }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
    </Tabs>
  );
}
```

**Apply:** Add 3 more `Tabs.Screen` entries with `tabBarIcon` using Ionicons, following the UI-SPEC icon map (outline inactive / filled active):
```typescript
import { Ionicons } from '@expo/vector-icons';

<Tabs.Screen
  name="exercises"
  options={{
    title: 'Tập luyện',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons
        name={focused ? 'barbell' : 'barbell-outline'}
        size={size}
        color={color}
      />
    ),
  }}
/>
```

---

### `mobile/src/app/(tabs)/exercises/index.tsx` (screen, CRUD)

**Analog:** `mobile/src/app/(tabs)/index.tsx` + `mobile/src/app/(onboarding)/screen-3.tsx`

**Screen shell pattern** (onboarding/screen-3.tsx lines 14-66):
```typescript
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { BACKGROUND, PRIMARY, TEXT, TEXT_SECONDARY } from '../../constants/colors';

export default function OnboardingScreen3(): React.JSX.Element {
  const router = useRouter();
  // state + handlers
  return (
    <SafeAreaView style={styles.container}>
      {/* content */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND, paddingHorizontal: 24 },
});
```

**Alert pattern** (index.tsx lines 11-28):
```typescript
import { Alert } from 'react-native';
Alert.alert(
  'Đăng xuất',
  'Bạn có chắc muốn đăng xuất?',
  [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: async () => { ... } },
  ]
);
```

**Apply to exercises/index.tsx:** SafeAreaView > ScrollView, import ACCENT/PRIMARY/BACKGROUND from `../../../constants/colors`. TanStack Query `useQuery` for exercise list. `useState` for `activeCategory`. FlatList for exercises.

---

### `mobile/src/app/(tabs)/exercises/[id].tsx` (screen, request-response)

**Analog:** `mobile/src/app/(onboarding)/screen-3.tsx`

Same screen shell. Uses `useLocalSearchParams()` from expo-router for `id`. TanStack Query `useQuery({ queryKey: ['exercise', id] })`. Sticky bottom bar with `PrimaryButton`. Navigation to timer: `router.push(`/(tabs)/exercises/${id}/timer`)`.

---

### `mobile/src/app/(tabs)/exercises/[id]/timer.tsx` (screen, event-driven — orange theme)

**Analog:** `mobile/src/app/(onboarding)/screen-3.tsx` (shell only)

**Orange theme pattern** — No existing full-orange-background analog. Use design tokens from `mobile/src/constants/colors.ts` (line 3): `ACCENT = '#FF6B35'`.

```typescript
// Full-screen orange background
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ACCENT, // '#FF6B35'
  },
});
```

**AppState pattern (D-45):** React Native built-in, no analog exists. Import from 'react-native':
```typescript
import { AppState, AppStateStatus } from 'react-native';

useEffect(() => {
  const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'background') timerStore.pause();
  });
  return () => sub.remove();
}, []);
```

**Alert confirmation pattern** (index.tsx lines 11-28) — reuse for stop confirmation (D-47).

---

### `mobile/src/app/(tabs)/exercises/[id]/complete.tsx` (screen, request-response — orange theme)

**Analog:** `mobile/src/app/(onboarding)/screen-3.tsx` (shell + centered layout)

Same orange background as timer screen. On mount fires `useMutation` to `POST /api/workouts`. `useEffect` triggers mutation on component mount. Navigation on "Hoàn tất": `router.replace('/(tabs)/exercises')` + call `timerStore.reset()`.

---

### `mobile/src/app/(tabs)/habits/index.tsx` (screen, CRUD)

**Analog:** `mobile/src/app/(tabs)/index.tsx`

Same screen shell as exercises/index.tsx. Static list of 6 HabitRow components (no FlatList). TanStack Query `useQuery` for today's habit log. `useMutation` for check-in with optimistic update pattern.

---

### `mobile/src/app/(tabs)/bmi/index.tsx` (screen, CRUD)

**Analog:** `mobile/src/app/(tabs)/index.tsx` + `mobile/src/app/(onboarding)/screen-3.tsx`

Screen shell. `useState` for height/weight sliders (initialized from `useAuth().user` profile values). BMI computed client-side on every slider change. `useMutation` for PATCH. TanStack Query `useQuery` for 30-day history chart.

---

### `mobile/src/components/ui/ExerciseCard.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx`

**Full GoalCard pattern** (lines 1-89):
```typescript
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#4CAF50';

interface GoalCardProps {
  label: string;
  iconName: string;
  value: 'lose' | 'maintain' | 'gain';
  selected: boolean;
  onPress: () => void;
}

export default function GoalCard({ label, iconName, selected, onPress }: GoalCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
        <Ionicons name={iconName as React.ComponentProps<typeof Ionicons>['name']} size={28} color={selected ? PRIMARY : '#757575'} />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 8, borderRadius: 16, borderWidth: 2, marginHorizontal: 4 },
  cardUnselected: { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  cardSelected: { borderColor: PRIMARY, backgroundColor: 'rgba(76,175,80,0.1)' },
  cardPressed: { opacity: 0.85 },
});
```

**ExerciseCard differs** — row layout (not column), no selection state, has thumbnail area (80x80 bg-surface), difficulty tag pill, `onPress` navigates. Props: `{ exercise: IExercise, onPress: () => void }`.

---

### `mobile/src/components/ui/CategoryFilterChip.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx`

**Active/inactive state toggle** from GoalCard lines 28-43:
```typescript
style={({ pressed }) => [
  styles.card,
  selected ? styles.cardSelected : styles.cardUnselected,
  pressed && styles.cardPressed,
]}
```

Props: `{ label: string, active: boolean, onPress: () => void }`. Chip is smaller than GoalCard — horizontal pill, `paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20`. Active: `bg-primary` + white text. Inactive: `bg-surface` + border + text-text.

---

### `mobile/src/components/ui/WeeklyStatCard.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx` (card shell)

Simple display card, no interaction. Props: `{ label: string, value: string | number, unit?: string }`. Uses GoalCard's `borderRadius: 16, backgroundColor: '#FFFFFF'` pattern but no Pressable — use plain `View`.

---

### `mobile/src/components/ui/DailyChallengeCard.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx` (card shell)

Display card with progress bar. Props: `{ targetKcal: number, currentKcal: number }`. Progress bar: `View` with fixed height 8dp, `bg-background` track, `bg-primary` fill via `width: \`${(currentKcal/targetKcal)*100}%\`` style. Borderless card with `bg-surface` + shadow.

---

### `mobile/src/components/ui/TimerDisplay.tsx` (component, event-driven)

**Analog:** `mobile/src/components/ui/PrimaryButton.tsx` (structure only)

**ActivityIndicator/conditional render pattern** from PrimaryButton lines 40-56:
```typescript
{loading ? (
  <ActivityIndicator color={variant === 'filled' ? '#FFFFFF' : PRIMARY} size="small" />
) : (
  <Text style={[styles.label, ...]}>{ label }</Text>
)}
```

Props: `{ remainingSeconds: number, totalSeconds: number }`. Renders countdown MM:SS as `Text` at 80dp font size. On orange background — all text white. `accessibilityLiveRegion="assertive"` on the Text node (UI-SPEC accessibility requirement).

Format helper:
```typescript
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
```

---

### `mobile/src/components/ui/TimerControls.tsx` (component, event-driven)

**Analog:** `mobile/src/components/ui/PrimaryButton.tsx`

**Pressable + accessibilityRole pattern** (PrimaryButton lines 29-39):
```typescript
<Pressable
  onPress={isDisabled ? undefined : onPress}
  accessibilityRole="button"
  accessibilityState={{ busy: loading, disabled: isDisabled }}
  style={({ pressed }) => [styles.base, isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed]}
>
```

Props: `{ onPause: () => void, onResume: () => void, onStop: () => void, isPaused: boolean }`. Renders 2 icon Pressables with Ionicons (stop-circle-outline, pause/play-circle-outline). 44dp minimum touch target. `accessibilityLabel` in Vietnamese: "Tạm dừng" / "Tiếp tục" / "Dừng".

---

### `mobile/src/components/ui/HabitRow.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx`

**Pressable + state pattern** (GoalCard lines 24-43). Props: `{ habit: { id: string, name: string, iconName: string }, isCompletedToday: boolean, onCheckIn: () => void }`. Row layout (flexDirection: 'row') 72dp tall. Left: icon + name. Right: "Đánh dấu +1" Pressable (disabled when `isCompletedToday`). When completed: show `checkmark-circle` Ionicon in PRIMARY color. `accessibilityState={{ disabled: isCompletedToday }}`.

---

### `mobile/src/components/ui/HabitHeatmap.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx` (card shell — no selection)

Props: `{ weekData: { date: string, qualified: boolean }[] }`. Renders a `View` with `flexDirection: 'row'`, 7 child `View` cells, each 36x36dp, `borderRadius: 18` (circle), `bg-habit-active` (#4CAF50) or `bg-habit-inactive` (#E0E0E0). Day labels T2–CN below each cell, Label/14/400 text-text-secondary. Non-interactive.

---

### `mobile/src/components/ui/StreakBadge.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx` (iconWrapper pattern)

Props: `{ streakDays: number }`. Small badge — `flexDirection: 'row'`, flame icon (Ionicons `flame-outline`) at ACCENT color (#FF6B35), streak count text Label/14/700. GoalCard iconWrapper pattern (lines 34-43) for the rounded icon container.

---

### `mobile/src/components/ui/BMIResultCard.tsx` (component, request-response)

**Analog:** `mobile/src/components/ui/GoalCard.tsx` (card shell)

Props: `{ bmi: number, category: 'underweight' | 'normal' | 'overweight' | 'obese' }`. Card with `bg-surface, borderRadius: 16, shadow`. BMI score in Heading/20/700 primary color. Category label in Body/16/400. Contains BMIScaleBar as child component.

---

### `mobile/src/components/ui/BMIScaleBar.tsx` (component, request-response)

**Analog:** DailyChallengeCard progress bar (derived pattern — no existing analog)

Props: `{ bmi: number }`. Horizontal bar, 4 color segments (bmi-underweight/normal/overweight/obese), 8dp height, rounded ends. Position dot: white circle 16dp, bordered with primary color, positioned at `left: ${clamp((bmi-15)/25 * 100, 0, 100)}%`. Uses `StyleSheet.create` for segments, inline `style` for dynamic dot position.

---

### `mobile/src/components/ui/BMIChart.tsx` (component, request-response)

**Analog:** None — no chart component exists in codebase.

**Planner note:** Must select and install chart library. UI-SPEC suggests `react-native-gifted-charts` or `victory-native`. Props: `{ records: { date: string, bmi: number }[] }`. Bar color `#4CAF50` (bmi-normal). Y-axis: BMI value. X-axis: date labels every 7 days (D-55 aggregation: last value per day).

---

### `mobile/src/stores/timerStore.ts` (store, event-driven)

**Analog:** `mobile/src/lib/auth/auth-store.ts`

**Full Zustand store pattern** (lines 1-20):
```typescript
import { create } from 'zustand';
import type { IAuthUser } from '../api/types';

interface AuthState {
  user: IAuthUser | null;
  accessToken: string | null;
  setUser: (user: IAuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null }),
}));
```

**Apply to timerStore.ts:**
```typescript
import { create } from 'zustand';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  exerciseId: string | null;
  start: (exerciseId: string, durationSeconds: number) => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  isRunning: false,
  isPaused: false,
  remainingSeconds: 0,
  exerciseId: null,
  start: (exerciseId, durationSeconds) =>
    set({ isRunning: true, isPaused: false, remainingSeconds: durationSeconds, exerciseId }),
  pause: () => set({ isRunning: false, isPaused: true }),
  resume: () => set({ isRunning: true, isPaused: false }),
  tick: () => set((s) => ({ remainingSeconds: Math.max(0, s.remainingSeconds - 1) })),
  reset: () => set({ isRunning: false, isPaused: false, remainingSeconds: 0, exerciseId: null }),
}));
```

---

### `mobile/src/lib/api/exercises.api.ts` (utility, request-response)

**Analog:** `mobile/src/lib/api/auth.api.ts`

**Full API function pattern** (lines 1-18):
```typescript
import apiClient from './client';
import type { LoginRequest, LoginResponse } from './types';

export async function registerApi(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<{ success: boolean; data: RegisterResponse }>(
    '/api/auth/register',
    body,
  );
  return res.data.data;
}
```

**Apply to exercises.api.ts:**
```typescript
import apiClient from './client';
import type { IExercise } from './types';

export async function listExercisesApi(category?: string): Promise<IExercise[]> {
  const params = category ? { category } : {};
  const res = await apiClient.get<{ success: boolean; data: IExercise[] }>('/api/exercises', { params });
  return res.data.data;
}

export async function getExerciseApi(id: string): Promise<IExercise> {
  const res = await apiClient.get<{ success: boolean; data: IExercise }>(`/api/exercises/${id}`);
  return res.data.data;
}
```

**workouts.api.ts, habits.api.ts, bmi.api.ts** follow identical pattern — `apiClient.post/get/patch` returning `res.data.data`.

---

## Shared Patterns

### JWT Authentication Middleware
**Source:** `backend/src/middleware/auth.middleware.ts` (lines 1-45)
**Apply to:** ALL Phase 3 backend route files — every route is protected
```typescript
import { authenticate } from '../../middleware/auth.middleware';
import type { AuthRequest } from '../../middleware/auth.middleware';

// In routes:
router.get('/', authenticate, controller.list);

// In controllers — extract userId:
const userId = (req as AuthRequest).user.id;
```

### Error Factory + Error Middleware
**Source:** `backend/src/api/auth/auth.service.ts` (lines 70-74) + `backend/src/middleware/error.middleware.ts` (lines 1-42)
**Apply to:** All service files — throw `makeError(message, statusCode)` and let `errorMiddleware` in `app.ts` handle it
```typescript
function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
```

### Response Shape
**Source:** `backend/src/utils/response.ts` (lines 1-9)
**Apply to:** All controllers — never call `res.json()` directly
```typescript
import { success, error } from '../../utils/response';
// success: { success: true, data: T }
// error:   { success: false, error: string }
success(res, result, 201);  // created
success(res, result);       // 200 default
error(res, 'message', 400);
```

### Zod Validation in Controller
**Source:** `backend/src/api/auth/auth.controller.ts` (lines 7-17)
**Apply to:** All controller handlers that accept body/query input
```typescript
const parsed = schema.safeParse(req.body /* or req.query */);
if (!parsed.success) {
  error(res, parsed.error.errors[0].message, 400);
  return;
}
```

### Axios API Client
**Source:** `mobile/src/lib/api/client.ts` (lines 28-35)
**Apply to:** All mobile API files — import `apiClient` from `./client`, never create a new axios instance. Response data is always at `res.data.data`.
```typescript
import apiClient from './client';
const res = await apiClient.get<{ success: boolean; data: T }>(url);
return res.data.data;
```

### Color Token Imports
**Source:** `mobile/src/constants/colors.ts` (lines 1-8)
**Apply to:** All mobile screens and components — import named constants, never hardcode hex in `StyleSheet.create`
```typescript
import { PRIMARY, ACCENT, BACKGROUND, SURFACE, TEXT, TEXT_SECONDARY } from '../../../constants/colors';
// Or for components: '../../constants/colors'
```

### Pressable Interaction States
**Source:** `mobile/src/components/ui/PrimaryButton.tsx` (lines 29-56) + `mobile/src/components/ui/GoalCard.tsx` (lines 24-43)
**Apply to:** All tappable components (CategoryFilterChip, HabitRow, TimerControls, ExerciseCard)
```typescript
style={({ pressed }) => [
  styles.base,
  isDisabled && styles.disabled,
  pressed && !isDisabled && styles.pressed,
]}
// disabled: opacity: 0.5
// pressed: opacity: 0.85
accessibilityRole="button"
accessibilityState={{ disabled: isDisabled }}
```

### Ionicons Icon Pattern
**Source:** `mobile/src/components/ui/GoalCard.tsx` (lines 36-40) + `mobile/src/components/ui/ScreenHeader.tsx` (lines 31-33)
**Apply to:** All components using icons
```typescript
import { Ionicons } from '@expo/vector-icons';
<Ionicons
  name={iconName as React.ComponentProps<typeof Ionicons>['name']}
  size={24}
  color={PRIMARY}
/>
```

### TanStack Query Data Fetching
**Source:** `mobile/src/lib/query/query-client.ts` (lines 1-15) + `mobile/src/providers/AuthProvider.tsx` patterns
**Apply to:** All screens needing server data — `useQuery` for reads, `useMutation` for writes
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Read:
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['exercises', activeCategory],
  queryFn: () => listExercisesApi(activeCategory),
});

// Write with optimistic update + invalidation:
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: checkInHabitApi,
  onMutate: async (habitId) => { /* optimistic */ },
  onError: (err, habitId, context) => { /* rollback */ },
  onSettled: () => qc.invalidateQueries({ queryKey: ['habits', 'today'] }),
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `mobile/src/components/ui/BMIChart.tsx` | component | request-response | No chart library used in codebase yet — new dependency (react-native-gifted-charts or victory-native) |
| `backend/src/scripts/seed-exercises.ts` | utility | batch | No seed scripts exist — planner must define Node.js + ts-node direct-connect pattern |

---

## Metadata

**Analog search scope:** `backend/src/api/`, `backend/src/middleware/`, `backend/src/utils/`, `backend/src/models/`, `mobile/src/app/`, `mobile/src/components/ui/`, `mobile/src/lib/`, `mobile/src/providers/`, `mobile/src/constants/`
**Files scanned:** 28 (full reads)
**Pattern extraction date:** 2026-05-18
