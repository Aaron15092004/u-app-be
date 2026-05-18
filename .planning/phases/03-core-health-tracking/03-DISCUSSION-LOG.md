# Phase 3: Core Health Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 3-Core Health Tracking
**Areas discussed:** Exercise seed data, Workout timer behavior, Streak & habit completion rule, BMI save behavior

---

## Exercise Seed Data

### Q1: Language for exercise names and descriptions

| Option | Description | Selected |
|--------|-------------|----------|
| 100% Tiếng Việt | Tên + mô tả hoàn toàn tiếng Việt, nhất quán với app | ✓ |
| Tiếng Anh với tên Việt | Tên tiếng Việt, description tiếng Anh | |
| Placeholder dummy data | Exercise 1, Exercise 2... admin điền sau | |

**User's choice:** 100% Tiếng Việt

---

### Q2: Image strategy

| Option | Description | Selected |
|--------|-------------|----------|
| imageUrl = null | Category icon placeholder, admin upload ảnh Phase 6 | ✓ |
| Free stock images Unsplash | Hardcode URL từ Unsplash mỗi category | |
| Category icons | Dùng icon theo category thay ảnh | |

**User's choice:** imageUrl = null (option 1) với ghi chú muốn thêm Lottie/video
**Notes:** User đề xuất "cho phép import ảnh động 2D lottie/ video" — đây là capability mới ngoài scope v1. Noted as deferred idea cho v2. Decision giữ nguyên imageUrl = null.

---

### Q3: Exercise distribution

| Option | Description | Selected |
|--------|-------------|----------|
| ~25 mỗi category (100 tổng) | Yoga:25, Cardio:25, Tạ:25, Giãn cơ:25 | ✓ |
| Tập trung Cardio + Tạ (50%) | Cardio:30, Tạ:30, Yoga:20, Giãn cơ:20 | |
| Tùy chỉnh theo sở thích | User cho con số cụ thể | |

**User's choice:** ~25 mỗi category (100 tổng)

---

### Q4: Seed script method

| Option | Description | Selected |
|--------|-------------|----------|
| npm run seed | Idempotent ts-node script, chạy thủ công khi deploy | ✓ |
| Auto-run khi server start | Server tự seed nếu collection rỗng | |
| Migration file | Track seed qua migration table | |

**User's choice:** npm run seed (idempotent script)

---

## Workout Timer Behavior

### Q1: Background behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Timer dừng/pause khi app vào background | AppState listener, không cần background permission | ✓ |
| Timer tiếp tục chạy background | Ghi timestamp khi vào BG, tính elapsed khi quay lại | |
| expo-task-manager background task | Thực sự chạy background, cần permission | |

**User's choice:** Timer tự động pause khi app vào background

---

### Q2: Manual pause behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze tại thời điểm đang đếm, resume từ đó | Standard behavior | ✓ |
| Pause reset về 0, bắt đầu lại | Kém UX | |

**User's choice:** Freeze và resume từ đúng thời điểm

---

### Q3: Stop behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Không lưu vào lịch sử | Stop = hủy, WorkoutLog chỉ tạo khi Hoàn thành | ✓ |
| Lưu với trạng thái "Chưa hoàn thành" | status field trong WorkoutLog | |

**User's choice:** Không lưu — stop = cancel

---

### Q4: Timer duration source

| Option | Description | Selected |
|--------|-------------|----------|
| exercise.durationMinutes từ model | Tự động, nhất quán | ✓ |
| User tự nhập thời gian trước khi bắt đầu | Flexible nhưng thêm friction | |

**User's choice:** exercise.durationMinutes từ Exercise model

---

## Streak & Habit Completion Rule

### Q1: Streak definition

| Option | Description | Selected |
|--------|-------------|----------|
| Tất cả 6/6 thói quen | Strict nhất | |
| ≥1 thói quen bất kỳ | Dễ nhất, ít ý nghĩa | |
| ≥3/6 thói quen | Middle ground — cân bằng motivation và ý nghĩa | ✓ |

**User's choice:** ≥3/6 thói quen = 1 streak day

---

### Q2: Streak calculation method

| Option | Description | Selected |
|--------|-------------|----------|
| Computed từ HabitLog query | Query đếm ngày liên tục, không denormalize | ✓ |
| Denormalized vào User model | User.currentStreak cập nhật mỗi check-in | |

**User's choice:** Computed từ HabitLog query

---

### Q3: Daily reset timezone

| Option | Description | Selected |
|--------|-------------|----------|
| 00:00 UTC+7 Việt Nam (server timezone) | Implicit qua date-based query | ✓ |
| 00:00 timezone device của user | Phức tạp, relevant cho quốc tế | |

**User's choice:** Server timezone Asia/Ho_Chi_Minh (UTC+7), implicit reset qua date query

---

### Q4: Weekly heatmap coloring rule

| Option | Description | Selected |
|--------|-------------|----------|
| Ô tô màu khi ≥3 habits hoàn thành | Nhất quán với streak rule | ✓ |
| Gradient theo % hoàn thành | Đẹp hơn nhưng cần color scale | |

**User's choice:** Ô xanh khi ≥3 habits, xám khi chưa đủ

---

## BMI Save Behavior

### Q1: When to create a BMIRecord

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit "Lưu" button | Slider realtime client-side, persist khi nhấn Lưu | ✓ |
| Auto-save debounced khi slider dừng | Tự động sau 500ms, tạo nhiều records | |

**User's choice:** Explicit Lưu button

---

### Q2: Sync with User.profile

| Option | Description | Selected |
|--------|-------------|----------|
| Cập nhật cả BMIRecord và User.profile | Atomic update trong 1 PATCH request | ✓ |
| BMIRecord độc lập với User.profile | Có thể lệch dữ liệu | |

**User's choice:** Cập nhật cả BMIRecord và User.profile.heightCm + weightKg

---

### Q3: Chart aggregation cho multiple records/ngày

| Option | Description | Selected |
|--------|-------------|----------|
| Giá trị cuối cùng trong ngày | Sort by recordedAt desc, group by date | ✓ |
| Trung bình các lần đo trong ngày | Phức tạp hơn, smooth hơn | |

**User's choice:** Giá trị BMI record cuối cùng trong ngày

---

### Q4: Slider ranges

| Option | Description | Selected |
|--------|-------------|----------|
| Chiều cao: 100–220 cm \| Cân nặng: 30–200 kg | Range rộng, cover tất cả users | ✓ |
| Chiều cao: 140–200 cm \| Cân nặng: 40–150 kg | Narrow, phù hợp người trưởng thành VN | |

**User's choice:** 100–220 cm / 30–200 kg

---

## Claude's Discretion

- **HabitLog unique index conflict**: `{ userId, date, habitId }` unique:true có thể conflict với HAB-03 "Đánh dấu +1" nếu habits như nước được check nhiều lần. Planner cần quyết định: 1 check/ngày (binary done/not done) hay counter-based (nhiều check-ins). Đây là implementation detail cho planner giải quyết dựa trên Figma mockup.
- **Daily challenge X value** (WO-04): 300 kcal hardcode cho v1 hoặc random — planner quyết định.

## Deferred Ideas

- **Lottie animations / video cho bài tập** — User đề xuất "ảnh động 2D lottie/ video" trong Q2 exercise images. Out of scope v1 (PROJECT.md: "Video workout content — v2"). Ghi nhận cho v2.
- **Custom habit creation** — User tự tạo thói quen riêng. Đã có trong v2 requirements.
- **Biometric unlock** trước khi xem health data. v2.
