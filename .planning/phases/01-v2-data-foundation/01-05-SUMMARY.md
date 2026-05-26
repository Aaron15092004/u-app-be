---
phase: 01-v2-data-foundation
plan: 05
subsystem: testing
tags: [node-test, mongodb-memory-server, supertest, mongoose, zod, v2-contracts, code-11]
requires:
  - phase: 01-v2-data-foundation/01-04
    provides: Mobile/admin v2 DTO contracts and backend scaffold endpoints
provides:
  - Fast `test:v2-foundation` backend gate for Phase 1 contracts
  - CODE-11 tests for normalized HMAC hashing and hash-only RedeemCode persistence
  - Cross-model schema/index tests for campaign, entitlement, barcode, nut-milk, media, and feedback contracts
  - Supertest coverage for campaign scaffold authentication/validation and admin v2 guard behavior
  - Barcode validation tests proving string handling, leading-zero preservation, and required macros
affects: [phase-02-campaign-codes, phase-03-barcode-food-scan, phase-04-milk-recommendation, phase-05-exercise-media, phase-06-feedback-ratings]
tech-stack:
  added: []
  patterns: [node:test contract coverage, mongodb-memory-server model index checks, supertest scaffold verification]
key-files:
  created:
    - backend/src/models/RedeemCode.test.ts
    - backend/src/models/v2-data-foundation.test.ts
    - backend/src/api/campaigns/campaigns.integration.test.ts
  modified:
    - backend/src/services/redeem-code.service.test.ts
    - backend/src/api/food/food.integration.test.ts
    - backend/src/api/admin/admin.integration.test.ts
    - backend/package.json
key-decisions:
  - "test:v2-foundation is the fast backend gate for Phase 1 data foundation contracts."
  - "CODE-11 is verified at both service and model/index layers: normalized HMAC hashes, no plaintext schema paths, and unique codeHash enforcement."
  - "Barcode tests assert string digit handling with leading zeros and minimum macro fields before save-ready behavior."
  - "Admin v2 scaffold tests verify campaign, rating, and media endpoints remain behind requireAdmin."
patterns-established:
  - "Model contract tests should assert schema paths and indexes directly for foundation decisions."
  - "Scaffold route tests assert auth/validation/501 boundaries without implementing later workflow behavior."
requirements-completed: [CODE-11]
duration: 1h12m
completed: 2026-05-26
---

# Phase 01 Plan 05: v2 Foundation Verification Summary

**Automated contract gate for CODE-11, v2 schema/index decisions, barcode validation, and scaffold route guards**

## Performance

- **Duration:** 1h12m
- **Started:** 2026-05-26T10:28:00Z
- **Completed:** 2026-05-26T11:40:00Z
- **Tasks:** 2 completed
- **Files modified:** 7

## Accomplishments

- Added `test:v2-foundation` covering redeem-code utility/model tests, cross-model schema/index tests, campaign scaffold tests, and affected food/admin suites.
- Locked CODE-11 with tests for normalized HMAC hashing, no `code`/`rawCode`/`plainCode` schema paths, and duplicate `codeHash` unique-index failure.
- Added executable coverage for D-03 through D-13 where testable: entitlement policy fields, scan-attempt audit metadata, barcode string validation, separate nut-milk/prompt/rating models, static rules, media metadata, and admin guard boundaries.

## Task Commits

1. **Task 1 RED: Add RedeemCode storage contract tests** - `cacf680` (test)
2. **Task 1 GREEN: Add v2 foundation test script** - `cdb684d` (chore)
3. **Task 2: Add schema, validation, and route scaffold contract tests** - `2645c68` (test)

## Files Created/Modified

- `backend/src/models/RedeemCode.test.ts` - Tests hash-only persisted schema paths and unique `codeHash` enforcement in mongodb-memory-server.
- `backend/src/models/v2-data-foundation.test.ts` - Tests v2 model paths, defaults, indexes, static nut-milk rules, and absence of a `MediaBatch` model.
- `backend/src/api/campaigns/campaigns.integration.test.ts` - Tests campaign scaffold auth, validation, 501 boundary, and entitlement status response contract.
- `backend/src/api/food/food.integration.test.ts` - Adds barcode validation/route tests and aligns scan quota test with `FoodScanAttempt`.
- `backend/src/api/admin/admin.integration.test.ts` - Adds requireAdmin coverage for v2 campaign, rating, and media scaffold endpoints.
- `backend/src/services/redeem-code.service.test.ts` - Included in the new fast gate.
- `backend/package.json` - Adds and expands `test:v2-foundation`.

## Decisions Made

- Kept Phase 1 tests focused on contracts and boundaries, not full campaign redemption, QR export, barcode provider fallback, media assignment, or rating prompt workflows.
- Used direct schema/index assertions for model contracts because these are foundation decisions that downstream phases rely on before any service behavior exists.
- Treated 501 scaffold responses as intentional contract boundaries and tested only auth, validation, and reachability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale food quota test to current scan-attempt contract**
- **Found during:** Task 2 verification
- **Issue:** Existing `test:food` quota coverage seeded `FoodLog` documents, but current rate limiting counts `FoodScanAttempt` documents and returns the newer retry payload.
- **Fix:** Seeded `FoodScanAttempt` records, cleared them between tests, and asserted `usedToday`/`limit` alongside the 429 message.
- **Files modified:** `backend/src/api/food/food.integration.test.ts`
- **Verification:** `npm run test:v2-foundation`, `npm run test:food`, and `npm run typecheck` passed.
- **Committed in:** `2645c68`

### Shared Working Tree Staging

- `backend/package.json` already had unrelated unstaged edits. Only the `test:v2-foundation` script changes were staged for this plan.
- `backend/src/api/food/food.integration.test.ts` already had current Gemini/scan-attempt-era edits in the working tree; this plan modified the same listed file for v2 barcode/quota coverage and verified against the shared working tree.

---

**Total deviations:** 1 auto-fixed bug plus shared-tree staging notes  
**Impact on plan:** The auto-fix was necessary for the required affected-suite gate. No later-phase workflow behavior was implemented.

## Issues Encountered

- The Task 1 RED gate failed because `test:v2-foundation` did not exist yet, which was the expected RED condition for adding the fast verification script.
- TypeScript initially rejected overly strict Mongoose model helper typings in `v2-data-foundation.test.ts`; the test helper was narrowed to the schema methods it actually uses.

## Verification

- `cd backend && npm run typecheck` - passed
- `cd backend && npm run test:v2-foundation` - passed
- `cd backend && npm run test:food` - passed
- `cd backend && npm run test:admin` - passed
- `cd mobile && npx tsc --noEmit` - passed
- `cd admin && npx tsc --noEmit` - passed
- Decision coverage grep across `01-*-PLAN.md` - found CODE-11 and D-01 through D-13 plan coverage.
- `rg -n "rawCode|plainCode|code: String|code: \\{ type: String" backend/src/models/RedeemCode.ts` - no persisted plaintext code paths found.

## Known Stubs

None. Route scaffold 501 responses remain intentional Phase 1 boundaries and are tested as such.

## Threat Flags

None. This plan added tests for existing planned trust boundaries and did not introduce new network endpoints, auth paths, file access, or schema trust surfaces.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 can start campaign-code workflows with a fast backend gate that proves hashed redeem-code storage, entitlement metadata, route auth/validation boundaries, and admin guard placement before workflow implementation begins.

## Self-Check: PASSED

All created files and task commits were verified.

---
*Phase: 01-v2-data-foundation*
*Completed: 2026-05-26*
