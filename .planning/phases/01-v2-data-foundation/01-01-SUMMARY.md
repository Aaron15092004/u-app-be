---
phase: 01-v2-data-foundation
plan: 01
subsystem: security
tags: [redeem-codes, hmac, qrcode, csv, expo-store-review, tdd]
requires: []
provides:
  - Backend redeem-code normalization and HMAC hash utility for CODE-11
  - HTTPS redeem payload helper for future QR/export workflows
  - Finite high-daily-quota scan policy constants
  - Approved backend QR/CSV dependencies and mobile store-review dependency
affects: [phase-02-campaign-codes, phase-06-feedback-ratings, backend-services, mobile-packages]
tech-stack:
  added: [qrcode, csv-parse, csv-stringify, "@types/qrcode", expo-store-review]
  patterns: [HMAC-SHA-256 redeem-code hashing, HTTPS redeem URL payloads, finite quota policy constants]
key-files:
  created:
    - backend/src/services/redeem-code.service.ts
    - backend/src/services/redeem-code.service.test.ts
  modified:
    - backend/package.json
    - backend/package-lock.json
    - mobile/package.json
    - mobile/package-lock.json
key-decisions:
  - "Redeem codes normalize before hashing so printed/manual variants map to the same lookup."
  - "hashRedeemCode uses HMAC-SHA-256 with REDEEM_CODE_PEPPER and rejects missing pepper."
  - "QR payload support is an HTTPS URL with raw code only in transient query payloads."
  - "Unlimited scan foundation is represented as high_daily_quota with a finite daily limit."
patterns-established:
  - "Redeem-code services must call normalizeRedeemCode before hash lookup."
  - "Downstream campaign generation/export may return raw codes transiently, but persisted contracts use hashRedeemCode."
requirements-completed: [CODE-11]
duration: 7m22s
completed: 2026-05-26
---

# Phase 01 Plan 01: Package and Redeem-Code Security Foundation Summary

**HMAC-backed redeem-code utility with HTTPS QR payload support, finite high-quota metadata, and approved QR/CSV/store-review packages**

## Performance

- **Duration:** 7m22s
- **Started:** 2026-05-26T08:13:21Z
- **Completed:** 2026-05-26T08:20:42Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments

- Added approved backend dependencies for QR generation and CSV parsing/stringifying, plus Expo store-review support for later native review prompts.
- Created `redeem-code.service.ts` with normalization, HMAC-SHA-256 hashing, HTTPS redeem URL construction, and finite high-daily-quota constants.
- Added focused TDD coverage for CODE-11/D-01/D-02/D-04 behavior.

## Task Commits

1. **Task 1: Add approved package dependencies** - `2f2ce8e` (chore)
2. **Task 2 RED: Create redeem-code security utility tests** - `abd80ba` (test)
3. **Task 2 GREEN: Implement redeem-code security utility** - `fa3ff31` (feat)

## Files Created/Modified

- `backend/src/services/redeem-code.service.ts` - Normalizes printed/manual code variants, hashes with `REDEEM_CODE_PEPPER`, builds HTTPS redeem URLs, and exposes finite high-quota constants.
- `backend/src/services/redeem-code.service.test.ts` - Node test coverage for normalization, hash secrecy/equivalence, missing pepper errors, HTTPS-only payloads, and quota constants.
- `backend/package.json` / `backend/package-lock.json` - Adds `qrcode`, `csv-parse`, `csv-stringify`, and `@types/qrcode`.
- `mobile/package.json` / `mobile/package-lock.json` - Adds `expo-store-review`.

## Decisions Made

- Used `HIGH_QUOTA_DAILY_LIMIT = 1000` as a finite foundation constant: high enough for campaign entitlement semantics, but not an unbounded bypass.
- Kept `buildRedeemHttpsUrl` pure and non-persistent; raw code appears only in the returned URL payload.
- Added an adjacent service test file because Task 2 was marked `tdd="true"`, even though the plan file list only named the service implementation.

## Deviations from Plan

### Auto-fixed Issues

None.

### File-List Deviation

- **Added:** `backend/src/services/redeem-code.service.test.ts`
- **Reason:** Task 2 required TDD execution; the adjacent test file was necessary to satisfy the RED/GREEN gate and validate CODE-11 security behavior.
- **Verification:** RED failed before implementation; GREEN passed after implementation.
- **Commits:** `abd80ba`, `fa3ff31`

## Issues Encountered

- The shared working tree already had uncommitted edits in package files. Package commits were staged index-only from plan-specific dependency changes so previous/user edits stayed unstaged.
- `expo-store-review` install surfaced existing React/Expo peer warnings. The install completed in the working tree and `npm ls expo-store-review` passed.
- Existing npm audit warnings remain outside this plan's scope: backend reports 8 moderate vulnerabilities; mobile reports 17 vulnerabilities after install.

## Verification

- `cd backend && npm ls qrcode csv-parse csv-stringify @types/qrcode` - passed
- `cd mobile && npm ls expo-store-review` - passed
- `rg "archiver" backend/package.json backend/package-lock.json` - no matches
- `cd backend && npm run typecheck` - passed
- `cd backend && node --env-file=.env.test --require tsx/cjs --test src/services/redeem-code.service.test.ts` - passed

## Known Stubs

None.

## User Setup Required

`REDEEM_CODE_PEPPER` must be configured before any real campaign-code generation or redemption lookup runs. This plan intentionally does not edit environment files because they were outside the plan's file list.

## Next Phase Readiness

Phase 2 can consume `hashRedeemCode` for `RedeemCode.codeHash`, use `buildRedeemHttpsUrl` for CSV/QR export payloads, and rely on finite high-quota metadata instead of introducing an unbounded scan bypass.

---
*Phase: 01-v2-data-foundation*
*Completed: 2026-05-26*

## Self-Check: PASSED

All created files and task commits were verified.
