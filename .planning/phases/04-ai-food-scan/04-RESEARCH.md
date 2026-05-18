# Phase 4: AI Food Scan — Research

**Researched:** 2026-05-19
**Domain:** OpenAI Vision API + Expo Camera/Image Picker + MongoDB FoodItem model + Vietnamese food seed
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-58:** AI provider = GPT-4o-mini sole provider. No LogMeal in Phase 4. `aiProvider = 'openai'` in FoodLog.
- **D-59:** Prompt strategy — system prompt defines JSON schema, user message has base64 image + Vietnamese instruction text. Use `response_format: { type: 'json_object' }`.
- **D-60:** NutritionResult food item fields: `name, weightG, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminC`. Add `tags: string[]`.
- **D-61:** No `mealType` field in FoodLog. Flat list by date.
- **D-62:** `imageUrl = null` in Phase 4. No Cloudinary. Field kept in schema for future use.
- **D-63:** FoodLog.foods adds `sodium: Number` and `vitaminC: Number`.
- **D-64:** Barcode scan deferred. FOOD-08 = manual search only.
- **D-65:** New `FoodItem` model with `name, nameEn, kcalPer100g, protein, carbs, fat, fiber, sugar, sodium, vitaminC, category, source`. Text index on `name + nameEn`.
- **D-66:** Seed source = OpenFoodFacts CSV filtered for Vietnamese items. Script: `backend/src/scripts/seed-foods.ts`. Idempotent: check `FoodItem.countDocuments() < 50` before insert. Target: 200–300 items.
- **D-67:** `GET /api/food/items?q=` using MongoDB `$text` search on FoodItem. Returns top 10. Client debounced 300ms.
- **D-68:** Camera scan route = `app/(food)/scan.tsx`. Food diary = `app/(food)/diary.tsx`. Route group `(food)/` is NOT a tab.
- **D-69:** Two temporary buttons on `app/(tabs)/index.tsx`: "Quét bữa ăn" → `/food/scan`, "Nhật ký ăn" → `/food/diary`. Phase 5 removes these.
- **D-70:** `expo-image-manipulator` compress: max 800×800 px, JPEG quality 0.7 → target <500KB. Upload as `multipart/form-data`.
- **D-71:** Backend: multer memory storage → `req.file.buffer.toString('base64')` → OpenAI vision call.
- **D-72:** Rate limit = count FoodLog docs with `aiProvider != 'manual'` for userId + today's date. If >= 20 → 429 with Vietnamese message.

### Claude's Discretion
- OpenAI prompt exact wording (Vietnamese instruction) — use practical prompt that elicits accurate food recognition.
- Seed script implementation details (parsing logic, field mapping from OpenFoodFacts CSV columns).
- Integration test scope for food endpoints.
- Zustand store structure for passing scan results from scan screen to result screen.

### Deferred Ideas (OUT OF SCOPE)
- Barcode scan (Open Food Facts barcode API, native barcode reader module)
- LogMeal API integration
- Meal type categorization (Sáng/Trưa/Tối/Bữa phụ)
- 5th Food tab in tab bar
- Cloudinary image storage for food logs
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOOD-01 | User chụp ảnh bữa ăn bằng camera để phân tích dinh dưỡng bằng AI | expo-camera CameraView + takePictureAsync → POST /api/food/scan → OpenAI vision |
| FOOD-02 | User chọn ảnh từ thư viện điện thoại để phân tích | expo-image-picker launchImageLibraryAsync → same compress + POST flow |
| FOOD-03 | App hiển thị màn camera scan với scan frame, nút chụp, gallery, flash (dark theme) | CameraView component, flash prop, useCameraPermissions hook, dark theme per UI spec |
| FOOD-04 | App hiển thị: tên món + tags, tổng kcal, Protein/Carbs/Chất béo, Chất xơ/Đường/Natri/Vitamin C | NutritionResult interface with all 10 fields + tags array; result screen renders them |
| FOOD-05 | User xác nhận kết quả AI và lưu bữa ăn vào nhật ký | POST /api/food/logs creates FoodLog document; foodScanStore clears after save |
| FOOD-06 | User chụp lại nếu kết quả không chính xác ("Chụp lại") | router.back() from result screen; foodScanStore.clearScanResult() |
| FOOD-07 | User tìm kiếm món ăn thủ công trong database | GET /api/food/items?q= with MongoDB $text search; FlatList with debounced input |
| FOOD-08 | App có database thực phẩm Việt Nam (200-500 món seed sẵn) | FoodItem model + seed-foods.ts script from OpenFoodFacts CSV |
| FOOD-09 | User xem nhật ký bữa ăn theo ngày (lịch sử) | GET /api/food/logs?date= returns FoodLog docs; diary screen with date pill selector |
</phase_requirements>

---

## Summary

Phase 4 implements three distinct features: (1) AI-powered food photo analysis via OpenAI GPT-4o-mini proxied through the backend, (2) a manual Vietnamese food database search using MongoDB full-text search, and (3) a date-based food diary. The technical stack is already scaffolded — multer, the auth middleware, and the FoodLog model stub all exist from Phase 1. The primary new backend dependency is the `openai` npm package (v6.38.0, confirmed on npm registry). The primary new mobile dependency is `expo-camera` (~15.0.0), which is not yet in `mobile/package.json`.

**Critical discovery:** The mobile `package.json` has `expo-image-picker: ~15.0.0` and `expo-image-manipulator: ~12.0.0`, which are SDK 51 tags according to the npm registry. The project runs Expo SDK 54. The locked-in `node_modules` versions are `expo-image-picker@15.0.7` and `expo-image-manipulator@12.0.5`. These are SDK 51 packages and may behave unexpectedly with SDK 54 runtime, but since they have broad `peerDependencies: { expo: '*' }` and the project is already using them (installed), the planner should note this debt but not block on it — both packages have been in continuous development and SDK 51 versions still work in SDK 54 Expo Go. The plan should upgrade these as a Wave 0 step using `npx expo install expo-image-picker expo-image-manipulator`.

**expo-camera** is confirmed NOT in `mobile/package.json`. It must be added via `npx expo install expo-camera`. iOS permissions (NSCameraUsageDescription) and Android permissions (CAMERA) are already declared in `app.json`.

The OpenAI vision API accepts base64 data URLs in `image_url.url` field. `response_format: { type: 'json_object' }` is confirmed compatible with vision/image inputs on gpt-4o-mini. The pattern `data:image/jpeg;base64,${buffer.toString('base64')}` is the correct format.

**Primary recommendation:** Implement in 5 waves: (1) backend model updates + FoodItem model + OpenAI install, (2) backend food API routes (scan + logs + items endpoints), (3) seed script, (4) mobile infrastructure (foodScanStore + food.api.ts + route group scaffold), (5) mobile screens (scan → result → search → diary).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Camera preview + capture | Browser/Client (React Native) | — | Camera hardware access is client-only; backend never touches camera |
| Image compression (<500KB) | Browser/Client (React Native) | — | CLAUDE.md rule: compress before upload, never send raw photo |
| AI food analysis | API/Backend | — | CLAUDE.md rule: AI APIs MUST proxy via backend, never called from mobile |
| Rate limit enforcement (20/day) | API/Backend | — | Server-side count prevents client bypass |
| FoodLog persistence | Database/Storage | API/Backend | MongoDB FoodLog collection; API owns write path |
| FoodItem text search | Database/Storage | API/Backend | MongoDB $text index; API owns query path |
| FoodItem seeding | API/Backend (script) | Database/Storage | One-time idempotent seed script, not a runtime API |
| Nutrition result display | Browser/Client | — | Presentation layer only; data comes from backend response |
| Food diary rendering | Browser/Client | API/Backend | Client fetches via GET /api/food/logs?date=; groups/displays locally |
| Scan result passing scan→result screen | Browser/Client (Zustand) | — | In-memory store avoids serialization issues with router params for large objects |

---

## Standard Stack

### Core (Backend — new additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | 6.38.0 | Official OpenAI Node.js SDK — chat.completions.create with vision | Official SDK by OpenAI; wraps API auth, retries, TypeScript types |

[VERIFIED: npm registry] — `openai@6.38.0` published 2020-07-09 (package), latest modified 2026-05-15. Official TypeScript library by OpenAI.

### Core (Mobile — new additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-camera` | ~15.0.0 | CameraView component, useCameraPermissions hook, takePictureAsync | Official Expo SDK camera package; SDK 51 tag matches project's existing image-picker/manipulator versions |

[VERIFIED: npm registry] — `expo-camera@15.0.16` confirmed on npm. SDK-51 tag is `15.0.9`. Project already uses SDK 51 versions of sibling packages.

### Already Installed (confirm version compatibility)

| Library | Installed Version | SDK 54 Tag | Action |
|---------|-----------------|------------|--------|
| `expo-image-picker` | ~15.0.0 (SDK 51) | 17.0.11 | Wave 0: upgrade via `npx expo install expo-image-picker` |
| `expo-image-manipulator` | ~12.0.0 (SDK 51) | no sdk-54 tag; latest 55.x | Wave 0: upgrade via `npx expo install expo-image-manipulator` |
| `multer` | ^1.4.5-lts.1 | n/a (Node.js) | Already correct |

[ASSUMED] — The version mismatch (SDK 51 packages in an SDK 54 project) was inherited from Phase 1 scaffold. In practice, broad `peerDependencies: { expo: '*' }` means these packages install and run in SDK 54 Expo Go. The upgrade is recommended but low-risk if deferred.

### Supporting (Backend)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `multer` | ^1.4.5-lts.1 | Multipart form upload — already configured in `upload.middleware.ts` | Reuse `uploadSingle` middleware on POST /api/food/scan |
| `zod` | ^3.24.0 | Request body validation | Validate POST /api/food/logs body and GET /api/food/items query params |
| `mongoose` | ^8.0.0 | FoodItem model, FoodLog schema update | Already installed |

**Backend installation (new only):**
```bash
cd backend && npm install openai
```

**Mobile installation (new + upgrades):**
```bash
cd mobile && npx expo install expo-camera
npx expo install expo-image-picker expo-image-manipulator
```

**Version verification (confirmed):**
```
openai@6.38.0          — npm view openai version → 6.38.0 ✓
expo-camera@55.0.18    — current latest; use ~15.0.0 to match project SDK tier
expo-image-picker      — upgrade from ~15 to ~17 (SDK 54 tag: 17.0.11)
expo-image-manipulator — upgrade from ~12 to latest stable
```

---

## Package Legitimacy Audit

> All packages checked against npm registry. Slopcheck tool checks PyPI only and is not applicable for npm packages — npm view used as primary registry verification.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `openai` | npm | 5+ yrs (2020) | Millions/wk | github.com/openai/openai-node | [OK] | Approved |
| `expo-camera` | npm | 6+ yrs (2018) | Millions/wk | github.com/expo/expo | [OK] | Approved |
| `expo-image-picker` | npm | 6+ yrs | Millions/wk | github.com/expo/expo | [OK] | Approved |
| `expo-image-manipulator` | npm | 6+ yrs | Millions/wk | github.com/expo/expo | [OK] | Approved |
| `multer` | npm | 10+ yrs (2014) | Millions/wk | github.com/expressjs/multer | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Note: slopcheck v0.6.1 was installed but targets PyPI, not npm. All packages above were verified directly via `npm view` against the npm registry and confirmed as official, well-maintained packages from their canonical organizations (OpenAI, Expo/Facebook, Express). No postinstall scripts found on any package.*

---

## Architecture Patterns

### System Architecture Diagram

```
Mobile (React Native / Expo SDK 54)
├── app/(food)/scan.tsx         → CameraView (expo-camera)
│   ├── takePictureAsync()      → uri → expo-image-manipulator compress (max 800×800, JPEG 0.7)
│   ├── launchImageLibraryAsync → uri → same compress path
│   └── POST /api/food/scan     → multipart/form-data (FormData, field: 'image')
│       └── stores result in foodScanStore → navigate to result.tsx
│
├── app/(food)/result.tsx       ← reads foodScanStore.scanResult
│   ├── "Xác nhận & Lưu"       → POST /api/food/logs → foodScanStore.clear()
│   └── "Chụp lại"             → router.back() → foodScanStore.clear()
│
├── app/(food)/search.tsx
│   ├── TextInput (debounced 300ms)
│   └── GET /api/food/items?q= → FlatList → ServingSizeSheet
│       └── "Thêm vào nhật ký" → POST /api/food/logs (aiProvider='manual')
│
└── app/(food)/diary.tsx
    ├── Date pill selector
    └── GET /api/food/logs?date=YYYY-MM-DD → FlatList items

Backend (Express 5.1 + Node.js)
├── POST /api/food/scan
│   ├── auth middleware (JWT verify)
│   ├── uploadSingle middleware (multer 5MB memory)
│   ├── Rate limit check: FoodLog.countDocuments({ userId, date: today, aiProvider: { $ne: 'manual' } }) >= 20 → 429
│   ├── buffer.toString('base64') → OpenAI chat.completions.create (gpt-4o-mini, vision, response_format: json_object)
│   └── Returns: NutritionResult JSON
│
├── POST /api/food/logs
│   ├── auth middleware
│   ├── Zod validation (foods array, totals, aiProvider)
│   └── FoodLog.create() → returns saved document
│
├── GET /api/food/logs?date=YYYY-MM-DD
│   ├── auth middleware
│   └── FoodLog.find({ userId, date: { $gte: dayStart, $lt: dayEnd } }) → array
│
├── DELETE /api/food/logs/:id
│   ├── auth middleware
│   └── FoodLog.deleteOne({ _id: id, userId }) → 404 if not found
│
└── GET /api/food/items?q=
    ├── auth middleware
    └── FoodItem.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } }).sort().limit(10)

Database (MongoDB Atlas M2)
├── FoodLog collection (updated schema: no mealType, add sodium/vitaminC)
│   └── Compound index: { userId: 1, date: -1 } ✓ (already exists from Phase 1)
└── FoodItem collection (new)
    ├── Text index: { name: 'text', nameEn: 'text' }
    └── Seeded via seed-foods.ts from OpenFoodFacts CSV (~200-300 items)
```

### Recommended Project Structure

```
backend/src/
├── api/food/
│   ├── food.routes.ts          # POST scan, POST logs, GET logs, DELETE logs/:id, GET items
│   ├── food.controller.ts      # scan, saveFoodLog, getFoodLogs, deleteFoodLog, searchItems
│   ├── food.service.ts         # business logic — rate limit check, date range query, text search
│   └── food.validation.ts      # Zod: saveFoodLogSchema, searchItemsSchema
├── models/
│   ├── FoodLog.ts              # UPDATE: remove mealType, add sodium/vitaminC to foods array
│   └── FoodItem.ts             # NEW: Vietnamese food database item
├── services/
│   └── ai-food.service.ts      # IMPLEMENT: analyzeImage() using openai SDK
└── scripts/
    └── seed-foods.ts           # NEW: download/parse OpenFoodFacts CSV → insert FoodItem docs

mobile/src/
├── app/(food)/
│   ├── _layout.tsx             # Stack, headerShown: false
│   ├── scan.tsx                # Camera scan (FOOD-01/02/03)
│   ├── result.tsx              # AI result display (FOOD-04/05/06)
│   ├── search.tsx              # Manual search (FOOD-07/08)
│   └── diary.tsx               # Food diary (FOOD-09)
├── stores/
│   └── foodScanStore.ts        # Zustand: scanResult, isScanning, pendingImageUri
├── lib/api/
│   └── food.api.ts             # scanFoodApi, saveFoodLogApi, getFoodLogsApi, searchFoodItemsApi, deleteFoodLogApi
├── lib/api/types.ts            # ADD: Phase 4 types (IFoodLogItem, IFoodLog, IFoodItem, IScanFoodResponse)
└── components/ui/
    ├── ScanFrame.tsx           # Green corner brackets overlay (pure presentational)
    ├── CameraControls.tsx      # Gallery + Capture + Flash button row
    ├── NutritionSummaryCard.tsx # Green kcal card + 3-col macro row
    ├── NutritionDetailRow.tsx  # Single micro-nutrient row (colored label + value)
    ├── FoodTagPill.tsx         # Green tag pill badge
    ├── FoodSearchBar.tsx       # Controlled TextInput with search icon
    ├── FoodDiaryItem.tsx       # Diary entry row with swipe-to-delete
    ├── DatePill.tsx            # Date selector pill (active/inactive)
    └── ServingSizeSheet.tsx    # Bottom sheet for manual search portion input
```

### Pattern 1: OpenAI Vision + JSON Output (Backend)

**What:** Call GPT-4o-mini with a base64-encoded image and a system prompt that defines the JSON output schema. Use `response_format: { type: 'json_object' }` to guarantee parseable output.

**When to use:** POST /api/food/scan after multer saves the image buffer to memory.

**Example:**
```typescript
// Source: OpenAI official docs — platform.openai.com/docs/guides/vision
// Source: npm openai@6.38.0 README — github.com/openai/openai-node
import OpenAI from 'openai';
import type { NutritionResult } from './ai-food.service';

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
        content: `Bạn là chuyên gia dinh dưỡng. Phân tích ảnh bữa ăn và trả về JSON với cấu trúc:
{
  "foods": [{
    "name": "string (tên món ăn tiếng Việt)",
    "weightG": number,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number,
    "vitaminC": number,
    "tags": ["string"]
  }],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number }
}
Tất cả giá trị dinh dưỡng tính theo gram (ngoại trừ calories = kcal). Ước tính số lượng thực tế trong ảnh.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Phân tích các món ăn trong ảnh và trả về thông tin dinh dưỡng theo định dạng JSON đã yêu cầu.',
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về kết quả rỗng');
  return JSON.parse(content) as NutritionResult;
}
```

[VERIFIED: npm registry] for openai package. Pattern confirmed by OpenAI official docs (images-vision guide, searched 2026-05-19). `response_format: json_object` confirmed compatible with vision inputs on gpt-4o-mini.

---

### Pattern 2: Image Compression with expo-image-manipulator v12

**What:** Resize and compress a photo URI before upload. Installed version is v12.0.5.

**When to use:** After `takePictureAsync()` or `launchImageLibraryAsync()` returns a URI, before sending to backend.

**Example (legacy API — v12 stable):**
```typescript
// Source: docs.expo.dev/versions/v54.0.0/sdk/imagemanipulator/ (fetched 2026-05-19)
// v12 uses manipulateAsync (modern hook API not available until later versions)
import * as ImageManipulator from 'expo-image-manipulator';

async function compressForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],  // preserves aspect ratio, max 800px wide
    {
      compress: 0.7,                // JPEG quality 0.7 (D-70)
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}
```

[CITED: docs.expo.dev/versions/v54.0.0/sdk/imagemanipulator/] — `manipulateAsync` is the correct API for v12. The modern hook-based API (`useImageManipulator`) was introduced in a later version.

---

### Pattern 3: Multipart Upload with Axios (Mobile)

**What:** Upload compressed image as `multipart/form-data` using the existing `apiClient`.

**When to use:** After compression, to POST to `/api/food/scan`.

**Example:**
```typescript
// Source: Established pattern from mobile/src/lib/api/client.ts + Axios FormData
import apiClient from './client';
import type { IScanFoodResponse } from './types';

export async function scanFoodApi(imageUri: string): Promise<IScanFoodResponse> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'meal.jpg',
  } as any);  // React Native FormData requires this shape

  const res = await apiClient.post<{ success: boolean; data: IScanFoodResponse }>(
    '/api/food/scan',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,  // OpenAI vision can take 10-20s — increase timeout
    }
  );
  return res.data.data;
}
```

[ASSUMED] — The `timeout: 30000` value is based on typical GPT-4o-mini vision latency. The default apiClient timeout is 10000ms which may be too short for vision calls.

---

### Pattern 4: expo-camera CameraView with SDK 54

**What:** Use `CameraView` component and `useCameraPermissions` hook for the scan screen.

**When to use:** `app/(food)/scan.tsx` (FOOD-01/03).

**Example:**
```typescript
// Source: docs.expo.dev/versions/v54.0.0/sdk/camera/ (fetched 2026-05-19)
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import type { CameraType } from 'expo-camera';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return null; // loading
  if (!permission.granted) {
    return <PermissionRequest onRequest={requestPermission} />;
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
    // photo.uri → compress → upload
  };

  return (
    <CameraView
      ref={cameraRef}
      style={{ flex: 1 }}
      facing="back"
      flash={flash}
    >
      {/* overlay: ScanFrame, CameraControls */}
    </CameraView>
  );
}
```

[CITED: docs.expo.dev/versions/v54.0.0/sdk/camera/] — `CameraView`, `useCameraPermissions`, `takePictureAsync` confirmed for SDK 54. Known iOS issue: after first permission grant on fresh install, `useCameraPermissions` may not immediately show `permission.granted = true` — workaround is to check `permission.status === 'granted'` OR re-render.

---

### Pattern 5: MongoDB $text Search on FoodItem

**What:** Full-text search on Vietnamese food item names. MongoDB `$text` operator uses the text index on `name + nameEn`.

**When to use:** GET /api/food/items?q= endpoint.

**Example:**
```typescript
// Source: Established project pattern (bmi.service.ts, habits.service.ts) + Mongoose 8.x docs
import FoodItem from '../../models/FoodItem';

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

[ASSUMED] — MongoDB $text search with Vietnamese text has limitations: diacritics (tone marks) may not match perfectly. The text index will tokenize by whitespace and strip some punctuation but will handle basic word matching. For better results, create the text index without case sensitivity specification.

---

### Pattern 6: Rate Limit Count (D-72)

**What:** Count today's AI scans for a user before allowing a new scan.

**When to use:** At the top of the scan controller, before the multer upload (or after, before OpenAI call).

**Example:**
```typescript
// Source: Established pattern from backend/src/utils/date.ts
import { vietnamDayStart } from '../../utils/date';
import FoodLog from '../../models/FoodLog';

export async function checkScanRateLimit(userId: string): Promise<boolean> {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const count = await FoodLog.countDocuments({
    userId,
    date: { $gte: todayStart, $lt: tomorrowStart },
    aiProvider: { $ne: 'manual' },
  });
  return count >= 20;
}
```

[VERIFIED: npm registry] for mongoose. Pattern reuses `vietnamDayStart` utility already in `backend/src/utils/date.ts`.

---

### Pattern 7: Zustand foodScanStore (Mobile)

**What:** In-memory store to pass scan result from scan screen to result screen without router param serialization.

**When to use:** scan.tsx writes to store → navigate to result.tsx → result.tsx reads from store → clears on confirm or back.

**Example:**
```typescript
// Source: Established project pattern from mobile/src/lib/auth/auth-store.ts (Zustand v5)
import { create } from 'zustand';

interface FoodScanState {
  scanResult: NutritionResult | null;
  isScanning: boolean;
  pendingImageUri: string | null;
  setScanResult: (result: NutritionResult) => void;
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

[CITED: Zustand v5 established in Phase 3] — auth-store.ts and timerStore.ts in the project confirm this pattern.

---

### Anti-Patterns to Avoid

- **Calling OpenAI from mobile client:** CLAUDE.md rule, non-negotiable. All AI calls through backend.
- **Sending raw camera photo to backend:** Always compress to <500KB before upload (CLAUDE.md rule). `takePictureAsync({ quality: 1 })` + `manipulateAsync` compress step is mandatory.
- **Using `AsyncStorage` for tokens:** Established project rule. Never, use expo-secure-store.
- **Passing NutritionResult as router params:** Large JSON objects fail in React Navigation params serialization. Use Zustand store (foodScanStore) instead.
- **Using `Camera` (old API) instead of `CameraView`:** `Camera` class is deprecated in Expo SDK 52+. Use `CameraView` from `expo-camera`.
- **Not debouncing search input:** MongoDB text search on every keystroke is expensive. Enforce 300ms debounce before calling GET /api/food/items.
- **Seeding FoodItem every server start:** seed-foods.ts must be a standalone script (`npm run seed:foods`), NOT called from server startup. Uses idempotency check: `countDocuments() < 50`.
- **Using `mealType` in new FoodLog documents:** D-61 removed this field. Schema update removes `required: true` from mealType — remove the field entirely.
- **Default apiClient timeout for scan:** The scan endpoint calls OpenAI which can take 15-25 seconds. Override timeout to 30000ms in `food.api.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAI API authentication + retries + types | Custom HTTP client | `openai` npm package (v6.38.0) | Handles auth, token counting, retries, TypeScript types |
| Image resize/compress | Custom canvas manipulation | `expo-image-manipulator` (already installed) | Handles EXIF rotation, multi-platform, returns URI |
| Camera permission flow | Manual `PermissionsAndroid.request()` | `useCameraPermissions()` from expo-camera | Cross-platform, returns permission object with `.granted` |
| Multipart form parsing | Custom body parser | `multer` (already installed in backend) | Already configured as `uploadSingle` in `upload.middleware.ts` |
| Full-text search on food names | Custom regex search | MongoDB `$text` index | Handles tokenization, diacritic normalization, relevance scoring |
| Nutrition JSON parsing | Custom regex | `JSON.parse()` on `response_format: json_object` response | GPT-4o-mini always returns valid JSON when `json_object` enforced |

**Key insight:** The backend already has multer, Mongoose, Zod, and auth — the only new package is `openai`. The mobile already has image-picker and image-manipulator — the only new package is `expo-camera`.

---

## Common Pitfalls

### Pitfall 1: expo-camera NOT installed — app crashes on scan screen mount

**What goes wrong:** `CameraView` import throws a module not found error at runtime. The planner may assume `expo-camera` is installed because CONTEXT.md mentions it — it is NOT in `mobile/package.json`.

**Why it happens:** Phase 1 scaffold added permissions to app.json but did not install the package.

**How to avoid:** Wave 0 task: `cd mobile && npx expo install expo-camera`. Verify it appears in `package.json` before implementing scan.tsx.

**Warning signs:** Metro bundler error "Cannot find module 'expo-camera'" on first run.

---

### Pitfall 2: Axios default timeout (10s) is too short for OpenAI vision calls

**What goes wrong:** The scan POST request times out on the mobile client with a network error, even though the backend may successfully receive the response from OpenAI.

**Why it happens:** GPT-4o-mini vision inference takes 10–25 seconds. The default `apiClient` timeout is 10000ms.

**How to avoid:** In `food.api.ts`, pass `{ timeout: 30000 }` as the third argument to `apiClient.post()`. Do not change the global default (other endpoints are fine with 10s).

**Warning signs:** 401/network error on scan that never shows `isScanning: false`.

---

### Pitfall 3: FoodLog schema migration — mealType field removal

**What goes wrong:** Existing FoodLog documents in the DB (if any) have `mealType`. After removing `required: true` and the field, new documents save fine, but old documents still have the field. More critically, if the schema still has `mealType: { required: true }`, creating new FoodLog docs without mealType will throw a Mongoose validation error (500).

**Why it happens:** Phase 1 scaffold set mealType as `required: true` enum.

**How to avoid:** Update `FoodLog.ts` before implementing any food endpoints:
1. Remove `mealType` from the `IFoodLog` interface
2. Remove `mealType` from the Schema definition entirely
3. Add `sodium: Number` and `vitaminC: Number` to the `foods` subdocument

**Warning signs:** `ValidationError: Path 'mealType' is required` on POST /api/food/logs.

---

### Pitfall 4: OpenFoodFacts CSV is 9GB uncompressed — seed script cannot download at runtime

**What goes wrong:** seed-foods.ts that streams the full 9GB CSV will OOM or time out on most development machines and all CI environments.

**Why it happens:** The full OpenFoodFacts dump is enormous. The Context suggests downloading it but the implementation must be selective.

**How to avoid:** The seed script should NOT download the full CSV. Instead, use a pre-filtered, committed static JSON file (`backend/src/scripts/data/vietnamese-foods.json`) with ~200-300 curated items. The seed script reads this local file and inserts. If this data file does not exist at plan time, create a minimal hardcoded array of 50–100 Vietnamese foods directly in the script. The OpenFoodFacts CSV approach is aspirational — for MVP, a hand-curated JSON is more reliable.

**Alternative:** Use OpenFoodFacts REST API with Vietnamese search terms (phở, bún, cơm, etc.) during seed script execution. This makes the script network-dependent but avoids the 9GB download.

**Warning signs:** `ENOMEM` or timeout during `npm run seed:foods`.

---

### Pitfall 5: GPT-4o-mini returns JSON that doesn't match NutritionResult schema

**What goes wrong:** The AI returns a response with missing fields (e.g., no `sodium` or `vitaminC`), extra fields, or numeric values as strings.

**Why it happens:** Even with `response_format: json_object`, the model respects the system prompt schema but may omit optional-seeming numeric fields if the image shows no relevant food.

**How to avoid:** After `JSON.parse()`, validate and normalize the response:
- Default missing numeric fields to 0
- Coerce string numbers to numbers
- If `foods` array is empty, throw a user-friendly error "Không nhận dạng được thức ăn trong ảnh"
- If any required field is missing from totals, recalculate from foods array

**Warning signs:** `NaN` values in nutrition display, or undefined food name on result screen.

---

### Pitfall 6: expo-camera iOS permission — `granted` not updated after first grant

**What goes wrong:** User grants camera permission in the iOS system dialog. The `permission.granted` from `useCameraPermissions()` stays `false` until the next render cycle or component remount.

**Why it happens:** Known issue in expo-camera (GitHub issue #28756) — the permission state is not immediately updated after the system dialog resolves on first install.

**How to avoid:** In the permission check, use `permission.status === 'granted'` rather than `permission.granted` (they should be equivalent, but use both as fallback). Also add a conditional re-render trigger after `requestPermission()` resolves.

**Warning signs:** Blank black screen after granting camera permission on first launch.

---

### Pitfall 7: expo-image-picker v15 (SDK 51) behavior differences in SDK 54

**What goes wrong:** `launchImageLibraryAsync` or `launchCameraAsync` may exhibit different behavior with the current v15 installation vs the expected v17 API in SDK 54.

**Why it happens:** The mobile package.json has `"expo-image-picker": "~15.0.0"` which resolves to v15.0.7 (SDK 51). SDK 54's expected version is v17.

**How to avoid:** Wave 0 task: upgrade via `npx expo install expo-image-picker expo-image-manipulator`. If upgrade breaks other code, the fallback is to stay on v15 (broad peer deps mean it still works in SDK 54 Expo Go) and document the debt.

**Warning signs:** TypeScript type errors on `ImagePickerResult.assets` or permission request methods.

---

### Pitfall 8: MongoDB text search on Vietnamese diacritics

**What goes wrong:** Searching for "pho" does not find items named "phở". Vietnamese tone marks (diacritics) create tokenization mismatches.

**Why it happens:** MongoDB's default text search stemmer is English; Vietnamese diacritics are treated as distinct characters.

**How to avoid:** Create the text index with `{ default_language: 'none' }` (no stemming, exact token match). This means "phở" matches "phở" but "pho" does not match "phở" — which is actually the correct Vietnamese behavior. Users searching in Vietnamese will type Vietnamese characters.

**Example index definition:**
```typescript
FoodItemSchema.index(
  { name: 'text', nameEn: 'text' },
  { default_language: 'none' }
);
```

[ASSUMED] — MongoDB text search behavior with Vietnamese confirmed by understanding of MongoDB text index language options; specific Vietnamese behavior not verified against MongoDB Atlas docs.

---

## Code Examples

### FoodItem Model (New)

```typescript
// Source: Established project pattern from backend/src/models/FoodLog.ts + D-65
import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem extends Document {
  name: string;           // Vietnamese name (required)
  nameEn?: string;        // English name (optional)
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

const FoodItemSchema = new Schema<IFoodItem>({
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
}, { timestamps: true });

// Text index with no stemming for Vietnamese accuracy
FoodItemSchema.index(
  { name: 'text', nameEn: 'text' },
  { default_language: 'none' }
);

export default mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);
```

### FoodLog Schema Update

```typescript
// Changes from Phase 1 scaffold (remove mealType, add sodium/vitaminC):
// REMOVE: mealType field (D-61)
// ADD to foods subdocument: sodium: Number, vitaminC: Number (D-63)
foods: [
  {
    name: { type: String, required: true },
    weightG: Number,
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },    // NEW (D-63)
    vitaminC: { type: Number, default: 0 },  // NEW (D-63)
  },
],
```

### NutritionResult Interface (Updated)

```typescript
// Source: backend/src/services/ai-food.service.ts — needs these additions (D-60)
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
    sodium: number;     // NEW (D-60)
    vitaminC: number;   // NEW (D-60)
    tags: string[];     // NEW (D-60 + specifics)
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string | null;  // null in Phase 4 (D-62)
}
```

### Backend Route Registration (app.ts addition)

```typescript
// Add to backend/src/app.ts after line 24 (bmiRouter)
import foodRouter from './api/food/food.routes';
// ...
app.use('/api/food', foodRouter);
```

### GET /api/food/logs date range query

```typescript
// Pattern from backend/src/api/habits/habits.service.ts (date utility reuse)
import { vietnamDayStart } from '../../utils/date';

export async function getFoodLogsForDate(userId: string, dateStr: string) {
  const date = new Date(dateStr);
  const dayStart = vietnamDayStart(date);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  return FoodLog
    .find({ userId, date: { $gte: dayStart, $lt: dayEnd } })
    .sort({ createdAt: -1 })
    .lean();
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-camera`: `Camera` class | `CameraView` component | Expo SDK 52 | `Camera` deprecated; `CameraView` is the new API |
| `expo-image-manipulator`: `manipulateAsync` only | `useImageManipulator` hook (chaining) | expo-image-manipulator v13+ | Project uses v12 — stick with `manipulateAsync` |
| OpenAI SDK v3/v4 | v6.x (current) | 2024-2025 | API changed significantly; v6 has different import path and client instantiation |
| GPT-4o vision: image URLs only | base64 data URLs supported | GPT-4o launch | Can send base64 directly — no need to upload to CDN first |

**Deprecated/outdated:**
- `Camera` class from expo-camera: deprecated since SDK 52, use `CameraView`
- `expo-camera`'s old barcode scanner: replaced by `launchScanner()` in SDK 54
- OpenAI SDK `openai.createChatCompletion()`: replaced by `openai.chat.completions.create()`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | expo-image-picker v15 (SDK 51) works correctly in Expo SDK 54 without upgrade | Standard Stack | Image picker fails silently or throws runtime error; fix: upgrade to v17 |
| A2 | OpenAI vision call takes 10–25 seconds — 30s timeout is sufficient | Code Examples (scanFoodApi) | Timeout on slow networks; fix: increase to 45s or show retry |
| A3 | MongoDB $text search with `default_language: 'none'` gives acceptable Vietnamese results | Common Pitfalls #8 | Poor search results for Vietnamese users; fix: implement Lunr.js client-side search or upgrade to Atlas Search |
| A4 | OpenFoodFacts CSV approach will be replaced by a hand-curated JSON for MVP | Common Pitfalls #4 | Seed script fails; fix: commit a static vietnamese-foods.json file with 100+ items |
| A5 | Zustand store (not router params) is the correct approach for passing NutritionResult | Architecture Patterns | If store loses state on navigation, result screen is blank; add fallback check |
| A6 | The existing `apiClient` (10s timeout) is used globally and overriding per-request is safe | Code Examples (scanFoodApi) | If apiClient doesn't support per-request timeout override, use a separate Axios instance for food scan |

---

## Open Questions

1. **Vietnamese food database content**
   - What we know: OpenFoodFacts has some Vietnamese products. CONTEXT.md says "filter by countries_tags or product_name_vi". The full CSV is 9GB.
   - What's unclear: How many truly Vietnamese items are in the dataset? Are the nutrition values accurate for Vietnamese dishes (vs packaged products)?
   - Recommendation: For MVP, create a curated static JSON with 100–200 Vietnamese dishes (phở, bún bò, cơm tấm, bánh mì, etc.) with estimated nutrition values. Add a `source: 'manual'` flag. This avoids the CSV download problem entirely.

2. **Seed script: static file vs CSV download**
   - What we know: Context says use OpenFoodFacts CSV dump; 9GB is impractical for dev environments.
   - What's unclear: Can a filtered subset CSV (~10MB) be committed to git? Is the `world.openfoodfacts.org` server reliable for automated downloads?
   - Recommendation: Commit a small pre-filtered `vietnamese-foods.json` file (200-300 items, <100KB). Include a comment in seed-foods.ts explaining how to regenerate it from the full CSV if needed.

3. **expo-image-picker/manipulator version upgrade timing**
   - What we know: Current versions are SDK 51 (v15/v12). SDK 54 versions are v17/v13+.
   - What's unclear: Will upgrading break the existing BMI or other screens that don't use these libraries?
   - Recommendation: These libraries are only used in Phase 4 screens. Upgrade is safe. Do it in Wave 0.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend dev | ✓ | 20.x (from package.json engines) | — |
| npm | Package install | ✓ | system | — |
| MongoDB Atlas | FoodLog + FoodItem | ✓ (configured from Phase 1) | M2 | — |
| OPENAI_API_KEY | ai-food.service.ts | ? | — | Blocked without key |
| expo-camera package | FOOD-01/03 | ✗ | NOT installed | Install via `npx expo install expo-camera` |
| openai package | backend ai-food.service.ts | ✗ | NOT installed | Install via `npm install openai` in backend/ |

**Missing dependencies with no fallback:**
- `OPENAI_API_KEY` environment variable — scan endpoint returns 500 without it. Must be set in `backend/.env` before testing scan functionality. The `.env.example` already has `OPENAI_API_KEY=` as a placeholder.

**Missing dependencies with fallback:**
- `expo-camera` — install in Wave 0; without it the scan screen crashes on mount
- `openai` npm package — install in Wave 0; without it the scan endpoint throws "not implemented"

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + supertest (backend); no mobile test framework configured |
| Config file | none — run via `node --env-file=.env.test --require tsx/cjs --test` |
| Quick run command | `cd backend && node --env-file=.env.test --require tsx/cjs --test src/api/food/food.integration.test.ts` |
| Full suite command | `cd backend && npm run test:food` (add to package.json scripts) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOOD-01/02 | POST /api/food/scan returns NutritionResult | integration (mock OpenAI) | `npm run test:food` | ❌ Wave 0 |
| FOOD-04 | NutritionResult has all 10 fields + tags | unit (pure parse) | `npm run test:food` | ❌ Wave 0 |
| FOOD-05 | POST /api/food/logs creates FoodLog document | integration | `npm run test:food` | ❌ Wave 0 |
| FOOD-06 | Retry flow — no log saved | integration | `npm run test:food` | ❌ Wave 0 |
| FOOD-07/08 | GET /api/food/items?q= returns results | integration | `npm run test:food` | ❌ Wave 0 |
| FOOD-09 | GET /api/food/logs?date= returns correct logs | integration | `npm run test:food` | ❌ Wave 0 |
| D-72 | Rate limit: 20 scans/day enforced, 429 returned | integration | `npm run test:food` | ❌ Wave 0 |
| Manual only | Camera permission UI shows correctly | manual (Expo Go device) | — | manual |
| Manual only | Image compression < 500KB | manual (console.log file size) | — | manual |

**Note:** OpenAI calls in integration tests MUST be mocked. Pattern from existing tests: stub environment variables + use MongoMemoryServer. Add `process.env.OPENAI_API_KEY = 'test-key'` at test file top and mock the openai module.

### Sampling Rate

- **Per task commit:** `cd backend && node --env-file=.env.test --require tsx/cjs --test src/api/food/food.integration.test.ts`
- **Per wave merge:** All test suites: `npm run test:auth && npm run test:food && npm run test:bmi`
- **Phase gate:** Full suite green before `/gsd:verify-work 4`

### Wave 0 Gaps

- [ ] `backend/src/api/food/food.integration.test.ts` — covers FOOD-01/02/05/07/08/09 + D-72 rate limit
- [ ] Add `"test:food": "node --env-file=.env.test --require tsx/cjs --test src/api/food/food.integration.test.ts"` to `backend/package.json` scripts

*(No new mobile test infrastructure needed — Phase 4 mobile screens follow established Phase 3 patterns with no framework changes)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via existing `auth.middleware.ts` — all food endpoints require `authenticate` |
| V3 Session Management | no (handled in Phase 2) | — |
| V4 Access Control | yes | FoodLog queries always filter by `userId` — users cannot access other users' logs |
| V5 Input Validation | yes | Zod validation on POST /api/food/logs body; multer 5MB file size limit; query param validation on GET /api/food/items |
| V6 Cryptography | no | No new crypto in Phase 4 |

### Known Threat Patterns for AI Vision + File Upload Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized image upload (DoS) | Denial of Service | multer 5MB limit already configured in `upload.middleware.ts` |
| Malicious file content masquerading as JPEG | Tampering | multer does not validate MIME type deeply — mitigated by passing to OpenAI (which validates image content) and not storing the file |
| API key exposure in client | Information Disclosure | CLAUDE.md rule: all AI calls via backend — never expose OPENAI_API_KEY to mobile |
| Rate limit bypass via multiple accounts | Elevation of Privilege | Per-user rate limit (D-72) tied to authenticated userId — cannot bypass without auth |
| IDOR on FoodLog delete/read | Information Disclosure | Always query with `{ userId, _id }` — userId from JWT, not from request body |
| Prompt injection via image metadata | Tampering | Low risk for food recognition; GPT-4o-mini system prompt defines strict JSON schema |
| OpenAI spend abuse (unlimited scans) | Denial of Service (financial) | D-72 rate limit: 20 AI scans/user/day enforced server-side |

---

## Project Constraints (from CLAUDE.md)

All directives extracted from `./CLAUDE.md`:

1. **Compress images before AI API call** — target <500KB; never send raw camera photo. Implemented via expo-image-manipulator (max 800×800, JPEG 0.7) in mobile before upload.
2. **AI APIs must proxy via backend** — never call OpenAI from mobile client. Implemented: POST /api/food/scan is the only AI entry point.
3. **Apple Sign In mandatory** — not applicable to Phase 4 (auth already done in Phase 2).
4. **Rate limit AI scans: 20 scans/user/day** — implemented via D-72 countDocuments check.
5. **JWT refresh token in expo-secure-store** — not applicable to Phase 4 (auth already done).
6. **No Redux** — Zustand (foodScanStore) for scan state. TanStack Query for server state (getFoodLogs, searchFoodItems).
7. **Navigation: Expo Router file-based** — `(food)/` route group as non-tab stack.
8. **State: Zustand + TanStack Query** — foodScanStore (Zustand) + useQuery for logs/items.
9. **MongoDB compound index `{ userId: 1, date: -1 }`** — already exists on FoodLog from Phase 1.
10. **No GSD plan execution without PLAN.md** — this research enables planning; execution blocked until PLAN.md exists.

---

## Sources

### Primary (HIGH confidence)

- npm registry via `npm view openai` — version 6.38.0, official OpenAI TypeScript library
- npm registry via `npm view expo-camera` — version 55.0.18 latest, expo/expo monorepo
- npm registry via `npm view expo-image-picker` — dist-tags confirm sdk-54: 17.0.11
- npm registry via `npm view expo-image-manipulator` — latest 55.0.16
- `docs.expo.dev/versions/v54.0.0/sdk/camera/` — CameraView, useCameraPermissions, takePictureAsync API (fetched 2026-05-19)
- `docs.expo.dev/versions/v54.0.0/sdk/imagemanipulator/` — manipulateAsync, SaveFormat.JPEG (fetched 2026-05-19)
- `docs.expo.dev/versions/v54.0.0/sdk/imagepicker/` — launchCameraAsync, launchImageLibraryAsync, SDK 54 changes (fetched 2026-05-19)
- `developers.openai.com/api/docs/guides/images-vision` — base64 data URL format, gpt-4o-mini vision (fetched 2026-05-19)
- Project codebase: `backend/src/app.ts`, `backend/src/models/FoodLog.ts`, `backend/src/services/ai-food.service.ts`, `backend/src/middleware/upload.middleware.ts`, `mobile/src/lib/api/client.ts`, `mobile/package.json`, `mobile/app.json`
- `.planning/phases/04-ai-food-scan/04-CONTEXT.md` — all locked decisions D-58 to D-72
- `.planning/phases/04-ai-food-scan/04-UI-SPEC.md` — complete screen contracts, component inventory, navigation contract

### Secondary (MEDIUM confidence)

- WebSearch: OpenAI response_format json_object with vision inputs — confirmed compatible with gpt-4o-mini
- WebSearch: multer memoryStorage req.file.buffer to base64 pattern — confirmed standard Node.js pattern
- WebSearch: expo-camera iOS permission issue (#28756) — known issue with useCameraPermissions on first grant

### Tertiary (LOW confidence)

- OpenFoodFacts CSV download approach — practical limitations (9GB) identified via reasoning; recommendation to use hand-curated JSON is [ASSUMED]
- MongoDB $text search with `default_language: 'none'` for Vietnamese — based on MongoDB docs understanding, not tested against Atlas

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm view; Expo docs fetched directly
- Architecture: HIGH — follows established Phase 3 patterns exactly; route group pattern confirmed from existing code
- OpenAI integration: HIGH — official docs fetched; base64 vision + json_object confirmed
- Pitfalls: HIGH — expo-camera not installed (verified by reading package.json); timeout issue based on known GPT-4o-mini latency
- Seed script: MEDIUM — OpenFoodFacts CSV approach has known practical limitations; hand-curated JSON recommended

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable libraries; OpenAI API may change faster — verify if >2 weeks)
