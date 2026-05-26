# Plan 02-02 Summary: Admin Campaign & Ratings MVP

## Status

Completed.

## Changes

- Added admin campaign/code hooks and a `CampaignsPage` for:
  - creating campaigns,
  - generating bulk redeem codes,
  - downloading the sensitive raw-code CSV immediately after generation,
  - listing campaign codes,
  - revoking campaigns and unused codes.
- Added internal ratings backend persistence and admin listing because the admin ratings page needs real data, not the old 501 scaffold.
- Added admin ratings hook and `RatingsPage` with user, stars, comment, trigger, platform, app version, and created date.
- Added admin routes/navigation for campaign codes and ratings.
- Updated Phase 2 admin DTOs for generated CSV rows and populated rating users.

## Scope Notes

- QR image/ZIP export remains out of Phase 2 scope.
- CSV raw codes are only available from the generation response; the historical export route remains unavailable for security.
- Ratings remain internal feedback only; no native store-review or analytics controls were added.
- Exercise media operations were not added.

## Verification

- `cd backend && npm run typecheck`
- `cd admin && npx tsc --noEmit`

Both passed.
