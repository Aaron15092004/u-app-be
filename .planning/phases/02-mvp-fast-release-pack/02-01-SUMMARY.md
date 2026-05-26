---
phase: 02-mvp-fast-release-pack
plan: 01
subsystem: api
tags: [campaigns, redeem-codes, entitlements, quota, mongoose]

requires:
  - phase: 01-v2-data-foundation
    provides: Hash-only redeem code models, entitlement models, campaign scaffolds, and scan attempt metadata.
provides:
  - Backend campaign creation/listing, bulk code generation, and transient CSV export payload.
  - Manual redeem endpoint with atomic single-use code behavior and entitlement creation.
  - Entitlement-aware AI scan quota resolver using 30 scans/day for active redeemed users.
  - Admin campaign/code routes mounted behind existing admin auth.
affects: [campaigns, food-scan, admin, mobile-redeem]

tech-stack:
  added: []
  patterns: [service-backed controllers, hash-only code generation, entitlement-aware quota]

key-files:
  created:
    - backend/src/api/campaigns/campaigns.service.ts
  modified:
    - backend/src/services/redeem-code.service.ts
    - backend/src/api/campaigns/campaigns.controller.ts
    - backend/src/api/campaigns/campaigns.validation.ts
    - backend/src/api/admin/admin.routes.ts
    - backend/src/api/food/food.service.ts
    - backend/src/api/food/food.controller.ts

key-decisions:
  - "Phase 2 entitlement limit is 30 scans/day, replacing the Phase 1 placeholder high quota."
  - "Raw codes are returned only from generation/export response; later CSV re-export with raw code is intentionally unavailable."
  - "Food scan quota remains backend-authoritative and records entitlement metadata on scan attempts."

patterns-established:
  - "Campaign service owns code generation, hash lookup, redemption, entitlement status, and admin operations."
  - "Food scan controllers pass the resolved quota metadata into scan-attempt recording."

requirements-completed: [CODE-01, CODE-02, CODE-03, CODE-05, CODE-06, CODE-08, CODE-09, CODE-10, CODE-12]

duration: 45min
completed: 2026-05-27
---

# Phase 2 Plan 01 Summary

**Backend campaign code activation with hash-only bulk generation, manual redeem, and 30/day entitlement scan quota**

## Performance

- **Duration:** 45 min
- **Started:** 2026-05-27T00:00:00+07:00
- **Completed:** 2026-05-27T00:45:00+07:00
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `campaigns.service.ts` for admin campaign creation/listing, code generation, code listing, revoke operations, user redeem, and entitlement status.
- Replaced campaign user scaffolds with real service-backed redeem/status responses.
- Replaced admin campaign scaffolds with real protected route handlers.
- Updated AI food scan quota to resolve active entitlements and use 30 scans/day while entitlement is active.
- Added entitlement audit metadata to food scan attempt recording.

## Task Commits

1. **Task 1 + 2: Backend campaign/code/redeem/quota core** - pending plan commit

## Files Created/Modified

- `backend/src/api/campaigns/campaigns.service.ts` - Campaign, code generation/export, redeem, entitlement, revoke service logic.
- `backend/src/api/campaigns/campaigns.controller.ts` - Real user/admin campaign handlers.
- `backend/src/api/campaigns/campaigns.validation.ts` - Admin campaign/code validation schemas.
- `backend/src/api/admin/admin.routes.ts` - Admin campaign routes wired to real handlers.
- `backend/src/api/food/food.service.ts` - Entitlement-aware quota resolver and scan attempt metadata.
- `backend/src/api/food/food.controller.ts` - Quota metadata returned and recorded after scan.
- `backend/src/services/redeem-code.service.ts` - Phase 2 high quota constant set to 30.

## Decisions Made

- Raw code re-export by campaign is not supported after generation because raw codes are intentionally not persisted.
- `GET /api/admin/campaigns/:id/codes/export.csv` returns a security-oriented 410 message; CSV with raw code is available in the generation response.
- Active entitlement users receive 30 scans/day; standard users keep the existing 20/day limit.

## Deviations from Plan

None - implementation followed the planned backend scope. The only notable design clarification is that raw-code CSV export is immediate-generation only because hash-only storage forbids later raw-code reconstruction.

## Issues Encountered

- TypeScript narrowing needed explicit safeParse branches in campaign controller; fixed before commit.

## User Setup Required

Set `REDEEM_CODE_PEPPER` before using generation/redeem in non-test environments. Optionally set `REDEEM_BASE_URL`; otherwise generated CSV uses `https://u-app.vn/redeem`.

## Next Phase Readiness

Plan 02-02 can build admin UI against the new admin campaign endpoints. Plan 02-03 can build mobile redeem/status UI against the user campaign endpoints and quota metadata.

---
*Phase: 02-mvp-fast-release-pack*
*Completed: 2026-05-27*
