# Roadmap — Ủ App

## Overview

**Project**: Ủ App — Vietnamese Health & Wellness Mobile Application
**Coverage**: 62/62 v1 requirements mapped
**Granularity**: Standard (6 phases)
**Last updated**: 2026-05-17

---

## Phases

- [ ] **Phase 1: Infrastructure** — Project scaffold, API skeleton, all third-party services wired up, CI/CD pipeline ready
- [ ] **Phase 2: Authentication** — Onboarding + full auth flow (email, Google, Apple, JWT sessions)
- [ ] **Phase 3: Core Health Tracking** — Workout library + timer, Habit tracking + streaks, BMI calculator + 30-day chart
- [ ] **Phase 4: AI Food Scan** — Camera scan, AI proxy, Vietnamese food database, meal logging + history
- [ ] **Phase 5: Home Dashboard, Profile & Notifications** — Assembled dashboard, user profile, push notification reminders
- [ ] **Phase 6: Admin Web Dashboard** — Admin login, exercise CRUD, food DB CRUD, user management

---

## Phase Details

### Phase 1: Infrastructure

**Goal**: All foundational services are running and wired together so every subsequent phase can build immediately without environment blockers.
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: *(No user-facing v1 requirements — pure foundation enabling all other phases)*

**Success Criteria**:

1. Expo development build runs on a physical iOS and Android device without errors
2. Express API server starts and returns a health-check response at `/api/health`
3. MongoDB Atlas connection is live; a test document can be written and read via Mongoose
4. Cloudinary image upload returns a public URL from a test image
5. Firebase project is configured and Expo push token can be registered from the device

**Plans**: 5 plans

Wave 1:

- [ ] 01-PLAN-01.md — Project scaffold: mobile, backend, admin directory structure + package.json + tsconfig

Wave 2 *(blocked on Wave 1)*:

- [ ] 01-PLAN-02.md — Backend core: Express app, Mongoose loader (M2 pool settings), all models with compound indexes, GET /api/health
- [x] 01-PLAN-03.md — Mobile foundation: Expo Router layout, providers (Query/Auth/Theme), API client, Walking Skeleton health-check screen

Wave 3 *(blocked on Wave 2)*:

- [ ] 01-PLAN-04.md — Third-party services: Cloudinary upload, Firebase Admin SDK, FCM service, AI food service stubs, push token endpoint
- [ ] 01-PLAN-05.md — CI/CD: GitHub Actions lint+typecheck, EAS 3-profile config, Render deploy config, env file audit

**Cross-cutting constraints:** TypeScript strict mode across all workspaces (D-07); compound indexes on all health collections required before Phase 2 (D-11); JWT tokens only in expo-secure-store never AsyncStorage (D-22)

---

### Phase 2: Authentication

**Goal**: Users can create accounts and securely access the app through email, Google, or Apple — and stay logged in across sessions.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08

**Success Criteria**:

1. First-time user sees all 3 onboarding screens (Welcome / Daily tracking / Get started) before reaching login
2. User can register with email + password (minimum 8 characters, confirm password, Terms agreement) and land on the main app
3. User can log in with email/password and receive a JWT that persists across app restarts (refresh token)
4. User can trigger a password reset email and set a new password via the link
5. User can authenticate with Google OAuth and Apple Sign In on iOS without redirect errors
6. User can log out and be returned to the login screen with session cleared

**Plans**: TBD
**UI hint**: yes

---

### Phase 3: Core Health Tracking

**Goal**: Users can browse and complete workouts, check in daily habits, and view their BMI — all stored to their account history.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: WO-01, WO-02, WO-03, WO-04, WO-05, WO-06, WO-07, WO-08, WO-09, WO-10, WO-11, HAB-01, HAB-02, HAB-03, HAB-04, HAB-05, HAB-06, HAB-07, BMI-01, BMI-02, BMI-03, BMI-04, BMI-05, BMI-06

**Success Criteria**:

1. User can browse 100+ exercises filtered by category (Yoga/Cardio/Tạ/Giãn cơ), view detail with description and movement list, and start a countdown timer that can be paused, stopped, or completed
2. Completing a workout shows the "Xuất sắc!" screen and saves the session to workout history; weekly stats (days/exercises/kcal/minutes) update correctly
3. User sees the 6 default habits with a daily progress counter, can tap "Đánh dấu +1" on each, and the streak counter increments for consecutive days; progress resets at 00:00
4. User can update height and weight via sliders, the BMI score and category label (Thiếu cân/Bình thường/Thừa cân/Béo phì) recalculate instantly, and a 30-day bar chart reflects past entries

**Plans**: TBD
**UI hint**: yes

---

### Phase 4: AI Food Scan

**Goal**: Users can photograph a meal, receive AI-generated nutrition data, and log confirmed meals to a date-based food diary.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: FOOD-01, FOOD-02, FOOD-03, FOOD-04, FOOD-05, FOOD-06, FOOD-07, FOOD-08, FOOD-09

**Success Criteria**:

1. Camera scan screen opens (dark theme, scan frame, flash, gallery button); user can capture a photo or pick from gallery and the image is sent for AI analysis (proxied through backend, never called directly from client)
2. AI result screen shows food name + tags, total kcal, Protein/Carbs/Fat, and micronutrients (fiber/sugar/sodium/Vitamin C); user can tap "Chụp lại" to discard and retry
3. User can confirm and save a meal ("Xác nhận & Lưu") and it appears in the daily food diary
4. User can search the Vietnamese food database manually (200–500 seed items) and log a meal without using the camera
5. Daily food diary shows all logged meals grouped by date with correct kcal totals

**Plans**: TBD
**UI hint**: yes

---

### Phase 5: Home Dashboard, Profile & Notifications

**Goal**: Users land on a unified dashboard summarizing all tracked data, manage their profile, and receive timely push notification reminders.
**Mode**: mvp
**Depends on**: Phase 3, Phase 4
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, PRO-01, PRO-02, PRO-03, PRO-04, PRO-05, PRO-06, PRO-07, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04

**Success Criteria**:

1. Home screen greets the user by name, shows today's kcal consumed / water glasses / workout minutes, a BMI widget, a macro nutrition summary with progress bars, quick action buttons (Quét bữa ăn / Bắt đầu tập / Thói quen), and the Ủ Shop banner that opens an external link
2. Profile screen shows avatar, name, email, personal stats (streak/workouts/calories burned), achievement badges at streak milestones (7/14/28/60 days), and allows editing of age/height/weight/health goal
3. User can toggle notification permissions on/off from Profile settings; the app shows a rationale screen before requesting system permission for the first time
4. User receives a push notification reminding them to drink water, start a workout, and a streak alert when they are about to break their streak — all delivered via Firebase Cloud Messaging on both iOS and Android (including OEM devices)

**Plans**: TBD
**UI hint**: yes

---

### Phase 6: Admin Web Dashboard

**Goal**: Admins can log into a web interface and manage the exercise library, food database, and user list that power the mobile app.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04

**Success Criteria**:

1. Admin can log in to the web dashboard with email/password (separate admin role, not a regular user account)
2. Admin can create, edit, and delete exercises including all fields (name, category, difficulty, duration, kcal, image upload, movement list) and changes appear in the mobile app immediately
3. Admin can create, edit, and delete food items in the Vietnamese database (name, kcal, macros, micros) and changes are searchable in the mobile app
4. Admin can view the user list with email, registration date, and account status

**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | Infrastructure | 3/5 | In Progress | - |
| 2 | Authentication | 0/? | Not started | - |
| 3 | Core Health Tracking | 0/? | Not started | - |
| 4 | AI Food Scan | 0/? | Not started | - |
| 5 | Home Dashboard, Profile & Notifications | 0/? | Not started | - |
| 6 | Admin Web Dashboard | 0/? | Not started | - |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| AUTH-08 | Phase 2 | Pending |
| HOME-01 | Phase 5 | Pending |
| HOME-02 | Phase 5 | Pending |
| HOME-03 | Phase 5 | Pending |
| HOME-04 | Phase 5 | Pending |
| HOME-05 | Phase 5 | Pending |
| HOME-06 | Phase 5 | Pending |
| FOOD-01 | Phase 4 | Pending |
| FOOD-02 | Phase 4 | Pending |
| FOOD-03 | Phase 4 | Pending |
| FOOD-04 | Phase 4 | Pending |
| FOOD-05 | Phase 4 | Pending |
| FOOD-06 | Phase 4 | Pending |
| FOOD-07 | Phase 4 | Pending |
| FOOD-08 | Phase 4 | Pending |
| FOOD-09 | Phase 4 | Pending |
| WO-01 | Phase 3 | Pending |
| WO-02 | Phase 3 | Pending |
| WO-03 | Phase 3 | Pending |
| WO-04 | Phase 3 | Pending |
| WO-05 | Phase 3 | Pending |
| WO-06 | Phase 3 | Pending |
| WO-07 | Phase 3 | Pending |
| WO-08 | Phase 3 | Pending |
| WO-09 | Phase 3 | Pending |
| WO-10 | Phase 3 | Pending |
| WO-11 | Phase 3 | Pending |
| HAB-01 | Phase 3 | Pending |
| HAB-02 | Phase 3 | Pending |
| HAB-03 | Phase 3 | Pending |
| HAB-04 | Phase 3 | Pending |
| HAB-05 | Phase 3 | Pending |
| HAB-06 | Phase 3 | Pending |
| HAB-07 | Phase 3 | Pending |
| BMI-01 | Phase 3 | Pending |
| BMI-02 | Phase 3 | Pending |
| BMI-03 | Phase 3 | Pending |
| BMI-04 | Phase 3 | Pending |
| BMI-05 | Phase 3 | Pending |
| BMI-06 | Phase 3 | Pending |
| PRO-01 | Phase 5 | Pending |
| PRO-02 | Phase 5 | Pending |
| PRO-03 | Phase 5 | Pending |
| PRO-04 | Phase 5 | Pending |
| PRO-05 | Phase 5 | Pending |
| PRO-06 | Phase 5 | Pending |
| PRO-07 | Phase 5 | Pending |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| NOTIF-04 | Phase 5 | Pending |
| ADM-01 | Phase 6 | Pending |
| ADM-02 | Phase 6 | Pending |
| ADM-03 | Phase 6 | Pending |
| ADM-04 | Phase 6 | Pending |

**Total mapped: 62/62**

---

*Created: 2026-05-17*
*Updated: 2026-05-17 — Phase 1 planning complete (5 plans)*
