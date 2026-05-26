# Phase 1: v2 Data Foundation - Research

**Researched:** 2026-05-26
**Domain:** Express 5 + Mongoose 8 backend data contracts for v2.0 campaign, entitlement, barcode, recommendation, media, and feedback foundations
**Confidence:** HIGH for repo integration and schema/index guidance; MEDIUM for package provenance where package docs are npm README sources rather than Context7

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Raw redeem codes are shown only at generation/export time. The database stores hashed lookup material only, not raw reusable code values.
- **D-02:** QR payloads should use HTTPS redeem links, e.g. `https://.../redeem?code=...`, so printed bottles work as a fallback even when the app is not installed.
- **D-03:** Code entitlement expiry is based on `N` days after the user redeems the code, not a shared fixed campaign expiry.
- **D-04:** "Unlimited scan" is implemented as a very high daily quota while entitlement is active, not a truly unbounded bypass. Backend fair-use controls remain mandatory.
- **D-05:** Phase 1 should prepare entitlement metadata needed by Phase 2: `activeUntil`, link to campaign/code/redemption, quota policy fields, and scan-attempt audit fields that can identify entitlement-backed scans.
- **D-06:** Barcode results need product name, kcal, and protein/carbs/fat before the app lets the user save them as a food log. Missing macro data should trigger review/manual fallback rather than silent save.
- **D-07:** Add `FoodItem.barcodes` as an array of strings for local curated barcode lookup. Preserve leading zeros; barcodes must never be modeled as numbers.
- **D-08:** Store user Ủ milk preference in a separate `NutMilkPreference` model rather than only embedding the current value in `User.profile`, because history and analytics matter.
- **D-09:** Recommendation rules for Phase 1 should be static backend constants/type-safe config in code, not seeded database rows and not admin-editable.
- **D-10:** Preserve existing `Exercise.imageUrl` for mobile compatibility and add optional `Exercise.imageAssetId` for the future media library.
- **D-11:** `MediaAsset` should carry source/batchId/status/basic metadata. Phase 1 does not need a separate `MediaBatch` model yet.
- **D-12:** Store feedback prompt state in a separate `FeedbackPromptState` model instead of local-only mobile state or embedding it in `User.profile`.
- **D-13:** `AppRating` is primarily internal feedback. Native store review is optional and can be triggered only after positive internal feedback when platform rules allow.

### the agent's Discretion
- Choose exact model filenames, validation module names, and route scaffolding layout according to existing backend conventions.
- Choose exact TypeScript union names and DTO names, as long as they preserve the decisions above and remain clear for later phases.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CODE-11 | Backend stores redeem codes hashed at rest and redeems them atomically so the same code cannot be reused. | Use `RedeemCode.codeHash` unique lookup, server-side pepper, no raw code persistence, and a future `findOneAndUpdate`/transaction redemption path. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/phases/01-v2-data-foundation/01-CONTEXT.md`, Mongoose docs] |
</phase_requirements>

## Summary

Phase 1 should add backend contracts, not full workflows. The current backend already uses Mongoose models, Zod validation modules, domain routers, central route mounting in `backend/src/app.ts`, authenticated food routes, and admin-only `/api/admin` protection. [VERIFIED: codebase grep/read] The planner should create new models and route skeletons in those same locations, extend `FoodItem`, `Exercise`, `FoodScanAttempt`, and `User.profile` narrowly, and add integration tests around schema compatibility and the CODE-11 security contract. [VERIFIED: codebase grep/read]

The most important foundation is `RedeemCode`: raw codes must exist only in generation/export responses, while the database stores a normalized-code hash computed with a server-side pepper. [VERIFIED: CONTEXT.md] Phase 1 should provide the utility and model constraints for this now, while Phase 2 implements generation/export/redemption workflows. [VERIFIED: ROADMAP.md] Mongoose supports schema indexes and `findOneAndUpdate()` atomicity except for unindexed upsert cases, so a unique `codeHash` index plus a status-guarded update is the right primitive for later single-use redemption. [CITED: https://mongoosejs.com/docs/guide.html, https://mongoosejs.com/docs/tutorials/findoneandupdate.html]

**Primary recommendation:** Add data models, indexes, validation DTOs, typed API scaffolds, package dependencies, and tests for the contracts; do not implement campaign generation, QR export, barcode fallback calls, recommendation UI, rating prompt workflow, or media batch assignment in Phase 1. [VERIFIED: ROADMAP.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Redeem-code hashing and lookup | API / Backend | Database / Storage | Backend owns code normalization, peppered hash creation, raw-code redaction, and future atomic redemption; database enforces unique `codeHash`. [VERIFIED: CONTEXT.md; CITED: Mongoose docs] |
| Scan entitlement storage | API / Backend | Database / Storage | Backend must decide AI scan quota on each scan; mobile only displays status. [VERIFIED: `.planning/research/ARCHITECTURE.md`, `backend/src/api/food/food.service.ts`] |
| Barcode food lookup fields | API / Backend | Database / Storage | `FoodItem` remains the local authoritative search/cache shape and barcodes are string lookup keys. [VERIFIED: CONTEXT.md, `backend/src/models/FoodItem.ts`] |
| Nut-milk recommendation rules | API / Backend | Mobile client | Backend returns deterministic rules and persisted preferences; mobile renders them. [VERIFIED: CONTEXT.md] |
| Exercise media compatibility | API / Backend | Admin UI, Mobile client, Cloudinary | `Exercise.imageUrl` remains the compatibility field; `MediaAsset` and `imageAssetId` prepare admin bulk operations. [VERIFIED: CONTEXT.md, `backend/src/models/Exercise.ts`] |
| App rating and prompt state | API / Backend | Mobile client, Admin UI | Backend persists feedback and prompt state across reinstalls; mobile can still keep local cooldown UI state. [VERIFIED: CONTEXT.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `mongoose` | repo `^8.0.0` | Model schemas, indexes, refs, validation, and future transactions. | Existing backend standard; Mongoose docs support schema indexes and transaction helpers. [VERIFIED: `backend/package.json`; CITED: https://mongoosejs.com/docs/guide.html, https://mongoosejs.com/docs/transactions.html] |
| `zod` | repo `^3.24.0` | API input validation for new scaffolds. | Existing food/admin modules already use Zod validation near route/controller code. [VERIFIED: `backend/package.json`, `backend/src/api/food/food.validation.ts`] |
| Node `crypto` | Node built-in; local Node `v22.15.0` | Generate random codes and compute HMAC/sha256 lookup hashes. | Built-in secure randomness and hashing avoids adding an ID package. [VERIFIED: local environment; CITED: https://nodejs.org/api/crypto.html] |
| Express `Router` | repo `^5.1.0` | New `/api/campaigns`, `/api/recommendations`, `/api/ratings`, and admin route groups. | Existing app mounts modular routers in `app.ts`; Express documents `Router` as a modular route/middleware system. [VERIFIED: `backend/src/app.ts`; CITED: https://expressjs.com/en/guide/routing.html] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `qrcode` | `1.5.4` | QR generation for later admin export/preview. | Add to backend now only if Phase 2 needs QR generation utilities compiled and typed. [VERIFIED: npm registry + slopcheck npm OK; CITED: https://www.npmjs.com/package/qrcode] |
| `csv-parse` | `6.2.1` | CSV import parsing for later media/image mapping workflows. | Add to backend only if Phase 1 creates CSV helper scaffolds. [VERIFIED: npm registry + slopcheck npm OK; CITED: https://www.npmjs.com/package/csv] |
| `csv-stringify` | `6.7.0` | CSV export stringification for generated code exports. | Add to backend because CODE-03 downstream export should not hand-roll quoting/escaping. [VERIFIED: npm registry + slopcheck npm OK; CITED: https://www.npmjs.com/package/csv] |
| `archiver` | `8.0.0` | Optional ZIP streaming for QR image bundle export. | Do not add unless Phase 1 deliberately prepares ZIP export scaffolding; CSV is enough unless print operations require ZIPs. [VERIFIED: npm registry + slopcheck npm OK; CITED: https://www.npmjs.com/package/archiver] |
| `expo-store-review` | `56.0.3`; Expo bundled doc currently lists `~55.0.14` for latest docs page | Native store review prompt API for Phase 6. | Add to mobile with Expo-compatible install only if Phase 1 is responsible for package installation; internal `AppRating` remains backend-owned. [VERIFIED: npm registry + slopcheck npm OK; CITED: https://docs.expo.dev/versions/latest/sdk/storereview/] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node `crypto` | `nanoid` or UUID package | Extra dependency is unnecessary for code generation because Node already provides secure random bytes. [CITED: https://nodejs.org/api/crypto.html] |
| `csv-parse` / `csv-stringify` | Manual comma splitting | Manual CSV parsing breaks on quoting, commas, newlines, and encoding edge cases. [ASSUMED] |
| `archiver` | No ZIP support | Prefer no ZIP dependency unless QR image bundle export is a committed operational need. [VERIFIED: ROADMAP.md] |
| Backend recommendation constants | Rules engine | Five static product rules do not justify a rules engine. [VERIFIED: CONTEXT.md] |

**Installation:**
```bash
cd backend
npm install qrcode csv-parse csv-stringify
npm install -D @types/qrcode

# Only if QR image ZIP export is explicitly needed:
npm install archiver
npm install -D @types/archiver

cd ../mobile
npx expo install expo-store-review
```

**Version verification:** `npm view` on 2026-05-26 returned `qrcode@1.5.4`, `csv-parse@6.2.1`, `csv-stringify@6.7.0`, `archiver@8.0.0`, and `expo-store-review@56.0.3`. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `qrcode` | npm | created 2010-12-21; modified 2025-11-13 | 12,570,626 last week | `github.com/soldair/node-qrcode` | OK with `--ecosystem npm` | Approved for backend QR generation. [VERIFIED: npm registry + npm downloads API + slopcheck] |
| `csv-parse` | npm | created 2013-10-25; modified 2026-03-20 | 13,531,991 last week | `github.com/adaltas/node-csv` | OK with `--ecosystem npm` | Approved for backend CSV parsing. [VERIFIED: npm registry + npm downloads API + slopcheck] |
| `csv-stringify` | npm | created 2013-10-25; modified 2026-03-17 | 7,243,052 last week | `github.com/adaltas/node-csv` | OK with `--ecosystem npm` | Approved for backend CSV export. [VERIFIED: npm registry + npm downloads API + slopcheck] |
| `archiver` | npm | created 2012-10-09; modified 2026-05-08 | 27,541,765 last week | `github.com/archiverjs/node-archiver` | OK with `--ecosystem npm` | Conditional; add only if ZIP export is required. [VERIFIED: npm registry + npm downloads API + slopcheck] |
| `expo-store-review` | npm | created 2019-09-14; modified 2026-05-26 | 572,912 last week | `github.com/expo/expo` | OK with `--ecosystem npm` | Approved for mobile store-review support when installed with Expo. [VERIFIED: npm registry + npm downloads API + slopcheck; CITED: Expo docs] |

**Packages removed due to slopcheck [SLOP] verdict:** none when forced to npm ecosystem. [VERIFIED: slopcheck]
**Packages flagged as suspicious [SUS]:** none when forced to npm ecosystem. [VERIFIED: slopcheck]

Note: an initial `slopcheck install` without `--ecosystem npm` checked PyPI and produced false ecosystem results for npm packages; planner must use `python -m slopcheck install --ecosystem npm ...` for JavaScript packages. [VERIFIED: local command output]

## Architecture Patterns

### System Architecture Diagram

```text
Admin Dashboard
  -> /api/admin/campaigns/* scaffolds
  -> /api/admin/media-assets/* scaffolds
  -> /api/admin/ratings
       |
       v
Express API modules
  campaigns -> Campaign + RedeemCode + UserScanEntitlement
  food      -> FoodItem barcode fields + FoodScanAttempt entitlement metadata
  recommendations -> static nut-milk rules + NutMilkPreference
  ratings   -> AppRating + FeedbackPromptState
  admin/media -> MediaAsset + Exercise.imageAssetId + imageUrl compatibility
       |
       v
MongoDB/Mongoose indexes enforce lookup and query contracts

Mobile App
  -> existing /api/food/scan remains the only AI scan path
  -> future /api/campaigns/redeem displays entitlement returned by backend
  -> future /api/recommendations/nut-milk renders backend rules
```

### Recommended Project Structure

```text
backend/src/
├── models/
│   ├── Campaign.ts
│   ├── RedeemCode.ts
│   ├── UserScanEntitlement.ts
│   ├── NutMilkPreference.ts
│   ├── AppRating.ts
│   ├── FeedbackPromptState.ts
│   └── MediaAsset.ts
├── api/
│   ├── campaigns/          # user redeem/status scaffolds
│   ├── recommendations/    # static nut-milk rules + selection scaffolds
│   ├── ratings/            # user rating/status scaffolds
│   ├── media-assets/       # optional admin controller/service if not kept in admin
│   └── food/               # barcode validation/route additions
└── services/
    └── redeem-code.service.ts # normalize/hash/generate utilities
```

Use the existing `*.routes.ts`, `*.controller.ts`, `*.service.ts`, and `*.validation.ts` convention where a module has routes; pure static rule helpers can live beside the module service. [VERIFIED: codebase grep/read]

### Pattern 1: Redeem-Code Hash Contract

**What:** Normalize user/admin code strings, hash normalized code material with a server-only pepper, store only `codeHash`, and return raw code only from generation/export responses. [VERIFIED: CONTEXT.md]

**When to use:** Every `RedeemCode` insert and every future redemption lookup. [VERIFIED: CONTEXT.md]

**Example:**
```typescript
// Source: Node crypto docs + Phase 1 CONTEXT.md
import { createHmac, timingSafeEqual } from 'node:crypto';

export function normalizeRedeemCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function hashRedeemCode(input: string, pepper: string): string {
  return createHmac('sha256', pepper)
    .update(normalizeRedeemCode(input), 'utf8')
    .digest('hex');
}
```

Use HMAC-SHA-256 rather than plain `sha256(code + pepper)` so the pepper is a key rather than string concatenation material. [ASSUMED]

### Pattern 2: Model Indexes Live With Schemas

**What:** Define query-critical indexes in each Mongoose schema using `schema.index(...)`. [CITED: https://mongoosejs.com/docs/guide.html]

**When to use:** Every new model in Phase 1; do not leave admin filters, entitlement lookup, or `codeHash` lookup unindexed. [VERIFIED: ROADMAP.md]

**Example:**
```typescript
// Source: Mongoose schema index docs
RedeemCodeSchema.index({ codeHash: 1 }, { unique: true });
RedeemCodeSchema.index({ campaignId: 1, status: 1, createdAt: -1 });
UserScanEntitlementSchema.index({ userId: 1, type: 1, activeUntil: -1 });
```

### Pattern 3: Route Scaffolds Should Return 501 or Minimal Contract Responses

**What:** Create modules and route mounts with validation schemas and controller placeholders, but avoid implementing workflows scheduled for later phases. [VERIFIED: ROADMAP.md]

**When to use:** Campaign, barcode, recommendation, rating, and media route scaffolds. [VERIFIED: ROADMAP.md]

**Example:**
```typescript
// Source: existing Express Router pattern in backend/src/api/food/food.routes.ts
const router = Router();
router.post('/redeem', authenticate, redeemCampaignCode);
router.get('/me/entitlements', authenticate, getMyEntitlements);
export default router;
```

## Proposed Model Shapes and Critical Indexes

### `Campaign`

Fields: `name`, `description`, `status: 'draft' | 'active' | 'paused' | 'ended' | 'revoked'`, `startsAt`, `endsAt`, `entitlementDurationDays`, `highQuotaDailyLimit`, `createdBy`, `codeCount`, `redeemedCount`, timestamps. [VERIFIED: ROADMAP.md, CONTEXT.md]

Indexes:
- `{ status: 1, startsAt: 1, endsAt: 1 }` for active/admin filters. [ASSUMED]
- `{ createdAt: -1 }` for admin list sorting. [VERIFIED: existing admin list pattern]

### `RedeemCode`

Fields: `campaignId`, `batchId`, `codeHash`, `codePrefix`, `codeLength`, `status: 'unused' | 'redeemed' | 'revoked' | 'expired'`, `expiresAt`, `redeemedBy`, `redeemedAt`, `redemptionSource: 'manual' | 'qr'`, `createdBy`, timestamps. [VERIFIED: CONTEXT.md]

Indexes:
- `{ codeHash: 1 }` unique. [VERIFIED: CODE-11; CITED: Mongoose index docs]
- `{ campaignId: 1, status: 1, createdAt: -1 }` for admin search/filter. [VERIFIED: ROADMAP.md]
- `{ batchId: 1, createdAt: -1 }` for export/reprint batch support. [VERIFIED: ROADMAP.md]
- `{ redeemedBy: 1, redeemedAt: -1 }` for support views. [VERIFIED: REQUIREMENTS.md CODE-04]

Raw code rule: no `code`, `rawCode`, `plainCode`, `qrRawCode`, or reusable plaintext field should exist in this schema. [VERIFIED: CONTEXT.md]

### `UserScanEntitlement`

Fields: `userId`, `campaignId`, `redeemCodeId`, `type: 'ai_scan_high_quota'`, `startsAt`, `activeUntil`, `quotaPolicy: { mode: 'high_daily_quota', dailyLimit: number }`, `source: 'redeem_code'`, `createdAt`. [VERIFIED: CONTEXT.md]

Indexes:
- `{ userId: 1, type: 1, activeUntil: -1 }` for `resolveScanAccess`. [VERIFIED: ARCHITECTURE.md]
- `{ redeemCodeId: 1 }` unique to prevent duplicate entitlement for one code. [VERIFIED: CODE-11]
- `{ campaignId: 1, createdAt: -1 }` for campaign reporting. [VERIFIED: REQUIREMENTS.md]

Relationship to `FoodScanAttempt`: extend `FoodScanAttempt` with `source: 'daily_quota' | 'redeem_entitlement'`, `entitlementId?: ObjectId`, and optionally `quotaMode?: 'standard' | 'high_quota'`. [VERIFIED: CONTEXT.md, `backend/src/models/FoodScanAttempt.ts`] Keep the existing 7-day TTL for quota counting unless analytics requires a separate durable event model. [VERIFIED: `backend/src/models/FoodScanAttempt.ts`]

### `FoodItem` Barcode Extension

Add fields: `barcodes: string[]`, `brand?: string`, `servingSizeG?: number`, `packageSize?: string`, `barcodeSource?: 'manual' | 'open_food_facts' | 'admin_import'`, `barcodeLastVerifiedAt?: Date`. [VERIFIED: CONTEXT.md]

Indexes:
- `{ barcodes: 1 }` sparse/non-unique unless product confirms all products have globally unique local package codes. [ASSUMED]
- Update text index to include `brand` while preserving `default_language: 'none'` for Vietnamese text behavior. [VERIFIED: `backend/src/models/FoodItem.ts`]

Minimum nutrition rule: barcode-save validation must require product name, kcal, protein, carbs, and fat; missing macro data should force manual review/fallback. [VERIFIED: CONTEXT.md]

### `NutMilkPreference`

Fields: `userId`, `recommendedFlavorId`, `selectedFlavorId`, `bmiRecordId?`, `bmi?`, `bmiCategory?`, `signals: { stressOrSleep?: boolean; skippingBreakfast?: boolean }`, `source: 'bmi_recommendation' | 'manual_profile'`, timestamps. [VERIFIED: CONTEXT.md]

Indexes:
- `{ userId: 1, updatedAt: -1 }` for latest preference reads. [VERIFIED: CONTEXT.md]
- `{ selectedFlavorId: 1, createdAt: -1 }` for future analytics. [VERIFIED: CONTEXT.md]

Static backend rules source: create a typed constant such as `NUT_MILK_RULES` with stable ASCII `flavorId` values and Vietnamese display/copy keys. [VERIFIED: CONTEXT.md] Do not seed rules into MongoDB in Phase 1. [VERIFIED: CONTEXT.md]

### `MediaAsset`

Fields: `type: 'exercise_image' | 'food_image' | 'campaign_qr'`, `url`, `secureUrl?`, `publicId`, `folder`, `filename`, `batchId?`, `status: 'uploaded' | 'assigned' | 'failed' | 'archived'`, `metadata: { width?: number; height?: number; bytes?: number; format?: string; mimeType?: string }`, `uploadedBy`, `usageCount`, timestamps. [VERIFIED: CONTEXT.md]

Indexes:
- `{ type: 1, status: 1, createdAt: -1 }` for admin queues. [VERIFIED: ROADMAP.md]
- `{ batchId: 1, createdAt: -1 }` for batch audit. [VERIFIED: CONTEXT.md]
- `{ publicId: 1 }` unique for Cloudinary identity. [VERIFIED: `.planning/research/PITFALLS.md`]

`Exercise` compatibility: add `imageAssetId?: ObjectId` and leave `imageUrl: string | null` unchanged in backend, mobile, and admin types. [VERIFIED: CONTEXT.md, `backend/src/models/Exercise.ts`, `mobile/src/lib/api/types.ts`, `admin/src/features/exercises/useExercises.ts`]

### `AppRating`

Fields: `userId`, `stars: 1 | 2 | 3 | 4 | 5`, `comment?`, `trigger: 'food_scan' | 'barcode_scan' | 'bmi_recommendation' | 'workout_complete' | 'habit' | 'profile'`, `appVersion?`, `platform?: 'ios' | 'android'`, `deviceInfo?`, timestamps. [VERIFIED: REQUIREMENTS.md RATE-02/RATE-04]

Indexes:
- `{ userId: 1, createdAt: -1 }` for user history/status. [VERIFIED: REQUIREMENTS.md RATE-03]
- `{ stars: 1, createdAt: -1 }` for admin filter. [VERIFIED: REQUIREMENTS.md RATE-04]
- `{ trigger: 1, createdAt: -1 }` for feature-context review. [VERIFIED: REQUIREMENTS.md RATE-04]

### `FeedbackPromptState`

Fields: `userId`, `promptKey: 'app_rating'`, `status: 'eligible' | 'dismissed' | 'submitted' | 'cooldown'`, `lastPromptedAt?`, `dismissedAt?`, `submittedAt?`, `cooldownUntil?`, `triggerCounts?: Record<string, number>`, timestamps. [VERIFIED: CONTEXT.md]

Indexes:
- `{ userId: 1, promptKey: 1 }` unique. [VERIFIED: CONTEXT.md]
- `{ cooldownUntil: 1 }` for future prompt eligibility jobs. [ASSUMED]

## API Scaffolding Modules and Routes

Create these route files and mount points without full workflow implementation. [VERIFIED: ROADMAP.md]

| Module | Mount | Scaffolds |
|--------|-------|-----------|
| `campaigns` | `/api/campaigns` | `POST /redeem`, `GET /me/entitlements`; validate code string and return placeholder/501 until Phase 2. [VERIFIED: ROADMAP.md] |
| admin campaigns | `/api/admin/campaigns` or nested in existing admin router | `GET /`, `POST /`, `POST /:id/codes/generate`, `GET /:id/codes`, `GET /:id/codes/export.csv`; Phase 1 can expose only route skeletons and validation exports. [VERIFIED: ROADMAP.md] |
| barcode | `/api/food/items/barcode/:barcode` | Add validation schema and controller placeholder; keep existing `/api/food/items?q=` search compatible. [VERIFIED: `backend/src/api/food/food.routes.ts`] |
| recommendations | `/api/recommendations` | `GET /nut-milk`, `POST /nut-milk/selection`; service should expose static rule function now. [VERIFIED: CONTEXT.md] |
| ratings | `/api/ratings` | `GET /status`, `POST /`; admin `GET /api/admin/ratings`. [VERIFIED: REQUIREMENTS.md] |
| media assets | `/api/admin/media-assets` | `GET /`, `POST /upload`, `PATCH /:id`, `DELETE /:id`; Phase 1 should create model/validation and route mount, not full batch workflow. [VERIFIED: ROADMAP.md] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR encoding | Custom QR matrix generation | `qrcode` | QR encoding has format/version/error-correction details. [VERIFIED: npm package docs] |
| CSV export/import | Manual `split(',')` or string concatenation | `csv-parse` / `csv-stringify` | CSV quoting and embedded delimiters are easy to mishandle. [ASSUMED] |
| ZIP streaming | Buffering all files into memory | `archiver` if ZIP export is required | QR/image ZIP export can be streamed rather than held in memory. [CITED: https://www.npmjs.com/package/archiver] |
| Redeem-code randomness | `Math.random()` or sequential counters | Node `crypto.randomBytes` | Redeem codes are bearer credentials for paid AI usage. [CITED: https://nodejs.org/api/crypto.html; VERIFIED: PITFALLS.md] |
| Store review prompt | Custom native bridge | `expo-store-review` | Expo provides a library over Android/iOS native review APIs. [CITED: https://docs.expo.dev/versions/latest/sdk/storereview/] |

**Key insight:** Phase 1 should hand-roll only app-specific contracts and deterministic product rules; commodity encoding/parsing/review primitives should use maintained packages. [VERIFIED: STACK.md]

## Common Pitfalls

### Pitfall 1: Plaintext Redeem Codes Leak Through Schema or Logs

**What goes wrong:** A future admin list, error object, request log, or model field stores/reveals reusable raw codes. [VERIFIED: PITFALLS.md]
**Why it happens:** Campaign codes are treated like marketing coupon strings instead of bearer credentials. [VERIFIED: PITFALLS.md]
**How to avoid:** Model only `codeHash`, `codePrefix`, and metadata; add tests that serialized `RedeemCode` documents never contain raw code fields. [VERIFIED: CONTEXT.md]
**Warning signs:** Fields named `code`, `rawCode`, `plainCode`, or route responses returning persisted code values outside generation/export. [VERIFIED: CONTEXT.md]

### Pitfall 2: Entitlement Metadata Does Not Connect to Scan Attempts

**What goes wrong:** Phase 2 can unlock scans but cannot audit which AI calls used entitlement quota. [VERIFIED: CONTEXT.md]
**Why it happens:** `FoodScanAttempt` currently stores only `userId` and timestamps. [VERIFIED: `backend/src/models/FoodScanAttempt.ts`]
**How to avoid:** Add optional `entitlementId` and `source` now while keeping existing daily counting behavior intact. [VERIFIED: CONTEXT.md]
**Warning signs:** `recordScanAttempt(userId)` remains the only API shape and no source field exists. [VERIFIED: `backend/src/api/food/food.service.ts`]

### Pitfall 3: Barcode Fields Break Existing Search or Mobile Types

**What goes wrong:** `FoodItem` changes force mobile/admin updates before barcode UI exists. [VERIFIED: codebase read]
**Why it happens:** Required fields are added too aggressively or barcode stored as number. [VERIFIED: CONTEXT.md]
**How to avoid:** Add optional `barcodes: string[]` with default `[]`; preserve existing nutrition fields and `source` behavior. [VERIFIED: `backend/src/models/FoodItem.ts`]
**Warning signs:** Migration requires all old FoodItems to have barcode/brand/package data. [ASSUMED]

### Pitfall 4: `Exercise.imageUrl` Compatibility Is Lost

**What goes wrong:** Existing mobile and admin screens stop rendering exercise images. [VERIFIED: `mobile/src/lib/api/types.ts`, `admin/src/features/exercises/useExercises.ts`]
**Why it happens:** A media ref replaces the denormalized URL instead of supplementing it. [VERIFIED: CONTEXT.md]
**How to avoid:** Add `imageAssetId` only; admin writes both asset ref and `imageUrl` in later phases. [VERIFIED: CONTEXT.md]
**Warning signs:** Type changes remove or require non-null `imageUrl`. [VERIFIED: codebase read]

### Pitfall 5: Phase 1 Accidentally Implements Later Workflows

**What goes wrong:** Planner expands scope into full campaign admin, redemption, barcode provider calls, rating prompt UX, or media assignment UI. [VERIFIED: ROADMAP.md]
**Why it happens:** Scaffolding and models are close to implementation. [ASSUMED]
**How to avoid:** Mark route skeletons as contract placeholders and write tests for model/validation contracts only. [VERIFIED: ROADMAP.md]
**Warning signs:** Phase 1 tasks include QR ZIP download UI, barcode camera screens, or campaign CRUD pages. [VERIFIED: ROADMAP.md]

## Code Examples

### Atomic Redemption Primitive for Phase 2

```typescript
// Source: Mongoose findOneAndUpdate docs + CODE-11 contract
const redeemed = await RedeemCode.findOneAndUpdate(
  { codeHash, status: 'unused', expiresAt: { $gt: now } },
  { $set: { status: 'redeemed', redeemedBy: userId, redeemedAt: now } },
  { new: true, runValidators: true },
);
```

`findOneAndUpdate()` is atomic except for unindexed upserts, so the query must use an indexed `codeHash` and must not be an upsert. [CITED: https://mongoosejs.com/docs/tutorials/findoneandupdate.html]

### Barcode Validation Shape

```typescript
// Source: existing Zod validation style in backend/src/api/food/food.validation.ts
export const barcodeParamSchema = z.object({
  barcode: z.string().regex(/^\d{6,18}$/, 'Mã vạch không hợp lệ'),
});

export const barcodeSaveMinimumNutritionSchema = z.object({
  name: z.string().min(1),
  kcalPer100g: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});
```

### Static Nut-Milk Rule Shape

```typescript
// Source: Phase 4 ROADMAP milk rule baseline + CONTEXT.md D-09
export const NUT_MILK_FLAVORS = [
  { flavorId: 'rau_ma_sua_dua', bmiRule: 'gt_23' },
  { flavorId: 'rau_ma_hat_sen', bmiRule: 'any', need: 'stress_sleep' },
  { flavorId: 'gao_lut_me_den_hat_sen', bmiRule: 'range_18_5_22_9' },
  { flavorId: 'gao_lut_oc_cho_hanh_nhan', bmiRule: 'lt_18_5' },
  { flavorId: 'hat_sen_oc_cho', bmiRule: 'any', need: 'energy_memory' },
] as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client/local-only unlock state | Backend-owned entitlement records checked during scans | Locked in v2.0 context on 2026-05-26 | Prevents tampering/reinstall bypass and centralizes AI cost controls. [VERIFIED: CONTEXT.md] |
| Plaintext campaign coupon storage | Hash-only redeem-code lookup with one-time raw export | Locked in v2.0 context on 2026-05-26 | Reduces blast radius if database/admin lists leak. [VERIFIED: CONTEXT.md] |
| Single exercise `imageUrl` only | `imageUrl` compatibility plus optional `imageAssetId` | Locked in v2.0 context on 2026-05-26 | Enables future media library without breaking mobile. [VERIFIED: CONTEXT.md] |
| Client-side milk rules | Static backend rules | Locked in v2.0 context on 2026-05-26 | Prevents rule drift across app versions. [VERIFIED: CONTEXT.md] |

**Deprecated/outdated:**
- Treating `expo-store-review` as a custom feedback form is wrong; Expo docs describe it as access to native in-app review APIs, while app comments need backend `AppRating`. [CITED: https://docs.expo.dev/versions/latest/sdk/storereview/]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | HMAC-SHA-256 is preferable to plain `sha256(code + pepper)`. | Architecture Patterns | Low; either can meet hash-at-rest if pepper is secret, but HMAC is cleaner. |
| A2 | Manual CSV parsing will mishandle quoting/newlines. | Alternatives / Don't Hand-Roll | Medium; a naive export could corrupt print-vendor files. |
| A3 | `FoodItem.barcodes` should be sparse/non-unique until product confirms uniqueness policy. | Model Shapes | Medium; duplicate barcode data may require admin cleanup policy. |
| A4 | `FeedbackPromptState.cooldownUntil` index may be useful for future jobs. | Model Shapes | Low; harmless but can be omitted if no background jobs are planned. |
| A5 | Adding optional fields with defaults will not require old-document migration. | Pitfalls | Low; Mongoose defaults apply on new docs, but old docs may need read-path defaults. |

## Open Questions (RESOLVED)

1. **Redeem-code pepper env name**
   - What we know: hashing must use server-only pepper and no raw code storage. [VERIFIED: CONTEXT.md]
   - Resolution: use `REDEEM_CODE_PEPPER` as the canonical env var name. Phase 1 should add this to env config/example files and tests should set a deterministic test value.
   - Rotation policy: rotation is out of scope for Phase 1. The Phase 1 contract should make pepper use centralized so a future rotation strategy can be added without changing call sites.

2. **ZIP export dependency**
   - What we know: ZIP export is optional only if needed. [VERIFIED: ROADMAP.md]
   - Resolution: do not install `archiver` in Phase 1. CSV export scaffolding is enough for the foundation; Phase 2 can add `archiver` only if print operations explicitly require QR image ZIPs.
   - Planner instruction: package additions for Phase 1 should include `qrcode`, `csv-parse`, `csv-stringify`, `@types/qrcode`, and `expo-store-review`; `archiver` remains a documented future conditional dependency.

3. **BMI 23.0 boundary**
   - What we know: Phase 4 baseline says BMI `18.5-22.9` and `> 23`. [VERIFIED: ROADMAP.md]
   - Resolution: Phase 1 static rule config should encode explicit ranges and tests that preserve the current product wording: normal recommendation applies through `22.9`; Rau má sữa dừa applies only for values strictly greater than `23`. BMI `23.0` should not be silently rounded into either side without a named boundary test.
   - Planner instruction: Phase 1 may include a TODO/comment that Phase 4 must get product/legal signoff on the exact Vietnamese copy and display behavior for BMI `23.0`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Backend/mobile/admin package scripts | yes | `v22.15.0` | Project engines require `>=20.0.0`; current version satisfies. [VERIFIED: local command + `backend/package.json`] |
| npm | Package verification/install | yes | `10.9.2` | none needed. [VERIFIED: local command] |
| Python | slopcheck CLI module execution | yes | `3.13.13` | use npm registry checks if slopcheck cannot run. [VERIFIED: local command] |
| slopcheck | package legitimacy gate | yes via `python -m slopcheck` | `0.6.1` | use `--ecosystem npm`; executable is not on PATH. [VERIFIED: local command] |
| Context7 CLI | documentation lookup | no | — | Used official docs/web and repo inspection. [VERIFIED: local command] |

**Missing dependencies with no fallback:** none for research. [VERIFIED: local command]

**Missing dependencies with fallback:** Context7 CLI missing; official docs and repo inspection were used. [VERIFIED: local command]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner with `tsx/cjs`, `supertest`, and `mongodb-memory-server`. [VERIFIED: `backend/package.json`, test files] |
| Config file | none; commands are package scripts. [VERIFIED: `backend/package.json`] |
| Quick run command | `cd backend && npm run typecheck && npm run test:food` [VERIFIED: `backend/package.json`] |
| Full suite command | run backend listed `test:*` scripts plus `npm run typecheck`; there is no aggregate `test` script. [VERIFIED: `backend/package.json`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CODE-11 | `RedeemCode` stores `codeHash` and no raw reusable code field. | unit/model | `node --env-file=.env.test --require tsx/cjs --test src/models/RedeemCode.test.ts` | no, Wave 0 |
| CODE-11 | duplicate `codeHash` violates unique index. | integration/model | `node --env-file=.env.test --require tsx/cjs --test src/models/RedeemCode.test.ts` | no, Wave 0 |
| CODE-11 | hash utility normalizes hyphens/spaces/case consistently and never returns raw input. | unit | `node --env-file=.env.test --require tsx/cjs --test src/services/redeem-code.service.test.ts` | no, Wave 0 |
| CODE-11 | future redemption primitive can use `findOneAndUpdate` with `status: 'unused'`. | unit/service | `node --env-file=.env.test --require tsx/cjs --test src/api/campaigns/campaigns.integration.test.ts` | no, Wave 0 |

### Sampling Rate

- **Per task commit:** `cd backend && npm run typecheck`
- **Per wave merge:** `cd backend && npm run typecheck && npm run test:food && npm run test:admin`
- **Phase gate:** all new Phase 1 tests plus existing backend typecheck and affected `test:food`/`test:admin` scripts pass.

### Wave 0 Gaps

- [ ] `backend/src/models/RedeemCode.test.ts` — covers CODE-11 storage/index contract.
- [ ] `backend/src/services/redeem-code.service.test.ts` — covers normalization and hashing.
- [ ] `backend/src/api/campaigns/campaigns.integration.test.ts` — covers route scaffold auth/validation behavior if routes are mounted.
- [ ] `backend/src/models/v2-data-foundation.test.ts` or separate model tests — covers `Campaign`, `UserScanEntitlement`, `MediaAsset`, `AppRating`, `FeedbackPromptState`, and `NutMilkPreference` required fields/index declarations.
- [ ] Extend `backend/src/api/food/food.integration.test.ts` — covers barcode route validation and `FoodScanAttempt` metadata compatibility.
- [ ] Extend `backend/src/api/admin/admin.integration.test.ts` — covers admin route guard still applies to campaign/media/rating scaffolds.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing JWT `authenticate` middleware on user routes and `requireAdmin` on admin routes. [VERIFIED: `backend/src/api/food/food.routes.ts`, `backend/src/api/admin/admin.routes.ts`] |
| V3 Session Management | no direct new session work | Keep existing JWT/session behavior unchanged. [VERIFIED: codebase read] |
| V4 Access Control | yes | User endpoints use JWT user id; admin scaffolds must stay behind `/api/admin` guard. [VERIFIED: codebase read] |
| V5 Input Validation | yes | Zod schemas for code, barcode, ratings, media metadata, and campaign DTOs. [VERIFIED: existing validation pattern] |
| V6 Cryptography | yes | Node `crypto` HMAC/hash and random bytes; never custom crypto. [CITED: https://nodejs.org/api/crypto.html] |
| V8 Data Protection | yes | No raw redeem code persistence; redact code values from logs/errors. [VERIFIED: CONTEXT.md, PITFALLS.md] |

### Known Threat Patterns for Express/Mongoose v2 Foundation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Redeem-code brute force | Elevation of privilege / Resource consumption | High-entropy codes, `codeHash` lookup, rate limits in Phase 2, generic errors. [VERIFIED: PITFALLS.md; CITED: OWASP API4] |
| Duplicate redemption race | Tampering | Unique `codeHash`, status-guarded `findOneAndUpdate`, optional transaction. [CITED: Mongoose findOneAndUpdate/transactions docs] |
| AI cost overrun from entitlement | Denial of service / Resource consumption | High daily quota policy, source telemetry, fair-use controls in Phase 2. [VERIFIED: CONTEXT.md; CITED: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/] |
| IDOR in admin/media/rating lists | Information disclosure | Use existing `authenticate` and `requireAdmin` route guards. [VERIFIED: `backend/src/api/admin/admin.routes.ts`] |
| Raw code leakage in logs | Information disclosure | Never log request `code`; log hash prefix/batch only. [VERIFIED: PITFALLS.md] |

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — v2.0 project context and stack.
- `.planning/REQUIREMENTS.md` — CODE-11 and downstream v2 requirement IDs.
- `.planning/ROADMAP.md` — Phase 1 boundary and success criteria.
- `.planning/phases/01-v2-data-foundation/01-CONTEXT.md` — locked implementation decisions.
- `.planning/research/SUMMARY.md`, `STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` — synthesized v2 guidance.
- Repo files read: `FoodScanAttempt.ts`, `FoodItem.ts`, `Exercise.ts`, `User.ts`, `food.service.ts`, `food.routes.ts`, `food.validation.ts`, `admin.routes.ts`, `admin.service.ts`, `app.ts`, `mobile/src/lib/api/food.api.ts`, `mobile/src/lib/api/types.ts`, `admin/src/features/exercises/useExercises.ts`.
- Mongoose docs — schema indexes, `findOneAndUpdate`, transactions: https://mongoosejs.com/docs/guide.html, https://mongoosejs.com/docs/tutorials/findoneandupdate.html, https://mongoosejs.com/docs/transactions.html
- Express routing docs — Router pattern: https://expressjs.com/en/guide/routing.html
- Node crypto docs — random/hash primitives: https://nodejs.org/api/crypto.html
- Expo StoreReview docs — native store review API package: https://docs.expo.dev/versions/latest/sdk/storereview/
- OWASP API4:2023 — resource consumption/cost control: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/

### Secondary (MEDIUM confidence)
- npm registry/package docs for `qrcode`, `csv`, `archiver`, `expo-store-review` plus npm downloads API and slopcheck npm audit.
- Existing planning research package guidance in `.planning/research/STACK.md`.

### Tertiary (LOW confidence)
- Assumptions listed in `## Assumptions Log`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — current repo stack was verified locally and package versions were checked with npm/slopcheck.
- Architecture: HIGH — model and route guidance follows existing repo conventions and locked CONTEXT.md decisions.
- Pitfalls: HIGH — security/cost/data-quality risks are documented in project research and supported by OWASP/API and official docs.
- Package additions: MEDIUM-HIGH — npm/slopcheck checks passed, but `archiver` remains conditional and package docs for some packages are npm README sources.

**Research date:** 2026-05-26
**Valid until:** 2026-06-25 for model/API guidance; package versions should be rechecked before install.
