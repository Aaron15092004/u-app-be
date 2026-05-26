# Phase 2: MVP Fast Release Pack - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the fastest usable v2.0 commercial MVP: milk campaign code generation/export, manual user redemption, entitlement-backed AI scan quota, barcode-assisted food logging through an external provider, Ủ milk preference capture, and lightweight internal rating after redemption. The release priority is monetization through bottled milk codes, with minimal real backend and mobile/admin UI for each included workflow.

Exercise image operations are cut from Phase 2 despite being present in the compressed roadmap text. Treat exercise media as Post-MVP hardening or a separate follow-up phase; do not include it in Phase 2 planning unless the user explicitly reopens scope.

</domain>

<decisions>
## Implementation Decisions

### MVP Cut Line
- **D-01:** Phase 2 priority is release/monetization: campaign code redemption and high scan quota are the core success path.
- **D-02:** Every included feature needs real backend behavior plus minimal usable UI. Avoid demo-only stubs for the selected MVP workflows.
- **D-03:** Do not cut additional MVP areas by default. Polish/advanced work is already deferred, but the selected MVP workflows should ship together.

### Campaign Code and Redemption
- **D-04:** Admin MVP includes campaign creation, bulk single-use code generation, and CSV export.
- **D-05:** CSV export must include raw code, campaign metadata, expiry policy, and HTTPS redeem URL. QR image/ZIP generation is not required in Phase 2.
- **D-06:** User can enter the code from both Profile and the food-scan quota/exhausted state.
- **D-07:** QR in Phase 2 is limited to HTTPS redeem URLs in the CSV for printing/fallback. In-app QR scanning and deep-link polish move to Phase 3.
- **D-08:** Redemption must remain atomic: used, revoked, or expired codes never create entitlement.
- **D-09:** Rating prompt should appear after successful redeem, not on first launch or after an error.

### Entitlement and AI Scan Quota
- **D-10:** The product promise "unlimited" is implemented as 30 AI scans/day while entitlement is active, replacing the Phase 1 default high quota constant for MVP behavior.
- **D-11:** Food scan UI should show an active entitlement badge, e.g. "Gói quét AI đang hoạt động đến DD/MM", so the user can see the redeemed benefit.
- **D-12:** Backend quota resolution remains the source of truth. Active entitlement users should receive the 30/day limit until `activeUntil`; normal users keep the existing default daily limit.

### Barcode MVP
- **D-13:** Barcode MVP should use an external provider such as Open Food Facts or an equivalent external barcode nutrition source. Do not rely on local `FoodItem` barcode coverage because the local database does not currently contain enough barcode data.
- **D-14:** Barcode values remain strings and must preserve leading zeros.
- **D-15:** If an external barcode result contains enough macro data, the user can log it immediately after basic serving/weight adjustment.
- **D-16:** Even in MVP, barcode results should keep normalized source/provenance data so Phase 3 can add cache/review/hardening without replacing the contract.

### Ủ Milk Preference
- **D-17:** Ủ milk MVP lives in Profile, not the BMI screen, to keep the release small.
- **D-18:** Profile should show suitable flavor options and let the user choose one preferred flavor to save.
- **D-19:** Recommendation should use the existing deterministic backend rules and safe Vietnamese product-preference copy, not medical treatment claims.

### App Rating
- **D-20:** Internal star/comment feedback is triggered after successful code redemption.
- **D-21:** Native store review prompt is deferred to Phase 3. Phase 2 stores internal feedback only.
- **D-22:** Admin only needs a basic way to view stored feedback entries in MVP; advanced filters/analytics are deferred.

### Explicitly Deferred From Phase 2
- **D-23:** Exercise image operations are out of Phase 2 MVP. The user will add exercise images manually for now or handle that in Phase 3/future work.

### the agent's Discretion
- Choose exact admin screen placement and naming for campaign/code pages based on existing admin navigation patterns.
- Choose the external barcode provider integration details during research, with Open Food Facts as the default candidate.
- Choose exact Vietnamese copy for non-medical milk guidance and redemption/rating messages, keeping it concise and product-safe.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/PROJECT.md` — v2.0 milestone goals and product context.
- `.planning/REQUIREMENTS.md` — v2.0 requirement IDs, including campaign, barcode, milk, rating, and media requirements.
- `.planning/ROADMAP.md` — Phase 2/3 compressed roadmap; note that this CONTEXT cuts exercise media from Phase 2.
- `.planning/STATE.md` — Current phase status and Phase 1 decisions carried forward.
- `.planning/phases/01-v2-data-foundation/01-CONTEXT.md` — Locked Phase 1 foundation decisions for code hashing, quota policy, barcode strings, milk rules, and rating storage.
- `.planning/phases/01-v2-data-foundation/01-VERIFICATION.md` — Verified data foundation and closed contract drift.

### Campaign and Entitlement Foundation
- `backend/src/services/redeem-code.service.ts` — Code normalization, HMAC hashing, HTTPS redeem URL helper, and existing quota constants.
- `backend/src/models/RedeemCode.ts` — Hash-only redeem code persistence and indexes.
- `backend/src/models/Campaign.ts` — Campaign model fields.
- `backend/src/models/UserScanEntitlement.ts` — Entitlement model, `activeUntil`, and quota policy.
- `backend/src/models/FoodScanAttempt.ts` — Scan attempt audit and daily count foundation.
- `backend/src/api/campaigns/campaigns.controller.ts` — Current user redemption scaffold.
- `backend/src/api/campaigns/campaigns.validation.ts` — Current code validation schema.

### Food Scan and Barcode
- `backend/src/api/food/food.controller.ts` — Current AI scan, food log, search, and barcode scaffold endpoints.
- `backend/src/api/food/food.service.ts` — Current daily scan rate limit and food log persistence.
- `backend/src/api/food/food.validation.ts` — Food log, search, barcode param, and minimum nutrition validation.
- `backend/src/models/FoodItem.ts` — Food item nutrition shape and barcode fields.
- `mobile/src/app/(food)/scan.tsx` — Existing mobile food scan UI entry point.
- `mobile/src/app/(food)/result.tsx` — Existing food scan result/log flow.
- `mobile/src/lib/api/food.api.ts` — Existing food API client.
- `mobile/src/lib/api/v2-contracts.api.ts` — Phase 1 v2 API helper scaffolds.

### Milk and Rating
- `backend/src/api/recommendations/nut-milk.rules.ts` — Static Ủ milk flavor/rule constants.
- `backend/src/api/recommendations/recommendations.controller.ts` — Current recommendation scaffold/selection endpoints.
- `backend/src/models/NutMilkPreference.ts` — Saved milk preference model.
- `backend/src/api/ratings/ratings.controller.ts` — Rating scaffold endpoints.
- `backend/src/api/ratings/ratings.validation.ts` — Rating payload validation.
- `backend/src/models/AppRating.ts` — Internal feedback model.
- `backend/src/models/FeedbackPromptState.ts` — Prompt/cooldown state foundation.
- `mobile/src/app/(tabs)/profile/index.tsx` — Target area for Profile-based milk preference and redeem entry.

### Admin
- `admin/src/App.tsx` — Admin route/navigation structure.
- `admin/src/components/layout/AppShell.tsx` — Admin shell/navigation pattern.
- `admin/src/components/data-table/DataTable.tsx` — Reusable admin table pattern.
- `admin/src/features/v2-contracts/types.ts` — Existing v2 admin type contracts.
- `admin/src/pages/ExercisesPage.tsx` — Existing admin CRUD/table/form pattern; media is deferred but page shows style conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `redeem-code.service.ts` already normalizes codes, hashes with `REDEEM_CODE_PEPPER`, and builds HTTPS redeem URLs.
- Campaign, RedeemCode, UserScanEntitlement, FoodScanAttempt, NutMilkPreference, AppRating, and FeedbackPromptState models already exist from Phase 1.
- `/api/campaigns/redeem` and `/api/campaigns/me/entitlements` exist as user-facing scaffolds.
- `/api/food/scan` already counts daily attempts and returns `usedToday`/`limit`.
- `/api/food/items/barcode/:barcode` exists as a barcode scaffold with string validation.
- `mobile/src/lib/api/v2-contracts.api.ts` already contains typed helpers for redeem, entitlement status, barcode, milk recommendations, milk selection, and rating.
- Admin already has React Query, DataTable, dialog/form patterns, and protected admin routes.

### Established Patterns
- Backend modules use route/controller/service/validation files with Zod validation at API boundaries.
- Authenticated user routes use `authenticate`; admin routes sit behind `authenticate, requireAdmin`.
- Food service uses Vietnam-day boundaries for daily quota reset.
- Mobile UI is Vietnamese-first, Expo Router based, and uses typed API helpers plus TanStack Query.
- Admin UI uses shadcn-style components, sonner toast, and table/form CRUD patterns.

### Integration Points
- Replace `checkScanRateLimit` logic with entitlement-aware quota resolution rather than adding a parallel scan route.
- Add real campaign/admin endpoints under the admin router while preserving hash-only code storage.
- Add Profile and food-scan exhausted-state entry points for manual redeem.
- Add external barcode lookup behind the existing barcode route.
- Add Profile-based milk preference UI using existing recommendation/selection API helpers.
- Trigger internal rating after successful redeem and expose stored ratings to admin.

</code_context>

<specifics>
## Specific Ideas

- The company will print or place codes inside/on bottled milk; CSV export is enough for the first operations workflow.
- The user explicitly chose 30 scans/day for entitled users, not 1000/day.
- The local food database is not expected to contain useful barcode data right now; external barcode lookup is required for MVP value.
- Sữa Ủ should be saved from Profile for speed, while BMI-screen integration can wait.
- Exercise image workflow is intentionally removed from Phase 2 to speed release.

</specifics>

<deferred>
## Deferred Ideas

- In-app QR scanner and deep-link polish for redeem.
- QR image/ZIP export.
- External barcode cache/data-quality review/admin moderation beyond the minimum needed for MVP.
- Native store review prompt after positive feedback.
- Advanced admin search/filter/analytics for campaigns/codes/ratings.
- Exercise image bulk operations, media audit, orphan cleanup, and batch workflows.

</deferred>

---

*Phase: 2-MVP Fast Release Pack*
*Context gathered: 2026-05-26*
