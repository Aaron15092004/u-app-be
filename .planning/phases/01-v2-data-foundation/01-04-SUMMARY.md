---
phase: 01-v2-data-foundation
plan: 04
subsystem: client-contracts
tags: [mobile-types, admin-types, v2-contracts, campaign-codes, barcode, recommendations, ratings, media-assets]
requires:
  - phase: 01-v2-data-foundation/01-03
    provides: Authenticated backend scaffold routes for v2 contracts
provides:
  - Mobile v2 DTOs for campaigns, scan entitlements, barcode lookup, nut-milk recommendations/preferences, app ratings, and prompt status
  - Mobile typed API helper stubs for mounted Phase 1 backend scaffold endpoints
  - Admin v2 DTOs for campaigns, hash-only redeem code metadata, entitlements, media assets, barcode products, ratings, prompt state, and nut-milk preference
  - Optional exercise imageAssetId compatibility on mobile and admin exercise types while preserving imageUrl
affects: [phase-02-campaign-codes, phase-03-barcode-food-scan, phase-04-milk-recommendation, phase-05-exercise-media, phase-06-feedback-ratings]
tech-stack:
  added: []
  patterns: [shared DTO contracts, typed scaffold endpoint helpers, hash-only persisted redeem-code DTOs, response-only raw code export DTO]
key-files:
  created:
    - mobile/src/lib/api/v2-contracts.api.ts
    - admin/src/features/v2-contracts/types.ts
  modified:
    - mobile/src/lib/api/types.ts
    - admin/src/features/exercises/useExercises.ts
key-decisions:
  - "Persisted client/admin redeem-code DTOs expose codeHash, codePrefix, status, and metadata only; rawCode is limited to explicit response-only export rows."
  - "Scan entitlement DTOs carry activeUntil, campaignId, redeemCodeId, and finite high_daily_quota policy metadata."
  - "Barcode contract DTOs keep barcode values as strings and expose isSaveReady plus required macro fields for minimum nutrition readiness."
  - "Exercise imageUrl remains unchanged while optional imageAssetId prepares future media asset workflows."
requirements-completed: [CODE-11]
duration: 6m48s
completed: 2026-05-26
---

# Phase 01 Plan 04: Client/Admin v2 Contract Summary

**Typed mobile and admin DTO contracts for v2 campaign, entitlement, barcode, nut-milk, media, and rating foundations**

## Performance

- **Duration:** 6m48s
- **Started:** 2026-05-26T11:19:33Z
- **Completed:** 2026-05-26T11:26:21Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments

- Added mobile v2 DTOs and API helper stubs for the Phase 1 mounted campaign, barcode, recommendation, and rating scaffold endpoints.
- Added admin v2 DTOs for campaign/code/entitlement/media/rating/barcode/nut-milk contracts.
- Preserved existing exercise image compatibility by keeping `imageUrl` unchanged and adding optional `imageAssetId`.

## Task Commits

1. **Task 1: Add mobile v2 DTOs and API scaffold helpers** - `e7344f5` (feat)
2. **Task 2: Add admin v2 DTOs and exercise media compatibility** - `d9f8105` (feat)

## Files Created/Modified

- `mobile/src/lib/api/types.ts` - Adds mobile v2 DTOs and optional `IExercise.imageAssetId`.
- `mobile/src/lib/api/v2-contracts.api.ts` - Adds typed helper functions for v2 scaffold endpoints.
- `admin/src/features/exercises/useExercises.ts` - Adds optional `Exercise.imageAssetId` while leaving `imageUrl` unchanged.
- `admin/src/features/v2-contracts/types.ts` - Adds admin-facing v2 contract DTOs.

## Decisions Made

- Mobile helpers return typed DTOs even though several endpoints intentionally return 501 until later phases implement workflows.
- Admin `rawCode` is available only in `AdminV2GeneratedRedeemCodeExportRow`, a response-only generation/export shape; persisted code metadata uses `codeHash`.
- Store-review fields remain optional metadata alongside internal app rating DTOs, not a required public-review workflow.

## Deviations from Plan

### Auto-fixed Issues

None.

### Shared Working Tree Staging

- **Found during:** Task 1 and Task 2 commits
- **Issue:** `mobile/src/lib/api/types.ts` and `admin/src/features/exercises/useExercises.ts` already had unrelated unstaged changes in the shared working tree.
- **Fix:** Staged index-only versions containing only the Plan 01-04 additions for those files, leaving pre-existing working-tree edits unstaged.
- **Files affected:** `mobile/src/lib/api/types.ts`, `admin/src/features/exercises/useExercises.ts`
- **Commits:** `e7344f5`, `d9f8105`

## Verification

- `cd mobile && npx tsc --noEmit` - passed after Task 1.
- `cd admin && npx tsc --noEmit` - passed after Task 2.
- `cd mobile && npx tsc --noEmit` - passed as final verification.
- `cd admin && npx tsc --noEmit` - passed as final verification.
- `rg -n "imageAssetId|rawCode|redeemUrl|high_daily_quota|barcode: string|storeReview" ...` - confirmed required contract fields.

## Known Stubs

None. API helpers intentionally target backend scaffold endpoints that later phases will implement; this plan is contract-only.

## Threat Flags

None. DTO surfaces match the plan threat model: barcode values remain strings, persisted redeem-code DTOs avoid raw reusable code fields, and rating DTOs separate internal feedback from optional native store-review eligibility.

## Next Phase Readiness

Phase 2 can consume the campaign/code/entitlement DTOs for admin and mobile redemption flows. Phases 3-6 can use the barcode, nut-milk, media, and rating contracts without inventing new per-screen shapes.

---
*Phase: 01-v2-data-foundation*
*Completed: 2026-05-26*

## Self-Check: PASSED

All created/modified files and task commits were verified.
