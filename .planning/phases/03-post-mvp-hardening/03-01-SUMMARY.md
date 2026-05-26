---
phase: 03-post-mvp-hardening
plan: 01
subsystem: redeem-hardening
status: complete
tags:
  - redeem
  - entitlement
  - anti-abuse
key-files:
  - backend/src/api/campaigns/campaigns.controller.ts
  - backend/src/api/campaigns/campaigns.service.ts
  - backend/src/api/campaigns/campaigns.integration.test.ts
  - backend/src/utils/response.ts
  - mobile/src/components/ui/RedeemCodeCard.tsx
  - mobile/src/lib/api/types.ts
---

# Plan 03-01 Summary

## What Changed

- Added user/IP scoped redeem-attempt rate limiting with stable `RATE_LIMITED` error code.
- Added stable redeem error codes for invalid, already used, expired, revoked, inactive campaign, and rate-limited states.
- Preserved atomic redeem and hash-only code storage behavior.
- Polished mobile manual-code entry with uppercase normalization, grouped paste handling, disabled/loading states, and Vietnamese status-specific messages.
- Kept QR/deep-link redeem out of scope.

## Verification

- `cd backend && npm run typecheck` — passed
- `cd backend && npm run test:v2-mvp` — passed
- `cd mobile && npx tsc --noEmit` — passed

## Deviations

- None. QR remains explicitly deferred.

## Self-Check

PASSED
