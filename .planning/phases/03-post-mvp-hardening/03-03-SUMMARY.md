---
phase: 03-post-mvp-hardening
plan: 03
subsystem: admin-ops-dashboards
status: complete
tags:
  - admin
  - campaigns
  - ratings
key-files:
  - backend/src/api/campaigns/campaigns.service.ts
  - backend/src/api/campaigns/campaigns.controller.ts
  - backend/src/api/ratings/ratings.service.ts
  - backend/src/api/ratings/ratings.controller.ts
  - backend/src/api/admin/admin.routes.ts
  - backend/src/api/admin/admin.integration.test.ts
  - admin/src/pages/CampaignsPage.tsx
  - admin/src/pages/RatingsPage.tsx
  - admin/src/features/campaigns/useCampaigns.ts
  - admin/src/features/ratings/useRatings.ts
---

# Plan 03-03 Summary

## What Changed

- Added `/api/admin/campaigns/stats` with total codes, redeemed rate, active campaigns, and near-expiry campaigns.
- Added `/api/admin/ratings/stats` with average rating, star distribution, and recent comments.
- Added admin React Query hooks and compact dashboard sections on Campaigns and Ratings pages.
- Extended admin contract types for the new dashboard payloads.

## Verification

- `cd backend && npm run typecheck` — passed
- `cd backend && npm run test:admin` — passed
- `cd admin && npx tsc --noEmit` — passed
- `cd backend && npm run test:v2-mvp` — passed

## Deviations

- Exercise media admin hardening remains in Plan 03-05.

## Self-Check

PASSED
