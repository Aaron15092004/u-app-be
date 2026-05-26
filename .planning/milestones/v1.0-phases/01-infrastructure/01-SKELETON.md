# Walking Skeleton — Phase 1: Infrastructure

**Phase:** 1 — Infrastructure
**Mode:** MVP / Walking Skeleton
**Date:** 2026-05-17

---

## What the Walking Skeleton Proves

The Walking Skeleton for the Ủ App is the thinnest possible end-to-end path that exercises every layer of the architecture simultaneously. When it runs, it proves:

1. The mobile app (Expo SDK 54 Development Build) runs on a physical device and calls the backend.
2. The backend (Express 5.1 on Render) receives requests, writes to MongoDB Atlas, reads back, and returns a structured response.
3. MongoDB Atlas (M2) accepts connections via Mongoose, enforces compound indexes, and survives connection pool configuration. The health check performs a real write/read/delete cycle on the HealthCheckLog collection — not merely a readyState check.
4. Cloudinary accepts an image upload from the backend and returns a public URL.
5. Firebase Admin SDK initializes and a test FCM token can be registered from the device to the backend.

---

## The End-to-End Path

```
Physical iOS/Android Device
        │
        │  (1) Device opens Expo Dev Build
        │      → renders root _layout.tsx with QueryProvider + AuthProvider stubs
        │      → navigates to app/index.tsx (health-check screen)
        │      → useEffect fires: registerPushToken() calls getExpoPushTokenAsync()
        │        and POSTs token to POST /api/notifications/register-token
        │
        │  (2) Screen calls GET /api/health
        │      → Authorization: none (health check is public)
        ▼
Render (Node.js / Express 5.1)
        │
        │  (3) Express router hits GET /api/health handler
        │      → connectDB() has already wired Mongoose to MongoDB Atlas
        │      → health check writes a HealthCheckLog document to MongoDB
        │      → reads it back by _id
        │      → deletes it
        │      → sets dbWrite: true (or false if round-trip fails)
        │      → calls cloudinary.api.ping() → sets cloudinary: true/false
        │      → checks admin.apps.length > 0 → sets firebase: true/false
        │      → returns JSON: { success: true, db: "connected", dbWrite: true,
        │                        cloudinary: true, firebase: true, version: "1.0.0" }
        │
        ▼
MongoDB Atlas M2
        │  Compound indexes pre-created on: FoodLogs, WorkoutLogs, HabitLogs, BMIHistory
        │  Connection pool: maxPoolSize 10, serverSelectionTimeoutMS 5000
        │  HealthCheckLog collection: used for write/read/delete probe only
        │
        ▼
Cloudinary (test ping)
        │  Returns: ping success → cloudinary: true in health response
        │
        ▼  (response flows back to device)
Device screen displays:
  "Backend: OK"
  "Database: Connected"
  "DB Write: OK"
  "Cloudinary: OK"
  "Firebase: Configured"
  "Push Token: Registered"
```

---

## Architectural Decisions Locked By This Skeleton

These decisions are recorded here as the Walking Skeleton creates the first concrete instances of each:

| Decision | Locked Value |
|----------|--------------|
| Expo SDK | 54 (React Native 0.79) |
| Bundle ID | `com.uapp.health` (iOS + Android) |
| Backend language | TypeScript (compiled via tsx dev, tsc prod) |
| Node.js version | 20 LTS (enforced via `engines` in backend/package.json) |
| Express version | 5.1.x |
| MongoDB tier | Atlas M2 minimum production |
| Compound index pattern | `{ userId: 1, date: -1 }` on all health collections |
| Health check DB probe | Write/read/delete on HealthCheckLog — not readyState only |
| Mobile navigation | Expo Router v4 file-based |
| State management | Zustand 5.x + TanStack Query v5 |
| Secure token storage | expo-secure-store (never AsyncStorage for JWT) |
| Styling | NativeWind v4 |
| Image upload | Multer (memory) → Cloudinary SDK |
| Push notifications | Firebase Cloud Messaging v1 HTTP API via Firebase Admin SDK |
| Push token registration | Mobile calls getExpoPushTokenAsync + POSTs to /api/notifications/register-token |
| Backend hosting | Render (auto-deploy from GitHub main) |
| Admin hosting | Vercel (static deploy) |
| EAS builds | Free tier dev, 3 profiles: development/preview/production |
| CI/CD | GitHub Actions: lint + type-check only (no auto EAS build) |

---

## Directory Layout (Locked by Skeleton)

```
u-exe201-trang/
├── mobile/                    # React Native Expo SDK 54
│   ├── app.json               # Bundle ID: com.uapp.health
│   ├── package.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── tailwind.config.js     # NativeWind v4
│   ├── global.css             # NativeWind v4 base styles
│   └── src/
│       ├── app/               # Expo Router pages (routing only)
│       ├── components/        # Reusable UI atoms
│       ├── lib/               # API client, query client, auth, notifications
│       │   ├── api/           # client.ts (Axios instance)
│       │   ├── auth/          # token-storage.ts (expo-secure-store)
│       │   ├── notifications/ # push-token.ts (registerPushToken)
│       │   └── query/         # query-client.ts (TanStack Query singleton)
│       ├── providers/         # QueryProvider, AuthProvider, ThemeProvider
│       ├── hooks/             # Custom hooks
│       ├── utils/             # Pure functions
│       ├── constants/         # Colors, config, habits
│       └── types/             # Shared TypeScript types
│
├── backend/                   # Node.js + Express 5.1 + TypeScript
│   ├── package.json           # engines: { node: ">=20.0.0" }
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── app.ts             # Express app setup (no listen)
│       ├── server.ts          # HTTP server + port binding
│       ├── loaders/           # mongoose.ts, firebase.ts, express.ts
│       ├── api/               # Route modules (auth, food, workouts...)
│       ├── models/            # Mongoose schemas (incl. HealthCheckLog)
│       ├── middleware/        # auth, validate, upload, rateLimit, error
│       ├── services/          # cloudinary.service.ts, fcm.service.ts...
│       ├── config/            # index.ts (env validation), cors.ts
│       └── utils/             # jwt.ts, bcrypt.ts, response.ts
│
├── admin/                     # React + Vite web dashboard
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── pages/
│
├── .github/
│   └── workflows/
│       └── ci.yml             # lint + typecheck on push/PR
│
└── .planning/                 # GSD planning artifacts (this directory)
```

---

## Verification Path

After all 5 plans execute, run this verification sequence:

```bash
# 1. Backend health check (Render deployed)
curl https://<render-url>.onrender.com/api/health
# Expected: { "success": true, "data": { "status": "ok", "db": "connected",
#             "dbWrite": true, "cloudinary": true, "firebase": true } }

# 2. Local backend health check
cd backend && npm run dev
curl http://localhost:3000/api/health
# Expected: dbWrite: true (proves Atlas IP whitelist and DB permissions are correct)

# 3. TypeScript type-check passes
cd backend && npx tsc --noEmit
cd mobile && npx tsc --noEmit

# 4. Expo development build loads on device
# → eas build --profile development --platform ios
# → eas build --profile development --platform android
# → Device shows health-check screen with all 6 status rows

# 5. MongoDB compound indexes confirmed
# Atlas UI → Database → Collections → FoodLogs → Indexes
# Should show: { userId: 1, date: -1 }

# 6. Push token registration
# → Device health-check screen shows "Push Token: Registered"
# → Atlas UI → Database → Collections → DeviceTokens → shows new document
```

---

*Walking Skeleton created: 2026-05-17*
*Revised: 2026-05-17 (CHK-01: DB write probe; CHK-04: firebase field; CHK-05: engines field)*
*Plans: 01-PLAN-01 through 01-PLAN-05*
