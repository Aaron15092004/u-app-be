---
phase: 03-core-health-tracking
verified: 2026-05-18T12:00:00+07:00
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Timer đếm ngược hiển thị đúng và tự chuyển sang màn Xuất sắc! khi về 0"
    expected: "Countdown chạy từ durationMinutes*60 xuống 0, sau đó router.replace sang /complete"
    why_human: "Cần runtime để xác nhận setInterval + Zustand tick hoạt động trên thiết bị thực"
  - test: "Tắt màn hình / app chuyển background thì timer tự pause"
    expected: "AppState 'background' → pause() được gọi; khi foreground lại timer vẫn còn trên màn hình"
    why_human: "AppState behavior chỉ xác minh được trên thiết bị thực"
  - test: "Optimistic check-in habit bị rollback đúng khi network lỗi"
    expected: "UI hiển thị trạng thái đã check-in ngay, sau đó revert về trạng thái cũ nếu API fail"
    why_human: "Cần mô phỏng lỗi mạng trong runtime"
  - test: "Habit streak tính chính xác theo D-49 (>=3/6 distinct habits/day UTC+7)"
    expected: "streak tăng 1 sau khi check in ít nhất 3 trong 6 habits trong ngày, không tăng nếu chỉ check 2"
    why_human: "Logic tính streak server-side, cần test với DB thực"
  - test: "BMI save lưu đồng thời BMIRecord và User.profile (atomic D-54)"
    expected: "PATCH /api/bmi gọi → cả 2 collections cập nhật, history chart refresh"
    why_human: "Cần test với MongoDB Atlas replica set thực để xác nhận transaction thành công"
  - test: "Màn Home (tab đầu) hiện placeholder Phase 3 sắp ra mắt — đây là thiết kế có chủ đích"
    expected: "Home tab hiển thị thông báo 'Phase 3 sắp ra mắt' và nút đăng xuất"
    why_human: "Cần xác nhận từ developer rằng Home tab placeholder là dự kiến (HOME-01..06 thuộc Phase 5)"
---

# Phase 3: Core Health Tracking — Báo cáo Xác minh

**Mục tiêu Phase:** Users can browse and complete workouts, check in daily habits, and view their BMI — all stored to their account history.
**Thời điểm xác minh:** 2026-05-18T12:00:00+07:00
**Trạng thái:** human_needed
**Xác minh lần đầu:** Yes

---

## Tóm tắt đánh giá

**4/4 success criteria được xác minh qua code.** Tất cả backend API routes tồn tại, có implementation thực (không phải stub), được mount đúng trong `app.ts`, và được gọi từ mobile screens thông qua API client chính xác. Các mobile screens cover toàn bộ 25 requirements (WO-01 đến WO-11, HAB-01 đến HAB-07, BMI-01 đến BMI-06).

Còn 6 hạng mục cần kiểm tra trên thiết bị thực hoặc với developer (xem phần Human Verification).

---

## Goal Achievement

### Observable Truths (Success Criteria từ ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User có thể duyệt 100+ bài tập theo category (Yoga/Cardio/Tạ/Giãn cơ), xem chi tiết với mô tả và danh sách động tác, bắt đầu countdown timer có thể pause/stop/complete | VERIFIED | `ExerciseListScreen` dùng `listExercisesApi` với filter; `ExerciseDetailScreen` hiển thị steps; `TimerScreen` dùng Zustand timer store với pause/resume/stop logic; seed script có 100 bài tập (25 yoga + 25 cardio + 25 tạ + 25 giãn cơ) |
| 2 | Hoàn thành workout hiển thị màn "Xuất sắc!" và lưu session vào workout history; weekly stats cập nhật đúng | VERIFIED | `CompleteScreen` gọi `createWorkoutLogApi` ngay khi mount (hasFiredRef chống re-fire); `useMutation` invalidates `['workouts']`; backend `createWorkoutLog` service dùng `WorkoutLog.create()` thực sự; `getWeeklyStats` aggregate query thực |
| 3 | User thấy 6 thói quen mặc định với daily progress counter, tap "Đánh dấu +1", streak tăng cho consecutive days; progress reset lúc 00:00 | VERIFIED | `HabitsScreen` có HABIT_DEFAULTS đủ 6 thói quen; `checkInHabitApi` → `/api/habits/check-in`; optimistic update với rollback; `getStreak` service tính streak dựa trên UTC+7 day buckets; reset 00:00 là tự nhiên từ `vietnamDayStart()` tạo bucket mới mỗi ngày |
| 4 | User cập nhật chiều cao/cân nặng qua slider, BMI score và category label tính ngay tức thì, bar chart 30 ngày phản ánh lịch sử | VERIFIED | `BMIScreen` dùng `useMemo` tính BMI khi slider thay đổi; `BMIResultCard` + `BMIScaleBar` render realtime; `saveBMIApi` → `PATCH /api/bmi`; `getBMIHistoryApi` → `GET /api/bmi/history` aggregate 30 ngày; `BMIChart` render bars từ history data |

**Score:** 4/4 success criteria verified

---

## Required Artifacts

### Backend API

| Artifact | Expected | Status | Chi tiết |
|----------|----------|--------|----------|
| `backend/src/api/exercises/exercises.routes.ts` | GET /, GET /:id | VERIFIED | Routes mount với `authenticate` middleware |
| `backend/src/api/exercises/exercises.service.ts` | List với filter + getById | VERIFIED | `Exercise.find(filter)` thực, 404 error khi không tồn tại |
| `backend/src/api/workouts/workouts.routes.ts` | POST /, GET /stats/weekly | VERIFIED | Cả 2 routes có `authenticate` |
| `backend/src/api/workouts/workouts.service.ts` | createWorkoutLog + getWeeklyStats | VERIFIED | `WorkoutLog.create()` thực; aggregate với `$group`, `$match` thực |
| `backend/src/api/habits/habits.routes.ts` | POST /check-in, GET /today, GET /weekly, GET /streak | VERIFIED | 4 routes đầy đủ |
| `backend/src/api/habits/habits.service.ts` | checkIn idempotent + today + weekly heatmap + streak | VERIFIED | `findOneAndUpdate` với `$setOnInsert` (idempotent upsert); aggregate streak logic với D-49 (>=3 habits) |
| `backend/src/api/bmi/bmi.routes.ts` | PATCH /, GET /history | VERIFIED | 2 routes với authenticate |
| `backend/src/api/bmi/bmi.service.ts` | saveBMIAtomic + getBMIHistory | VERIFIED | Transaction với fallback sequential save (D-54); aggregate pipeline 30-day history |
| `backend/src/scripts/seed-exercises.ts` | 100 exercises, idempotent | VERIFIED | `grep -c "name:"` = 100; `package.json` có `"seed": "tsx src/scripts/seed-exercises.ts"` |
| `backend/src/models/Exercise.ts` | Schema với compound index | VERIFIED | Index `{ category: 1, isActive: 1 }` |
| `backend/src/models/WorkoutLog.ts` | Schema với compound index | VERIFIED | Index `{ userId: 1, date: -1 }` |
| `backend/src/models/HabitLog.ts` | Schema với unique index | VERIFIED | Unique index `{ userId: 1, date: -1, habitId: 1 }` — enforces 1 check-in/habit/day |
| `backend/src/models/BMIRecord.ts` | Schema với compound index | VERIFIED | Index `{ userId: 1, recordedAt: -1 }` |

### Mobile Screens

| Artifact | Expected | Status | Chi tiết |
|----------|----------|--------|----------|
| `mobile/src/app/(tabs)/exercises/index.tsx` | Exercise List screen | VERIFIED | Filter chips 5 categories; FlatList với ExerciseCard; WeeklyStatCard row; DailyChallengeCard |
| `mobile/src/app/(tabs)/exercises/[id]/index.tsx` | Exercise Detail screen | VERIFIED | Steps list; difficulty/duration/kcal metadata; "Bắt đầu tập" button → timer route |
| `mobile/src/app/(tabs)/exercises/[id]/timer.tsx` | Timer screen | VERIFIED | Orange theme (TIMER_BG); Zustand timer; AppState auto-pause; auto-navigate complete khi hit 0 |
| `mobile/src/app/(tabs)/exercises/[id]/complete.tsx` | Complete screen | VERIFIED | "Xuất sắc!" text; `createWorkoutLogApi` mutation on mount; hasFiredRef chống double-save; "Hoàn tất" button |
| `mobile/src/app/(tabs)/habits/index.tsx` | Habit screen | VERIFIED | 6 HABIT_DEFAULTS; optimistic mutation; HabitHeatmap; StreakBadge; Tips section |
| `mobile/src/app/(tabs)/bmi/index.tsx` | BMI screen | VERIFIED | Sliders height/weight; `useMemo` BMI; BMIResultCard; BMIScaleBar; BMIChart; CATEGORY_ADVICE |
| `mobile/src/app/(tabs)/_layout.tsx` | 4 tabs layout | VERIFIED | Tabs: Trang chủ, Tập luyện, Thói quen, BMI |

### Mobile Components

| Artifact | Expected | Status | Chi tiết |
|----------|----------|--------|----------|
| `mobile/src/components/ui/ExerciseCard.tsx` | Card với difficulty/duration/kcal | VERIFIED | Difficulty pill màu, time, kcal, category icon |
| `mobile/src/components/ui/CategoryFilterChip.tsx` | Filter chip active/inactive | VERIFIED | Active = PRIMARY bg, inactive = bordered |
| `mobile/src/components/ui/WeeklyStatCard.tsx` | Weekly stat display | VERIFIED | Value + label |
| `mobile/src/components/ui/DailyChallengeCard.tsx` | Daily challenge progress bar | VERIFIED | Progress bar %; currentKcal/targetKcal |
| `mobile/src/components/ui/TimerDisplay.tsx` | MM:SS countdown | VERIFIED | format() function; accessibility live region |
| `mobile/src/components/ui/TimerControls.tsx` | Pause/Resume/Stop buttons | VERIFIED | Toggle pause/resume; stop button |
| `mobile/src/components/ui/HabitRow.tsx` | Habit row với check-in CTA | VERIFIED | "Đánh dấu +1" button; checkmark khi completed |
| `mobile/src/components/ui/HabitHeatmap.tsx` | Weekly heatmap T2-CN | VERIFIED | 7 circles; dayLabelFromDate(); qualified = HABIT_ACTIVE color |
| `mobile/src/components/ui/StreakBadge.tsx` | Streak counter badge | VERIFIED | flame icon; streakDays > 0 ? "{n} ngày" : motivational text |
| `mobile/src/components/ui/BMIResultCard.tsx` | BMI score + category + scale | VERIFIED | Bao gồm BMIScaleBar; CATEGORY_VI mapping |
| `mobile/src/components/ui/BMIScaleBar.tsx` | Scale bar 15-40 với dot | VERIFIED | 4 segments màu (underweight/normal/overweight/obese); dot position theo % |
| `mobile/src/components/ui/BMIChart.tsx` | Bar chart lịch sử | PASSED (Expo Go adaptation) | Plain RN bars thay vì victory-native/Skia — intentional, documented trong comment |

### Mobile Infrastructure

| Artifact | Expected | Status | Chi tiết |
|----------|----------|--------|----------|
| `mobile/src/stores/timerStore.ts` | Zustand timer store | VERIFIED | start/pause/resume/tick/reset; isRunning + isPaused state |
| `mobile/src/lib/api/exercises.api.ts` | API client exercises | VERIFIED | listExercisesApi + getExerciseApi → đúng endpoints |
| `mobile/src/lib/api/workouts.api.ts` | API client workouts | VERIFIED | createWorkoutLogApi + getWeeklyStatsApi → đúng endpoints |
| `mobile/src/lib/api/habits.api.ts` | API client habits | VERIFIED | checkInHabitApi + getTodayHabitsApi + getWeeklyHabitsApi + getStreakApi → đúng endpoints |
| `mobile/src/lib/api/bmi.api.ts` | API client BMI | VERIFIED | saveBMIApi (PATCH) + getBMIHistoryApi (GET) → đúng endpoints |
| `mobile/src/constants/colors.ts` | Design tokens Phase 3 | VERIFIED | TIMER_BG, BMI_*, HABIT_ACTIVE/INACTIVE, STREAK_BADGE, DIFFICULTY_* |

---

## Key Link Verification

| From | To | Via | Status | Chi tiết |
|------|----|-----|--------|---------|
| `ExerciseListScreen` | `GET /api/exercises` | `listExercisesApi` | WIRED | `useQuery` với queryKey `['exercises', activeFilter]` |
| `ExerciseDetailScreen` | `GET /api/exercises/:id` | `getExerciseApi(id)` | WIRED | `useQuery` enabled khi `Boolean(id)` |
| `ExerciseDetailScreen` "Bắt đầu tập" | `TimerScreen` | `router.push('/(tabs)/exercises/${id}/timer')` | WIRED | Xác nhận trong handleStart() |
| `TimerScreen` → 0 giây | `CompleteScreen` | `router.replace('/(tabs)/exercises/${id}/complete')` | WIRED | Trong useEffect khi `remainingSeconds <= 0` |
| `CompleteScreen` | `POST /api/workouts` | `createWorkoutLogApi` trong `useMutation` | WIRED | Mutation gọi khi `exercise` load xong, hasFiredRef chống re-fire |
| `ExerciseListScreen` | `GET /api/workouts/stats/weekly` | `getWeeklyStatsApi` | WIRED | `useQuery` `['workouts', 'stats', 'weekly']` |
| `HabitsScreen` "Đánh dấu +1" | `POST /api/habits/check-in` | `checkInHabitApi(habitId)` | WIRED | Trong `mutation.mutate(habit.id)` |
| `HabitsScreen` | `GET /api/habits/today` | `getTodayHabitsApi` | WIRED | `useQuery` `['habits', 'today']` |
| `HabitsScreen` heatmap | `GET /api/habits/weekly` | `getWeeklyHabitsApi` | WIRED | `useQuery` `['habits', 'weekly']` |
| `HabitsScreen` streak | `GET /api/habits/streak` | `getStreakApi` | WIRED | `useQuery` `['habits', 'streak']` |
| `BMIScreen` "Lưu số đo" | `PATCH /api/bmi` | `saveBMIApi(heightCm, weightKg)` | WIRED | `useMutation` với invalidate `['bmi', 'history']` |
| `BMIScreen` chart | `GET /api/bmi/history` | `getBMIHistoryApi` | WIRED | `useQuery` `['bmi', 'history']` |
| Backend routes | `app.ts` | `app.use('/api/...')` | WIRED | Tất cả 4 routers mount đúng |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ExerciseListScreen` | `exercises` | `Exercise.find(filter).lean()` | Yes — MongoDB query | FLOWING |
| `ExerciseListScreen` | `stats` | `WorkoutLog.aggregate([...])` | Yes — aggregate query | FLOWING |
| `HabitsScreen` | `todayQuery.data` | `HabitLog.find({userId, date: today}).lean()` | Yes — MongoDB query | FLOWING |
| `HabitsScreen` | `weeklyQuery.data` | `HabitLog.aggregate([...])` group by date | Yes — aggregate | FLOWING |
| `HabitsScreen` | `streakQuery.data` | `HabitLog.aggregate([...])` 365-day lookback | Yes — aggregate | FLOWING |
| `BMIScreen` | `historyQuery.data` | `BMIRecord.aggregate([...])` 30-day pipeline | Yes — aggregate | FLOWING |
| `BMIScreen` | `bmi` (live) | `useMemo(computeBMI, [heightCm, weightKg])` | Yes — computed from slider | FLOWING |
| `CompleteScreen` | mutation result | `WorkoutLog.create({...})` | Yes — MongoDB insert | FLOWING |

---

## Behavioral Spot-Checks

Step 7b không chạy: không có runnable entry points để test mà không cần khởi động server/thiết bị.

---

## Requirements Coverage

### WO (Workout) Requirements

| Requirement | Plan | Mô tả | Status | Evidence |
|-------------|------|-------|--------|---------|
| WO-01 | 03-01, 03-06 | Exercise list với filter Tất cả/Yoga/Cardio/Tạ/Giãn cơ | SATISFIED | `ExerciseListScreen` + `CategoryFilterChip` + backend filter `?category=` |
| WO-02 | 03-01, 03-06 | Mỗi bài: tên, ảnh, độ khó (Dễ/TB/Khó), thời gian, kcal | SATISFIED | `ExerciseCard` có difficulty pill, duration, kcal; icon thay ảnh (D-42) |
| WO-03 | 03-02, 03-06 | Weekly stats: ngày/7, bài tập, kcal, phút | SATISFIED | `WeeklyStatCard` x4 + `getWeeklyStatsApi` → `getWeeklyStats` aggregate |
| WO-04 | 03-02, 03-06 | Daily challenge (đốt X calo) với progress bar | SATISFIED | `DailyChallengeCard` với `todayKcal`/`targetKcal` từ weekly stats API |
| WO-05 | 03-01, 03-06 | Chi tiết bài: mô tả, danh sách động tác, lưu ý | SATISFIED | `ExerciseDetailScreen` hiển thị `description` và `steps[]` |
| WO-06 | 03-06, 03-07 | Bắt đầu tập từ màn chi tiết | SATISFIED | "Bắt đầu tập" button → `router.push(.../timer)` |
| WO-07 | 03-07 | Countdown timer với tên bài tập, orange theme | SATISFIED | `TimerScreen` dùng `TIMER_BG = '#FF6B35'`; exercise name ở header |
| WO-08 | 03-07 | Pause, dừng, hoàn thành trong lúc tập | SATISFIED | `TimerControls` có pause/resume; `handleStop` alert; auto-complete khi 0s |
| WO-09 | 03-07 | Màn "Xuất sắc!" sau hoàn thành, orange theme | SATISFIED | `CompleteScreen` "Xuất sắc!" text; TIMER_BG background |
| WO-10 | 03-02, 03-07 | Lưu vào lịch sử workout | SATISFIED | `createWorkoutLogApi` mutation trong `CompleteScreen` |
| WO-11 | 03-01 | 100+ bài tập từ launch (4 categories seed) | SATISFIED | seed-exercises.ts có 100 bài (25 x 4); `npm run seed` script |

### HAB (Habit) Requirements

| Requirement | Plan | Mô tả | Status | Evidence |
|-------------|------|-------|--------|---------|
| HAB-01 | 03-03, 03-08 | Danh sách thói quen với progress (X/6, %) | SATISFIED | `{todayQuery.data?.progress.count ?? 0}/6 hoàn thành — {percent}%` |
| HAB-02 | 03-03, 03-08 | 6 thói quen mặc định (nước, rau, tập, ngủ, đọc, sữa hạt) | SATISFIED | `HABIT_DEFAULTS` khớp đúng 6 items; `HABIT_IDS` ở backend |
| HAB-03 | 03-03, 03-08 | Đánh dấu hoàn thành từng thói quen ("Đánh dấu +1") | SATISFIED | `HabitRow` CTA; `checkInHabitApi`; idempotent upsert |
| HAB-04 | 03-03, 03-08 | Streak counter | SATISFIED | `StreakBadge` + `getStreakApi`; backend service D-49 logic |
| HAB-05 | 03-03, 03-08 | Heatmap tuần (T2-CN) | SATISFIED | `HabitHeatmap` với `weekData[]`; `dayLabelFromDate()` mapping |
| HAB-06 | 03-08 | Tips section về habit building | SATISFIED | "Mẹo nhỏ" section trong `HabitsScreen` |
| HAB-07 | 03-03 | Reset lúc 00:00 | SATISFIED | `vietnamDayStart()` tạo bucket mới mỗi ngày; không có cron — reset tự nhiên |

### BMI Requirements

| Requirement | Plan | Mô tả | Status | Evidence |
|-------------|------|-------|--------|---------|
| BMI-01 | 03-04, 03-09 | Màn BMI với chỉ số + phân loại | SATISFIED | `BMIScreen` heading "Phân tích BMI"; `BMIResultCard` hiển thị bmi + CATEGORY_VI |
| BMI-02 | 03-09 | BMI scale bar (15-40) với điểm hiện tại | SATISFIED | `BMIScaleBar` tính `percent = ((bmi-15)/25)*100`; 4 segment màu |
| BMI-03 | 03-04, 03-09 | Cập nhật chiều cao/cân nặng qua slider | SATISFIED | `@react-native-community/slider` trong `BMIScreen` |
| BMI-04 | 03-09 | Tự động tính BMI khi thay đổi | SATISFIED | `useMemo(() => computeBMI(...), [heightCm, weightKg])` |
| BMI-05 | 03-09 | Lời khuyên dựa trên BMI | SATISFIED | `CATEGORY_ADVICE` object; hiển thị trong "Lời khuyên" card |
| BMI-06 | 03-04, 03-09 | Bar chart lịch sử 30 ngày | SATISFIED (Expo Go adaptation) | `BMIChart` với plain RN bars; được comment rõ sẽ restore victory-native trước EAS build |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mobile/src/app/(tabs)/index.tsx` | 33 | `"Trang chủ — Phase 3 sắp ra mắt"` | INFO | Home tab là placeholder — HOME-01..06 thuộc Phase 5, không phải Phase 3 |
| `mobile/src/components/ui/BMIChart.tsx` | 1-2 | Comment "EXPO GO FALLBACK — Restore before EAS" | INFO | Intentional, documented; plain RN bars render real data |
| `mobile/src/lib/storage/mmkv.ts` | 1-2 | EXPO GO MOCK in-memory | INFO | Intentional (stated in problem statement) |
| `mobile/src/lib/auth/google-signin.ts` | 1-2 | EXPO GO MOCK | INFO | Intentional (stated in problem statement) |
| `mobile/src/lib/auth/apple-signin.ts` | 1-2 | EXPO GO MOCK | INFO | Intentional (stated in problem statement) |

**Kết luận:** Không có BLOCKER anti-patterns. Không có TBD/FIXME/XXX chưa resolved. Các EXPO GO mocks đều được document rõ ràng và là intentional adaptations.

---

## Ghi chú kỹ thuật đặc biệt

### Timer Store — Pause logic

`pause()` set `isRunning: false, isPaused: true`. Tick loop check `if (isRunning && !isPaused)` — vì vậy pause ngừng interval đúng. Auto-complete check `if (isRunning && ...)` — vì vậy không auto-complete khi đang pause. Behavior này đúng theo spec.

**Cảnh báo nhỏ (WARNING, không phải BLOCKER):** Khi user pause timer rồi timer về đúng 0 giây trước khi resume, sau đó resume, `isRunning` trở lại `true` và `remainingSeconds` vẫn là 0 → effect auto-complete sẽ fire. `hasFiredCompleteRef` trong timer.tsx ngăn double-navigate. Cần confirm trên thiết bị thực.

### WO-04 targetKcal Hardcoded

`targetKcal: 300` trong `workouts.service.ts` line 70 có comment `// WO-04 hardcoded constant`. Đây không phải stub — data flow chính xác; chỉ là constant thay vì user setting. Acceptable cho Phase 3.

---

## Human Verification Required

### 1. Timer Countdown Runtime Test

**Test:** Tìm một bài tập ngắn (5 phút), nhấn "Bắt đầu tập", quan sát màn timer đếm ngược, để timer chạy hết.
**Expected:** Timer đếm từ 5:00 xuống 0:00, sau đó tự chuyển sang màn "Xuất sắc!"; bài tập xuất hiện trong weekly stats.
**Why human:** setInterval + Zustand state update cần runtime để xác minh; không thể test bằng static analysis.

### 2. AppState Auto-Pause Test

**Test:** Trong khi timer đang chạy, nhấn Home button (background app), sau đó quay lại app.
**Expected:** Timer hiển thị "Đã tạm dừng" khi quay lại; countdown không tiếp tục tự động.
**Why human:** AppState behavior trên iOS vs Android khác nhau; cần test trên thiết bị thực.

### 3. Optimistic Rollback Test

**Test:** Bật airplane mode, tap "Đánh dấu +1" trên một thói quen.
**Expected:** UI ngay lập tức hiện checkmark (optimistic), sau đó revert + hiện "Không thể cập nhật. Thử lại."
**Why human:** Cần simulate network failure trong runtime.

### 4. Streak Counter Accuracy Test

**Test:** Check in ít nhất 3/6 thói quen ngày hôm nay, xem streak. Sau đó thử check chỉ 2/6 ngày hôm sau.
**Expected:** Streak tăng 1 sau ngày có >=3; không tăng (hoặc reset) sau ngày có <3.
**Why human:** Logic tính streak backend theo D-49 cần test với DB thực qua nhiều ngày.

### 5. BMI Atomic Save Test

**Test:** Thay đổi chiều cao/cân nặng, nhấn "Lưu số đo".
**Expected:** Toast "Đã lưu!" xuất hiện; history chart thêm bar mới; PATCH /api/bmi trả 200 với cả bmiRecord và user.profile.
**Why human:** Transaction behavior cần Atlas replica set để xác minh.

### 6. Home Tab Placeholder Confirmation

**Test:** Developer xác nhận rằng Home tab hiển thị placeholder "Phase 3 sắp ra mắt" là thiết kế có chủ đích.
**Expected:** Developer xác nhận HOME-01..06 thuộc Phase 5; Phase 3 không cần implement Home dashboard.
**Why human:** Cần developer decision — nếu là thiết kế đúng, không có gap. Nếu không, cần xem lại scope.

---

## Gaps Summary

**Không có blocker gaps được tìm thấy.** Tất cả 4 success criteria của ROADMAP.md được verify qua codebase. Tất cả 25 requirements (WO, HAB, BMI) đều có implementation thực trong cả backend lẫn mobile.

Trạng thái `human_needed` phản ánh 6 hạng mục cần xác minh runtime — đây là phân loại chính xác. Các hạng mục này không phải gaps mà là behavioral checks không thể verify bằng static analysis.

---

*Verified: 2026-05-18T12:00:00+07:00*
*Verifier: Claude (gsd-verifier)*
