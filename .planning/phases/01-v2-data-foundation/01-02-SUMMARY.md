---
phase: 01-v2-data-foundation
plan: 02
subsystem: database
tags: [mongoose, campaigns, redeem-codes, scan-entitlements, barcode, media-assets, app-ratings]
requires:
  - phase: 01-v2-data-foundation/01-01
    provides: Backend redeem-code HMAC utility and finite high-quota constants
provides:
  - Mongoose model contracts for Campaign, RedeemCode, and UserScanEntitlement
  - Hash-only redeem-code persistence shape for CODE-11
  - FoodScanAttempt entitlement audit metadata for future quota resolution
  - Barcode fields on FoodItem while preserving Vietnamese text search behavior
  - Exercise media asset reference while preserving imageUrl compatibility
  - Separate NutMilkPreference, MediaAsset, AppRating, and FeedbackPromptState models
  - Static backend nut-milk recommendation rule config
affects: [phase-02-campaign-codes, phase-03-barcode-food-scan, phase-04-milk-recommendation, phase-05-exercise-media, phase-06-feedback-ratings]
tech-stack:
  added: []
  patterns: [Mongoose schema indexes, hash-only redeem-code storage, finite high-quota entitlement policy, static recommendation config]
key-files:
  created:
    - backend/src/models/Campaign.ts
    - backend/src/models/RedeemCode.ts
    - backend/src/models/UserScanEntitlement.ts
    - backend/src/models/NutMilkPreference.ts
    - backend/src/models/MediaAsset.ts
    - backend/src/models/AppRating.ts
    - backend/src/models/FeedbackPromptState.ts
    - backend/src/api/recommendations/nut-milk.rules.ts
  modified:
    - backend/src/models/FoodScanAttempt.ts
    - backend/src/models/FoodItem.ts
    - backend/src/models/Exercise.ts
key-decisions:
  - "RedeemCode persists only codeHash, prefix, length, status, redemption metadata, and admin support indexes; raw reusable code fields are absent."
  - "UserScanEntitlement stores finite high_daily_quota policy and unique redeemCodeId linkage for future atomic redemption."
  - "FoodItem barcode fields are optional string arrays, and Vietnamese text search keeps default_language: none while adding brand."
  - "Exercise keeps imageUrl unchanged and adds optional imageAssetId for future media workflows."
  - "Nut-milk rules are static backend constants with explicit BMI 23.0 boundary handling."
patterns-established:
  - "New v2 foundation schemas keep downstream workflow fields optional until their feature phase exposes routes."
  - "Entitlement-backed scan auditing uses FoodScanAttempt.source, entitlementId, and quotaMode without changing existing daily count indexes."
requirements-completed: [CODE-11]
duration: 3m26s
completed: 2026-05-26
---

# Phase 01 Plan 02: v2 Data Model Foundation Summary

**Mongoose contracts for hashed campaign codes, scan entitlements, barcode foods, nut-milk preferences, media assets, and internal ratings**

## Performance

- **Duration:** 3m26s
- **Started:** 2026-05-26T08:24:39Z
- **Completed:** 2026-05-26T08:28:04Z
- **Tasks:** 2 completed
- **Files modified:** 11

## Accomplishments

- Added campaign, hash-only redeem code, and user scan entitlement schemas with indexes needed by future atomic redemption and entitlement-backed scan quota resolution.
- Extended existing `FoodScanAttempt`, `FoodItem`, and `Exercise` models in a backward-compatible way.
- Added separate data contracts for nut-milk preferences, media assets, app ratings, feedback prompt state, and static nut-milk recommendation rules.

## Task Commits

1. **Task 1: Add campaign, code, and entitlement models** - `e9a1ac9` (feat)
2. **Task 2: Add barcode, recommendation, media, and feedback model contracts** - `26b9fed` (feat)

## Files Created/Modified

- `backend/src/models/Campaign.ts` - Campaign metadata with active window, entitlement duration, finite high-quota limit, counts, creator, and admin filter indexes.
- `backend/src/models/RedeemCode.ts` - Hash-only redeem-code lookup model with unique `codeHash` and campaign/batch/redemption support indexes.
- `backend/src/models/UserScanEntitlement.ts` - User entitlement records with active window, campaign/code links, unique `redeemCodeId`, and finite high-daily-quota policy.
- `backend/src/models/FoodScanAttempt.ts` - Adds optional scan source, entitlement reference, and quota mode while preserving TTL and user/date indexes.
- `backend/src/models/FoodItem.ts` - Adds optional string barcode/package fields and includes `brand` in no-stemming Vietnamese text search.
- `backend/src/models/Exercise.ts` - Adds optional `imageAssetId` without changing existing `imageUrl`.
- `backend/src/models/NutMilkPreference.ts` - Separate history-friendly saved preference model with BMI context and need signals.
- `backend/src/api/recommendations/nut-milk.rules.ts` - Static backend rule config for five roadmap nut-milk flavors with explicit BMI boundary helper.
- `backend/src/models/MediaAsset.ts` - Media asset metadata model for future admin bulk upload/assignment workflows.
- `backend/src/models/AppRating.ts` - Internal star/comment feedback model with trigger, platform, app version, device info, and optional store-review metadata.
- `backend/src/models/FeedbackPromptState.ts` - Separate prompt-state model with cooldown and trigger counters.

## Decisions Made

- Kept Phase 1 strictly at the model/config layer; no routes, controllers, or feature workflows were added.
- Used optional schema additions/defaults for existing models so current mobile/admin reads remain compatible.
- Modeled BMI `23.0` as a named `boundary_23` result in the helper instead of silently assigning it to either adjacent marketing range.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `backend/src/models/FoodScanAttempt.ts` existed on disk but was untracked in the shared working tree. It was explicitly listed in Plan 01-02 and was committed with Task 1.
- The shared working tree still contains many unrelated user/previous changes. Only Plan 01-02 files were staged for task commits.

## Verification

- `cd backend && npm run typecheck` - passed after Task 1.
- `cd backend && npm run typecheck` - passed after Task 2.
- `cd backend && npm run typecheck` - passed as final plan verification.
- `rg -n "rawCode|plainCode|code: \{ type: String|code: String" backend/src/models/RedeemCode.ts` - no matches.
- Stub-pattern scan across all Plan 01-02 files - no matches.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 can build campaign admin generation/export and user redemption on the `Campaign`, `RedeemCode`, and `UserScanEntitlement` contracts. Later barcode, milk recommendation, exercise media, and feedback phases have stable model shapes without requiring schema churn.

---
*Phase: 01-v2-data-foundation*
*Completed: 2026-05-26*

## Self-Check: PASSED

All created/modified files and task commits were verified.
