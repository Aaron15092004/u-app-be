# Architecture Research — Ủ App

**Researched:** 2026-05-17
**Confidence:** HIGH (stack well-established; AI food flow MEDIUM — latency varies by provider)

---

## System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│                                                                      │
│  ┌──────────────────────────────┐   ┌────────────────────────────┐  │
│  │   React Native / Expo App    │   │  Admin Web Dashboard       │  │
│  │   (iOS + Android)            │   │  (React + Vite, separate)  │  │
│  │                              │   │                            │  │
│  │  Expo Router (file-based)    │   │  Route: /admin             │  │
│  │  TanStack Query (data cache) │   │  CRUD: exercises, food,    │  │
│  │  AsyncStorage (offline)      │   │  habits, users             │  │
│  │  expo-camera / image picker  │   │                            │  │
│  └──────────────┬───────────────┘   └────────────┬───────────────┘  │
└─────────────────┼────────────────────────────────┼──────────────────┘
                  │ HTTPS/REST                      │ HTTPS/REST
                  │ (JWT Bearer)                    │ (Admin JWT)
┌─────────────────▼────────────────────────────────▼──────────────────┐
│                        API LAYER                                     │
│                                                                      │
│              Node.js + Express (single server)                       │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ /api/auth  │  │ /api/food  │  │ /api/      │  │ /api/admin    │  │
│  │            │  │            │  │ workouts   │  │               │  │
│  │ JWT issue  │  │ image up   │  │ habits     │  │ admin-only    │  │
│  │ OAuth      │  │ AI proxy   │  │ bmi        │  │ CRUD routes   │  │
│  │ refresh    │  │ log CRUD   │  │ profile    │  │               │  │
│  └────────────┘  └─────┬──────┘  └────────────┘  └───────────────┘  │
│                         │                                            │
│  Middleware stack:       │                                           │
│  auth → validate →      │                                           │
│  rateLimit → handler     │                                           │
└─────────────────────────┼────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
┌─────────▼──────┐  ┌──────▼──────┐  ┌─────────▼──────┐
│  MongoDB Atlas │  │  Cloudinary │  │  AI Food API   │
│                │  │             │  │                │
│  Collections:  │  │  food photo │  │  OpenAI Vision │
│  users         │  │  storage +  │  │  OR LogMeal    │
│  food_logs     │  │  CDN serve  │  │  OR Clarifai   │
│  workouts      │  │             │  │                │
│  habits        │  │             │  │  Returns:      │
│  bmi_history   │  │             │  │  food name +   │
│  exercises     │  │             │  │  macros JSON   │
│  notifications │  └─────────────┘  └────────────────┘
└────────────────┘
          │
┌─────────▼──────────────────┐
│  Firebase Cloud Messaging  │
│  (via Expo Push Service)   │
│                            │
│  Node backend triggers     │
│  FCM → Expo → iOS/Android  │
└────────────────────────────┘
```

---

## Data Flow

### Food Scan Flow (primary feature, most complex)

```
1. USER ACTION
   User opens camera screen → expo-camera renders viewfinder
   User taps capture OR selects from gallery (expo-image-picker)

2. CLIENT PROCESSING
   Image compressed locally (< 2MB recommended for API cost)
   Encoded to base64 OR multipart FormData constructed

3. UPLOAD TO BACKEND
   POST /api/food/analyze
   Headers: Authorization: Bearer <jwt>
   Body: multipart/form-data { image: <file> }

4. BACKEND: IMAGE STORAGE
   Multer receives file in memory
   Upload to Cloudinary → receive { secure_url, public_id }
   Store image URL in temp or immediately in food_logs doc

5. BACKEND: AI ANALYSIS
   Send image (URL or base64) to AI provider:

   Option A — OpenAI Vision (gpt-4o-mini):
     POST https://api.openai.com/v1/chat/completions
     { model: "gpt-4o-mini",
       messages: [{ role: "user", content: [
         { type: "text", text: "Identify all foods... Return JSON array..." },
         { type: "image_url", image_url: { url: cloudinary_url } }
       ]}]
     }
     → Returns: [{ food, weight_g, calories, protein_g, carbs_g, fat_g }]
     Cost: ~$0.003/image (gpt-4o-mini)

   Option B — LogMeal API (food-specialized):
     POST https://api.logmeal.com/v2/image/recognition/complete
     → Returns structured nutrition JSON, Vietnamese food awareness
     Cost: per-request pricing, free tier available

6. BACKEND: RESPONSE
   Parse AI JSON response
   Normalize to app schema (NutritionResult)
   Return to client:
   { success: true, analysis: { foods: [...], totals: { calories, protein, carbs, fat } }, imageUrl }

7. CLIENT: DISPLAY RESULT
   Meal Analysis Result screen renders food cards
   User edits portion sizes if needed (optional v2)
   User taps "Xác nhận & Lưu"

8. SAVE TO DATABASE
   POST /api/food/logs
   Body: { date, mealType, foods: [...], imageUrl, totals }
   Creates FoodLog document in MongoDB
   Updates daily summary cache

9. HOME DASHBOARD UPDATE
   TanStack Query invalidates ["daily-summary"] cache
   Home screen re-fetches and shows updated kcal count
```

**Latency expectation:** 3–8 seconds total (upload + AI + DB write). Show loading state with progress indicator. This is non-negotiable for UX — inform user immediately that analysis is in progress.

---

### Auth Flow

```
1. Email/Password:
   POST /api/auth/register → hash password (bcrypt) → create User → issue JWT + refreshToken
   POST /api/auth/login → verify password → issue JWT (15min) + refreshToken (30 days)

2. Google OAuth:
   Client: expo-auth-session triggers Google OAuth popup
   Client receives: { id_token }
   POST /api/auth/google { id_token }
   Backend: verify id_token with Google → findOrCreate user → issue JWT

3. Apple Sign In:
   Client: expo-apple-authentication triggers Apple sheet
   Client receives: { identityToken, user (first login only) }
   POST /api/auth/apple { identityToken, fullName? }
   Backend: verify identityToken with Apple → findOrCreate user → issue JWT

4. Token Refresh:
   Client stores JWT in expo-secure-store
   On 401: POST /api/auth/refresh { refreshToken } → new JWT
   Axios interceptor handles this transparently

5. Admin Auth:
   Admin web uses same /api/auth/login endpoint
   Admin role checked via user.role === 'admin' middleware
```

---

### Workout Tracking Flow

```
1. User browses Exercise List → GET /api/exercises?category=yoga
2. User starts exercise → client starts countdown timer (local, no network)
3. Timer completes → POST /api/workouts/logs { exerciseId, duration, caloriesBurned, date }
4. Completion screen shown
5. Weekly stats updated: GET /api/workouts/stats?week=current
```

---

### Habit Tracking Flow

```
1. Load habits: GET /api/habits (returns user's habit list + today's completions)
2. Mark complete: POST /api/habits/:id/check { date }
3. Streak calculated server-side from habit_logs collection
4. Push notification scheduled server-side (FCM) for next day reminder
```

---

## Mobile App Structure

Recommended structure following Expo Router file-based routing with src/ wrapper:

```
mobile/
├── app.json                    # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
└── src/
    ├── app/                    # Expo Router pages (routing ONLY, no logic)
    │   ├── _layout.tsx         # Root layout: providers, fonts, splash
    │   ├── index.tsx           # Redirect → (auth) or (tabs)
    │   ├── (onboarding)/       # Route group, no URL prefix
    │   │   ├── _layout.tsx     # Stack navigator
    │   │   ├── index.tsx       # Welcome screen
    │   │   ├── features.tsx    # Feature highlights
    │   │   └── start.tsx       # CTA / Get started
    │   ├── (auth)/             # Route group
    │   │   ├── _layout.tsx     # Stack navigator (no bottom tabs)
    │   │   ├── login.tsx
    │   │   ├── register.tsx
    │   │   └── forgot-password.tsx
    │   └── (tabs)/             # Protected: requires auth
    │       ├── _layout.tsx     # Bottom tab navigator (5 tabs)
    │       ├── index.tsx       # Trang chủ (Home Dashboard)
    │       ├── meals/
    │       │   ├── index.tsx   # Meal log / history
    │       │   ├── scan.tsx    # Camera scan screen
    │       │   └── result.tsx  # AI analysis result
    │       ├── workouts/
    │       │   ├── index.tsx   # Exercise list
    │       │   ├── [id].tsx    # Exercise detail
    │       │   └── timer.tsx   # Active workout timer
    │       ├── habits/
    │       │   └── index.tsx   # Habit tracking
    │       └── profile/
    │           ├── index.tsx   # Profile overview
    │           └── bmi.tsx     # BMI analysis
    │
    ├── components/             # Reusable UI (no routing logic)
    │   ├── ui/                 # Atoms: Button, Input, Card, Badge, Icon
    │   ├── forms/              # LoginForm, RegisterForm, HabitForm
    │   ├── food/               # FoodCard, MacroBar, NutritionSummary
    │   ├── workout/            # ExerciseCard, TimerDisplay, WeeklyStats
    │   ├── habit/              # HabitRow, StreakCounter, ProgressBar
    │   └── charts/             # BMIChart, CalorieChart (Victory Native)
    │
    ├── lib/                    # Core app logic
    │   ├── api/
    │   │   ├── client.ts       # Axios instance, interceptors, JWT refresh
    │   │   ├── auth.api.ts     # Auth endpoints
    │   │   ├── food.api.ts     # Food scan + logs endpoints
    │   │   ├── workout.api.ts  # Exercise + workout endpoints
    │   │   ├── habit.api.ts    # Habit endpoints
    │   │   └── profile.api.ts  # User profile + BMI
    │   ├── query/
    │   │   └── query-client.ts # TanStack Query client config
    │   └── auth/
    │       ├── auth-context.tsx # Session state + signIn/signOut
    │       └── token-storage.ts # expo-secure-store wrapper
    │
    ├── hooks/                  # Custom hooks (business-logic hooks)
    │   ├── useAuth.ts
    │   ├── useFoodScan.ts      # Camera + upload + analyze orchestration
    │   ├── useWorkoutTimer.ts  # Countdown timer logic
    │   ├── useDailySummary.ts  # TanStack Query for home stats
    │   └── useNetworkStatus.ts # @react-native-community/netinfo
    │
    ├── providers/              # Context providers (wrap app)
    │   ├── AuthProvider.tsx
    │   ├── QueryProvider.tsx   # TanStack QueryClientProvider
    │   └── ThemeProvider.tsx   # Colors, typography tokens
    │
    ├── utils/                  # Pure functions, zero React dependency
    │   ├── bmi.ts              # BMI calculation
    │   ├── nutrition.ts        # Macro totaling, formatting
    │   ├── date.ts             # Vietnamese date formatting
    │   └── image.ts            # Compress, base64 encode
    │
    ├── constants/
    │   ├── colors.ts           # Green primary, orange accent
    │   ├── config.ts           # API_URL, feature flags
    │   └── habits.ts           # Default 6 habit definitions
    │
    └── types/
        ├── api.types.ts        # API response shapes
        ├── food.types.ts       # FoodLog, NutritionData
        ├── workout.types.ts    # Exercise, WorkoutLog
        └── user.types.ts       # User, BMIRecord, HabitLog
```

**Key decisions:**
- `app/` holds routing files only — no business logic, no hooks
- `lib/api/` owns all network calls; components never call fetch directly
- `(onboarding)` and `(auth)` are route groups — excluded from URL, no bottom tabs
- `(tabs)` has `_layout.tsx` that checks auth session and redirects if unauthenticated
- `expo-secure-store` for JWT storage (not AsyncStorage — secure storage for tokens)

---

## Backend API Structure

### Folder Structure

```
backend/
├── package.json
├── .env
└── src/
    ├── app.js                  # Express app setup (no listen())
    ├── server.js               # Starts HTTP server, port binding
    ├── loaders/
    │   ├── express.js          # Middleware registration order
    │   ├── mongoose.js         # MongoDB Atlas connection
    │   └── firebase.js         # Firebase Admin SDK init
    │
    ├── api/
    │   ├── auth/
    │   │   ├── auth.routes.js  # POST /register /login /refresh /google /apple
    │   │   ├── auth.controller.js
    │   │   └── auth.service.js
    │   ├── food/
    │   │   ├── food.routes.js  # POST /analyze, GET|POST|DELETE /logs
    │   │   ├── food.controller.js
    │   │   └── food.service.js # Calls Cloudinary + AI API
    │   ├── workouts/
    │   │   ├── workout.routes.js
    │   │   ├── workout.controller.js
    │   │   └── workout.service.js
    │   ├── habits/
    │   │   ├── habit.routes.js
    │   │   ├── habit.controller.js
    │   │   └── habit.service.js
    │   ├── profile/
    │   │   ├── profile.routes.js # GET|PATCH /me, POST /bmi
    │   │   ├── profile.controller.js
    │   │   └── profile.service.js
    │   ├── notifications/
    │   │   ├── notification.routes.js # POST /register-token
    │   │   ├── notification.controller.js
    │   │   └── notification.service.js # FCM send logic
    │   └── admin/
    │       ├── admin.routes.js  # All CRUD routes, admin-only
    │       ├── admin.controller.js
    │       └── admin.service.js
    │
    ├── models/
    │   ├── User.js
    │   ├── FoodLog.js
    │   ├── Exercise.js
    │   ├── WorkoutLog.js
    │   ├── Habit.js
    │   ├── HabitLog.js
    │   ├── BMIRecord.js
    │   └── DeviceToken.js
    │
    ├── middleware/
    │   ├── auth.middleware.js   # JWT verify → req.user
    │   ├── admin.middleware.js  # req.user.role === 'admin' check
    │   ├── upload.middleware.js # Multer config (memory storage)
    │   ├── validate.middleware.js # express-validator chains
    │   ├── rateLimit.middleware.js # express-rate-limit (AI endpoint: strict)
    │   └── error.middleware.js  # Global error handler (last middleware)
    │
    ├── services/               # External integrations (called by route services)
    │   ├── cloudinary.service.js # upload(), delete()
    │   ├── ai-food.service.js   # analyzeImage() → normalized NutritionResult
    │   ├── fcm.service.js       # sendToUser(), scheduleReminder()
    │   └── email.service.js     # Password reset emails (Nodemailer/Resend)
    │
    ├── config/
    │   ├── index.js            # Validates + exports all env vars
    │   └── cors.js             # Allowed origins (mobile + admin URL)
    │
    └── utils/
        ├── jwt.js              # sign(), verify(), refresh()
        ├── bcrypt.js           # hash(), compare()
        └── response.js         # Standard { success, data, error } shape
```

### Route Organization

```
/api/auth
  POST   /register
  POST   /login
  POST   /refresh
  POST   /google
  POST   /apple
  POST   /forgot-password
  POST   /reset-password

/api/food
  POST   /analyze              # Upload + AI scan (rate-limited: 20/hour)
  GET    /logs?date=YYYY-MM-DD # User's food log for a day
  POST   /logs                 # Save confirmed meal
  DELETE /logs/:id

/api/workouts
  GET    /exercises            # List (filter: ?category= ?difficulty=)
  GET    /exercises/:id        # Single exercise detail
  GET    /logs?week=current    # User's workout history
  POST   /logs                 # Log completed workout
  GET    /stats?week=current   # Weekly aggregate

/api/habits
  GET    /                     # User's habits + today's completions
  POST   /:id/check            # Mark habit complete for today
  DELETE /:id/check            # Unmark (within same day)
  GET    /streak               # Current streak count

/api/profile
  GET    /me
  PATCH  /me
  POST   /bmi                  # Save new BMI measurement
  GET    /bmi?days=30          # BMI history

/api/notifications
  POST   /register-token       # Save FCM device token

/api/admin                     # Requires admin role
  GET|POST|PATCH|DELETE /exercises
  GET|POST|PATCH|DELETE /food-items
  GET|POST|PATCH|DELETE /habits
  GET    /users
  PATCH  /users/:id/role
```

### Middleware Execution Order

```
Request → cors → helmet → json() → rateLimit (global)
       → auth.middleware (JWT decode, attach req.user)
       → [route-specific: validate, upload, admin check]
       → controller (calls service)
       → error.middleware (catches all throws)
       → JSON response
```

---

## Database Schema Sketch

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String (null for OAuth),
  name: String,
  avatar: String,              // Cloudinary URL
  role: String,                // 'user' | 'admin'
  authProviders: [{
    provider: String,          // 'email' | 'google' | 'apple'
    providerId: String
  }],
  profile: {
    dateOfBirth: Date,
    gender: String,            // 'male' | 'female' | 'other'
    heightCm: Number,
    weightKg: Number,
    goalType: String           // 'lose' | 'maintain' | 'gain'
  },
  notifications: {
    waterReminder: Boolean,
    workoutReminder: Boolean,
    reminderTime: String       // "08:00" HH:mm
  },
  createdAt: Date,
  updatedAt: Date
}
```

### FoodLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, indexed),
  date: Date (indexed, YYYY-MM-DD normalized to UTC midnight),
  mealType: String,            // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  imageUrl: String,            // Cloudinary URL
  aiProvider: String,          // 'openai' | 'logmeal' — for debugging
  foods: [{
    name: String,              // Vietnamese name if detected
    weightG: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  }],
  totals: {                    // Denormalized for query speed
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  createdAt: Date
}
// Compound index: { userId: 1, date: 1 }
```

### Exercises Collection (Admin-managed content)

```javascript
{
  _id: ObjectId,
  name: String,                // Vietnamese name
  nameEn: String,              // English (for search)
  category: String,            // 'yoga' | 'cardio' | 'weights' | 'stretching'
  difficulty: String,          // 'easy' | 'medium' | 'hard'
  durationMinutes: Number,
  caloriesBurned: Number,
  imageUrl: String,
  description: String,
  steps: [{
    order: Number,
    instruction: String,
    durationSeconds: Number
  }],
  isActive: Boolean,
  createdAt: Date
}
```

### WorkoutLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, indexed),
  exerciseId: ObjectId (ref: Exercises),
  exerciseName: String,        // Denormalized (exercise may change)
  date: Date (indexed),
  durationMinutes: Number,
  caloriesBurned: Number,
  completedAt: Date
}
// Compound index: { userId: 1, date: 1 }
```

### HabitLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, indexed),
  habitId: String,             // 'water' | 'vegetables' | 'exercise' | 'sleep' | 'reading' | 'nut-milk'
  date: Date (UTC midnight, indexed),
  checkedAt: Date
}
// Compound index: { userId: 1, date: 1, habitId: 1 } — unique
// Streak computed in service layer by querying consecutive dates
```

### BMIHistory Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, indexed),
  heightCm: Number,
  weightKg: Number,
  bmi: Number,                 // Computed: weight / (height/100)^2
  category: String,            // 'underweight' | 'normal' | 'overweight' | 'obese'
  recordedAt: Date (indexed)
}
// Index: { userId: 1, recordedAt: -1 }
```

### DeviceTokens Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, indexed),
  token: String (unique),      // FCM token
  platform: String,            // 'ios' | 'android'
  updatedAt: Date
}
```

---

## Build Order Implications

Dependencies flow in this order — each layer must exist before the next:

```
LAYER 0 — Infrastructure (Day 1, no code dependencies)
  MongoDB Atlas cluster setup
  Cloudinary account + upload preset
  Firebase project + FCM config
  Expo project init (npx create-expo-app)

LAYER 1 — Auth (blocks everything)
  Backend: User model + auth routes + JWT middleware
  Mobile: AuthProvider + login/register screens
  Must complete before any protected route or user-linked data

LAYER 2 — Static Content (no AI dependency, unblocks workout/habit tabs)
  Backend: Exercise CRUD + seed data
  Backend: Habit defaults seeded
  Mobile: Exercise List + Detail screens (read-only content)
  Mobile: Habit Tracking screen
  Note: WorkoutLogs and HabitLogs require Auth (Layer 1)

LAYER 3 — AI Food Scan (depends on: Auth + Cloudinary + AI API key)
  Backend: Multer → Cloudinary upload → AI API call → response normalize
  Mobile: Camera screen + result display + confirm & save
  This is the highest-risk layer — AI latency and accuracy unpredictable

LAYER 4 — Tracking & History (depends on: Auth + Layer 2 + Layer 3)
  Backend: FoodLog save + daily summary endpoint
  Backend: WorkoutLog save + weekly stats
  Backend: HabitLog check + streak calculation
  Backend: BMI save + history
  Mobile: Home Dashboard (reads from all logs)
  Mobile: Profile + BMI screens

LAYER 5 — Push Notifications (depends on: Auth + DeviceTokens)
  Backend: FCM token registration + send logic
  Backend: Scheduled job (node-cron) for daily reminders
  Mobile: Request notification permission + register token

LAYER 6 — Admin Dashboard (depends on: Auth with admin role + Exercise CRUD)
  Admin web app: React + Vite, separate deploy
  Auth: reuses same backend /api/auth + admin middleware
  CRUD for exercises, food items, habit templates, users
```

**Critical path:** Auth → Food Scan → Home Dashboard (these three define the core loop)

---

## Offline Considerations

The Ủ app is **connectivity-dependent** for its primary feature (AI food scan). Offline-first adds significant complexity; the recommended approach is **cache-first with graceful degradation**.

### What Works Offline

| Feature | Offline Behavior | Storage |
|---------|-----------------|---------|
| Browse exercise list | Show cached exercises | TanStack Query cache (persisted) |
| View exercise detail | Show cached detail | TanStack Query cache |
| Read habit list | Show today's cached habits | TanStack Query cache |
| BMI calculator | Works fully (local math only) | No storage needed |
| View food log history | Show cached logs | TanStack Query cache |
| View Home Dashboard | Show last-known stats | TanStack Query cache |
| Onboarding screens | Works fully | No storage needed |

### What Requires Connectivity

| Feature | Why | User Experience |
|---------|-----|----------------|
| Food scan (AI) | Image upload + AI API are remote | Show "No internet" toast, disable scan button |
| Mark habit complete | Writes to server; streak is server-authoritative | Queue mutation, sync on reconnect |
| Log workout complete | Writes to server | Queue mutation, sync on reconnect |
| Auth (login/register) | JWT issued by server | Show offline message |
| Push notifications | FCM is remote | Handled silently by OS |

### Implementation Pattern

Use TanStack Query with AsyncStorage persister for cache-first reads:

```
TanStack Query config:
  staleTime: 5 minutes (re-fetch only after 5 min in background)
  gcTime: 24 hours (keep cache across app restarts)
  persister: AsyncStoragePersister (persist cache to disk)

For write operations (habit check, workout log):
  Use optimistic updates → update local cache immediately
  If offline: mutation is queued by TanStack Query
  On reconnect: resumePausedMutations() auto-triggers
  On failure: rollback cache, show toast

Network detection:
  @react-native-community/netinfo
  Set online/offline state via TanStack Query's onlineManager
```

### What NOT to Build (v1)

Full offline workout timer logging with local SQLite is over-engineered for v1. The workout timer is local (no network needed during countdown) — only the final POST to save requires connectivity. Queue that one call; it will succeed within seconds of reconnection.

---

## Admin Dashboard Architecture

**Decision: Separate React web app, shared backend.**

```
admin/
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx              # React Router setup
    ├── pages/
    │   ├── Login.tsx
    │   ├── Dashboard.tsx    # Stats overview
    │   ├── Exercises.tsx    # Exercise CRUD table
    │   ├── FoodItems.tsx    # Food database management
    │   ├── Habits.tsx       # Habit template management
    │   └── Users.tsx        # User list + role management
    ├── components/
    │   └── ...              # Table, Form, Modal reusables
    └── lib/
        ├── api.ts           # Axios client → same backend /api/admin/*
        └── auth.ts          # Admin JWT storage
```

**Why separate app, not integrated:**
- Separate deploy → admin URL can be restricted by IP or basic auth at CDN level
- No code shipping admin routes to mobile bundle
- Different tech stack acceptable (can use React Query + antd/shadcn for rapid admin UI)
- Small team: one dev can own admin, one owns mobile — no conflicts

**Hosting recommendation:** Vercel (admin) + Railway/Render (backend) + Expo (mobile). Free tiers sufficient for development and early beta.

---

## Sources

- Expo Router authentication docs: https://docs.expo.dev/router/advanced/authentication/
- Expo Router folder structure: https://dev.to/sachinrupani/designing-a-scalable-react-native-expo-router-folder-structure-3dnj
- Bulletproof Node.js architecture: https://softwareontheroad.com/ideal-nodejs-project-structure
- GPT-4 Vision food analysis: https://dev.to/albert_nahas_cdc8469a6ae8/using-gpt-4-vision-for-real-time-food-analysis-3cb1
- Offline-first with React Query: https://www.whitespectre.com/ideas/how-to-build-offline-first-react-native-apps-with-react-query-and-typescript/
- MongoDB fitness schema: https://www.geeksforgeeks.org/dbms/how-to-design-a-database-for-health-and-fitness-tracking-applications/
- Expo push notifications vs FCM: https://pushbase.dev/blog/expo-notifications-vs-react-native-firebase-cloud-messaging
- Cloudinary vs S3 for React Native: https://cloudinary.com/documentation/react_native_image_and_video_upload
