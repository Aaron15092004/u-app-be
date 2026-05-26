# Phase 4: AI Food Scan — Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 xây dựng 2 luồng nhập bữa ăn và 1 màn xem nhật ký:

1. **AI photo scan** (FOOD-01/02/03/04/05/06): Camera screen (dark theme, scan frame, flash, gallery) → compress ảnh → gửi backend → GPT-4o-mini phân tích → kết quả nutrition → user confirm/retake → lưu FoodLog.
2. **Manual food search** (FOOD-07/08): Search Vietnamese food database (200-300 items từ OpenFoodFacts) → chọn item → chọn lượng → lưu FoodLog.
3. **Food diary** (FOOD-09): Màn nhật ký bữa ăn grouped by date, total kcal/day.

**Requirements:** FOOD-01, FOOD-02, FOOD-03, FOOD-04, FOOD-05, FOOD-06, FOOD-07, FOOD-08, FOOD-09

**Success criteria (từ ROADMAP.md):**
1. Camera scan screen opens (dark theme, scan frame, flash, gallery); capture/pick → AI analysis proxied through backend
2. AI result screen: food name + tags, kcal, Protein/Carbs/Fat, Fiber/Sugar/Sodium/Vitamin C; "Chụp lại" discards and retries
3. Confirm & save meal → appears in daily food diary
4. Manual search Vietnamese food DB (200–500 seed items) → log meal without camera
5. Daily food diary grouped by date with correct kcal totals

</domain>

<decisions>
## Implementation Decisions

### AI Provider (FOOD-01/04)

- **D-58:** AI provider = **GPT-4o-mini sole provider** cho Phase 4 MVP. Không implement LogMeal trong Phase 4 (Open Question #2 chưa resolved, contact sales vẫn pending). `analyzeImage()` trong `backend/src/services/ai-food.service.ts` gọi OpenAI GPT-4o-mini với vision capability — send ảnh dưới dạng base64 data URL trong message content, yêu cầu JSON output theo schema NutritionResult. `aiProvider = 'openai'` trong FoodLog khi lưu.

- **D-59:** GPT-4o-mini prompt strategy: System prompt định nghĩa format JSON cần trả về (foods array + totals). User message chứa ảnh base64 + "Phân tích các món ăn trong ảnh và trả về thông tin dinh dưỡng". Dùng `response_format: { type: 'json_object' }` để enforce structured output. Parse response, validate fields, trả về NutritionResult.

- **D-60:** NutritionResult cần thêm `sodium` và `vitaminC` vào mỗi food item (FOOD-04 yêu cầu Natri và Vitamin C). Cập nhật interface trong `ai-food.service.ts` và `FoodLog` model. Final fields mỗi food item: `name, weightG, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminC`.

### FoodLog Model Update (FOOD-05)

- **D-61:** Remove `mealType` field khỏi FoodLog schema. User quyết định: flat list by date, không phân loại Sáng/Trưa/Tối/Bữa phụ. Diary chỉ group by date và hiển thị tổng kcal.

- **D-62:** `imageUrl: null` trong FoodLog (không lưu ảnh vào Cloudinary). Ảnh chỉ dùng để analyze rồi discard — không persist. Giảm chi phí Cloudinary. `imageUrl` field vẫn giữ trong schema (cho admin/future use) nhưng default null và không set trong Phase 4.

- **D-63:** FoodLog.foods cần thêm `sodium: Number` và `vitaminC: Number` (đồng bộ với D-60).

### Barcode Scan (FOOD-08 partial)

- **D-64:** Barcode scan **deferred** (không trong Phase 4). FOOD-08 implement partial: chỉ Vietnamese food DB + manual search. Open Food Facts barcode API deferred sang post-launch hoặc v2. Không cần barcode reader native module trong Phase 4.

### Vietnamese Food Database Seed (FOOD-08)

- **D-65:** Database model: tạo `FoodItem` model riêng (tách biệt với FoodLog). Schema: `name: String` (tiếng Việt), `nameEn: String` (optional), `kcalPer100g: Number`, `protein: Number`, `carbs: Number`, `fat: Number`, `fiber: Number`, `sugar: Number`, `sodium: Number`, `vitaminC: Number`, `category: String` (optional), `source: 'openfoods' | 'manual'`. Text index trên `name` + `nameEn` để full-text search.

- **D-66:** Seed source = **OpenFoodFacts dump** lọc theo `countries_tags` hoặc `product_name_vi` chứa từ khóa phổ biến (phở, bún, cơm, bánh...). Script `backend/src/scripts/seed-foods.ts` download/parse file CSV từ `world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv` (filtered subset) → transform → insert ~200-300 items. Idempotent: check `FoodItem.countDocuments()` threshold = 50 trước khi insert.

- **D-67:** Manual search endpoint `GET /api/food/items?q=` dùng MongoDB `$text` search trên FoodItem collection. Return top 10 results. Client-side search debounced 300ms.

### Camera Navigation (FOOD-03)

- **D-68:** Không thêm tab thứ 5. Camera scan screen = stack route `app/(food)/scan.tsx`. Food diary screen = `app/(food)/diary.tsx`. Route group `(food)/` không hiển thị trong tab bar.

- **D-69:** Phase 4 navigation entry point: thêm 2 nút tạm thời vào `app/(tabs)/index.tsx` (home tab hiện tại) — nút "Quét bữa ăn" → navigate `/food/scan` và nút "Nhật ký ăn" → navigate `/food/diary`. Phase 5 sẽ xóa nút tạm này và build home dashboard proper (HOME-01 có quick action "Quét bữa ăn").

### Image Compression & Upload (FOOD-01/02)

- **D-70:** Mobile compress ảnh trước khi upload: dùng `expo-image-manipulator` (đã install) để resize xuống max 800x800 pixels + JPEG quality 0.7 → target <500KB (CLAUDE.md rule). Upload qua `multipart/form-data` POST `/api/food/scan` dùng Axios.

- **D-71:** Backend nhận ảnh qua multer (đã setup `upload.middleware.ts`, 5MB limit). Đọc `req.file.buffer`, convert sang base64 để gửi OpenAI. Không cần Cloudinary trong Phase 4 (D-62).

### API Rate Limiting (FOOD-01)

- **D-72:** Rate limit 20 AI scans/user/day (từ CLAUDE.md). Implement bằng cách count FoodLog documents với `aiProvider != 'manual'` trong ngày hiện tại cho userId. Nếu >= 20, trả 429 với message tiếng Việt: "Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai."

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, requirements FOOD-01–09
- `.planning/REQUIREMENTS.md` — FOOD-01 đến FOOD-09 (9 requirements)
- `CLAUDE.md` — Critical rules: compress <500KB, AI proxy qua backend, rate limit 20 scans/day

### Prior Phase Decisions
- `.planning/phases/01-infrastructure/01-CONTEXT.md` — D-07 đến D-25 (services, compound indexes)
- `.planning/phases/02-authentication/02-CONTEXT.md` — Auth patterns, JWT middleware
- `.planning/phases/03-core-health-tracking/03-CONTEXT.md` — Established patterns (API response shape, route structure, TanStack Query, Zustand)

### Existing Models (đã scaffold từ Phase 1)
- `backend/src/models/FoodLog.ts` — Cần update: remove `mealType`, add `sodium`/`vitaminC` to foods array. Compound index `{ userId: 1, date: -1 }` ✓
- **New model cần tạo:** `backend/src/models/FoodItem.ts` — Vietnamese food database (D-65)

### Existing Service Stub
- `backend/src/services/ai-food.service.ts` — `analyzeImage(buffer, imageUrl)` stub. Phase 4 implements dùng GPT-4o-mini (D-58). Cần thêm `sodium`/`vitaminC` vào NutritionResult interface (D-60).

### Existing Backend Infrastructure
- `backend/src/middleware/auth.middleware.ts` — JWT verify, dùng cho tất cả food endpoints
- `backend/src/middleware/upload.middleware.ts` — Multer memory storage 5MB. Dùng cho `POST /api/food/scan`
- `backend/src/services/cloudinary.service.ts` — Available nhưng KHÔNG dùng trong Phase 4 (D-62)
- `backend/src/app.ts` — Mount food router tại `/api/food` (chưa có, cần thêm)

### Mobile Infrastructure
- `mobile/src/lib/api/client.ts` — Axios client với 401 interceptor
- `mobile/src/app/(tabs)/index.tsx` — Thêm 2 nút tạm navigate tới food screens (D-69)
- `expo-image-picker` v15 + `expo-image-manipulator` v12 — Đã install (D-70)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/middleware/upload.middleware.ts` — Multer đã setup, tái dụng cho food scan endpoint
- `mobile/src/components/ui/PrimaryButton.tsx` — Tái dụng cho "Xác nhận & Lưu", "Chụp lại"
- `mobile/src/components/ui/ScreenHeader.tsx` — Tái dụng cho header các food screens
- `mobile/src/lib/api/client.ts` — Thêm `food.api.ts` module với pattern giống `bmi.api.ts`

### Established Patterns
- **Backend route structure**: `api/food/food.routes.ts` + `food.controller.ts` + `food.service.ts`
- **API response**: `{ success: boolean, data: T, error?: string }`
- **Mobile server state**: TanStack Query `useQuery`/`useMutation`
- **Seed script pattern**: `backend/src/scripts/seed-foods.ts` — giống `seed-exercises.ts` (idempotent, countDocuments threshold check)

### Integration Points
- `backend/src/app.ts` line ~24: thêm `app.use('/api/food', foodRouter)`
- `mobile/src/app/(tabs)/index.tsx`: thêm 2 nút navigation tạm thời (D-69)
- `mobile/src/app/(food)/` — Tạo mới: `scan.tsx`, `result.tsx`, `diary.tsx`, `search.tsx`

### FoodLog Schema Changes (cần update trước khi Phase 4 implement)
Current issues với scaffold từ Phase 1:
1. `mealType` field cần remove (D-61)
2. `foods[].sodium` và `foods[].vitaminC` cần add (D-63)
3. NutritionResult interface trong `ai-food.service.ts` cần add sodium/vitaminC (D-60)

</code_context>

<specifics>
## Specific Ideas

- Camera screen dark theme: `backgroundColor: '#000'` hoặc `bg-black` toàn màn hình. Scan frame là border overlay (white/green border rectangle centered). Flash button góc trên phải. Gallery button góc dưới trái. Capture button (white circle) dưới giữa.
- AI result screen hiển thị tags (e.g., "rau xanh", "cà rốt", "protein cao") dưới food name — GPT-4o-mini prompt cần trả về `tags: string[]` trong response, thêm vào NutritionResult.
- Manual search: SearchBar component debounced 300ms → `GET /api/food/items?q=` → FlatList items → tap item → input serving size (default 100g) → confirm → `POST /api/food/logs` với aiProvider='manual'.
- Food diary màn `GET /api/food/logs?date=YYYY-MM-DD` (1 ngày) hoặc `?startDate=&endDate=` (range). Diary screen hiển thị ngày hiện tại mặc định, có thể swipe/tap để xem ngày khác.
- Micro nutrients hiển thị: Chất xơ / Đường / Natri / Vitamin C (FOOD-04 requirement — đã mapped vào D-60/63).

</specifics>

<deferred>
## Deferred Ideas

- **Barcode scan** (FOOD-08 partial): Open Food Facts barcode API. Cần native barcode reader. Defer sang v2 hoặc Phase 5+.
- **LogMeal API integration**: Primary food recognition provider. Block: chưa có API key/pricing. Add sau khi có LogMeal account. ai-food.service.ts interface đã ready với `aiProvider: 'logmeal'`.
- **Meal type categorization**: Sáng/Trưa/Tối/Bữa phụ. User không muốn cho v1. FoodLog schema đã remove mealType (D-61).
- **5th Food tab**: User chọn modal/stack approach (D-68). Tab có thể add sau khi Phase 5 home design confirmed.
- **Cloudinary image storage for food logs**: D-62 không store ảnh. Có thể add sau cho feature "review what you ate".

</deferred>

---

*Phase: 4-AI Food Scan*
*Context gathered: 2026-05-19*
