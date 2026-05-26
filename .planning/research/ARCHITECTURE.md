# Architecture Research: v2.0 Feature Integration

**Project:** Ủ App  
**Domain:** Expo React Native health app + Express/Node API + MongoDB + React admin dashboard  
**Researched:** 2026-05-26  
**Overall confidence:** HIGH for repo integration, MEDIUM for final mobile scanner behavior until tested on physical Android/iOS devices.

## Executive Summary

v2.0 should extend the current monolith-style backend rather than introduce a new service. The existing architecture already has the right boundaries: mobile calls typed API clients, backend routes are grouped by domain, Mongoose models own persistence, admin routes are protected by `authenticate` and `requireAdmin`, Cloudinary is already the image CDN, and AI scan quota is isolated in `FoodScanAttempt`. The safest approach is to add narrow domain modules for campaign codes, recommendations, ratings, and exercise media while modifying food scan quota logic in place.

The highest-impact integration is redeem-code unlocking for AI scans. Do not bypass the existing `/api/food/scan` flow from mobile. Instead, add entitlement-aware quota resolution inside `food.service.ts`: if the user has an active scan entitlement, return unlimited scan access for the entitlement expiry window; otherwise keep the existing daily limit. This keeps AI cost control and audit behavior centralized.

BMI milk recommendation should be rule-based and server-owned. Mobile can render the recommendation, but the backend should compute the canonical recommendation from the latest BMI plus optional user preference signals, then persist the selected flavor on the user profile or a dedicated preference record. This prevents product-rule drift across app versions and lets admin/product update copy later without an app release.

Barcode scanning should supplement food search, not replace AI scan. Use `expo-camera`'s existing `CameraView` stack for QR and barcode scanning because the mobile app already depends on `expo-camera`. Add barcode fields to `FoodItem` and route scanned EAN/UPC codes through the backend. Unknown barcodes should create a light telemetry record or return a "not found, try AI scan/manual search" response rather than calling a third-party food database by default.

Exercise image management should not be modeled as "one image URL string forever." Hundreds of exercise records need reusable image assets, bulk assignment, and deletion safety. Add a first-class `MediaAsset` model for admin-uploaded exercise images and let `Exercise.imageUrl` remain as a denormalized compatibility field during migration. New admin UI should manage images in a media library and assign `imageAssetId` to exercises.

## Current Architecture Fit

### Existing Components to Reuse

| Existing Area | Current Shape | v2.0 Integration Decision |
|---|---|---|
| Auth | JWT middleware with `AuthRequest`, role-based admin guard | Reuse for all user/admin v2 routes |
| AI scan | `POST /api/food/scan`, `FoodScanAttempt`, `SCAN_DAILY_LIMIT = 20` | Modify quota check to consider active entitlements |
| Food DB/search | `FoodItem` with text index and admin CRUD | Add barcode fields and lookup endpoint |
| BMI | `BMIRecord`, `/api/bmi`, latest height/weight mirrored to `User.profile` | Add recommendation endpoint and persisted flavor preference |
| Admin | Single `/api/admin` router, CRUD service/controller/validation pattern | Add admin campaign and media-library route groups |
| Uploads | Multer memory upload + Cloudinary helper | Add multi-upload/bulk asset endpoint; keep Cloudinary as source of truth |
| Mobile API | Typed functions in `mobile/src/lib/api/*.api.ts` | Add `campaign.api.ts`, `recommendations.api.ts`, `ratings.api.ts`; extend `food.api.ts` |
| State/cache | TanStack Query + local zustand for food scan result | Use React Query for v2 server state; avoid long-lived local-only entitlement state |

## Recommended Architecture

```
Mobile Expo App
  - Scan food image -> /api/food/scan
  - Scan QR/redeem code -> /api/campaigns/redeem
  - Scan barcode -> /api/food/items/barcode/:code
  - BMI recommendation -> /api/recommendations/nut-milk
  - App rating -> /api/ratings

Admin React Dashboard
  - Campaign code batch generation -> /api/admin/campaigns
  - QR export/download -> /api/admin/campaigns/:id/codes/export
  - Exercise media library -> /api/admin/media-assets
  - Bulk exercise image assignment -> /api/admin/exercises/bulk-image

Express Backend
  - campaigns module: code generation, redemption, entitlements
  - food module: quota resolution, barcode lookup
  - recommendations module: BMI/flavor rules
  - ratings module: feedback capture
  - admin/media module: Cloudinary asset catalog

MongoDB
  - Campaign
  - RedeemCode
  - UserScanEntitlement
  - NutMilkPreference or User.profile.nutMilkPreference
  - AppRating
  - MediaAsset
  - FoodItem modified with barcodes
  - Exercise modified with imageAssetId
```

## New Models

### Campaign

Admin-created campaign metadata. One campaign owns many redeem codes.

```typescript
{
  _id: ObjectId,
  name: string,
  description?: string,
  productLine?: 'bottled-milk' | 'other',
  startsAt?: Date,
  expiresAt: Date,
  unlockType: 'unlimited_ai_scans',
  codeCount: number,
  redeemedCount: number,
  isActive: boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```typescript
{ isActive: 1, expiresAt: 1 }
{ createdAt: -1 }
```

### RedeemCode

Store the code hash, not just plaintext, because bottled campaign codes are effectively bearer credentials. Admin can export plaintext only at generation time; after that, list views should show masked code and QR payload metadata.

```typescript
{
  _id: ObjectId,
  campaignId: ObjectId,
  codeHash: string,
  codePrefix: string,
  qrPayload: string,
  status: 'unused' | 'redeemed' | 'void',
  redeemedBy?: ObjectId,
  redeemedAt?: Date,
  expiresAt: Date,
  createdAt: Date
}
```

Indexes:

```typescript
{ codeHash: 1 } unique
{ campaignId: 1, status: 1 }
{ redeemedBy: 1, redeemedAt: -1 }
{ expiresAt: 1 }
```

Code format recommendation:

```text
U2-<CAMPAIGN_PREFIX>-<RANDOM_BASE32_10>-<CHECK_DIGIT>
```

Use `crypto.randomBytes`, uppercase Crockford/Base32 or hex-safe encoding, and a checksum/check digit to reduce support tickets from mistyped codes. Do not use Mongo `_id` or sequential codes.

### UserScanEntitlement

Represents unlocked unlimited AI scan access. Keep this separate from `User` so multiple campaigns, expiry windows, and audit history remain queryable.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  campaignId: ObjectId,
  redeemCodeId: ObjectId,
  type: 'unlimited_ai_scans',
  startsAt: Date,
  expiresAt: Date,
  source: 'redeem_code',
  createdAt: Date
}
```

Indexes:

```typescript
{ userId: 1, type: 1, expiresAt: -1 }
{ redeemCodeId: 1 } unique
```

Behavior:

- If a user redeems overlapping codes, create separate entitlement records and use the latest active `expiresAt`.
- Do not mutate the old entitlement in place; immutable entitlement records make campaign analytics and support easier.
- A code should be redeemable only once globally unless product explicitly changes that rule.

### NutMilkPreference

Use a dedicated model if product wants recommendation history and analytics. Use `User.profile.nutMilkPreference` only if the app only needs the current selected flavor. Recommended: dedicated model, plus denormalized current preference on `User.profile` for profile reads.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  recommendedFlavorId: string,
  selectedFlavorId: string,
  bmiRecordId?: ObjectId,
  bmi?: number,
  signals: {
    stressOrSleep?: boolean,
    skippingBreakfast?: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

Flavor IDs should be stable ASCII identifiers:

| Flavor ID | Display Name | Rule |
|---|---|---|
| `rau_ma_sua_dua` | Rau má sữa dừa | BMI > 23 |
| `rau_ma_hat_sen` | Rau má - Hạt sen | Any BMI, especially stress/sleep |
| `gao_lut_me_den_hat_sen` | Gạo lứt - Mè đen - Hạt sen | BMI 18.5-22.9 |
| `gao_lut_oc_cho_hanh_nhan` | Gạo lứt - Óc chó - Hạnh nhân | BMI < 18.5 |
| `hat_sen_oc_cho` | Hạt sen - Óc chó | Any BMI, especially skipping breakfast/quick energy |

### AppRating

Capture in-app feedback separately from store reviews. This supports admin review and avoids coupling prompts to app-store APIs.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  stars: 1 | 2 | 3 | 4 | 5,
  comment?: string,
  trigger: 'food_scan' | 'bmi' | 'workout' | 'habit' | 'profile',
  appVersion?: string,
  platform?: 'ios' | 'android',
  deviceInfo?: string,
  createdAt: Date
}
```

Indexes:

```typescript
{ userId: 1, createdAt: -1 }
{ stars: 1, createdAt: -1 }
```

Prompt throttling can start client-side with MMKV, but backend should expose rating history/status so a reinstall does not create repeated prompts.

### MediaAsset

First-class asset catalog for exercise images.

```typescript
{
  _id: ObjectId,
  type: 'exercise_image' | 'food_image' | 'campaign_qr',
  url: string,
  publicId: string,
  folder: string,
  filename?: string,
  width?: number,
  height?: number,
  bytes?: number,
  tags: string[],
  altText?: string,
  usageCount: number,
  uploadedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```typescript
{ type: 1, createdAt: -1 }
{ tags: 1 }
{ publicId: 1 } unique
```

## Modified Models

### FoodScanAttempt

Keep the model, but add metadata so future analytics can distinguish limited scans from campaign-unlocked scans.

```typescript
{
  userId: ObjectId,
  entitlementId?: ObjectId,
  source: 'daily_quota' | 'redeem_entitlement',
  createdAt: Date
}
```

Keep the existing TTL index because the current purpose is recent quota counting. If product wants long-term campaign analytics, store those on entitlement/campaign aggregates rather than extending attempt retention indefinitely.

### FoodItem

Add barcode fields for packaged foods and bottled milk.

```typescript
{
  barcodes: string[],
  brand?: string,
  servingSizeG?: number,
  packageSize?: string,
  source: 'openfoods' | 'manual' | 'barcode_import'
}
```

Indexes:

```typescript
{ barcodes: 1 } sparse
{ name: 'text', nameEn: 'text', brand: 'text' }
```

Use an array because products often have multiple package barcodes.

### User

Add only small denormalized fields:

```typescript
profile: {
  ...
  selectedNutMilkFlavorId?: string,
  selectedNutMilkFlavorAt?: Date
}
```

Do not add campaign entitlements as an embedded array. It will grow over time and makes expiry/index queries worse.

### Exercise

Add asset reference while keeping current `imageUrl` for backwards compatibility.

```typescript
{
  imageAssetId?: ObjectId,
  imageUrl: string | null
}
```

Migration path:

1. Create `MediaAsset` rows for existing distinct `Exercise.imageUrl` values where possible.
2. Backfill `Exercise.imageAssetId`.
3. Continue returning `imageUrl` to mobile so no mobile screen breaks.
4. Admin writes both `imageAssetId` and denormalized `imageUrl`.

## New and Modified Endpoints

### User Campaign Endpoints

```http
POST /api/campaigns/redeem
Authorization: Bearer <jwt>
Body: { "code": "U2-ABC-..." }
Response: {
  "entitlement": {
    "type": "unlimited_ai_scans",
    "startsAt": "...",
    "expiresAt": "..."
  }
}
```

```http
GET /api/campaigns/me/entitlements
Authorization: Bearer <jwt>
Response: {
  "activeAiScanEntitlement": {
    "expiresAt": "...",
    "campaignName": "..."
  } | null
}
```

Implementation notes:

- Normalize input by trimming, uppercasing, and removing spaces/hyphen variants before hashing.
- Redemption must be atomic: find unused code, set `redeemedBy/redeemedAt/status`, create entitlement.
- Prefer MongoDB transaction; if deployment lacks replica set transactions, use `findOneAndUpdate` with `status: 'unused'` as the atomic guard, then compensate on entitlement creation failure.

### Admin Campaign Endpoints

```http
GET /api/admin/campaigns?page=&limit=&search=
POST /api/admin/campaigns
GET /api/admin/campaigns/:id
PATCH /api/admin/campaigns/:id
POST /api/admin/campaigns/:id/codes/generate
GET /api/admin/campaigns/:id/codes
GET /api/admin/campaigns/:id/codes/export.csv
POST /api/admin/campaigns/:id/codes/:codeId/void
```

`POST /codes/generate` body:

```json
{
  "count": 1000,
  "expiresAt": "2026-08-31T16:59:59.999Z",
  "qrPayloadBaseUrl": "uapp://redeem"
}
```

QR payload recommendation:

```text
uapp://redeem?code=<CODE>
```

The QR should encode a deep link, not a raw database ID. Mobile parses the code and posts it to `/api/campaigns/redeem`.

### Modified Food Scan Endpoints

Keep:

```http
POST /api/food/scan
```

Change response to include quota state:

```json
{
  "foods": [],
  "totals": {},
  "aiProvider": "gemini",
  "imageUrl": null,
  "quota": {
    "mode": "daily_limit",
    "usedToday": 4,
    "limit": 20,
    "retryAfterSeconds": 12345
  }
}
```

or:

```json
{
  "quota": {
    "mode": "unlimited",
    "entitlementExpiresAt": "2026-08-31T16:59:59.999Z"
  }
}
```

Recommended internal service API:

```typescript
async function resolveScanAccess(userId: string): Promise<
  | { allowed: true; source: 'redeem_entitlement'; entitlementId: string; expiresAt: Date }
  | { allowed: true; source: 'daily_quota'; usedToday: number; limit: number }
  | { allowed: false; source: 'daily_quota'; usedToday: number; limit: number; retryAfterSeconds: number }
>
```

### Barcode Food Endpoints

```http
GET /api/food/items/barcode/:barcode
Authorization: Bearer <jwt>
Response: { "item": FoodItem | null }
```

Optional admin import later:

```http
PATCH /api/admin/food-items/:id/barcodes
POST /api/admin/food-items/import-barcodes
```

Do not call AI from barcode lookup. Barcode is deterministic lookup; AI image scan remains the fallback path.

### BMI Nut Milk Recommendation Endpoints

```http
GET /api/recommendations/nut-milk
Authorization: Bearer <jwt>
Query: ?stressOrSleep=true&skippingBreakfast=false
Response: {
  "latestBmi": { "value": 21.4, "category": "normal", "recordedAt": "..." },
  "recommended": { "flavorId": "gao_lut_me_den_hat_sen", "displayName": "..." },
  "alternatives": [...]
}
```

```http
POST /api/recommendations/nut-milk/selection
Authorization: Bearer <jwt>
Body: {
  "selectedFlavorId": "hat_sen_oc_cho",
  "signals": { "skippingBreakfast": true }
}
```

Rule precedence:

1. BMI > 23 -> `rau_ma_sua_dua`
2. BMI < 18.5 -> `gao_lut_oc_cho_hanh_nhan`
3. BMI 18.5-22.9 -> `gao_lut_me_den_hat_sen`
4. If no BMI exists, default recommendation should be `rau_ma_hat_sen` with copy asking user to record BMI.
5. `stressOrSleep` and `skippingBreakfast` should appear as alternatives or user-selected overrides, not silently override BMI unless product explicitly wants lifestyle signals to outrank BMI.

### Rating Endpoints

```http
GET /api/ratings/status
Authorization: Bearer <jwt>
Response: {
  "hasRated": false,
  "lastPromptedAt": "...",
  "eligibleTriggers": ["food_scan", "bmi"]
}
```

```http
POST /api/ratings
Authorization: Bearer <jwt>
Body: {
  "stars": 5,
  "comment": "Ứng dụng dễ dùng",
  "trigger": "food_scan",
  "appVersion": "2.0.0",
  "platform": "android"
}
```

Admin:

```http
GET /api/admin/ratings?stars=&page=&limit=
```

### Admin Media Endpoints

```http
GET /api/admin/media-assets?type=exercise_image&search=&page=&limit=&tag=
POST /api/admin/media-assets/upload
PATCH /api/admin/media-assets/:id
DELETE /api/admin/media-assets/:id
POST /api/admin/exercises/bulk-image
```

`POST /api/admin/media-assets/upload` should accept multiple images with a higher but explicit limit, for example 20 files per request and 5 MB per file. Add a new multer middleware such as `uploadMany = upload.array('images', 20)` instead of changing the current `uploadSingle` behavior.

`POST /api/admin/exercises/bulk-image` body:

```json
{
  "exerciseIds": ["..."],
  "imageAssetId": "..."
}
```

Deletion rule:

- If `usageCount > 0`, block delete by default.
- Offer "detach from exercises" as a separate explicit admin action.

## Data Flows

### 1. Campaign Code Generation and Redemption

```
Admin creates campaign
  -> backend creates Campaign
  -> admin requests N codes
  -> backend generates random plaintext codes
  -> backend stores codeHash + masked prefix
  -> backend returns CSV/QR export immediately
  -> admin prints QR on bottled milk campaign

User scans QR or enters code
  -> mobile parses deep link or text input
  -> POST /api/campaigns/redeem
  -> backend atomically marks RedeemCode redeemed
  -> backend creates UserScanEntitlement
  -> mobile invalidates entitlement/quota queries
  -> subsequent /api/food/scan is unlimited until expiresAt
```

Key implementation point: do not let mobile decide unlimited scan access. Mobile only displays the entitlement returned by the backend.

### 2. Entitlement-Aware AI Food Scan

```
Mobile captures/compresses image
  -> POST /api/food/scan multipart
  -> backend resolveScanAccess(userId)
     -> active UserScanEntitlement exists and not expired?
        yes: allow unlimited, source=redeem_entitlement
        no: count FoodScanAttempt for Vietnam-local day
  -> Gemini/OpenAI proxy analyzes image
  -> backend records FoodScanAttempt with source + entitlementId when present
  -> response includes result + quota metadata
```

Record attempts after successful analysis as the current code does. Failed AI/provider requests should not consume daily quota or campaign benefit.

### 3. Barcode Supplement Flow

```
Mobile opens food scan mode selector
  -> user selects Barcode
  -> CameraView scans EAN/UPC/QR payload
  -> mobile sends barcode to GET /api/food/items/barcode/:barcode
  -> backend finds FoodItem by barcodes
  -> if found: mobile opens serving-size/log confirmation
  -> if not found: mobile offers manual search or AI image scan
```

QR campaign codes and food barcodes should share camera infrastructure but not backend endpoints. Route by payload shape:

- `uapp://redeem?code=` or `U2-...` -> campaign redemption
- numeric EAN/UPC -> food barcode lookup

### 4. BMI Recommendation and Flavor Selection

```
User saves BMI
  -> existing PATCH /api/bmi creates BMIRecord and updates User.profile
  -> mobile invalidates recommendation query
  -> GET /api/recommendations/nut-milk
  -> backend fetches latest BMIRecord
  -> backend applies product rules
  -> mobile shows recommended flavor and alternatives
  -> user selects flavor
  -> POST /api/recommendations/nut-milk/selection
  -> backend writes NutMilkPreference and denormalized User.profile fields
```

Keep nutrition/medical claims conservative in copy. The architecture should store rules and selections, not infer health treatment claims.

### 5. Rating Prompt Flow

```
Mobile observes feature usage counters locally
  -> after threshold, GET /api/ratings/status
  -> if eligible, show modal with stars + optional comment
  -> POST /api/ratings
  -> backend stores AppRating
  -> mobile records lastPromptedAt locally to avoid immediate repeat
```

Trigger recommendation:

- Prompt after 2-3 meaningful successes, for example successful AI scan save, BMI recommendation selection, or completed workout.
- Do not prompt immediately after registration or failed scans.
- Low ratings should stay in-app with comment capture; high ratings can optionally deep-link to store review in a later phase.

### 6. Exercise Image Management Flow

```
Admin uploads many exercise images
  -> POST /api/admin/media-assets/upload
  -> backend uploads each to Cloudinary under u-app/exercises
  -> backend stores MediaAsset rows
  -> admin filters/searches media library
  -> admin selects exercises and assigns image asset
  -> backend updates Exercise.imageAssetId and imageUrl
  -> mobile exercise list continues reading imageUrl
```

This avoids large form churn in `ExercisesPage` and makes replacing images a bulk content operation instead of hundreds of row edits.

## Component Boundaries

| Component | Responsibility | Communicates With |
|---|---|---|
| `campaigns` API module | User redemption and entitlement reads | `RedeemCode`, `Campaign`, `UserScanEntitlement` |
| `admin/campaigns` routes | Campaign CRUD, code generation, export, voiding | Admin dashboard, `Campaign`, `RedeemCode` |
| `food.service` quota resolver | Decide whether `/api/food/scan` is allowed | `FoodScanAttempt`, `UserScanEntitlement` |
| `food` barcode lookup | Deterministic lookup by EAN/UPC | `FoodItem` |
| `recommendations` module | Server-owned nut milk rules and selection persistence | `BMIRecord`, `NutMilkPreference`, `User` |
| `ratings` module | Prompt status and rating submission | `AppRating`, admin reports |
| `media-assets` admin module | Bulk upload, asset catalog, usage tracking | Cloudinary, `MediaAsset`, `Exercise` |
| Mobile scan screen | Capture image/barcode/QR and route payloads | `/api/food/*`, `/api/campaigns/redeem` |
| Admin dashboard pages | Operator workflows only | `/api/admin/*` |

## Validation and Security Requirements

### Campaign Codes

- Hash redeem codes at rest with SHA-256 plus server-side pepper from env.
- Validate code format before database lookup.
- Use atomic redemption to prevent two users claiming one code.
- Rate-limit redemption attempts per user/IP to reduce brute force.
- Return generic invalid/expired/redeemed messages where possible; avoid leaking which codes exist.
- Export plaintext codes only during generation or store encrypted-at-rest export files with short retention if business requires re-download.

### QR Codes

- QR payload must contain only a redeem code/deep link, never admin credentials or user identifiers.
- QR generation can be done server-side using a Node QR package or client-side in admin for preview, but the backend remains authoritative for code creation.
- Store QR images in Cloudinary only if print/export workflows need persistent image files. Otherwise generate QR in CSV/PDF export on demand.

### Barcode

- Normalize barcodes as strings, not numbers, to preserve leading zeros.
- Restrict accepted types in mobile camera settings to `ean13`, `ean8`, `upc_a`, `upc_e`, and optionally `qr`.
- Unknown barcode submissions should be logged only if privacy-safe; do not store camera frames.

### Media Assets

- Validate MIME type and file size.
- Keep existing 5 MB single-file limit for normal uploads; add a separate multi-upload limit for admin media.
- Store Cloudinary `publicId` so assets can be deleted or replaced correctly.
- Track usage before delete to avoid broken exercise images.

## Suggested Build Order

1. **Data Model and Backend Foundation**
   - Add `Campaign`, `RedeemCode`, `UserScanEntitlement`, `AppRating`, `MediaAsset`, and optional `NutMilkPreference`.
   - Extend `FoodItem`, `Exercise`, `FoodScanAttempt`, and `User.profile`.
   - Rationale: models and indexes unblock all API and admin work.

2. **Entitlement-Aware Food Scan**
   - Add campaign redemption API.
   - Add `resolveScanAccess` and modify `/api/food/scan` response quota metadata.
   - Add integration tests for daily limit, active entitlement, expired entitlement, and duplicate redemption.
   - Rationale: campaign unlock is the riskiest business rule and touches AI cost control.

3. **Admin Campaign Management**
   - Build campaign CRUD, code batch generation, CSV export, and basic QR export.
   - Add admin page and React Query hooks.
   - Rationale: campaign creation must exist before bottled campaign QA.

4. **Barcode Food Lookup**
   - Extend `FoodItem` validation/admin form for barcodes.
   - Add `/api/food/items/barcode/:barcode`.
   - Add mobile barcode mode using existing `expo-camera`.
   - Rationale: deterministic supplement to food scan; minimal dependency on campaign work except scanner UI routing.

5. **BMI Nut Milk Recommendation**
   - Add recommendation service and endpoints.
   - Add mobile recommendation UI after BMI save and in BMI tab.
   - Persist selected flavor.
   - Rationale: self-contained feature with low technical risk once product copy is final.

6. **App Rating Prompt**
   - Add rating model/endpoints/admin list.
   - Add mobile prompt coordinator with local throttling plus backend status.
   - Rationale: low coupling, should not block revenue/campaign features.

7. **Exercise Media Library**
   - Add multi-upload, asset catalog, assignment flow, and backfill script for existing image URLs.
   - Update admin exercise UI to choose from media library.
   - Rationale: operational improvement; can ship after user-facing v2 features unless admin data entry is blocking content rollout.

## Testing Priorities

| Area | Required Tests |
|---|---|
| Redeem code generation | uniqueness, hash lookup, count creation, expiry |
| Redemption | invalid code, expired code, already redeemed, concurrent redemption, successful entitlement |
| Food scan quota | daily limited user, active unlimited user, expired entitlement fallback, attempt metadata |
| Barcode lookup | leading zeros, unknown barcode, multi-barcode product |
| Recommendation | each BMI bracket, no BMI fallback, selected flavor persistence |
| Rating | validation, duplicate prompt status, admin listing |
| Media assets | upload validation, bulk assignment, delete blocked while used |

## Pitfalls to Avoid

1. **Putting entitlement state only on mobile.** Users can reinstall or tamper with local state. Backend must decide scan access on every scan.
2. **Storing redeem codes as plaintext.** Campaign codes unlock paid AI usage. Hash at rest and design exports intentionally.
3. **Replacing the scan endpoint.** Add entitlement logic inside the existing scan flow so rate limits, AI proxy behavior, and error handling stay centralized.
4. **Making BMI recommendations client-only.** Product rules will change; server-owned rules prevent app-version drift.
5. **Treating barcodes as numbers.** Leading zeros are valid and must survive validation and indexing.
6. **Bulk media through the existing single upload endpoint.** Add a separate multi-upload path to avoid breaking current food/exercise upload behavior.
7. **Deleting Cloudinary images without usage checks.** Exercise records can silently break if `publicId` deletion is not tied to `MediaAsset.usageCount`.
8. **Prompting for ratings too early.** Ratings should follow successful value moments, not onboarding or failed AI scans.

## Sources and Verification

- Repo inspection: `backend/src/api/food/*`, `backend/src/models/FoodScanAttempt.ts`, `backend/src/models/FoodItem.ts`, `backend/src/api/bmi/*`, `backend/src/models/BMIRecord.ts`, `backend/src/models/User.ts`, `backend/src/api/admin/*`, `backend/src/models/Exercise.ts`, `mobile/src/lib/api/*`, `mobile/src/app/(food)/scan.tsx`.
- Expo Camera official docs: `CameraView` supports `barcodeScannerSettings`, `onBarcodeScanned`, and barcode types including QR, EAN, UPC, Code128, and others. Confidence HIGH. https://docs.expo.dev/versions/latest/sdk/camera/
- Cloudinary official docs: Node SDK supports stream uploads and upload parameters; current backend already uses `upload_stream`. Confidence HIGH. https://cloudinary.com/documentation/node_image_and_video_upload
- npm package discovery for QR generation: `qrcode` and related packages are available, but package choice should be locked during implementation after dependency review. Confidence MEDIUM. https://www.npmjs.com/package/qrcode
