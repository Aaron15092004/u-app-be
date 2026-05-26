# Phase 1: v2 Data Foundation - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the shared backend data foundation for v2.0: models, indexes, validation contracts, route scaffolds, typed API contracts, and backward-compatible schema extensions for campaign redeem codes, scan entitlements, barcode food lookup, Ủ milk preference, exercise media assets, and app feedback. It does not implement the full admin/mobile workflows for those features; later phases build on these contracts.

</domain>

<decisions>
## Implementation Decisions

### Redeem Code Foundation
- **D-01:** Raw redeem codes are shown only at generation/export time. The database stores hashed lookup material only, not raw reusable code values.
- **D-02:** QR payloads should use HTTPS redeem links, e.g. `https://.../redeem?code=...`, so printed bottles work as a fallback even when the app is not installed.
- **D-03:** Code entitlement expiry is based on `N` days after the user redeems the code, not a shared fixed campaign expiry.

### Entitlement & Scan Attempt Model
- **D-04:** "Unlimited scan" is implemented as a very high daily quota while entitlement is active, not a truly unbounded bypass. Backend fair-use controls remain mandatory.
- **D-05:** Phase 1 should prepare entitlement metadata needed by Phase 2: `activeUntil`, link to campaign/code/redemption, quota policy fields, and scan-attempt audit fields that can identify entitlement-backed scans.

### Barcode Data Shape
- **D-06:** Barcode results need product name, kcal, and protein/carbs/fat before the app lets the user save them as a food log. Missing macro data should trigger review/manual fallback rather than silent save.
- **D-07:** Add `FoodItem.barcodes` as an array of strings for local curated barcode lookup. Preserve leading zeros; barcodes must never be modeled as numbers.

### Ủ Milk Preference Storage
- **D-08:** Store user Ủ milk preference in a separate `NutMilkPreference` model rather than only embedding the current value in `User.profile`, because history and analytics matter.
- **D-09:** Recommendation rules for Phase 1 should be static backend constants/type-safe config in code, not seeded database rows and not admin-editable.

### Media Asset Foundation
- **D-10:** Preserve existing `Exercise.imageUrl` for mobile compatibility and add optional `Exercise.imageAssetId` for the future media library.
- **D-11:** `MediaAsset` should carry source/batchId/status/basic metadata. Phase 1 does not need a separate `MediaBatch` model yet.

### Rating/Feedback Foundation
- **D-12:** Store feedback prompt state in a separate `FeedbackPromptState` model instead of local-only mobile state or embedding it in `User.profile`.
- **D-13:** `AppRating` is primarily internal feedback. Native store review is optional and can be triggered only after positive internal feedback when platform rules allow.

### the agent's Discretion
- Choose exact model filenames, validation module names, and route scaffolding layout according to existing backend conventions.
- Choose exact TypeScript union names and DTO names, as long as they preserve the decisions above and remain clear for later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/PROJECT.md` — Current milestone v2.0 goals and project-level context.
- `.planning/REQUIREMENTS.md` — v2.0 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 1 boundary, success criteria, and downstream phase dependencies.

### v2.0 Research
- `.planning/research/SUMMARY.md` — Synthesized v2.0 stack, feature, architecture, pitfall, and build-order guidance.
- `.planning/research/STACK.md` — Package and stack additions; what not to add.
- `.planning/research/ARCHITECTURE.md` — Proposed models, APIs, integration points, and build order.
- `.planning/research/PITFALLS.md` — Security, abuse, cost-control, barcode, health-claim, and media workflow risks.

### Existing Backend Patterns
- `backend/src/models/FoodScanAttempt.ts` — Current scan attempt model and TTL/index pattern.
- `backend/src/models/FoodItem.ts` — Existing food item schema, text index, and nutrition fields.
- `backend/src/models/Exercise.ts` — Existing exercise schema and `imageUrl` compatibility requirement.
- `backend/src/models/User.ts` — Existing profile/notification embedding pattern.
- `backend/src/api/food/food.service.ts` — Current food scan quota and search patterns.
- `backend/src/api/food/food.routes.ts` — Current authenticated food API route structure.
- `backend/src/api/food/food.validation.ts` — Current Zod validation style.
- `backend/src/api/admin/admin.routes.ts` — Current admin route protection and CRUD route conventions.
- `backend/src/api/admin/admin.service.ts` — Current admin pagination/upload/service patterns.
- `backend/src/app.ts` — Central API router mount points.

### Existing Client/Admin Contracts
- `mobile/src/lib/api/food.api.ts` — Current mobile food API client shape.
- `mobile/src/lib/api/types.ts` — Current shared mobile API type declarations.
- `admin/src/features/exercises/useExercises.ts` — Current admin TanStack Query hook convention.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FoodScanAttempt` already provides a user/date scan-count foundation; Phase 1 can extend or prepare related audit fields for entitlement-backed scans.
- `FoodItem` already holds nutrition fields and Vietnamese text search; barcode fields should extend it without disrupting manual food search.
- `Exercise.imageUrl` is already used by mobile/admin contracts; adding `imageAssetId` must be backward-compatible.
- Admin upload already flows through `POST /api/admin/upload` and `cloudinary.service`; media asset foundations should reuse that path.

### Established Patterns
- Backend feature modules use `*.routes.ts`, `*.controller.ts`, `*.service.ts`, and `*.validation.ts`.
- Authenticated user routes mount under `/api/<domain>`; admin routes mount under `/api/admin` and use `router.use(authenticate, requireAdmin)`.
- Validation uses Zod schemas near the API module.
- MongoDB/Mongoose models use schema indexes for common queries and lean queries for admin list endpoints.
- Mobile and admin clients use typed API helper modules plus TanStack Query cache invalidation.

### Integration Points
- `/api/food/scan` will later need entitlement-aware quota resolution; Phase 1 should not create a parallel scan path.
- `/api/admin` will later need campaign, code, media, and feedback admin route groups.
- `/api/food/items` will later need barcode lookup support while preserving existing search behavior.
- Existing BMI/user profile flows will later consume `NutMilkPreference` and static backend recommendation rules.

</code_context>

<specifics>
## Specific Ideas

- The v2.0 bottle campaign should support QR printed on milk bottles and manual code entry.
- The phrase "unlimited scan" is a product promise, but implementation should remain cost-controlled by a very high backend quota during entitlement.
- Barcode save quality should be stricter than name-only: product name plus kcal plus protein/carbs/fat are required.
- Ủ milk preference needs history/analytics, so a separate model is worth the extra schema.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-v2 Data Foundation*
*Context gathered: 2026-05-26*
