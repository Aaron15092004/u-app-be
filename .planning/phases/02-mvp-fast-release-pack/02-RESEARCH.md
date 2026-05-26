---
phase: 02-mvp-fast-release-pack
researched: 2026-05-26
status: complete
sources:
  - ".planning/phases/02-mvp-fast-release-pack/02-CONTEXT.md"
  - ".planning/phases/01-v2-data-foundation/01-VERIFICATION.md"
  - "https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/"
  - "https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/"
---

# Phase 2 Research: MVP Fast Release Pack

## Scope Translation

Phase 2 is a monetization-first MVP. It must deliver real backend behavior and minimal usable UI for:

1. Admin campaign/code creation, bulk generation, and CSV export.
2. Manual user redeem from Profile and food-scan quota state.
3. Entitlement-aware AI scan quota set to 30 scans/day while active.
4. External barcode lookup and immediate food-log save when macro data is sufficient.
5. Profile-based Ủ milk preference selection.
6. Internal app rating after successful redeem and basic admin feedback view.

Exercise media operations are explicitly out of scope for Phase 2.

## Technical Findings

### Campaign Code MVP

Phase 1 already provides the core security contract:
- `RedeemCode` stores `codeHash`, not raw code.
- `hashRedeemCode()` normalizes and hashes with `REDEEM_CODE_PEPPER`.
- `buildRedeemHttpsUrl()` requires HTTPS and puts raw code only in export payload.
- `UserScanEntitlement.redeemCodeId` has a unique index for one-code-one-redemption semantics.

Phase 2 should add service-layer methods rather than put logic in controllers:
- `createCampaign`
- `generateCampaignCodes`
- `exportCampaignCodesCsv`
- `redeemCampaignCode`
- `getMyScanEntitlements`
- `resolveScanQuota`

Generation should create raw codes transiently, hash them for storage, and return/export raw codes only in the generation/export response. Do not add a persisted raw-code field.

### CSV Export

CSV is enough for first print operations. Required columns:
- raw code
- code prefix
- campaign name/id
- entitlement duration days
- campaign active window
- code expiry if present
- HTTPS redeem URL

QR image/ZIP export is deferred.

### Entitlement Quota

The user chose 30 scans/day for active entitlement users. Existing normal quota remains 20/day. `checkScanRateLimit()` should evolve into an entitlement-aware resolver that returns:
- `usedToday`
- `limit`
- `quotaMode`: `standard_daily_limit` or `entitlement_30_daily`
- `activeUntil`
- `entitlementId`

`FoodScanAttempt` should record entitlement metadata when applicable for audit and fair-use analysis.

### Open Food Facts Barcode Provider

Open Food Facts official Product Opener API supports product lookup by barcode through `/api/v2/product/{barcode}.json` and allows field selection for product name, brands, quantity/serving fields, image URL, and nutriments. It is suitable as the default MVP provider because no local barcode database coverage exists yet.

Implementation guidance:
- Use backend-only HTTP calls; mobile should call the app backend, not Open Food Facts directly.
- Preserve barcode as a string.
- Request only fields needed for MVP where possible.
- Normalize common nutrition fields from `nutriments`, preferring per-serving values when reliable and falling back to per-100g values with serving quantity where possible.
- Treat product name plus calories, protein, carbs, and fat as minimum save-ready fields.
- Store provenance in the response and saved food log metadata where the current schema allows; if schema changes are needed, keep them minimal and backward-compatible.
- Add timeout/friendly error handling because external data quality and availability are variable.

### Ủ Milk Preference

Backend rules already exist as static constants. Phase 2 should implement the save/read preference workflow and expose it through Profile. BMI-screen integration is deferred. The UI should present suitable options and let the user pick one; do not silently overwrite saved preference when BMI data changes.

### Rating After Redeem

The rating prompt is tied to successful redemption. The MVP can implement:
- mobile modal/sheet after success
- star/comment submit
- dismiss/cooldown via `FeedbackPromptState`
- internal `AppRating` persistence
- basic admin list view

Native store review prompt remains deferred.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Raw code leakage | Codes can be reused/abused | Keep raw codes transient, never persist; tests assert absence of raw fields. |
| Redemption race condition | Same code redeemed twice | Use atomic update or transaction-like compare-and-set on unused code plus unique entitlement index. |
| External barcode data quality | Missing macros or wrong serving data | Require name + kcal + protein/carbs/fat before save-ready; provide manual/AI fallback. |
| Phase grows too large | MVP release slips | Keep QR scanner, native review, advanced admin filters, and exercise media out of Phase 2. |
| Health/product claims | Risky milk copy | Use non-medical product-preference wording and concise disclaimer. |

## Verification Strategy

Required automated gates:
- Backend typecheck.
- Backend campaign/redeem integration tests.
- Backend food scan quota tests.
- Backend barcode provider normalization tests with mocked external responses.
- Backend recommendation/rating tests.
- Mobile TypeScript compile.
- Admin TypeScript compile.

Recommended scripts:
- Extend `test:v2-foundation` or add `test:v2-mvp` for Phase 2-specific tests.
- Keep existing `test:food` and `test:admin` passing.

## Planning Implications

Use vertical-ish waves so monetization flow lands early:

1. Backend campaign/code/redemption/quota core.
2. Admin campaign/code CSV and mobile redeem/entitlement/rating UI.
3. External barcode and profile milk preference.
4. Phase 2 verification suite and contract cleanup.
