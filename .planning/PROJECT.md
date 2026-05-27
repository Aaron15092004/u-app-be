# Ủ App — Health & Wellness Mobile Application

## What This Is

**Ủ** là ứng dụng quản lý sức khỏe toàn diện tập trung vào dinh dưỡng từ thực vật (plant-based nutrition). Ứng dụng giúp người dùng theo dõi bữa ăn qua AI, quản lý tập luyện, xây dựng thói quen lành mạnh và theo dõi chỉ số BMI — tất cả trong một nền tảng mobile tiếng Việt.

## Core Value

**AI food scanning + habit tracking trong một app đơn giản, đẹp, và bản địa hóa hoàn toàn tiếng Việt cho thị trường Việt Nam.**

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native (Expo) |
| Backend API | Node.js + Express |
| Database | MongoDB Atlas |
| AI Food Analysis | External API (Clarifai Food / LogMeal / OpenAI Vision) |
| Auth | JWT + Google OAuth + Apple Sign In |
| Push Notifications | Firebase Cloud Messaging (Expo) |
| Storage | Cloudinary (food images) |

## Target Users

- **End Users**: Người Việt Nam muốn quản lý sức khỏe qua điện thoại iOS/Android
- **Admin**: Quản trị viên quản lý nội dung bài tập, thực phẩm, thói quen qua web dashboard

## Screens (từ Figma Mockup)

### Onboarding Flow
1. **Screen 1** — Welcome "Chào mừng đến với Ủ" — logo, tagline, Tiếp tục / Bỏ qua
2. **Screen 2** — Feature highlights "Theo dõi sức khỏe hàng ngày" — icons nutrition/BMI/workout
3. **Screen 3** — CTA "Bắt đầu hành trình khỏe mạnh" — Tạo tài khoản / Đăng nhập

### Authentication
4. **Login** — Email + password, Quên mật khẩu, Google/Apple OAuth
5. **Register** — Email, password (min 8 chars), confirm password, Terms agreement

### Main App (Bottom Navigation: Trang chủ | Bữa ăn | Tập luyện | Thói quen | Cá nhân)
6. **Home Dashboard** — Greeting, daily summary (kcal/water/workout), Quick actions, BMI widget, Nutrition today, Ủ Shop banner
7. **Meal Scan (Camera)** — Dark camera UI, scan frame, gallery/capture/flash controls
8. **Meal Analysis Result** — Food name + tags, macro breakdown (kcal/protein/carbs/fat), micronutrients, Xác nhận & Lưu / Chụp lại
9. **Exercise List** — Weekly stats, category filter tabs, exercise cards with difficulty/duration/kcal, daily challenge
10. **Exercise Detail** — Description, Bắt đầu tập luyện CTA, exercise list with durations, notes
11. **Exercise Timer** — Countdown timer (orange theme), pause/stop/complete controls
12. **Exercise Complete** — Completion screen "Xuất sắc!" (orange theme), Hoàn tất
13. **Habit Tracking** — Daily progress, streak counter, habit list with progress bars, "Đánh dấu +1" CTAs, tips section
14. **BMI Analysis** — BMI score, category label, height/weight sliders, health advice, 30-day chart
15. **Profile** — Avatar, stats (streak/workouts/calories), personal info, achievements, settings

### Admin (Web)
16. **Admin Dashboard** — Exercise CRUD, food database, habit templates, user management

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| External AI API for food scanning | Tránh train model riêng — faster to market, reliable accuracy | Pending (evaluate Clarifai vs LogMeal vs OpenAI Vision) |
| Ủ Shop là redirect-only trong v1 | Giảm scope, không build e-commerce đầy đủ | Placeholder UI + external link |
| Google OAuth + Apple Sign In | Apple required cho iOS App Store; Google cho UX tốt hơn | Both required |
| Push notifications từ v1 | Core UX cho habit tracking — reminder uống nước, tập luyện | Firebase/Expo |
| MongoDB Atlas | Flexible schema cho nutrition data, free tier đủ cho development | Confirmed |
| Admin web dashboard | Content management cho exercises/food/habits | Node.js + React (separate from mobile) |

## Current Milestone: v2.0 Feature release nhanh

**Goal:** Ship the next commercial feature release quickly, focused on milk-code monetization, better food scanning, BMI-based Ủ milk guidance, app feedback, and scalable exercise image management.

**Target features:**
- Admin can generate bulk redeem codes/QR codes for bottled milk campaigns; users can enter or scan a code to unlock unlimited AI food scans for that code's expiry window.
- App can recommend and store a user's selected Ủ nut-milk flavor based on BMI and health need rules.
- Food scanning gains barcode scan support to complement AI image scan and manual search.
- Users can rate the app with stars and a short comment after using key features.
- Admin/content workflow makes adding images for hundreds of exercises easier and repeatable.

## Requirements

### Validated

- v2.0 Phase 3 complete: manual campaign-code redeem hardening, barcode scanner/cache/review flow, admin operations dashboards, native store review gating, exercise media filename mapping/audit, and automated release verification passed.

### Active

#### Authentication & Onboarding
- [ ] User xem 3 màn onboarding khi lần đầu mở app
- [ ] User đăng ký tài khoản bằng email/password (min 8 ký tự)
- [ ] User đăng nhập bằng email/password
- [ ] User đăng nhập/đăng ký bằng Google OAuth
- [ ] User đăng nhập/đăng ký bằng Apple Sign In
- [ ] User reset mật khẩu qua email

#### Home Dashboard
- [ ] Home hiển thị tổng quan ngày hôm nay: kcal, glasses nước, phút tập
- [ ] Quick actions: Quét bữa ăn, Bắt đầu tập, Thói quen
- [ ] BMI widget hiển thị trên Home
- [ ] Nutrition summary hôm nay với progress bar
- [ ] Ủ Shop banner (redirect)

#### Meal / Food
- [ ] User chụp ảnh bữa ăn bằng camera để phân tích dinh dưỡng (AI)
- [ ] User chọn ảnh từ thư viện để phân tích
- [ ] Hiển thị kết quả: tên món, macro (kcal/protein/carbs/fat), micro (fiber/sugar/sodium/vitamins)
- [ ] User xác nhận và lưu bữa ăn vào nhật ký
- [ ] Lịch sử bữa ăn theo ngày

#### Exercise / Workout
- [ ] Danh sách bài tập với filter theo category (Yoga/Cardio/Tạ/Giãn cơ)
- [ ] Mỗi bài tập có: tên, độ khó, thời gian, kcal, hình ảnh
- [ ] Xem chi tiết bài tập: mô tả, danh sách động tác
- [ ] Bắt đầu tập: countdown timer theo thời gian bài tập
- [ ] Hoàn thành bài tập: màn "Xuất sắc!" + lưu vào lịch sử
- [ ] Thống kê tuần: ngày hoàn thành, tổng kcal, tổng phút
- [ ] Daily challenge (đốt X calo)

#### Habit Tracking
- [ ] Danh sách thói quen mặc định: uống nước, ăn rau, tập luyện, ngủ, đọc sách, uống sữa hạt
- [ ] User đánh dấu hoàn thành từng thói quen
- [ ] Streak counter (chuỗi ngày liên tiếp)
- [ ] Progress hàng ngày (X/6 hoàn thành)
- [ ] Tips section cho habit building

#### BMI & Health Tracking
- [ ] Phân tích BMI dựa trên chiều cao + cân nặng
- [ ] Hiển thị BMI score + phân loại (Thiếu cân/Bình thường/Thừa cân/Béo phì)
- [ ] Cập nhật chiều cao/cân nặng qua slider
- [ ] Lời khuyên sức khỏe dựa trên BMI
- [ ] Lịch sử BMI 30 ngày (chart)

#### Profile
- [ ] Xem và cập nhật thông tin cá nhân (tên, tuổi, chiều cao, cân nặng, mục tiêu)
- [ ] Thành tích: Người kiên trì (7/14/28/60 ngày streak)
- [ ] Thống kê: streak, số bài tập, tổng kcal đốt
- [ ] Cài đặt thông báo
- [ ] Đăng xuất

#### Push Notifications
- [ ] Reminder uống nước hàng ngày
- [ ] Reminder bắt đầu tập luyện
- [ ] Streak alert (đừng bỏ lỡ streak)

#### Admin
- [ ] Admin đăng nhập web dashboard
- [ ] CRUD bài tập (tên, mô tả, category, độ khó, thời gian, kcal, hình ảnh, danh sách động tác)
- [ ] CRUD thực phẩm trong database dinh dưỡng
- [ ] Quản lý người dùng cơ bản

### Out of Scope (v1)

- E-commerce / checkout trong app — Ủ Shop chỉ redirect
- Social features (follow, share, leaderboard) — phức tạp, build sau
- Custom meal planning / diet plan generation — v2
- Wearable device integration (Apple Watch, Garmin) — v2
- Video workout content — v2 (hiện tại chỉ text + image)
- Multiple language support — Vietnamese only v1

## Context

- **Platform**: iOS + Android (React Native/Expo)
- **Language**: Vietnamese (100%)
- **Design system**: Green primary (#4CAF50-ish), Orange accent (workout screens), clean minimal UI
- **Logo**: "Ủ" plant-inspired green logo
- **Tagline**: "Ứng dụng quản lý sức khỏe toàn diện với dinh dưỡng từ thực vật"

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-27 after completing v2.0 Phase 3*
