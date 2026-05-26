# Plan 02-04 Summary: Barcode Lookup & Ủ Milk Preference

## Status

Completed.

## Changes

- Added backend Open Food Facts barcode provider with timeout, friendly fallback, provenance, and save-ready normalization.
- Replaced barcode scaffold with real `GET /api/food/items/barcode/:barcode` lookup.
- Added typed barcode fallback on the mobile scan screen and direct save-ready food-log creation.
- Implemented real Ủ milk preference persistence through `NutMilkPreference`.
- Added Profile-based Ủ milk options and save/update action with non-medical product-preference copy.

## Scope Notes

- Mobile barcode scanner polish remains Phase 3; Phase 2 uses typed barcode fallback.
- Barcode strings are preserved as strings and validated as 6-18 digits.
- External provider calls are backend-owned; mobile only calls app backend.
- Milk recommendations stay in Profile, not BMI screen.
- Exercise media operations were not added.

## Verification

- `cd backend && npm run typecheck`
- `cd mobile && npx tsc --noEmit`

Both passed.
