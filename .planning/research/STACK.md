# Stack Research: v2.0 Feature Additions for Ủ App

**Project:** Ủ App  
**Scope:** v2.0 new features only  
**Researched:** 2026-05-26  
**Overall confidence:** HIGH for Expo/Cloudinary/Mongo integration choices; MEDIUM for barcode product data coverage in Vietnam.

## Executive Recommendation

Do **not** change the core stack. The existing Expo React Native mobile app, Express/Node backend, MongoDB/Mongoose data layer, Cloudinary image storage, TanStack Query clients, and React/Vite admin dashboard are the correct base for all v2.0 features.

Add only a small set of targeted packages:

| Area | Add | Where | Why |
|------|-----|-------|-----|
| Redeem campaign QR generation | `qrcode` | Backend, optional admin preview | Generate QR SVG/PNG/data URLs without an external QR service |
| QR/export bundles | `archiver` | Backend, optional | Stream ZIP files of QR images/CSVs for print vendors |
| CSV import/export | `csv-parse`, `csv-stringify` | Backend | Safer than ad hoc CSV parsing for bulk code/image workflows |
| Barcode product lookup | No package required | Backend | Use Open Food Facts HTTP API through existing `axios` |
| Camera barcode/QR scan | No package required | Mobile | Existing `expo-camera` already supports QR, EAN, UPC, Code128, etc. |
| Native store review prompt | `expo-store-review` | Mobile | Optional OS-native review prompt after positive in-app rating |
| Exercise image admin UX | No new storage | Admin/backend | Reuse existing Cloudinary + Multer; improve admin batch endpoints/workflow |

Avoid adding Firebase, Firestore, RevenueCat, Shopify/e-commerce, a second image store, native barcode scanner modules, or a subscription/paywall SDK for this milestone. v2.0 is campaign-code entitlement, product recommendation, feedback, barcode lookup, and content management workflow, not a platform migration.

## Current Stack Fit

| Layer | Current | v2.0 Decision |
|-------|---------|---------------|
| Mobile | Expo SDK 54, React Native, Expo Router, `expo-camera`, `expo-image-picker`, TanStack Query, Zustand | Keep. Add `expo-store-review`; use existing `expo-camera` for QR/barcodes. |
| Backend | Express 5, Node 20+, TypeScript, Mongoose 8, Zod, JWT auth, `express-rate-limit`, Cloudinary, Multer | Keep. Add campaign/redeem models, QR generation, CSV/ZIP utilities, barcode lookup service. |
| Admin | React/Vite, TanStack Query, TanStack Table, React Hook Form, Zod, shadcn/Base UI, lucide | Keep. Add pages/forms for campaigns, code batches, QR export, exercise image batch assignment. |
| Database | MongoDB Atlas via Mongoose | Keep. Add collections/indexes; no relational migration needed. |
| Images | Cloudinary through backend | Keep. Extend admin workflow; do not introduce S3 for v2.0. |
| AI food scan | Backend vision proxy with daily usage checks | Keep. Change entitlement logic to allow unlimited scans during redeemed-code expiry windows. |

## Recommended Additions

### 1. Campaign Redeem Codes and QR Codes

#### Backend Packages

```bash
cd backend
npm install qrcode archiver csv-parse csv-stringify
npm install -D @types/qrcode @types/archiver
```

| Package | Purpose | Confidence | Notes |
|---------|---------|------------|-------|
| `qrcode` | Generate SVG/PNG/data URL QR codes for campaign redeem payloads | HIGH | Official npm package supports Node and browser output formats. |
| `archiver` | Stream downloadable ZIP files of QR images for print campaigns | MEDIUM-HIGH | Useful only if admins need one ZIP containing hundreds/thousands of QR files. |
| `csv-parse` / `csv-stringify` | Robust CSV import/export for campaign codes and exercise image mapping | HIGH | Use instead of hand-splitting commas. |

#### Code Generation

Prefer built-in Node `crypto.randomBytes()` over adding `nanoid`, because the backend is currently CommonJS and modern `nanoid` versions are ESM-first. Generate human-enterable codes with an alphabet that removes ambiguous characters:

```typescript
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
```

Recommended code shape: `U-XXXX-XXXX` or `U-XXXX-XXXX-XXXX`.

Store only a hash of the redeem code if campaign fraud matters:

| Field | Store |
|-------|-------|
| Display/export code | Return once during generation/export |
| Lookup key | `codeHash = sha256(normalizedCode + PEPPER)` |
| QR payload | Either raw code or deep link containing code |

For a fast v2.0 release, storing plaintext codes is acceptable only if admin access is tightly controlled and print vendor exposure is not sensitive. The better default is hashed storage plus one-time CSV export.

#### MongoDB/Mongoose Additions

Add `Campaign` and `RedeemCode` collections rather than overloading users or food logs.

Recommended indexes:

| Collection | Index | Why |
|------------|-------|-----|
| `Campaign` | `{ status: 1, startsAt: 1, expiresAt: 1 }` | Admin list/filter and active campaign checks |
| `RedeemCode` | `{ codeHash: 1 }` unique | Fast redemption and duplicate prevention |
| `RedeemCode` | `{ campaignId: 1, status: 1 }` | Admin batch progress |
| `RedeemCode` | `{ redeemedBy: 1, expiresAt: 1 }` | User entitlement checks |
| `RedeemCode` | `{ batchId: 1 }` | Export/reprint by batch |

Add a derived user entitlement check instead of copying large campaign state into the user:

```text
User scans food -> backend checks active RedeemCode where redeemedBy=userId and expiresAt>now -> bypass daily AI scan cap
```

If multiple codes can be redeemed, entitlement should be `max(expiresAt)` across active redeemed codes.

#### QR Payload

Use a deep link that the existing Expo app can handle:

```text
uapp://redeem?code=U-ABCD-2345
```

or an HTTPS universal/app link if already configured:

```text
https://uapp.vn/redeem?code=U-ABCD-2345
```

Prefer HTTPS universal links for printed packaging if web fallback matters. Use raw code entry as the fallback for devices that do not open deep links.

#### Admin Integration

Add admin routes:

| Route | Purpose |
|-------|---------|
| `POST /api/admin/campaigns` | Create campaign with name, validity window, code expiry policy |
| `POST /api/admin/campaigns/:id/codes` | Generate bulk codes |
| `GET /api/admin/campaigns/:id/codes.csv` | Export codes for print/vendor |
| `GET /api/admin/campaigns/:id/qr.zip` | Optional QR image bundle |
| `GET /api/admin/campaigns/:id/stats` | Generated/redeemed/expired counts |

Use existing admin auth and TanStack Query patterns.

### 2. Mobile Redeem Code Entry and QR Scan

#### Packages

No new scanner package is needed. The mobile app already depends on `expo-camera`, and current Expo Camera `CameraView` supports `barcodeScannerSettings` and `onBarcodeScanned` for QR and common retail barcode types.

Use:

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
```

Recommended barcode types:

```typescript
['qr']
```

for campaign redemption QR screens, and:

```typescript
['ean13', 'ean8', 'upc_a', 'upc_e', 'code128']
```

for food barcode scanning.

Keep QR redemption and food barcode scanning as two modes in the same camera infrastructure, not two different libraries.

#### Do Not Add

| Do Not Add | Why |
|------------|-----|
| `expo-barcode-scanner` | Deprecated/merged path; Expo Camera is the current API surface. |
| `react-native-vision-camera` | Better for high-performance native camera workflows, but it adds native config complexity this milestone does not need. |
| ML Kit barcode packages | Unnecessary unless Expo Camera proves inadequate in production testing. |

### 3. BMI-Based Ủ Nut Milk Recommendation

#### Packages

No new package is needed.

Implement as backend domain rules plus a stored user selection. This is deterministic business logic, not AI.

Recommended backend additions:

| Add | Where | Notes |
|-----|-------|-------|
| `milkRecommendation.service.ts` | `backend/src/api/bmi` or new `backend/src/api/milk` | Pure function from BMI + optional needs to ranked flavors |
| `selectedMilkFlavor` field | User profile or separate `UserMilkPreference` collection | Store flavor id, selectedAt, source |
| Optional admin config endpoint | Backend/admin | Only if product wants to edit rules without deployment |

Start with code-based constants because the rule table is small and product-owned:

| Flavor | Rule |
|--------|------|
| `rau-ma-sua-dua` | BMI > 23 |
| `rau-ma-hat-sen` | Any BMI; highlight for stress/sleep |
| `gao-lut-me-den-hat-sen` | BMI 18.5-22.9 |
| `gao-lut-oc-cho-hanh-nhan` | BMI < 18.5 |
| `hat-sen-oc-cho` | Any BMI; highlight for skipping breakfast/quick energy |

Do not add a rules engine. If rules become admin-editable later, store a simple JSON rule table in MongoDB and validate with Zod.

### 4. Barcode Scan to Supplement Food Scanning

#### Packages

No new mobile package. No backend SDK required.

Use existing `expo-camera` on mobile to scan product barcodes, then call a backend endpoint:

```text
GET /api/food/barcode/:code
```

Backend uses existing `axios` to call Open Food Facts:

```text
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

Use the v2 API first. Store normalized results in the existing food item schema or a new cached `BarcodeProduct` collection.

Recommended `BarcodeProduct` fields:

| Field | Why |
|-------|-----|
| `barcode` unique | Product lookup key |
| `name` | Display/logging |
| `brand` | Disambiguation |
| `servingSize` | User confirmation |
| `nutritionPer100g` | Consistent nutrition math |
| `imageUrl` | UI confirmation |
| `source` = `openfoodfacts` / `manual` | Trust/debugging |
| `lastFetchedAt` | Refresh stale data |
| `raw` optional | Debug source mismatches |

Cache misses and allow manual entry because Vietnamese packaged-product coverage may be incomplete. Barcode scanning should supplement AI/manual food logging, not replace it.

#### Do Not Add

| Do Not Add | Why |
|------------|-----|
| A paid barcode database immediately | Validate Open Food Facts coverage first with real Vietnam products. |
| Client-side Open Food Facts calls | Backend cache gives normalization, resilience, and source control. |
| Nutrition scraping | Use official API fields only; scraping creates fragile data quality problems. |

### 5. App Rating Prompt With Stars and Comment

#### Mobile Package

```bash
cd mobile
npx expo install expo-store-review
```

Use two layers:

1. Custom in-app feedback modal for stars and comment.
2. Optional `expo-store-review` native prompt only after positive feedback, e.g. 4-5 stars.

`expo-store-review` cannot collect a custom comment for your backend; it triggers OS/app-store review UI. Therefore the custom rating/comment feature needs a backend model.

#### Backend/Admin Additions

Add `AppFeedback` collection:

| Field | Notes |
|-------|-------|
| `userId` | Authenticated user |
| `rating` | 1-5 |
| `comment` | Optional, max length via Zod |
| `trigger` | `food_scan`, `barcode_scan`, `workout_complete`, `bmi_recommendation`, etc. |
| `appVersion` | From Expo constants/client config |
| `platform` | iOS/Android |
| `createdAt` | Admin sorting |

Add:

```text
POST /api/feedback
GET /api/admin/feedback
```

Use MMKV/Zustand or existing local state to suppress prompts after submission/dismissal. Do not prompt on first launch; trigger after meaningful completed actions.

#### Do Not Add

| Do Not Add | Why |
|------------|-----|
| A third-party star rating component | Five tappable icons are trivial and keep design consistent. |
| A survey platform SDK | Too much integration surface for one modal and admin table. |
| Store-review prompt as the only feature | It does not satisfy the requirement for stars + comment. |

### 6. Easier Image Management for Hundreds of Exercise Records

#### Packages

No new storage service is needed. Reuse Cloudinary and the existing backend upload path.

Add CSV parsing/stringifying on backend if exercise image mapping is imported/exported:

```bash
cd backend
npm install csv-parse csv-stringify
```

Recommended workflow:

1. Admin bulk uploads images to Cloudinary under a deterministic folder, e.g. `exercises/{exerciseId}` or `exercises/{slug}`.
2. Backend stores both `imageUrl` and `imagePublicId`.
3. Admin can export exercise IDs/slugs to CSV.
4. Admin can import a CSV mapping `exerciseId, imageUrl, imagePublicId` or `slug, imageUrl`.
5. Backend validates all rows with Zod and reports row-level errors.

For browser-side upload UX, Cloudinary Upload Widget is acceptable for admin only, but signed backend upload is more consistent with current security. If using unsigned upload presets, lock them down by folder, file type, and max size because preset names are visible in client code.

Recommended Cloudinary conventions:

| Convention | Why |
|------------|-----|
| Store `publicId` in MongoDB | Enables replacement/deletion without URL parsing |
| Use folders by content type | `exercises/`, `food-items/`, `campaign-qr/` |
| Use upload transformations | Normalize thumbnails and reduce mobile payload |
| Add admin batch validation | Prevent hundreds of broken image references |

#### Do Not Add

| Do Not Add | Why |
|------------|-----|
| S3/CloudFront for v2.0 | Cloudinary is already integrated and better for image transformations. |
| A full DAM/CMS | Too heavy for exercise image assignment. |
| Base64 image storage in MongoDB | Bloats documents and breaks CDN/image optimization. |
| Manual per-record upload only | Does not solve the "hundreds of records" requirement. |

## Updated Recommended Stack Table

### Mobile

| Technology | Version | Purpose | Decision |
|------------|---------|---------|----------|
| Expo SDK | Current repo `~54.0.0` | Mobile runtime | Keep |
| `expo-camera` | Current repo `~17.0.10` | QR and barcode scanning | Keep; use `CameraView` |
| `expo-store-review` | Expo-compatible install | Native app-store review prompt | Add |
| TanStack Query | Current repo v5 | API state | Keep |
| Zustand/MMKV | Current repo | Local prompt suppression and UI state | Keep |

### Backend

| Technology | Version | Purpose | Decision |
|------------|---------|---------|----------|
| Express | Current repo `^5.1.0` | API routes | Keep |
| Mongoose | Current repo `^8.0.0` | Campaign/code/feedback/barcode schemas | Keep |
| Zod | Current repo `^3.24.0` | API validation | Keep |
| Cloudinary | Current repo `^2.0.0` | Exercise images and optional QR image hosting | Keep |
| `qrcode` | Latest 1.x | QR generation | Add |
| `archiver` | Latest | ZIP export for QR bundles | Add only if ZIP export is required |
| `csv-parse` / `csv-stringify` | Latest | CSV import/export | Add |
| Node `crypto` | Built-in | Secure code generation/hashing | Use instead of adding ID library |

### Admin

| Technology | Version | Purpose | Decision |
|------------|---------|---------|----------|
| React/Vite | Current repo | Admin UI | Keep |
| TanStack Query/Table | Current repo | Campaign/code/feedback tables | Keep |
| React Hook Form + Zod | Current repo | Campaign forms and imports | Keep |
| Cloudinary Upload Widget | Hosted script, optional | Admin bulk image upload | Optional; prefer backend-signed flow if possible |
| `qrcode` or backend-rendered QR | Latest 1.x or API output | Preview QR codes | Use backend output for consistency |

## Implementation Integration Points

| Feature | Mobile | Backend | Admin | Database |
|---------|--------|---------|-------|----------|
| Redeem codes | Code entry screen; QR scan mode; entitlement status in profile/scan UI | Campaign/code generation, redemption endpoint, AI scan entitlement check | Campaign CRUD, bulk generate, export CSV/ZIP, stats | `Campaign`, `RedeemCode` |
| BMI milk recommendation | Display recommendation and selected flavor | Deterministic recommendation service; save selection endpoint | Optional read-only analytics later | User profile field or `UserMilkPreference` |
| Barcode food scan | Barcode scan mode using `expo-camera` | Open Food Facts lookup, normalization, cache, log conversion | Optional barcode cache admin later | `BarcodeProduct` cache |
| Rating prompt | Custom stars/comment modal; optional `expo-store-review` | Save feedback endpoint | Feedback table/filter/export | `AppFeedback` |
| Exercise image management | Consume optimized image URLs | Batch image mapping import; Cloudinary public ID handling | Bulk upload/mapping UI, row-level errors | Exercise `imageUrl`, `imagePublicId` |

## What Not To Add

| Avoid | Reason |
|-------|--------|
| New database or Firebase/Firestore | MongoDB already fits campaign, feedback, cache, and preference documents. |
| Subscription/paywall SDK | Campaign codes are not in-app subscriptions. Avoid App Store/Play billing complexity. |
| E-commerce/checkout stack | Bottled milk campaign redemption is entitlement unlock, not purchase flow. |
| Separate QR SaaS | `qrcode` is enough; generated assets can be exported or hosted in Cloudinary. |
| `react-native-vision-camera` | Adds native complexity; Expo Camera is already installed and supports target scan types. |
| Paid barcode database before validation | Open Food Facts may be enough; test Vietnam product coverage first. |
| Rules engine for milk recommendation | Five product rules do not justify rules-engine complexity. |
| New image storage provider | Cloudinary is already integrated and purpose-built for transformations/CDN. |
| Third-party survey SDK | A simple feedback model and admin table are faster and own the data. |
| AI for BMI flavor recommendation | Product gave deterministic rules; AI would reduce predictability and testability. |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Keep core Expo/Express/Mongo stack | HIGH | Existing app already has required foundations. |
| Expo Camera for QR/barcodes | HIGH | Official Expo Camera docs list QR, EAN, UPC, Code128, and related barcode types. |
| `qrcode` for QR generation | HIGH | Mature Node/browser package, no external service needed. |
| Open Food Facts lookup | MEDIUM | Official API is available, but Vietnam product coverage must be tested with real packages. |
| `expo-store-review` | HIGH | Official Expo package; only covers native store prompt, not custom comment capture. |
| Cloudinary for exercise image workflow | HIGH | Existing integration and official upload/widget support fit the use case. |
| CSV/ZIP export libraries | MEDIUM-HIGH | Standard implementation path; exact need depends on print/vendor workflow. |

## Sources

- Expo Camera SDK 54 docs: https://docs.expo.dev/versions/v54.0.0/sdk/camera
- Expo StoreReview docs: https://docs.expo.dev/versions/latest/sdk/storereview
- Expo SDK reference: https://docs.expo.dev/versions/v54.0.0
- Open Food Facts API docs: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/
- Open Food Facts product endpoint docs: https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- `qrcode` npm package: https://www.npmjs.com/package/qrcode
- `csv-parse` npm package: https://www.npmjs.com/package/csv-parse
- Cloudinary Upload Widget docs: https://cloudinary.com/documentation/upload_widget
- Cloudinary Node SDK docs: https://cloudinary.com/documentation/node_integration
- Cloudinary Node upload docs: https://cloudinary.com/documentation/node_image_and_video_upload
- Cloudinary unsigned upload limitations: https://support.cloudinary.com/hc/en-us/articles/204046472-Which-upload-parameters-are-allowed-when-using-unsigned-upload

