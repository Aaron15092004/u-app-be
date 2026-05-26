---
phase: 01-infrastructure
plan: "04"
subsystem: infra
tags: [cloudinary, firebase-admin, fcm, multer, push-notifications, ai-stub]

requires:
  - phase: 01-infrastructure/01-02
    provides: Express app scaffolding, Mongoose models (DeviceToken), utils/response, middleware/error

provides:
  - Cloudinary SDK wired with uploadImage/deleteImage/testConnection
  - Multer memory-storage upload middleware (5MB limit)
  - Firebase Admin SDK loader with idempotent init and private key newline fix
  - FCM service for push notification dispatch and device token upsert
  - AI food service stub with NutritionResult interface (Phase 4 placeholder)
  - POST /api/notifications/register-token endpoint
  - POST /api/upload/test endpoint (test-only, remove before production)
  - Health endpoint extended with cloudinary + firebase status fields

affects:
  - 01-05 (auth phase uses Firebase Admin for token verification)
  - 04-ai (implements analyzeImage stub)
  - any phase that sends push notifications

tech-stack:
  added:
    - cloudinary v2 (image CDN SDK)
    - firebase-admin v13 (push notifications + auth)
    - multer v1 (multipart memory storage)
  patterns:
    - Service layer pattern: thin controller -> service -> SDK
    - Idempotent SDK init guard (admin.apps.length > 0)
    - Private key newline replacement for Firebase .env single-line storage
    - TODO comments with Phase number for deferred implementation

key-files:
  created:
    - backend/src/services/cloudinary.service.ts
    - backend/src/middleware/upload.middleware.ts
    - backend/src/api/health/upload-test.routes.ts
    - backend/src/loaders/firebase.ts
    - backend/src/services/fcm.service.ts
    - backend/src/services/ai-food.service.ts
    - backend/src/api/notifications/notification.routes.ts
    - backend/src/api/notifications/notification.service.ts
    - backend/src/api/notifications/notification.controller.ts
  modified:
    - backend/src/api/health/health.controller.ts
    - backend/src/server.ts
    - backend/src/app.ts

key-decisions:
  - "Cloudinary upload uses stream (not temp file) to avoid disk I/O — keeps memory footprint low"
  - "Firebase private key stored single-line in .env with literal \\n; loader does replace(/\\\\n/g, '\\n') to restore"
  - "AI food service throws on call rather than returning mock data — prevents silent Phase 4 omission"
  - "Push token endpoint uses 'phase1-test-user' placeholder; JWT auth wired in Phase 2"
  - "Upload-test route carries production removal TODO to avoid accidental exposure"

patterns-established:
  - "Service layer: controller validates request shape, service orchestrates business logic, SDK call is in service"
  - "Idempotent loader guard: check before init to support hot-reload (tsx watch)"
  - "Stub throws instead of returns mock: forces Phase 4 to implement, prevents silent no-op"

requirements-completed: []

duration: 12min
completed: 2026-05-17
---

# Phase 1 Plan 04: Third-Party Services Summary

**Cloudinary image upload, Firebase Admin SDK loader with FCM push service, AI food analysis stub, and push token registration endpoint wired to Express app**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-17T14:52:00Z
- **Completed:** 2026-05-17T15:04:48Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Wired Cloudinary SDK with stream-based upload (avoids disk I/O) and health check ping
- Firebase Admin SDK loader with idempotent init guard and mandatory private key newline fix documented in code
- FCM service for multi-device push dispatch and device token upsert, backed by DeviceToken model
- AI food service stub that throws on call (Phase 4 placeholder) — prevents silent omission
- Push token registration endpoint (POST /api/notifications/register-token) with platform validation
- Health endpoint extended with `cloudinary` and `firebase` boolean fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Cloudinary service, upload middleware, health controller extension** - `9b9b72f` (feat)
2. **Task 2: Firebase loader, FCM service, AI food stub** - `b7be11e` (feat)
3. **Task 3: Push token endpoint and app route wiring** - `7cfcf6c` (feat)

## Files Created/Modified

- `backend/src/services/cloudinary.service.ts` — Cloudinary v2 wrapper: uploadImage (stream-based), deleteImage, testConnection (ping)
- `backend/src/middleware/upload.middleware.ts` — Multer memory storage, 5MB limit, single file
- `backend/src/api/health/upload-test.routes.ts` — POST /api/upload/test (dev/test only, remove pre-production)
- `backend/src/api/health/health.controller.ts` — Extended with cloudinary ping and firebase init status
- `backend/src/loaders/firebase.ts` — Firebase Admin SDK loader with apps.length guard and private key fix
- `backend/src/server.ts` — Added loadFirebase() call after connectDB()
- `backend/src/services/fcm.service.ts` — sendNotificationToUser (iterates device tokens), registerDeviceToken (upsert)
- `backend/src/services/ai-food.service.ts` — NutritionResult interface + analyzeImage stub (throws)
- `backend/src/api/notifications/notification.routes.ts` — Router: POST /register-token
- `backend/src/api/notifications/notification.service.ts` — Thin delegation to fcm.service
- `backend/src/api/notifications/notification.controller.ts` — Request validation, platform check
- `backend/src/app.ts` — Mounted /api/upload/test and /api/notifications routes

## Decisions Made

- Stream-based Cloudinary upload: avoids creating temp files on disk, works well with multer memory storage
- Firebase private key stored as single line in .env with literal `\n` sequences; the loader does `replace(/\\n/g, '\n')` — this is a well-known Firebase Admin SDK .env gotcha, commented clearly in code
- AI stub throws rather than returning mock data: ensures Phase 4 cannot accidentally skip implementation
- Push token endpoint uses hardcoded `'phase1-test-user'` with a Phase 2 TODO comment for JWT replacement

## Deviations from Plan

None — plan executed exactly as written. TypeScript typecheck exits 0 with no errors.

## Issues Encountered

None.

## User Setup Required

The following environment variables must be set in `backend/.env` for the new services to function:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

Note: `FIREBASE_PRIVATE_KEY` must be a single line with literal `\n` sequences (not actual newlines). The loader handles conversion.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `analyzeImage` throws | `backend/src/services/ai-food.service.ts` | Intentional Phase 4 placeholder — LogMeal + GPT-4o-mini integration deferred |
| `'phase1-test-user'` hardcoded | `backend/src/api/notifications/notification.controller.ts` | JWT auth middleware added in Phase 2 |
| Upload-test route | `backend/src/api/health/upload-test.routes.ts` | Dev-only test route — remove before production |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: unauthenticated-write | backend/src/api/notifications/notification.routes.ts | POST /register-token has no auth — any client can register arbitrary tokens. Mitigated in Phase 2 by JWT middleware. |
| threat_flag: unauthenticated-upload | backend/src/api/health/upload-test.routes.ts | POST /api/upload/test has no auth — dev-only route, must be removed before production. |

## Next Phase Readiness

- Cloudinary and Firebase Admin wired; Phase 2 (auth) can use `admin.auth().verifyIdToken()` immediately
- FCM service ready; notifications can be triggered from any service that imports fcm.service.ts
- Phase 4 AI food analysis has its interface defined — only implementation needed
- Push token endpoint needs JWT middleware from Phase 2 before production use

---
*Phase: 01-infrastructure*
*Completed: 2026-05-17*

## Self-Check: PASSED

All 12 files found on disk. All 3 task commits verified in git log (9b9b72f, b7be11e, 7cfcf6c). TypeScript typecheck exits 0.
