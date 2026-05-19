# Phase 5: Home Dashboard, Profile & Notifications - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers 3 integrated capabilities:

1. **Home Dashboard** (HOME-01 đến HOME-06): Thay thế placeholder index.tsx bằng dashboard thật — greeting + notification bell, today summary (kcal/water/workout), BMI widget, macro nutrition progress bars, quick actions (Quét bữa ăn / Bắt đầu tập / Thói quen), Ủ Shop banner. Xóa 2 nút tạm D-69.
2. **Profile tab** (PRO-01 đến PRO-07): Tab thứ 5 — avatar/name/email, stats (streak/workouts/calories burned), achievement badges, edit profile screen, notification settings, Help & Support, logout.
3. **Push notifications** (NOTIF-01 đến NOTIF-04): Rationale screen trước permission, water/workout reminders via FCM (thời gian riêng biệt), streak alert 20:00 mỗi ngày, server-side cron scheduler.

**Requirements:** HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, PRO-01, PRO-02, PRO-03, PRO-04, PRO-05, PRO-06, PRO-07, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04 (18 requirements)

**Success Criteria (từ ROADMAP.md):**
1. Home screen greets user by name, shows today's kcal/water/workout, BMI widget, macro progress bars, quick actions, Ủ Shop banner
2. Profile tab: avatar, name, email, stats, achievement badges, edit profile, logout
3. User can toggle notification on/off from Profile settings; rationale screen shown before first permission request
4. FCM push notifications for water reminder, workout reminder, streak alert — delivered on iOS + Android (incl. OEM)

</domain>

<decisions>
## Implementation Decisions

### Water Tracking (HOME-02)

- **D-73:** WaterLog model = **full collection** giống WorkoutLog/HabitLog. Schema: `{ userId: ObjectId, loggedAt: Date }`. Mỗi glass = 1 document. Compound index `{ userId: 1, loggedAt: -1 }`. Count documents for today to get daily glass count.

- **D-74:** Daily water goal = **user-configurable**. Add `waterGoal: { type: Number, default: 8 }` vào `User.profile`. Hiển thị trên dashboard và water log screen dưới dạng `X / goal glasses`.

- **D-75:** Water logging UI = **dedicated water log screen** (stack route `(water)/index.tsx` hoặc `(home)/water.tsx`). From Home dashboard: tap water summary card → push to water screen. Screen có: today's log count + goal, +1/−1 controls, history list (giờ log từng ly hôm nay).

### Tab Navigation Structure (PRO-01–07)

- **D-76:** Profile = **tab thứ 5** trong tab bar. Icon `person` / `person-outline` (Ionicons). Label "Hồ sơ". Add to `mobile/src/app/(tabs)/_layout.tsx` sau tab BMI. `app/(tabs)/profile/index.tsx`.

- **D-77:** Profile editing = **separate Edit Profile screen** (push navigation). Profile tab shows read-only info. Nút "Chỉnh sửa hồ sơ" → push `(tabs)/profile/edit.tsx`. Form fields: tên, ngày sinh/tuổi, chiều cao, cân nặng, mục tiêu sức khỏe. `PATCH /api/users/profile`.

### Achievement Badges (PRO-04)

- **D-78:** (Claude's discretion) Hiển thị 4 badge icons trong một horizontal row ở Profile screen, phía dưới stats. Mỗi badge: icon + milestone label (7/14/28/60 ngày). Unlocked = green tinted (`#E8F5E9` bg + `#4CAF50` icon). Locked = gray (`#F5F5F5` bg + `#BDBDBD` icon). Badge data computed từ streak count (từ HabitLog query như D-50).

### Notification Times & Scheduling

- **D-79:** Tách `reminderTime` thành 2 fields riêng trong `User.notifications`: `waterReminderTime: { type: String, default: '08:00' }` và `workoutReminderTime: { type: String, default: '07:00' }`. Remove single `reminderTime` field (breaking change — migration cần thiết nếu có users có data). HH:MM format (string) — consistent với existing pattern.

- **D-80:** Streak alert (NOTIF-04) = **fixed 20:00 UTC+7** daily cron job. Logic: lấy tất cả users có streak > 0, check HabitLog hôm nay, nếu < 3 habits checked → gửi FCM "Bạn sắp mất streak! Hoàn thành thói quen trước nửa đêm". Không phụ thuộc vào user setting — luôn 20:00.

- **D-81:** FCM scheduling = **node-cron per-minute job** trên backend. Mỗi phút: query users có `waterReminderTime == currentHH:MM` AND `notifications.waterReminder == true` → FCM batch. Tương tự cho `workoutReminderTime`. Separate cron cho 20:00 streak alert. Dùng `node-cron` package (chưa install — add vào `backend/package.json`).

### Ủ Shop Banner (HOME-06)

- **D-82:** Shop URL = **configurable từ backend**. Add endpoint `GET /api/config/shop-url` trả về `{ url: string }`. URL lưu trong backend env var `SHOP_URL` (default 'https://u-app.vn/shop'). App fetches on load (TanStack Query, cache 1 hour). Có thể đổi URL mà không cần update app.

- **D-83:** Mở link = **system browser** qua `expo-linking` (`Linking.openURL`). Đã có `expo-linking` trong Expo SDK 54. Không cần WebView, không cần install thêm.

### Claude's Discretion

- **Achievement badges display logic**: badge row in Profile below stats, 4 badges (7/14/28/60 ngày), unlocked = green, locked = gray — xem D-78.
- **Dashboard aggregation**: Một endpoint `/api/home/today-summary` trả về `{ kcalConsumed, waterGlasses, workoutMinutes, waterGoal }` để giảm số roundtrips từ home screen. Hoặc 3 queries riêng (Claude quyết định khi planning).
- **Help & Support (PRO-06)**: Static screen với FAQ + email contact — Claude quyết định format.
- **Notification rationale screen (NOTIF-01)**: Modal hoặc dedicated screen trước khi gọi `requestPermissionsAsync()` — Claude quyết định.
- **Home greeting format**: "Xin chào, [tên]! 👋" — sử dụng user.name từ AuthProvider.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, requirements HOME/PRO/NOTIF
- `.planning/REQUIREMENTS.md` — HOME-01–06, PRO-01–07, NOTIF-01–04 (18 requirements)
- `CLAUDE.md` — Critical rules: NativeWind v4, TanStack Query v5, Zustand, FCM server-side, no AsyncStorage

### Prior Phase Decisions
- `.planning/phases/03-core-health-tracking/03-CONTEXT.md` — D-49/50 (streak definition: ≥3 habits/day), D-51 (UTC+7 timezone), D-54 (User.profile update via PATCH /api/bmi)
- `.planning/phases/04-ai-food-scan/04-CONTEXT.md` — D-68/69 (food screens as stack, temp nav buttons to remove), D-61 (FoodLog no mealType — flat by date)
- `.planning/STATE.md` — Key decision: FCM server-side (not local Expo Notifications scheduling) for OEM device compatibility

### Existing Models to Extend
- `backend/src/models/User.ts` — Add `waterGoal` to `profile`, add `waterReminderTime` + `workoutReminderTime` to `notifications`, remove `reminderTime`
- **New model needed:** `backend/src/models/WaterLog.ts` — full collection (D-73)

### Existing Mobile Infrastructure
- `mobile/src/app/(tabs)/_layout.tsx` — Add 5th Profile tab (D-76)
- `mobile/src/app/(tabs)/index.tsx` — Replace entirely with real dashboard; remove D-69 temp buttons
- `mobile/src/providers/AuthProvider.tsx` — `useAuth().user.name` for greeting; `user.id` for all API calls
- `mobile/src/lib/api/client.ts` — Add home.api.ts, water.api.ts, profile.api.ts, notifications.api.ts

### Existing Backend Infrastructure
- `backend/src/middleware/auth.middleware.ts` — All Phase 5 endpoints authenticated
- `backend/src/api/bmi/bmi.routes.ts` — Pattern for PATCH /api/users/profile (update User.profile)
- `backend/src/services/firebase.service.ts` — FCM already wired (Phase 1). Add batch FCM send method.
- `backend/src/app.ts` — Mount home/water/profile/config routers

### Existing UI Components (reuse)
- `mobile/src/components/ui/PrimaryButton.tsx` — Quick actions, logout button
- `mobile/src/components/ui/ScreenHeader.tsx` — Profile + edit screens
- `mobile/src/components/ui/WeeklyStatCard.tsx` — Dashboard stat cards (kcal/water/workout)
- `mobile/src/components/ui/StreakBadge.tsx` — May be reusable for achievement badges
- `mobile/src/components/ui/GoalCard.tsx` — May be reusable for dashboard widgets

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WeeklyStatCard.tsx` — Likely reusable for the 3 today summary cards (kcal/water/workout)
- `StreakBadge.tsx` — Reuse or extend for achievement badges (7/14/28/60 days)
- `GoalCard.tsx` — Reuse for BMI widget or nutrition summary card
- `HabitHeatmap.tsx` — Not directly reused but same data source (HabitLog) as streak computation
- `PrimaryButton.tsx` — Quick action buttons on Home

### Established Patterns
- **Backend route structure**: `api/[feature]/[feature].routes.ts` + controller + service
- **API response**: `{ success: boolean, data: T, error?: string }`
- **Mobile server state**: TanStack Query `useQuery`/`useMutation`
- **Mobile UI state**: Zustand (only for non-server UI state — timer is the model)
- **Streak computation**: HabitLog query counting days with ≥3 habits (D-50) — reuse for badge unlock check

### Integration Points
- `app/(tabs)/index.tsx` — Full rewrite: replace placeholder with real dashboard
- `app/(tabs)/_layout.tsx` — Add 5th Profile tab after BMI
- `backend/src/app.ts` — Mount: `/api/home`, `/api/water`, `/api/users`, `/api/config`, add notification cron bootstrap
- `backend/src/models/User.ts` — Schema update: waterGoal, waterReminderTime, workoutReminderTime

### D-69 Cleanup
- Remove temp "Quét bữa ăn" and "Nhật ký ăn" buttons from `app/(tabs)/index.tsx`
- Phase 5 home dashboard has Home-03 quick action "Quét bữa ăn" → same destination

</code_context>

<specifics>
## Specific Ideas

- Home greeting: "Xin chào, [tên]!" (sử dụng `auth.user.name` từ AuthProvider)
- Today summary card: 3 metrics inline — kcal / ly nước / phút tập. Tap water card → water log screen (D-75)
- Quick actions row: 3 buttons — "Quét bữa ăn" → `/(food)/scan`, "Bắt đầu tập" → `/(tabs)/exercises`, "Thói quen" → `/(tabs)/habits`
- BMI widget: hiển thị BMI number + category label (từ latest BMIRecord). Tap → navigate to `/(tabs)/bmi`
- Nutrition summary: progress bars cho Calo/Protein/Carbs/Chất béo. Data từ FoodLog today (FoodLog đã implement Phase 4)
- Ủ Shop banner: full-width banner card với "Khám phá Ủ Shop" text + mũi tên. Tap → Linking.openURL(shopUrl)
- Profile stats: "X ngày streak" / "X bài tập" (count WorkoutLog) / "X kcal đốt" (sum WorkoutLog.caloriesBurned)
- Achievement badges: 4 icons in horizontal row. Badge "Người kiên trì 7 ngày" → "14 ngày" → "28 ngày" → "60 ngày"
- Notification settings screen: 2 toggles (nước / tập luyện) + 2 time pickers. Save → PATCH /api/users/notifications

</specifics>

<deferred>
## Deferred Ideas

- **Custom habit creation** — Mentioned in Phase 3 deferred; still deferred to v2
- **5th Food tab** — Phase 4 D-68: could add later; Phase 5 keeps food as stack routes (no 5th food tab)
- **Biometric unlock before health data** — v2
- **Water intake history chart** — Water log screen shows today's history; 7-day/30-day chart deferred
- **Barcode scan** — Phase 4 deferred; still deferred
- **Multiple reminder times per day** (e.g., water reminder every 2 hours) — v2; Phase 5 has 1 daily water reminder

</deferred>

---

*Phase: 5-Home Dashboard, Profile & Notifications*
*Context gathered: 2026-05-19*
