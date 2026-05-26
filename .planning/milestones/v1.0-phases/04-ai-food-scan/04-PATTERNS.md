# Phase 4: AI Food Scan — Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 27 new/modified files
**Analogs found:** 25 / 27

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/src/models/FoodLog.ts` | model | CRUD | `backend/src/models/FoodLog.ts` (self — update) | self |
| `backend/src/models/FoodItem.ts` | model | CRUD | `backend/src/models/Exercise.ts` | exact |
| `backend/src/services/ai-food.service.ts` | service | request-response | `backend/src/api/bmi/bmi.service.ts` | role-match |
| `backend/src/api/food/food.routes.ts` | route | request-response | `backend/src/api/habits/habits.routes.ts` | exact |
| `backend/src/api/food/food.controller.ts` | controller | request-response | `backend/src/api/habits/habits.controller.ts` | exact |
| `backend/src/api/food/food.service.ts` | service | CRUD | `backend/src/api/habits/habits.service.ts` | exact |
| `backend/src/api/food/food.validation.ts` | utility | request-response | `backend/src/api/bmi/bmi.validation.ts` | exact |
| `backend/src/scripts/seed-foods.ts` | utility | batch | `backend/src/scripts/seed-exercises.ts` | exact |
| `mobile/src/app/(food)/_layout.tsx` | config | request-response | `mobile/src/app/(auth)/_layout.tsx` | exact |
| `mobile/src/app/(food)/scan.tsx` | component | request-response | `mobile/src/app/(tabs)/exercises/[id]/timer.tsx` | role-match |
| `mobile/src/app/(food)/result.tsx` | component | request-response | `mobile/src/app/(tabs)/bmi/index.tsx` | role-match |
| `mobile/src/app/(food)/search.tsx` | component | request-response | `mobile/src/app/(tabs)/exercises/index.tsx` | role-match |
| `mobile/src/app/(food)/diary.tsx` | component | CRUD | `mobile/src/app/(tabs)/habits/index.tsx` | role-match |
| `mobile/src/lib/api/food.api.ts` | utility | request-response | `mobile/src/lib/api/bmi.api.ts` | exact |
| `mobile/src/stores/foodScanStore.ts` | store | event-driven | `mobile/src/stores/timerStore.ts` | exact |
| `mobile/src/components/ui/ScanFrame.tsx` | component | — | `mobile/src/components/ui/TimerDisplay.tsx` | role-match |
| `mobile/src/components/ui/CameraControls.tsx` | component | event-driven | `mobile/src/components/ui/TimerControls.tsx` | exact |
| `mobile/src/components/ui/NutritionSummaryCard.tsx` | component | — | `mobile/src/components/ui/BMIResultCard.tsx` | role-match |
| `mobile/src/components/ui/NutritionDetailRow.tsx` | component | — | `mobile/src/components/ui/HabitRow.tsx` | role-match |
| `mobile/src/components/ui/FoodTagPill.tsx` | component | — | `mobile/src/components/ui/CategoryFilterChip.tsx` | exact |
| `mobile/src/components/ui/FoodSearchBar.tsx` | component | request-response | `mobile/src/components/ui/AuthInput.tsx` | role-match |
| `mobile/src/components/ui/FoodDiaryItem.tsx` | component | CRUD | `mobile/src/components/ui/ExerciseCard.tsx` | exact |
| `mobile/src/components/ui/DatePill.tsx` | component | — | `mobile/src/components/ui/CategoryFilterChip.tsx` | exact |
| `mobile/src/components/ui/ServingSizeSheet.tsx` | component | request-response | `mobile/src/components/ui/PrimaryButton.tsx` | partial |
| `mobile/src/app/(tabs)/index.tsx` | component | request-response | `mobile/src/app/(tabs)/index.tsx` (self — update) | self |
| `mobile/src/lib/api/types.ts` | utility | — | `mobile/src/lib/api/types.ts` (self — extend) | self |
| `backend/src/app.ts` | config | — | `backend/src/app.ts` (self — one line add) | self |

---

## Pattern Assignments

### `backend/src/models/FoodLog.ts` (model, CRUD — update)

**Analog:** self (existing file, needs modification)

**Current state** (`backend/src/models/FoodLog.ts` lines 1–60):
The existing scaffold has `mealType` as required enum and is missing `sodium`/`vitaminC` in the foods subdocument.

**Required changes (D-61, D-63):**
- Remove `mealType` from `IFoodLog` interface (line 6)
- Remove `mealType` from Schema definition (line 33)
- Add `sodium: number` and `vitaminC: number` to `IFoodLog` interface foods array
- Add `sodium: { type: Number, default: 0 }` and `vitaminC: { type: Number, default: 0 }` to foods subdocument

**Existing compound index pattern** (`backend/src/models/FoodLog.ts` line 58):
```typescript
FoodLogSchema.index({ userId: 1, date: -1 });
```
Keep this index — it is already correct.

---

### `backend/src/models/FoodItem.ts` (model, CRUD — new)

**Analog:** `backend/src/models/Exercise.ts`

**Imports pattern** (lines 1):
```typescript
import mongoose, { Document, Schema } from 'mongoose';
```

**Interface + Schema pattern** (Exercise.ts lines 1–46 — copy structure, adapt fields):
```typescript
export interface IFoodItem extends Document {
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
```

**Schema + index pattern** (Exercise.ts lines 22–46):
```typescript
const FoodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true },
    nameEn: String,
    kcalPer100g: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    vitaminC: { type: Number, default: 0 },
    category: String,
    source: { type: String, enum: ['openfoods', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

// Text index with default_language: 'none' for Vietnamese diacritics (Pitfall 8)
FoodItemSchema.index(
  { name: 'text', nameEn: 'text' },
  { default_language: 'none' }
);

export default mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);
```

---

### `backend/src/services/ai-food.service.ts` (service, request-response — implement)

**Analog:** `backend/src/api/bmi/bmi.service.ts` (error helper pattern) + RESEARCH.md Pattern 1

**Imports pattern:**
```typescript
import OpenAI from 'openai';
```

**Error helper pattern** (bmi.service.ts lines 25–29):
```typescript
function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
```

**Updated NutritionResult interface** (ai-food.service.ts lines 3–22 — replace entirely):
```typescript
export interface NutritionResult {
  foods: Array<{
    name: string;
    weightG: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;      // NEW D-60
    vitaminC: number;    // NEW D-60
    tags: string[];      // NEW D-60
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string | null;  // null in Phase 4 per D-62
}
```

**Core analyzeImage implementation** (replace stub at lines 24–29):
```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeImage(imageBuffer: Buffer): Promise<NutritionResult> {
  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Bạn là chuyên gia dinh dưỡng. Phân tích ảnh bữa ăn và trả về JSON:
{"foods":[{"name":"string","weightG":0,"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0,"vitaminC":0,"tags":["string"]}],"totals":{"calories":0,"protein":0,"carbs":0,"fat":0}}`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Phân tích các món ăn trong ảnh và trả về thông tin dinh dưỡng.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw makeError('Không nhận dạng được thức ăn trong ảnh', 422);

  const parsed = JSON.parse(content) as NutritionResult;
  // Normalize: default missing numeric fields to 0 (Pitfall 5)
  if (!parsed.foods?.length) throw makeError('Không nhận dạng được thức ăn trong ảnh', 422);
  parsed.foods = parsed.foods.map((f) => ({
    ...f,
    sodium: f.sodium ?? 0,
    vitaminC: f.vitaminC ?? 0,
    tags: f.tags ?? [],
  }));
  return { ...parsed, aiProvider: 'openai', imageUrl: null };
}
```

---

### `backend/src/api/food/food.routes.ts` (route, request-response — new)

**Analog:** `backend/src/api/habits/habits.routes.ts`

**Full pattern** (habits.routes.ts lines 1–12):
```typescript
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import * as foodController from './food.controller';

const router = Router();

router.post('/scan', authenticate, uploadSingle, foodController.scanFood);
router.post('/logs', authenticate, foodController.saveFoodLog);
router.get('/logs', authenticate, foodController.getFoodLogs);
router.delete('/logs/:id', authenticate, foodController.deleteFoodLog);
router.get('/items', authenticate, foodController.searchFoodItems);

export default router;
```

**Note on uploadSingle:** Import from `../../middleware/upload.middleware` — the multer memory storage middleware already exists (upload.middleware.ts line 11: `export const uploadSingle = upload.single('image')`).

---

### `backend/src/api/food/food.controller.ts` (controller, request-response — new)

**Analog:** `backend/src/api/habits/habits.controller.ts` + `backend/src/api/bmi/bmi.controller.ts`

**Imports pattern** (habits.controller.ts lines 1–5):
```typescript
import { Request, Response } from 'express';
import * as foodService from './food.service';
import { saveFoodLogSchema, searchItemsSchema } from './food.validation';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
```

**Zod validation + userId extraction pattern** (habits.controller.ts lines 7–17 / bmi.controller.ts lines 7–26):
```typescript
export async function saveFoodLog(req: Request, res: Response): Promise<void> {
  const parsed = saveFoodLogSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }
  const userId = (req as AuthRequest).user.id;
  try {
    const result = await foodService.saveFoodLog(userId, parsed.data);
    success(res, result, 201);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}
```

**scanFood controller** (uses multer req.file — unique pattern):
```typescript
export async function scanFood(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    error(res, 'Vui lòng gửi ảnh để phân tích', 400);
    return;
  }
  const userId = (req as AuthRequest).user.id;
  try {
    // Rate limit check (D-72)
    const limited = await foodService.checkScanRateLimit(userId);
    if (limited) {
      error(res, 'Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai.', 429);
      return;
    }
    const result = await analyzeImage(req.file.buffer);
    success(res, result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi phân tích ảnh', e.statusCode ?? 500);
  }
}
```

**Query param controller** (GET with req.query):
```typescript
export async function getFoodLogs(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const date = req.query.date as string | undefined;
  try {
    const logs = await foodService.getFoodLogsForDate(userId, date ?? new Date().toISOString().slice(0, 10));
    success(res, logs);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    error(res, e.message ?? 'Lỗi server', e.statusCode ?? 500);
  }
}
```

---

### `backend/src/api/food/food.service.ts` (service, CRUD — new)

**Analog:** `backend/src/api/habits/habits.service.ts`

**Imports pattern** (habits.service.ts lines 1–4):
```typescript
import mongoose from 'mongoose';
import FoodLog from '../../models/FoodLog';
import FoodItem from '../../models/FoodItem';
import { vietnamDayStart } from '../../utils/date';
```

**makeError helper pattern** (habits.service.ts lines 6–10):
```typescript
function makeError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
```

**Date-range query pattern** (habits.service.ts lines 12–22 → adapt for FoodLog):
```typescript
export async function getFoodLogsForDate(userId: string, dateStr: string) {
  const dayStart = vietnamDayStart(new Date(dateStr));
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  return FoodLog
    .find({ userId: new mongoose.Types.ObjectId(userId), date: { $gte: dayStart, $lt: dayEnd } })
    .sort({ createdAt: -1 })
    .lean();
}
```

**Rate limit count pattern** (D-72, uses vietnamDayStart):
```typescript
export async function checkScanRateLimit(userId: string): Promise<boolean> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const count = await FoodLog.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: todayStart, $lt: tomorrowStart },
    aiProvider: { $ne: 'manual' },
  });
  return count >= 20;
}
```

**Text search pattern** (D-67):
```typescript
export async function searchFoodItems(query: string) {
  if (!query || query.trim().length < 2) return [];
  return FoodItem
    .find(
      { $text: { $search: query.trim() } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();
}
```

---

### `backend/src/api/food/food.validation.ts` (utility, request-response — new)

**Analog:** `backend/src/api/bmi/bmi.validation.ts`

**Pattern** (bmi.validation.ts lines 1–12):
```typescript
import { z } from 'zod';

export const saveFoodLogSchema = z.object({
  foods: z.array(z.object({
    name: z.string().min(1),
    weightG: z.number().optional(),
    calories: z.number().min(0),
    protein: z.number().min(0).default(0),
    carbs: z.number().min(0).default(0),
    fat: z.number().min(0).default(0),
    fiber: z.number().min(0).default(0),
    sugar: z.number().min(0).default(0),
    sodium: z.number().min(0).default(0),
    vitaminC: z.number().min(0).default(0),
    tags: z.array(z.string()).default([]),
  })).min(1, 'Cần ít nhất 1 món ăn'),
  totals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0).default(0),
    carbs: z.number().min(0).default(0),
    fat: z.number().min(0).default(0),
  }),
  aiProvider: z.enum(['openai', 'logmeal', 'manual']).default('manual'),
  date: z.string().datetime().optional(),
}).strict();

export const searchItemsSchema = z.object({
  q: z.string().min(2, 'Từ khóa phải có ít nhất 2 ký tự'),
});
```

---

### `backend/src/scripts/seed-foods.ts` (utility, batch — new)

**Analog:** `backend/src/scripts/seed-exercises.ts`

**Top of file + connect pattern** (seed-exercises.ts lines 1–3, 1720–1737):
```typescript
import 'dotenv/config';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem';

// Static Vietnamese food data — committed as src/scripts/data/vietnamese-foods.json
// (Pitfall 4: do NOT download 9GB OpenFoodFacts CSV; use committed JSON file)
import FOODS from './data/vietnamese-foods.json';

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(process.env.MONGODB_URI);

  // Idempotency check — threshold 50 (D-66)
  const existing = await FoodItem.countDocuments({});
  if (existing >= 50) {
    console.log(`Đã có đủ món ăn, bỏ qua seed (count=${existing}).`);
    await mongoose.disconnect();
    return;
  }

  const result = await FoodItem.insertMany(FOODS, { ordered: false });
  console.log(`Đã seed ${result.length} món ăn.`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Key difference vs seed-exercises.ts:** threshold is `50` (D-66), not `100`. Data source is a committed JSON file, not inline array.

---

### `mobile/src/app/(food)/_layout.tsx` (config, — new)

**Analog:** `mobile/src/app/(auth)/_layout.tsx`

**Full pattern** (auth/_layout.tsx lines 1–8):
```typescript
import { Stack } from 'expo-router';
import React from 'react';

export default function FoodLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```
Identical structure — just change function name from `AuthLayout` to `FoodLayout`.

---

### `mobile/src/app/(food)/scan.tsx` (component, request-response — new)

**Analog:** `mobile/src/app/(tabs)/exercises/[id]/timer.tsx` (uses a Zustand store + async operation that navigates on completion)

**Imports + store pattern** (timer.tsx lines 1–9):
```typescript
import React, { useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { scanFoodApi } from '../../lib/api/food.api';
```

**Zustand write + navigate on completion pattern** (timer.tsx lines 52–58):
```typescript
// After scan completes:
foodScanStore.setScanResult(result);
router.push('/(food)/result');
```

**Dark theme pattern:** Apply `backgroundColor: '#000'` (from CONTEXT.md specifics) — the existing `TIMER_BG = '#FF6B35'` from timer.tsx shows how to set a non-standard screen background color via `StyleSheet.create`.

**AppState pattern** (timer.tsx lines 43–50): Not needed for camera screen, but the `useRef` for camera ref follows same ref pattern:
```typescript
const cameraRef = useRef<CameraView>(null);
```

---

### `mobile/src/app/(food)/result.tsx` (component, request-response — new)

**Analog:** `mobile/src/app/(tabs)/bmi/index.tsx`

**TanStack Query mutation pattern** (bmi/index.tsx lines 75–97):
```typescript
const mutation = useMutation({
  mutationFn: () => saveFoodLogApi(scanResult),
  onSuccess: () => {
    foodScanStore.clearScan();
    qc.invalidateQueries({ queryKey: ['food', 'logs'] });
    router.replace('/(food)/diary');
  },
  onError: () => {
    setSaveError('Không thể lưu bữa ăn. Kiểm tra kết nối và thử lại.');
  },
});
```

**PrimaryButton usage pattern** (bmi/index.tsx lines 150–155):
```typescript
<PrimaryButton
  label="Xác nhận & Lưu"
  loading={mutation.isPending}
  onPress={() => mutation.mutate()}
/>
```

**Zustand read pattern** — read from store (not router params, per anti-pattern note):
```typescript
const { scanResult, clearScan } = useFoodScanStore();
```

**"Chụp lại" back pattern:**
```typescript
const handleRetake = (): void => {
  clearScan();
  router.back();
};
```

---

### `mobile/src/app/(food)/search.tsx` (component, request-response — new)

**Analog:** `mobile/src/app/(tabs)/exercises/index.tsx`

**TanStack Query with dynamic queryKey pattern** (exercises/index.tsx lines 43–52):
```typescript
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['food', 'items', searchQuery],
  queryFn: () => searchFoodItemsApi(searchQuery),
  enabled: searchQuery.length >= 2,  // only fire when 2+ chars
});
```

**FlatList pattern** (exercises/index.tsx — FlatList with renderItem):
```typescript
<FlatList
  data={data ?? []}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => (
    <FoodDiaryItem item={item} onPress={() => handleSelect(item)} />
  )}
/>
```

**Debounce pattern** — 300ms per D-67:
```typescript
const [inputValue, setInputValue] = useState('');
const [searchQuery, setSearchQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setSearchQuery(inputValue), 300);
  return () => clearTimeout(timer);
}, [inputValue]);
```

---

### `mobile/src/app/(food)/diary.tsx` (component, CRUD — new)

**Analog:** `mobile/src/app/(tabs)/habits/index.tsx`

**useQuery for date-based fetch pattern** (habits/index.tsx lines 49–61):
```typescript
const { data: logs, isLoading, isError, refetch } = useQuery({
  queryKey: ['food', 'logs', selectedDate],
  queryFn: () => getFoodLogsApi(selectedDate),
});
```

**Loading/error/empty states pattern** (habits/index.tsx lines 100–116):
```typescript
if (isLoading) return Array.from({ length: 3 }).map((_, i) => <View key={i} style={styles.skeleton} />);
if (isError) return <View style={styles.errorContainer}>...</View>;
```

**ScrollView + SafeAreaView wrapper** (habits/index.tsx lines 139–143):
```typescript
<SafeAreaView style={styles.safeArea}>
  <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
```

---

### `mobile/src/lib/api/food.api.ts` (utility, request-response — new)

**Analog:** `mobile/src/lib/api/bmi.api.ts`

**Standard API function pattern** (bmi.api.ts lines 1–17):
```typescript
import apiClient from './client';
import type { IScanFoodResponse, IFoodLog, IFoodItem, ISaveFoodLogRequest } from './types';

export async function scanFoodApi(imageUri: string): Promise<IScanFoodResponse> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'meal.jpg',
  } as any);  // React Native FormData shape

  const res = await apiClient.post<{ success: boolean; data: IScanFoodResponse }>(
    '/api/food/scan',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,  // OpenAI vision 10-25s (Pitfall 2 — override default 10s)
    }
  );
  return res.data.data;
}

export async function saveFoodLogApi(body: ISaveFoodLogRequest): Promise<IFoodLog> {
  const res = await apiClient.post<{ success: boolean; data: IFoodLog }>(
    '/api/food/logs',
    body,
  );
  return res.data.data;
}

export async function getFoodLogsApi(date: string): Promise<IFoodLog[]> {
  const res = await apiClient.get<{ success: boolean; data: IFoodLog[] }>(
    `/api/food/logs?date=${date}`,
  );
  return res.data.data;
}

export async function searchFoodItemsApi(q: string): Promise<IFoodItem[]> {
  const res = await apiClient.get<{ success: boolean; data: IFoodItem[] }>(
    `/api/food/items?q=${encodeURIComponent(q)}`,
  );
  return res.data.data;
}

export async function deleteFoodLogApi(id: string): Promise<void> {
  await apiClient.delete(`/api/food/logs/${id}`);
}
```

**Critical:** `timeout: 30000` on the scan POST only — do not change global client default.

---

### `mobile/src/stores/foodScanStore.ts` (store, event-driven — new)

**Analog:** `mobile/src/stores/timerStore.ts`

**Full pattern** (timerStore.ts lines 1–27 — copy structure exactly):
```typescript
import { create } from 'zustand';
import type { IScanFoodResponse } from '../lib/api/types';

interface FoodScanState {
  scanResult: IScanFoodResponse | null;
  isScanning: boolean;
  pendingImageUri: string | null;
  setScanResult: (result: IScanFoodResponse) => void;
  setIsScanning: (v: boolean) => void;
  setPendingImageUri: (uri: string | null) => void;
  clearScan: () => void;
}

export const useFoodScanStore = create<FoodScanState>((set) => ({
  scanResult: null,
  isScanning: false,
  pendingImageUri: null,
  setScanResult: (result) => set({ scanResult: result, isScanning: false }),
  setIsScanning: (v) => set({ isScanning: v }),
  setPendingImageUri: (uri) => set({ pendingImageUri: uri }),
  clearScan: () => set({ scanResult: null, isScanning: false, pendingImageUri: null }),
}));
```

**Key difference vs timerStore:** Actions are simpler (no tick loop). Pattern is identical `create<State>((set) => ({ ... }))`.

---

### `mobile/src/components/ui/FoodTagPill.tsx` (component — new)

**Analog:** `mobile/src/components/ui/CategoryFilterChip.tsx`

**Full pattern** (CategoryFilterChip.tsx lines 1–55):
```typescript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PRIMARY } from '../../constants/colors';

interface FoodTagPillProps {
  label: string;
}

export default function FoodTagPill({ label }: FoodTagPillProps): React.JSX.Element {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(76,175,80,0.12)',
    marginRight: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
});
```

**Key difference vs CategoryFilterChip:** No `active` prop, no `onPress` — FoodTagPill is display-only.

---

### `mobile/src/components/ui/DatePill.tsx` (component — new)

**Analog:** `mobile/src/components/ui/CategoryFilterChip.tsx`

**Pattern** (CategoryFilterChip.tsx lines 1–55 — nearly identical, rename props):
```typescript
interface DatePillProps {
  label: string;       // e.g. "Hôm nay", "19/05"
  active: boolean;
  onPress: () => void;
}
```
`active` prop drives `chipActive` / `chipInactive` styles exactly as in `CategoryFilterChip`.

---

### `mobile/src/components/ui/CameraControls.tsx` (component, event-driven — new)

**Analog:** `mobile/src/components/ui/TimerControls.tsx`

**Pattern** — pure presentational component with callback props:
```typescript
interface CameraControlsProps {
  onCapture: () => void;
  onGallery: () => void;
  onFlashToggle: () => void;
  flashOn: boolean;
  disabled?: boolean;
}
```
Follow TimerControls pattern of a `View` row with `Pressable` buttons that accept `onPress` callbacks. Use `Ionicons` for icons (`flash`, `image`, `radio-button-on`).

---

### `mobile/src/components/ui/NutritionSummaryCard.tsx` (component — new)

**Analog:** `mobile/src/components/ui/BMIResultCard.tsx`

**Card structure pattern** — white card with `backgroundColor: SURFACE`, `borderRadius: 16`, `padding: 16` matching the card style used throughout bmi/index.tsx:
```typescript
// From bmi/index.tsx styles.slidersCard:
slidersCard: {
  backgroundColor: SURFACE,
  borderRadius: 16,
  marginHorizontal: 16,
  marginTop: 16,
  padding: 16,
},
```
Shows total kcal prominently (green text) + 3-column row for Protein/Carbs/Fat.

---

### `mobile/src/components/ui/NutritionDetailRow.tsx` (component — new)

**Analog:** `mobile/src/components/ui/HabitRow.tsx`

**Row layout pattern** (HabitRow.tsx lines 22–58):
```typescript
// flexDirection: 'row', height: fixed, paddingHorizontal: 16
// Left: colored label text, Right: value text
<View style={styles.row}>
  <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
  <Text style={styles.value}>{value}</Text>
</View>
```
Simpler than HabitRow (no icon, no button) — just a 2-column row for micro-nutrients.

---

### `mobile/src/components/ui/FoodDiaryItem.tsx` (component, CRUD — new)

**Analog:** `mobile/src/components/ui/ExerciseCard.tsx`

**Card + Pressable pattern** (ExerciseCard.tsx lines 45–76):
```typescript
<Pressable
  onPress={onPress}
  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
>
  <View style={styles.info}>
    <Text style={styles.name}>{item.name}</Text>
    <View style={styles.metaRow}>
      <Ionicons name="flame-outline" size={14} color={TEXT_SECONDARY} />
      <Text style={styles.metaText}>{item.calories} kcal</Text>
    </View>
  </View>
</Pressable>
```

**Shadow pattern** (ExerciseCard.tsx styles.card lines 79–91):
```typescript
card: {
  backgroundColor: SURFACE,
  borderRadius: 16,
  padding: 12,
  marginHorizontal: 16,
  marginVertical: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
},
```

---

### `mobile/src/components/ui/FoodSearchBar.tsx` (component, request-response — new)

**Analog:** `mobile/src/components/ui/AuthInput.tsx`

Controlled `TextInput` with search icon left, `onChangeText` callback, `returnKeyType="search"`. Follow AuthInput component prop pattern with `value`, `onChangeText`, `placeholder`. Add `Ionicons name="search-outline"` prefix icon in a row container.

---

### `mobile/src/components/ui/ScanFrame.tsx` (component — new)

**Analog:** `mobile/src/components/ui/TimerDisplay.tsx`

Pure presentational component with no props — renders a centered overlay `View` with corner bracket borders. Uses `StyleSheet.create` with `position: 'absolute'` overlay. No interaction, no state. Border color: `'#FFFFFF'` or PRIMARY green.

---

### `mobile/src/components/ui/ServingSizeSheet.tsx` (component, request-response — new)

**No exact analog.** Closest: `mobile/src/components/ui/PrimaryButton.tsx` for button style inside the sheet, and the modal/alert pattern from `mobile/src/app/(tabs)/index.tsx` (`Alert.alert` with confirm/cancel).

For Phase 4 MVP, implement as a `Modal` with `animationType="slide"` (bottom sheet approximation) containing a `TextInput` for grams and a `PrimaryButton` for confirm. Full bottom sheet library deferred.

---

### `mobile/src/app/(tabs)/index.tsx` (update — add 2 temp buttons per D-69)

**Existing pattern** (index.tsx lines 1–62):
Add two `PrimaryButton` components below the existing logout button:
```typescript
import { useRouter } from 'expo-router';
// ...
const router = useRouter();
// ...
<PrimaryButton label="Quét bữa ăn" onPress={() => router.push('/(food)/scan')} />
<PrimaryButton label="Nhật ký ăn" onPress={() => router.push('/(food)/diary')} />
```
These are temporary (removed in Phase 5 per D-69).

---

### `mobile/src/lib/api/types.ts` (extend — add Phase 4 types)

**Existing pattern** (types.ts lines 33–111 — follow Phase 3 type grouping):
```typescript
// ---------------------------------------------------------------------------
// Phase 4 Types
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
  tags: string[];
}

export interface IFoodLog {
  _id: string;
  userId: string;
  date: string;
  foods: IFoodLogItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'openai' | 'logmeal' | 'manual';
  imageUrl: string | null;
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
  foods: IFoodLogItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'openai';
  imageUrl: null;
}

export interface ISaveFoodLogRequest {
  foods: IFoodLogItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  aiProvider: 'openai' | 'logmeal' | 'manual';
  date?: string;
}
```

---

### `backend/src/app.ts` (update — one line)

**Existing pattern** (app.ts lines 1–28):
```typescript
// Add after line 10 (imports):
import foodRouter from './api/food/food.routes';

// Add after line 23 (after bmiRouter):
app.use('/api/food', foodRouter);
```

---

## Shared Patterns

### Authentication Middleware
**Source:** `backend/src/middleware/auth.middleware.ts`
**Apply to:** All 5 food route handlers
```typescript
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// In controller — always extract userId from JWT, never req.body:
const userId = (req as AuthRequest).user.id;
```

### Response Utility
**Source:** `backend/src/utils/response.ts`
**Apply to:** All food controller functions
```typescript
import { success, error } from '../../utils/response';

// Success: { success: true, data: T }
success(res, result, 201);

// Error: { success: false, error: string }
error(res, 'Lỗi server', 500);
```

### Date Utility (Vietnam UTC+7)
**Source:** `backend/src/utils/date.ts`
**Apply to:** `food.service.ts` (getFoodLogsForDate, checkScanRateLimit)
```typescript
import { vietnamDayStart } from '../../utils/date';

const dayStart = vietnamDayStart(new Date(dateStr));
const dayEnd = new Date(dayStart.getTime() + 86400000);
```

### Error Helper (service layer)
**Source:** `backend/src/api/habits/habits.service.ts` lines 6–10
**Apply to:** `food.service.ts`, `ai-food.service.ts`
```typescript
function makeError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
```

### Zod Validation in Controllers
**Source:** `backend/src/api/habits/habits.controller.ts` lines 7–12
**Apply to:** `food.controller.ts` (saveFoodLog, searchItems)
```typescript
const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  error(res, parsed.error.errors[0].message, 400);
  return;
}
```

### TanStack Query (Mobile)
**Source:** `mobile/src/app/(tabs)/habits/index.tsx` lines 49–61
**Apply to:** diary.tsx (useQuery), search.tsx (useQuery), result.tsx (useMutation)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data, isLoading, isError } = useQuery({
  queryKey: ['food', 'logs', selectedDate],
  queryFn: () => getFoodLogsApi(selectedDate),
});

// Mutation with invalidation
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: saveFoodLogApi,
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['food', 'logs'] }); },
});
```

### Color Constants
**Source:** `mobile/src/constants/colors.ts`
**Apply to:** All mobile components
```typescript
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY, BACKGROUND } from '../../constants/colors';
// PRIMARY = '#4CAF50'  (green — food screens use green theme, not orange)
// SURFACE = '#FFFFFF'  (card backgrounds)
// Camera scan screen exception: use backgroundColor: '#000' (black, not BACKGROUND)
```

### Integration Test Boilerplate
**Source:** `backend/src/api/habits/habits.integration.test.ts` lines 1–55
**Apply to:** `backend/src/api/food/food.integration.test.ts`
```typescript
// Set env vars before imports
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.OPENAI_API_KEY = 'test-key';  // NEW for Phase 4
// ... other env stubs

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import FoodLog from '../../models/FoodLog';
import { signAccessToken } from '../../utils/jwt';

// createUserAndToken helper — copy exactly from habits test lines 30–38
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `mobile/src/components/ui/ServingSizeSheet.tsx` | component | request-response | No bottom sheet or modal component exists in codebase yet. Use `Modal` from RN core as MVP approach. |
| `backend/src/scripts/data/vietnamese-foods.json` | data | batch | Static JSON data file — no analog. Must be created as hand-curated list of 100–200 Vietnamese foods per Pitfall 4 recommendation. |

---

## Metadata

**Analog search scope:** `backend/src/**/*.ts`, `mobile/src/**/*.{ts,tsx}`
**Files scanned:** 62 backend + 68 mobile
**Pattern extraction date:** 2026-05-19

**Key patterns confirmed from codebase:**
1. All controllers use `success(res, data)` / `error(res, message, statusCode)` from `utils/response.ts`
2. All controllers extract `userId` from `(req as AuthRequest).user.id` — never from request body (SECURITY)
3. Zod `.safeParse()` with `parsed.error.errors[0].message` is the universal validation pattern
4. Zustand stores: `create<State>((set) => ({ ... }))` — all actions use `set()`
5. TanStack Query: `queryKey` arrays, `queryFn` functions, `useMutation` with `onSuccess` invalidation
6. Mobile screens: `SafeAreaView` → `ScrollView` wrapper, `StyleSheet.create` for all styles
7. Seed scripts: `countDocuments()` idempotency check before `insertMany()`, `mongoose.connect/disconnect` wrapper
8. Integration tests: `MongoMemoryServer` + `before/after/beforeEach` lifecycle + `createUserAndToken` helper pattern
