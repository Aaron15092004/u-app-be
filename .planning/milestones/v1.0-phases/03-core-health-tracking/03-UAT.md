---
status: testing
phase: 03-core-health-tracking
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
  - 03-05-SUMMARY.md
  - 03-06-SUMMARY.md
  - 03-07-SUMMARY.md
  - 03-08-SUMMARY.md
  - 03-09-SUMMARY.md
started: 2026-05-18T00:00:00.000Z
updated: 2026-05-18T00:00:00.000Z
---

## Current Test

number: 2
name: 4-Tab Navigation
expected: |
  Open the app. Bottom tab bar shows 4 tabs in order — "Trang chủ" (home icon), "Tập luyện"
  (barbell icon), "Thói quen" (checkmark-circle icon), "BMI" (body icon). Tapping each tab
  switches screen without crash.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Start the backend from scratch (`cd backend && npm run dev`). Server boots without errors, GET http://localhost:3000/api/health returns 200 with live DB probe.
result: pass

### 2. 4-Tab Navigation
expected: Open the app. Bottom tab bar shows 4 tabs in order — "Trang chủ" (home icon), "Tập luyện" (barbell icon), "Thói quen" (checkmark-circle icon), "BMI" (body icon). Tapping each tab switches screen without crash.
result: [pending]

### 3. Exercise List Screen
expected: Tap "Tập luyện" tab. Screen shows heading "Tập luyện", 4 WeeklyStatCard boxes (days/exercises/kcal/minutes), a daily challenge progress bar "Mục tiêu hôm nay: Đốt 300 kcal", and 5 filter chips (Tất cả / Yoga / Cardio / Tạ / Giãn cơ) above the exercise list.
result: [pending]

### 4. Exercise Category Filter
expected: On the Exercise List screen, tap "Yoga" chip — chip turns green, list updates to show only yoga exercises. Tap "Tất cả" — full list returns. Tapping other categories (Cardio, Tạ, Giãn cơ) each filter correctly.
result: [pending]

### 5. Exercise Detail Screen
expected: Tap any exercise card. Exercise detail screen opens showing the exercise name, category icon, difficulty pill (Dễ/Trung bình/Khó in correct color), duration, calories, a "Mô tả" section, a numbered "Các động tác" steps list, and a sticky "Bắt đầu tập" button at the bottom.
result: [pending]

### 6. Timer Screen (Start & Countdown)
expected: On Exercise Detail, tap "Bắt đầu tập". Full-screen orange (#FF6B35) timer screen opens. Exercise name shown at top, large white countdown MM:SS in center, and two controls (stop circle left, pause/play center). Timer counts down automatically (1 second per second).
result: [pending]

### 7. Timer Pause / Resume
expected: While timer is running, tap the pause button — countdown freezes, "Đã tạm dừng" text appears, button icon switches to play. Tap play button — countdown resumes from where it stopped, "Đã tạm dừng" text disappears.
result: [pending]

### 8. Timer Stop (Discard)
expected: While timer is running, tap the stop (circle-stop) button. Alert "Dừng buổi tập?" appears with two options: "Tiếp tục tập" and "Dừng". Tapping "Tiếp tục tập" dismisses alert and timer resumes. Tapping "Dừng" resets timer and navigates back to Exercise Detail — workout is NOT saved.
result: [pending]

### 9. Timer Complete → Workout Logged
expected: Let the timer count down to 0 (or use a short-duration test exercise). Screen automatically navigates to full-screen orange completion screen showing trophy icon, "Xuất sắc!", "Bạn đã hoàn thành bài tập!", exercise summary (minutes + kcal). "Hoàn tất" button returns to exercise list. Workout log is sent to the backend (check weekly stats — kcal/exercises count should increase).
result: [pending]

### 10. Habits Screen — 6 Habit Rows
expected: Tap "Thói quen" tab. Screen shows heading "Thói quen", a streak badge (flame icon), a progress line "{N}/6 hoàn thành", and 6 habit rows: Uống 8 ly nước, Ăn 5 bữa rau củ, Tập luyện 30 phút, Ngủ đủ 8 tiếng, Đọc sách 20 phút, Uống sữa hạt — each with the correct icon and "Đánh dấu +1" button.
result: [pending]

### 11. Habit Check-in (Optimistic + Binary)
expected: Tap "Đánh dấu +1" on any habit row. Row instantly shows a green checkmark-circle (optimistic update), "Đánh dấu +1" button disappears from that row, and the progress counter at top increases by 1. Tapping the row again does nothing (no second check-in). After refresh, the checkmark persists.
result: [pending]

### 12. Streak Badge
expected: After checking in habits on consecutive days, the streak badge above the habit list shows "{N} ngày" with orange flame icon. On day 1 (or 0 consecutive days), it shows "Bắt đầu chuỗi ngày của bạn!" in gray.
result: [pending]

### 13. Weekly Heatmap
expected: Below the habit list, a "Tuần này" section shows 7 circles representing the past 7 days (CN/T2/T3/T4/T5/T6/T7). Days where 3+ habits were completed appear green; others are gray. Today's circle reflects current day's habit count.
result: [pending]

### 14. BMI Screen — Sliders + Live Calculation
expected: Tap "BMI" tab. Screen shows two sliders — "Chiều cao" (100–220 cm) and "Cân nặng" (30–200 kg). Dragging either slider instantly updates the displayed BMI value and Vietnamese category label (Thiếu cân / Bình thường / Thừa cân / Béo phì) and the BMI scale bar dot position — no button press needed.
result: [pending]

### 15. BMI Save + Toast
expected: Set sliders to a desired height/weight, tap "Lưu". A brief "Đã lưu!" toast/notification appears for ~2 seconds, then disappears. The saved values persist — reopening the BMI screen shows the same height/weight pre-filled.
result: [pending]

### 16. BMI History Chart
expected: After saving at least one BMI value, the chart section below the BMI result shows a green bar chart with up to 30 days of history. If no prior saves exist, it shows empty-state text "Chưa có dữ liệu BMI...".
result: [pending]

## Summary

total: 16
passed: 1
issues: 0
skipped: 0
blocked: 0
pending: 15

## Gaps

[none yet]
