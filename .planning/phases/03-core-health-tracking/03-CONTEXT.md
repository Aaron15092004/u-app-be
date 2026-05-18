# Phase 3: Core Health Tracking - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Ba tính năng độc lập cùng được xây dựng trong Phase 3:

1. **Workout module** (WO-01 đến WO-11): Danh sách 100+ bài tập có seed sẵn, filter theo category, xem chi tiết, countdown timer với pause/stop/complete, màn "Xuất sắc!" sau khi hoàn thành, lưu lịch sử, thống kê tuần, daily challenge.
2. **Habit tracking** (HAB-01 đến HAB-07): 6 thói quen mặc định, đánh dấu hàng ngày, streak counter (≥3/6 habits/ngày), weekly heatmap, tips section, reset lúc 00:00 UTC+7.
3. **BMI calculator** (BMI-01 đến BMI-06): Slider chiều cao/cân nặng, tính BMI realtime client-side, explicit save button, lịch sử 30 ngày bar chart, sync User.profile khi lưu.

**Requirements:** WO-01, WO-02, WO-03, WO-04, WO-05, WO-06, WO-07, WO-08, WO-09, WO-10, WO-11, HAB-01, HAB-02, HAB-03, HAB-04, HAB-05, HAB-06, HAB-07, BMI-01, BMI-02, BMI-03, BMI-04, BMI-05, BMI-06

**Success criteria (từ ROADMAP.md):**
1. User browse 100+ exercises filtered by category, view detail, start countdown timer có thể pause/stop/complete
2. Completing workout → "Xuất sắc!" screen + saves to WorkoutLog; weekly stats (days/exercises/kcal/minutes) update correctly
3. 6 default habits, tap "Đánh dấu +1", streak counter increments for consecutive days, progress resets at 00:00
4. Update height/weight via sliders, BMI recalculates instantly, 30-day bar chart reflects past entries

</domain>

<decisions>
## Implementation Decisions

### Exercise Seed Data (WO-11)

- **D-41:** Exercise names và descriptions: **100% Tiếng Việt**. Seed file viết toàn bộ content tiếng Việt — tên bài tập, mô tả, tên các bước (steps). Nhất quán với design system của app.
- **D-42:** Image strategy: `imageUrl: null` cho tất cả 100 exercises seed. UI dùng **category icon placeholder** thay ảnh thực. Admin upload ảnh thực qua Phase 6 dashboard.
- **D-43:** Distribution: **~25 exercises mỗi category** (Yoga: 25, Cardio: 25, Tạ: 25, Giãn cơ: 25 = 100 tổng). Cân bằng, đủ đa dạng cho v1.
- **D-44:** Seed method: `npm run seed` (command trong `backend/package.json`, chạy `ts-node backend/src/scripts/seed-exercises.ts`). Script **idempotent** — check trước khi insert, skip nếu đã có data. Chạy thủ công 1 lần khi deploy lần đầu.

### Workout Timer (WO-07, WO-08)

- **D-45:** Background behavior: Timer **tự động pause khi app vào background** (dùng React Native `AppState` listener). Khi user quay lại app, timer vẫn ở đúng thời điểm đã pause. Không cần expo-task-manager, không cần background permission.
- **D-46:** Manual pause: Pause **giữ đúng thời điểm đang đếm** (freeze tại X giây còn lại). Resume tiếp tục đếm từ X. Standard behavior.
- **D-47:** Stop button: Nhấn "Dừng" = **hủy buổi tập, không lưu vào lịch sử**. WorkoutLog chỉ được tạo khi user nhấn "Hoàn thành". Bảo toàn tính toàn vẹn của dữ liệu workout history.
- **D-48:** Timer duration: Lấy từ `exercise.durationMinutes * 60` giây. Không có field nhập thủ công trước khi bắt đầu.

### Habit Streak & Completion (HAB-03, HAB-04, HAB-07)

- **D-49:** Streak definition: Một ngày **tính vào streak khi user hoàn thành ≥3/6 thói quen** trong ngày đó. Cân bằng giữa motivation và ý nghĩa thực của streak.
- **D-50:** Streak calculation: **Computed từ HabitLog query** — đếm số ngày liên tục (tính ngược từ hôm nay) mà ngày đó có ≥3 distinct habitId cho userId. Không denormalize vào User model.
- **D-51:** Daily reset: **Implicit qua date-based query**. Server timezone `Asia/Ho_Chi_Minh` (UTC+7). HabitLog.date lưu theo ngày local Việt Nam. Mỗi ngày tự là 1 bucket riêng — không cần cron job reset.
- **D-52:** Weekly heatmap (HAB-05): **Ô được tô màu xanh khi ≥3 habits hoàn thành** trong ngày đó. Nhất quán với streak definition (D-49). Ô xám = chưa đủ.
- **D-57:** HAB-03 = **strict 1 check per habit per day (binary)**. The "Đánh dấu +1" label is the CTA button label only — it does NOT mean multiple increments. `HabitLog` unique index `{ userId, date, habitId }` enforces this at the database level. Once a habit is checked today, tapping the button again is a no-op (idempotent upsert returns the existing record). The row UI should appear disabled/checked after the first tap. There is no counter model for any of the 6 default habits in Phase 3.

### BMI Save Behavior (BMI-03, BMI-06)

- **D-53:** Save trigger: **Explicit "Lưu" button** — slider cập nhật BMI score realtime (client-side computation), nhưng chỉ persist vào database khi user nhấn "Lưu". Tạo 1 BMIRecord mỗi lần user chủ động lưu.
- **D-54:** Data sync: `PATCH /api/bmi` **vừa tạo BMIRecord mới vừa update `User.profile.heightCm` và `User.profile.weightKg`** trong cùng 1 request. Đảm bảo Home dashboard và Profile screen dùng giá trị cân nặng/chiều cao mới nhất.
- **D-55:** Chart aggregation: Biểu đồ 30 ngày hiển thị **1 điểm/ngày = giá trị BMI của record cuối cùng trong ngày** (sort by `recordedAt` desc, group by date). Simple query, correct representation.
- **D-56:** Slider ranges: Chiều cao **100–220 cm**, Cân nặng **30–200 kg**. Cover đủ người dùng Việt Nam trưởng thành.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, requirements list (WO/HAB/BMI)
- `.planning/REQUIREMENTS.md` — WO-01 đến WO-11, HAB-01 đến HAB-07, BMI-01 đến BMI-06 (25 requirements)
- `.planning/PROJECT.md` — Screen inventory (Exercise List/Detail/Timer/Complete/Habit/BMI screens), design system (green primary, orange workout accent)
- `CLAUDE.md` — Critical rules: NativeWind v4, TanStack Query v5, Zustand, no AsyncStorage

### Prior Phase Decisions
- `.planning/phases/01-infrastructure/01-CONTEXT.md` — D-07 đến D-25 (library versions, compound index requirement)
- `.planning/phases/02-authentication/02-CONTEXT.md` — D-41 onward context; established patterns (API response shape, route structure, TanStack Query setup)

### Existing Models (đã scaffold từ Phase 1)
- `backend/src/models/Exercise.ts` — Schema đầy đủ: name/nameEn/category/difficulty/durationMinutes/caloriesBurned/imageUrl/description/steps/isActive. Index: `{ category: 1, isActive: 1 }`
- `backend/src/models/WorkoutLog.ts` — Schema: userId/exerciseId/exerciseName/date/durationMinutes/caloriesBurned/completedAt. Index: `{ userId: 1, date: -1 }` ✓
- `backend/src/models/HabitLog.ts` — Schema: userId/habitId(enum 6 values)/date/checkedAt. Unique index: `{ userId: 1, date: -1, habitId: 1 }` ✓
- `backend/src/models/BMIRecord.ts` — Schema: userId/heightCm/weightKg/bmi/category(4 values)/recordedAt. Index: `{ userId: 1, recordedAt: -1 }` ✓

### Existing Backend Infrastructure
- `backend/src/middleware/auth.middleware.ts` — JWT verify middleware (Phase 2). Tất cả Phase 3 endpoints đều cần xác thực.
- `backend/src/api/auth/` — Pattern mẫu cho route/controller/service structure

### Existing Mobile Infrastructure
- `mobile/src/providers/AuthProvider.tsx` — useAuth() hook, truy cập user.id cho API calls
- `mobile/src/lib/api/client.ts` — Axios client với 401 interceptor (Phase 2)
- `mobile/src/app/(tabs)/` — Tab navigation group. Phase 3 thêm screens trong tab Tập luyện (exercises), Thói quen (habits), và màn BMI

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mobile/src/app/(tabs)/index.tsx` — Tab layout đã có, Phase 3 thêm workout/habit/bmi screens vào tab group
- `backend/src/middleware/auth.middleware.ts` — Dùng cho tất cả Phase 3 protected endpoints
- `mobile/src/lib/api/client.ts` — Axios client tái dụng, thêm workout/habit/bmi API functions

### Established Patterns
- **Backend**: `api/[feature]/[feature].routes.ts` + `[feature].controller.ts` + `[feature].service.ts` — tạo folders: `api/exercises/`, `api/workouts/`, `api/habits/`, `api/bmi/`
- **API response**: `{ success: boolean, data: T, error?: string }` — nhất quán tất cả endpoints
- **Mobile server state**: TanStack Query (`useQuery`/`useMutation`) cho API calls
- **Mobile UI state**: Zustand cho timer state (isRunning, isPaused, remainingSeconds, exerciseId)
- **Styling**: NativeWind v4 utility classes, orange accent (`bg-orange-500`) cho workout screens

### Integration Points
- `backend/src/app.ts` — mount exercise/workout/habit/bmi routers tại `/api/exercises`, `/api/workouts`, `/api/habits`, `/api/bmi`
- `backend/src/models/User.ts` — `PATCH /api/bmi` update `profile.heightCm` + `profile.weightKg` trực tiếp (D-54)
- Timer screen cần `AppState` từ React Native để detect app background → auto-pause (D-45)
- Weekly stats (WO-03) query WorkoutLog aggregation theo `userId + date range (7 ngày gần nhất)`

</code_context>

<specifics>
## Specific Ideas

- Timer screen dùng **orange theme** (CLAUDE.md + Figma): background màu cam, text trắng. Hoàn thành màn "Xuất sắc!" cũng orange theme.
- Habit list: "Đánh dấu +1" CTA button mỗi habit row. **Resolved → D-57:** HAB-03 is binary 1 check per habit per day. The label "Đánh dấu +1" is the CTA label only; it does not mean multiple increments. Once tapped, the row is disabled for the rest of the day. HabitLog unique index enforces this.
- BMI categories tiếng Việt: `underweight` = "Thiếu cân", `normal` = "Bình thường", `overweight` = "Thừa cân", `obese` = "Béo phì" (BMI-01).
- Daily challenge (WO-04): "Đốt X calo" — X có thể hardcode 300 kcal cho v1 hoặc random từ seed exercises.
- Weekly stats labels tiếng Việt: "Ngày tập", "Bài tập", "kcal", "Phút" (WO-03).

</specifics>

<deferred>
## Deferred Ideas

- **Lottie animations / video cho exercise** — User muốn "ảnh động 2D lottie/ video" cho bài tập. Lottie animations và video exercises là capabilities mới, nằm ngoài scope v1 (PROJECT.md: "Video workout content — v2"). Ghi nhận cho v2.
- **Custom habit creation** — Cho phép user tạo thói quen riêng ngoài 6 defaults. Đã list trong v2 requirements (REQUIREMENTS.md). Để Phase 5 hoặc v2.
- **Biometric unlock trước khi xem data sức khỏe** — Không được đề cập nhưng có thể relevant. v2.

</deferred>

---

*Phase: 3-Core Health Tracking*
*Context gathered: 2026-05-18*
