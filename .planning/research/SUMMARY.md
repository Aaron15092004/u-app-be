# Research Summary — Ủ App

## Executive Summary

Ủ là ứng dụng health & wellness cho thị trường Việt Nam cạnh tranh với MyFitnessPal, Lifesum, HealthifyMe — điểm yếu cốt lõi của đối thủ là **không có database thực phẩm Việt Nam**. Lợi thế cạnh tranh là Vietnamese food database + AI photo scanning. Stack khuyến nghị: Expo SDK 53/54 + Express 5 + MongoDB Atlas M2 + LogMeal/GPT-4o-mini. Kiến trúc monolith REST API đơn giản, phù hợp team 3-5 người trong 6 tháng.

---

## Recommended Stack

- **Expo SDK 53/54 + Expo Router v4** — Development Build từ đầu (không dùng Expo Go). Push notifications bị break trên Expo Go từ SDK 54+.
- **Zustand 5.x + TanStack Query v5** — Thay thế Redux hoàn toàn. TanStack Query cho server state + caching; Zustand cho UI state (timer, scan session).
- **Express 5.1 + Node 20 LTS + Mongoose 8.x + MongoDB Atlas M2** — Express 5 là npm default từ 3/2025. M0 free tier bị giới hạn 500 connections — dùng M2 ($9/month) cho production.
- **LogMeal API (primary) + GPT-4o-mini Vision (fallback)** — LogMeal là food-specific AI với nutrition data tích hợp. GPT-4o-mini (~$0.003/ảnh) fallback cho món Việt Nam. Cả hai phải proxy qua backend — không bao giờ gọi trực tiếp từ client.
- **expo-secure-store (auth tokens) + react-native-mmkv (local storage) + Cloudinary (images)** — MMKV nhanh hơn AsyncStorage 30x; Cloudinary có CDN + free tier đủ cho MVP.

---

## Table Stakes Features

Phải có trong v1:
- Manual food search/log + Vietnamese food database (500+ món)
- AI photo scan bữa ăn với user confirmation step
- Workout library (100+ bài tập tiếng Việt) + timer + history
- BMI tracking với WHO Asian cutoffs (23/27.5) + 30-day chart
- Habit tracking + streak counter + daily check-in
- Push notifications (meal reminders, habit reminders)
- Offline reads qua TanStack Query cache
- 100% Vietnamese UI

Defer v2+: Social feed, recipe builder, AI chat coach, wearable integration.

---

## Architecture Highlights

1. **Single Express server** phục vụ cả mobile và admin. Admin là React web app riêng, cùng backend. Không cần microservices ở MVP scale.
2. **MongoDB bucket pattern** — 1 document per user per day. Pre-compute `dailySummary` trên mỗi write. Compound index `{ userId: 1, date: -1 }` là bắt buộc.
3. **Build order**: Auth → Content (exercise/habit) → AI food scan → Dashboard → Notifications → Admin.

---

## Top 5 Pitfalls to Avoid

1. **Apple Sign In không implement trước App Store submission** — Bắt buộc theo Guideline 4.8 khi có bất kỳ OAuth nào. Apple chỉ gửi email/name một lần duy nhất (first sign-in).
2. **AI food scan: ảnh không compress + không rate limit** — Memory crashes trên iOS/Android. Cost runaway lên $3,000-30,000/tháng không có rate limit. Compress xuống <500KB, giới hạn 20 scans/user/ngày.
3. **Google OAuth `redirect_uri_mismatch` trong production** — Dùng `@react-native-google-signin/google-signin` (native), không dùng `expo-auth-session`. Tạo 3 OAuth client IDs riêng (Web/iOS/Android).
4. **MongoDB Atlas M0 + thiếu compound index** — M0 fail ở ~100 concurrent users. Thiếu index gây full collection scan khi data lớn.
5. **iOS notification permission one-shot + Android OEM process killing** — Phải có rationale screen trước khi request. Dùng server-side FCM (không phải local scheduling) cho thiết bị Xiaomi/OPPO phổ biến ở Việt Nam.

---

## Open Questions Before Phase 1

1. **Vietnamese food database** — Source dữ liệu dinh dưỡng? (USDA không có món Việt — cần curation riêng hoặc dietitian)
2. **LogMeal production pricing** — Cần liên hệ sales. Nếu quá đắt, fallback về GPT-4o-mini sole provider (~$90/tháng ở 100 users).
3. **Apple Developer Account** ($99/year) — Phải active trước Phase 2
4. **EAS plan** — Free tier có giới hạn builds/tháng
5. **Monetization model** — Freemium hay fully free? Ảnh hưởng đến scope v1.
6. **Admin dashboard timeline** — Cần trước hay sau launch?

---

## Confidence Assessment

| Area | Level |
|------|-------|
| Core mobile stack | HIGH |
| Backend stack | HIGH |
| MongoDB data modeling | HIGH |
| Push notifications edge cases | HIGH |
| AI food analysis accuracy (Vietnamese) | MEDIUM |
| LogMeal pricing | MEDIUM |
| NativeWind v4 styling | MEDIUM |

**Overall: MEDIUM-HIGH**

---

*Generated: 2026-05-17 from parallel research agents*
