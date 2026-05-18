---
phase: "03"
plan: "07"
subsystem: mobile-workout-timer
tags: [timer, workout, zustand, appstate, react-native]
dependency_graph:
  requires: [03-05, 03-06]
  provides: [timer-screen, complete-screen]
  affects: [workout-log, exercises-navigation]
tech_stack:
  added: []
  patterns: [zustand-timer-state, appstate-background-pause, mutation-fire-once-ref]
key_files:
  created:
    - mobile/src/components/ui/TimerDisplay.tsx
    - mobile/src/components/ui/TimerControls.tsx
    - mobile/src/app/(tabs)/exercises/[id]/timer.tsx
    - mobile/src/app/(tabs)/exercises/[id]/complete.tsx
  modified: []
decisions:
  - "AppState background auto-pause: khi app vào background trong lúc timer đang chạy, tự động gọi pause() để tránh tick ngầm"
  - "hasFiredRef pattern: dùng useRef để đảm bảo mutation.mutate chỉ gọi 1 lần khi component mount, không gọi lại khi re-render"
  - "router.replace thay vì router.push cho complete screen: tránh user back về timer screen đã kết thúc"
metrics:
  duration: "~15 phút"
  completed_date: "2026-05-18"
  tasks_completed: 3
  files_created: 4
---

# Phase 03 Plan 07: Timer + Complete Screens Summary

Timer và Complete screens hoàn thiện workout user journey với orange theme (#FF6B35), Zustand timerStore, AppState background auto-pause, và auto-log workout khi hoàn thành.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | TimerDisplay + TimerControls UI components | c0af708 |
| 2 | Timer screen với Zustand + AppState + tick loop | c0af708 |
| 3 | Complete screen với auto-log + error retry | c0af708 |

## Timer State Transitions

```
start(exerciseId, durationSeconds)
  → isRunning=true, isPaused=false, remainingSeconds=N

[1Hz tick loop active]
  → remainingSeconds-- mỗi giây

pause() [manual hoặc AppState='background']
  → isRunning=false, isPaused=true
  [tick loop dừng]

resume()
  → isRunning=true, isPaused=false
  [tick loop tiếp tục]

remainingSeconds <= 0
  → router.replace('/(tabs)/exercises/[id]/complete')
  [hasFiredCompleteRef.current = true để tránh navigate 2 lần]

reset() [manual stop hoặc sau khi hoàn tất]
  → isRunning=false, isPaused=false, remainingSeconds=0, exerciseId=null
```

## AppState Handler

```
AppState.addEventListener('change', (nextState: AppStateStatus) => {
  if (nextState === 'background' && isRunning && !isPaused) {
    pause();
  }
});
```

Điều kiện: chỉ pause khi timer đang chạy thực sự (`isRunning && !isPaused`). Không pause nếu đã bị pause thủ công.

## Key Implementation Details

**D-48: Seed timer khi exercise data load**
```typescript
useEffect(() => {
  if (exercise && exerciseId !== exercise._id) {
    start(exercise._id, exercise.durationMinutes * 60);
  }
}, [exercise, exerciseId, start]);
```

**D-45: AppState background auto-pause** — xem phần AppState Handler ở trên.

**hasFiredRef pattern trong CompleteScreen** — ngăn mutation.mutate gọi 2 lần khi React re-render:
```typescript
const hasFiredRef = useRef(false);
useEffect(() => {
  if (exercise && !hasFiredRef.current) {
    hasFiredRef.current = true;
    mutation.mutate({ ... });
  }
}, [exercise]);
```

## Acceptance Criteria Verification

- [x] `fontSize: 80` trong TimerDisplay.tsx
- [x] `accessibilityLiveRegion="assertive"` trong TimerDisplay.tsx
- [x] `accessibilityLabel="Dừng"` trong TimerControls.tsx
- [x] `accessibilityLabel="Tạm dừng"` và `accessibilityLabel="Tiếp tục"` trong TimerControls.tsx
- [x] `minHeight: 44` trong TimerControls.tsx
- [x] `useTimerStore` trong timer.tsx
- [x] `AppState.addEventListener` trong timer.tsx
- [x] `nextState === 'background'` trong timer.tsx
- [x] `Dừng buổi tập?`, `Buổi tập sẽ không được lưu`, `Tiếp tục tập` trong timer.tsx
- [x] `Đã tạm dừng` trong timer.tsx
- [x] `router.replace.*complete` trong timer.tsx
- [x] `router.back` trong timer.tsx
- [x] `createWorkoutLogApi` trong complete.tsx
- [x] `trophy-outline` trong complete.tsx
- [x] `Xuất sắc!`, `Bạn đã hoàn thành bài tập!`, `Hoàn tất` trong complete.tsx
- [x] `Không thể lưu buổi tập. Vui lòng thử lại.` trong complete.tsx
- [x] `invalidateQueries` trong complete.tsx
- [x] `resetTimer` / `useTimerStore.*reset` trong complete.tsx
- [x] `router.replace('/(tabs)/exercises')` trong complete.tsx
- [x] `npx tsc --noEmit` — chỉ có 1 lỗi pre-existing (apple-signin.ts), không có lỗi mới

## Manual Smoke Steps (TypeScript verified, không chạy được trên device)

1. Mở ExerciseDetail → nhấn "Bắt đầu tập" → navigator đến `/exercises/[id]/timer`
2. TimerScreen hiển thị tên bài tập, đồng hồ đếm ngược màu trắng trên nền cam #FF6B35
3. Nhấn pause → icon chuyển sang play, text "Đã tạm dừng" xuất hiện, tick dừng
4. Nhấn resume → icon chuyển lại pause, tick tiếp tục
5. Nhấn stop → Alert "Dừng buổi tập?" → "Tiếp tục tập" hủy alert, "Dừng" reset store + router.back()
6. App vào background → timer tự động pause, vào foreground user phải nhấn resume thủ công
7. Khi remainingSeconds = 0 → router.replace đến complete screen
8. CompleteScreen: trophy icon, "Xuất sắc!", "Bạn đã hoàn thành bài tập!", summary phút/kcal
9. Mutation tự động fire khi exercise load, spinner hiển thị khi isPending
10. Nếu mutation lỗi → "Không thể lưu buổi tập..." + nút "Thử lại"
11. Nhấn "Hoàn tất" → resetTimer() + router.replace('/(tabs)/exercises')

## Deviations from Plan

Không có — plan được thực thi chính xác như viết. Lỗi TypeScript duy nhất (`apple-signin.ts:17`) là pre-existing từ Phase 02, không liên quan đến plan này.

## Threat Flags

Không có surface mới nào được thêm vào — plan này chỉ tạo UI screens phía mobile, không có network endpoints mới, không có auth paths mới, không có schema changes.

## Self-Check: PASSED

- [x] mobile/src/components/ui/TimerDisplay.tsx tồn tại
- [x] mobile/src/components/ui/TimerControls.tsx tồn tại
- [x] mobile/src/app/(tabs)/exercises/[id]/timer.tsx tồn tại
- [x] mobile/src/app/(tabs)/exercises/[id]/complete.tsx tồn tại
- [x] Commit c0af708 tồn tại trong git log
