# Phase 3: Post-MVP Hardening - Research

**Generated:** 2026-05-27  
**Mode:** inline research due Codex subagent restriction  
**Status:** Ready for planning

## Scope Summary

Phase 3 should harden the already-shipped Phase 2 MVP without reopening large deferred work. The user's latest scope cut is binding: redeem remains manual-code only; QR, QR scanner, and redeem deep links are deferred.

## Codebase Findings

### Manual Redeem

- `backend/src/api/campaigns/campaigns.service.ts` already implements campaign creation, bulk code generation, revoke, atomic redeem, entitlement creation, and status-specific error messages.
- `backend/src/services/redeem-code.service.ts` owns normalization, HMAC hashing, HTTPS redeem URL helpers, and high daily quota constants.
- `mobile/src/components/ui/RedeemCodeCard.tsx` is the correct place for input formatting, paste handling, loading/success/error states, and Vietnamese copy.
- Phase 3 should add rate limiting/audit around redeem attempts without changing hashed-code storage or atomic update behavior.

### Barcode Scanner and Cache

- `mobile/package.json` includes `expo-camera` `~17.0.10`; Expo SDK 54 camera docs confirm `CameraView` can detect barcodes in preview and also has modern scanner APIs.
- `mobile/src/app/(food)/scan.tsx` already contains food camera flow and typed barcode fallback from Phase 2.
- `backend/src/api/food/barcode-provider.service.ts` already normalizes Open Food Facts v2-style responses but is external-only and does not yet local-first/cache.
- `backend/src/models/FoodItem.ts` already supports barcode string arrays and nutrition fields, so cache/local lookup can reuse the existing model rather than adding a new collection.
- Open Food Facts read product API is unauthenticated but rate-limited; backend should keep the provider call server-side, use a custom User-Agent, cache successful lookups, and degrade gracefully.

### Admin Operations

- `admin/src/pages/CampaignsPage.tsx` and `admin/src/features/campaigns/useCampaigns.ts` establish the current campaign CRUD/list pattern.
- `admin/src/pages/RatingsPage.tsx` and `admin/src/features/ratings/useRatings.ts` establish the feedback list pattern.
- `backend/src/api/campaigns/*` and `backend/src/api/ratings/*` can add lightweight stats endpoints without introducing a new admin analytics module.
- Existing `DataTable` and `AppShell` should be reused; dashboard widgets should stay operational and compact rather than decorative.

### Store Review

- `expo-store-review` `~9.0.9` is already installed.
- Expo StoreReview docs indicate `StoreReview.requestReview()` should be called after a signature interaction, not from a button, and `hasAction()`, `isAvailableAsync()`, and `storeUrl()` support capability/fallback decisions.
- `backend/src/models/FeedbackPromptState.ts` already stores prompt state/cooldown data; Phase 3 can enforce a 14-day cooldown and positive-rating gate without new storage.

### Exercise Media

- `backend/src/models/MediaAsset.ts` supports `batchId`, `status`, `assignedExerciseId`, `uploadedBy`, and `metadata`.
- `backend/src/models/Exercise.ts` preserves `imageUrl` and optional `imageAssetId`; Phase 3 must not break mobile compatibility.
- `admin/src/pages/ExercisesPage.tsx` is the likely admin entry point, with media routes under `backend/src/api/media-assets/*`.
- Exact filename matching against exercise `slug` or `_id` is sufficient for the current speed goal. Fuzzy matching, undo, soft replacement, and DAM behavior remain deferred.

## External References

- Expo Camera SDK 54: `https://docs.expo.dev/versions/v54.0.0/sdk/camera/`
- Expo StoreReview SDK 54: `https://docs.expo.dev/versions/v54.0.0/sdk/storereview/`
- Open Food Facts API: `https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/`

## Planning Implications

1. Keep Phase 3 as hardening and verification, not a new feature expansion.
2. Treat QR redeem as an explicit non-goal despite older roadmap wording.
3. Add backend tests where abuse, atomicity, cache, and prompt state can regress.
4. Use mobile/admin TypeScript compile gates for UI-heavy plans.
5. Prefer simple operational stats endpoints over broad analytics abstractions.
6. For barcode, keep typed fallback available even after camera scan is added.
7. For media, exact filename matching and audit logs are enough; no rollback workflow in this phase.

## Research Complete

This research supports six execution plans:

- `03-01` Manual redeem UX, status errors, and anti-abuse.
- `03-02` Barcode camera scan, review-before-save, local-first cache.
- `03-03` Admin campaign/code/rating operations dashboards.
- `03-04` Positive-rating native store review prompt with cooldown/fallback.
- `03-05` Exercise media exact filename mapping and audit logging.
- `03-06` Release verification and regression gates.
