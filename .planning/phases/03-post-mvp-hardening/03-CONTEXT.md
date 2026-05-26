# Phase 3: Post-MVP Hardening - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the Phase 2 MVP after launch. It improves manual redeem UX and abuse protection, adds real camera barcode scanning with review-before-save, strengthens admin operations dashboards, enables native store review after positive internal feedback, implements exercise image filename mapping/audit, and expands release verification.

Despite the roadmap mentioning QR/deep-link redeem, the user explicitly cut QR, deep links, and QR scanner polish from Phase 3 to keep scope down. Redeem hardening is manual-code only.

</domain>

<decisions>
## Implementation Decisions

### Manual Redeem Hardening
- **D-01:** Do not implement QR redeem, deep links, or QR scanner in Phase 3. Keep Phase 3 redeem work to manual code entry.
- **D-02:** Polish manual code input: better formatting, paste handling, clearer success/error states, and concise Vietnamese copy.
- **D-03:** Redeem errors should be friendly and status-specific: invalid code, already used, expired, revoked, and unauthenticated.

### Barcode Hardening
- **D-04:** Prioritize a real camera barcode scanner in the food scan flow.
- **D-05:** After a barcode scan succeeds, always open a review screen before saving so the user can check/edit product name, serving, calories, and macros.
- **D-06:** Backend barcode lookup should use local-first lookup plus DB cache, then external fallback. Cache external results with provenance/last-verified metadata.
- **D-07:** Do not build a deep admin data-quality queue in this phase unless it falls out naturally from cache/audit work.

### Admin Operations
- **D-08:** Campaign/code admin hardening should prioritize an operations dashboard: total codes, redeemed rate, active campaigns, and campaigns nearing expiry.
- **D-09:** Rating admin hardening should prioritize a feedback dashboard: average rating, rating distribution, and recent comments.
- **D-10:** Exercise media admin hardening should prioritize filename-based auto mapping.

### Native Store Review
- **D-11:** Native store review may be triggered only after positive internal feedback of 4 or 5 stars.
- **D-12:** Rating prompt dismiss/submit cooldown should be 14 days.
- **D-13:** If the native store review API is unavailable or does not display, fall back to App Store / Google Play links.

### Exercise Media Workflow
- **D-14:** Auto-map exercise images by exact filename matching an exercise slug or id.
- **D-15:** If a filename match is 100%, the batch can apply directly without mandatory preview.
- **D-16:** Phase 3 only needs audit logging for media batch operations: who uploaded/applied, which file mapped to which exercise, and when. Undo batch and soft replacement are deferred.

### Release Hardening
- **D-17:** Prioritize redeem/quota abuse edge cases first.
- **D-18:** Add redeem anti-abuse rate limiting by user/IP. Do not add a separate lockout workflow unless required by implementation.
- **D-19:** Verification should include backend integration tests plus mobile/admin TypeScript compile gates.

### the agent's Discretion
- Choose exact placement and visual treatment of barcode scanner/review UI based on existing food scan navigation.
- Choose exact dashboard chart/table composition as long as the selected metrics are visible and operational.
- Choose the store URL configuration mechanism for App Store / Google Play fallback, keeping secrets out of client code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/PROJECT.md` — v2.0 milestone goals and product context.
- `.planning/REQUIREMENTS.md` — v2.0 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 3 boundary and hardening success criteria.
- `.planning/STATE.md` — Current workflow state and accumulated decisions.
- `.planning/phases/01-v2-data-foundation/01-CONTEXT.md` — Foundation decisions for hashing, quotas, barcode strings, milk rules, media assets, and rating storage.
- `.planning/phases/02-mvp-fast-release-pack/02-CONTEXT.md` — MVP cut line and deferred Phase 3 scope.

### Redeem and Entitlement
- `backend/src/services/redeem-code.service.ts` — Code normalization, HMAC hashing, HTTPS redeem helper, and quota constants.
- `backend/src/api/campaigns/campaigns.controller.ts` — Current redeem/admin campaign handlers.
- `backend/src/api/campaigns/campaigns.service.ts` — Atomic redeem, campaign code generation, revoke, and entitlement behavior.
- `backend/src/api/campaigns/campaigns.validation.ts` — Current redeem/campaign/code validation.
- `backend/src/models/RedeemCode.ts` — Hash-only code persistence and status fields.
- `backend/src/models/UserScanEntitlement.ts` — Active entitlement and quota policy.
- `backend/src/models/FoodScanAttempt.ts` — Scan attempt audit/quota metadata.
- `mobile/src/components/ui/RedeemCodeCard.tsx` — Current manual redeem form.
- `mobile/src/components/ui/ScanEntitlementBadge.tsx` — Current entitlement display.

### Barcode and Food Scan
- `backend/src/api/food/barcode-provider.service.ts` — Open Food Facts lookup and normalization.
- `backend/src/api/food/food.controller.ts` — Food scan, food logs, barcode route.
- `backend/src/api/food/food.service.ts` — Quota resolver, food log persistence, local food search.
- `backend/src/api/food/food.validation.ts` — Barcode and food log validation contracts.
- `backend/src/models/FoodItem.ts` — Local barcode fields and nutrition schema.
- `mobile/src/app/(food)/scan.tsx` — Current camera scan plus typed barcode fallback.
- `mobile/src/app/(food)/result.tsx` — Existing review/save pattern for food results.
- `mobile/src/lib/api/v2-contracts.api.ts` — Barcode/redeem/rating/milk API helpers.
- `mobile/src/lib/api/food.api.ts` — Food log save API.

### Admin and Ratings
- `admin/src/pages/CampaignsPage.tsx` — Current campaign/code admin MVP.
- `admin/src/pages/RatingsPage.tsx` — Current ratings admin MVP.
- `admin/src/components/data-table/DataTable.tsx` — Admin table pattern.
- `admin/src/components/layout/AppShell.tsx` — Admin navigation pattern.
- `admin/src/features/campaigns/useCampaigns.ts` — Campaign hooks.
- `admin/src/features/ratings/useRatings.ts` — Ratings hook.
- `backend/src/api/ratings/ratings.controller.ts` — Rating submit/status/admin list.
- `backend/src/api/ratings/ratings.service.ts` — Rating persistence and admin list.
- `backend/src/models/AppRating.ts` — Internal rating model.
- `backend/src/models/FeedbackPromptState.ts` — Prompt status/cooldown model.

### Exercise Media
- `backend/src/models/Exercise.ts` — Existing `imageUrl` compatibility and optional `imageAssetId`.
- `backend/src/models/MediaAsset.ts` — Media asset metadata model.
- `backend/src/api/media-assets/media-assets.controller.ts` — Current media asset scaffold/controller.
- `backend/src/api/media-assets/media-assets.routes.ts` — Admin media routes.
- `backend/src/api/media-assets/media-assets.validation.ts` — Media payload validation.
- `admin/src/pages/ExercisesPage.tsx` — Existing exercise admin CRUD and image field pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RedeemCodeCard` already centralizes manual redeem UI and can be hardened without adding QR scope.
- `ScanEntitlementBadge` already displays active scan package state.
- `CameraView` is already used in the food scan screen, making barcode scanner integration a natural extension of the existing camera flow.
- `barcode-provider.service.ts` already normalizes Open Food Facts responses and returns `isSaveReady`, `missingFields`, and provenance.
- `FoodItem.barcodes` already exists as a string array for local-first barcode lookup/cache.
- `MediaAsset` and `Exercise.imageAssetId` already exist, but the admin media workflow is still shallow.
- Admin has reusable table, route, and React Query hook patterns from Campaigns/Ratings/Exercises pages.

### Established Patterns
- Backend uses controller/service/validation modules with Zod at API boundaries.
- Admin routes sit under router-level `authenticate, requireAdmin`.
- Mobile API helpers live in `mobile/src/lib/api/*` and screens use TanStack Query/mutations.
- Mobile copy is Vietnamese-first and should stay concise.
- Existing Phase 2 verification gate uses backend integration tests plus mobile/admin typecheck.

### Integration Points
- Add manual redeem polish inside `RedeemCodeCard` and related Profile/food-scan entry points.
- Extend `/api/food/items/barcode/:barcode` to local-first/cache/external fallback and scanner review flow.
- Add barcode review/save screen or modal connected to existing food log save API.
- Add campaign and feedback dashboard data to backend/admin hooks/pages.
- Add native store review call from internal rating success path, guarded by rating threshold and cooldown.
- Add exercise media filename mapping/audit under admin media/exercise management without breaking `Exercise.imageUrl`.

</code_context>

<specifics>
## Specific Ideas

- QR/deep-link work was explicitly reduced out of scope by the user: "giảm scope bằng cách điền code thôi không cần mã QR".
- Barcode should graduate from typed fallback to camera scanner, but still require a review screen before saving.
- Exercise image filenames must equal exercise slug/id to avoid fuzzy-match mistakes.
- For media mapping, speed is acceptable when the filename match is exact; audit log is enough for now.
- Store review fallback needs real App Store / Google Play links when native review does not show.

</specifics>

<deferred>
## Deferred Ideas

- QR redeem scanner and deep-link redeem polish.
- Admin barcode data-quality moderation queue for unknown/incomplete products.
- Media batch undo and soft replacement workflow.
- Automated E2E tests such as Detox/Playwright for mobile/admin flows.

</deferred>

---

*Phase: 3-Post-MVP Hardening*
*Context gathered: 2026-05-27*
