# Project Research Summary

**Project:** U App v2.0 urgent feature release  
**Domain:** Expo React Native health app + Express API + MongoDB + React admin dashboard  
**Researched:** 2026-05-26  
**Confidence:** MEDIUM-HIGH

## Executive Summary

v2.0 should be built as a focused commercial feature release on top of the existing app, not a stack migration or platform rewrite. The core release is campaign redeem codes that unlock time-boxed AI scan entitlement for bottled milk buyers, supported by practical product features: BMI-based U nut milk recommendation, barcode food lookup, app feedback/rating capture, and admin bulk exercise image management.

The recommended approach is to keep Expo, Express, MongoDB/Mongoose, Cloudinary, TanStack Query, and the existing admin dashboard. Add only targeted packages for QR generation, CSV export, optional ZIP export, and native store review prompts. Server-side authority is the main architectural rule: entitlements, scan quota, barcode normalization, recommendation rules, and feedback persistence should all live behind backend APIs.

The main risks are campaign abuse, AI cost runaway, ambiguous entitlement expiry, inaccurate barcode data, health-claim copy, and bulk media mistakes. Mitigate them with hashed single-use codes, atomic redemption, backend fair-use throttles, explicit UTC expiry semantics rendered in Vietnam time, editable barcode confirmation flows, product/legal-approved Vietnamese recommendation copy, and deterministic media import previews.

## Key Findings

### Recommended Stack

Keep the current stack. v2.0 needs small additions, not new infrastructure.

**Core technologies:**
- Expo SDK 54 / `expo-camera`: mobile QR and barcode scanning using existing camera infrastructure.
- Express 5 + Node 20 + Mongoose 8: domain API modules for campaigns, recommendations, ratings, barcode lookup, and media assets.
- MongoDB Atlas: campaign, code, entitlement, feedback, barcode cache, and media documents fit the current document model.
- Cloudinary + Multer: continue as the image pipeline for exercise assets and optional QR/image storage.
- TanStack Query: use for all mobile/admin server state, entitlement refresh, and admin tables.
- React/Vite admin dashboard: extend with campaign, feedback, and media operations pages.

**Stack additions:**
- Backend: `qrcode` for QR generation.
- Backend: `csv-parse` and `csv-stringify` for campaign exports and exercise image mapping imports.
- Backend: `archiver` only if QR PNG/SVG ZIP export is required by print operations.
- Backend: Node `crypto` for random code generation and hashed redeem-code lookup; do not add an ID library.
- Mobile: `expo-store-review` for optional native store review prompts after internal positive feedback.
- Backend external API: use existing `axios` for Open Food Facts lookup; do not add a barcode SDK.

**Do not add for urgent v2.0:** Firebase/Firestore, RevenueCat/paywall SDKs, e-commerce checkout, a QR SaaS, `react-native-vision-camera`, a rules engine, a survey SDK, S3/CloudFront, or a full CMS/DAM.

### Expected Features

**Must have (table stakes):**
- Campaign CRUD and bulk single-use redeem code generation.
- CSV export with code and QR payload; QR ZIP only if launch operations need image files.
- Admin code status/search: generated, redeemed, expired, revoked/voided.
- Mobile manual code entry and QR scan redemption.
- Backend-enforced AI scan entitlement that bypasses the existing daily limit only while active.
- User-visible entitlement expiry: exact active-until date/time.
- BMI milk recommendation from deterministic product rules.
- Save selected milk flavor to profile/preference state.
- Barcode scan as a supplement to food logging, with local lookup first and Open Food Facts fallback.
- Manual/AI fallback when barcode data is missing or incomplete.
- Internal stars/comment feedback capture and admin feedback list.
- Missing-image filter plus bulk exercise image upload/mapping with preview.

**Should have (differentiators):**
- Physical bottle campaign entitlement tied to app utility.
- BMI-to-U flavor guidance with optional need chips for stress/sleep and breakfast/energy.
- Unified camera infrastructure for QR redemption and food barcode scanning.
- Campaign support view to explain invalid, used, expired, or revoked codes.
- Admin missing-image queue for hundreds of exercise records.

**Defer or cut for fast release:**
- Printer/vendor API integration.
- Campaign revenue attribution dashboards and advanced analytics charts.
- Admin-editable milk recommendation rules.
- Barcode crowdsourcing or Open Food Facts write/contribution flows.
- Paid barcode database before Vietnam product coverage is validated.
- Subscription, payment, loyalty, referral, gifting, or transfer logic.
- Rating prompt A/B testing, sentiment analysis, and ticketing workflows.
- AI image generation, AI media matching, crop editor, and full DAM features.

### Architecture Approach

Extend the current backend by domain modules and keep existing user flows intact. The most important integration is entitlement-aware AI scan quota inside the existing `/api/food/scan` path. Mobile should display entitlement state, but the backend must decide scan access on every request.

**Major components:**
1. Campaigns module: campaign CRUD, code generation, hashed lookup, redemption, export, and support/search.
2. Entitlement/quota service: `resolveScanAccess(userId)` used by `/api/food/scan`.
3. Recommendations module: server-owned BMI and need-signal rule table, flavor selection persistence.
4. Barcode lookup module: barcode normalization, local `FoodItem` lookup, Open Food Facts fallback/cache, provenance.
5. Ratings module: prompt status, internal feedback capture, admin listing.
6. Media assets module: Cloudinary upload catalog, deterministic exercise image assignment, usage checks.
7. Mobile scan UI: shared camera infrastructure with strict routing by payload shape.
8. Admin pages: operator workflows for campaign, feedback, and media management.

**Model/API implications:**
- Add `Campaign`, `RedeemCode`, `UserScanEntitlement`, `AppRating`, and `MediaAsset`.
- Add `NutMilkPreference` if recommendation history/analytics matter; otherwise denormalize current selected flavor on `User.profile`.
- Extend `FoodItem` with `barcodes`, `brand`, `servingSizeG`, `packageSize`, and `source`.
- Extend `Exercise` with `imageAssetId` while keeping `imageUrl` for mobile compatibility.
- Extend `FoodScanAttempt` with `source` and optional `entitlementId`.
- Add `POST /api/campaigns/redeem`, `GET /api/campaigns/me/entitlements`, admin campaign/code/export endpoints, `GET /api/food/items/barcode/:barcode`, recommendation endpoints, rating endpoints, and admin media endpoints.

### Critical Pitfalls

1. **Redeem codes treated like ordinary coupon strings** — use crypto-random codes, hashed storage with server pepper, single-use atomic redemption, rate limits, and batch audit logs.
2. **Unlimited scans remove the AI cost brake** — keep backend fair-use throttles, payload limits, duplicate/retry controls, scan-source telemetry, and campaign/global spend alarms.
3. **Expiry semantics are inconsistent** — define one rule before implementation, store UTC, render Asia/Ho_Chi_Minh, return explicit `activeUntil`, and test boundary cases.
4. **Barcode data is trusted as ground truth** — preserve leading zeros, validate checksum/types, show review/edit before logging, store provenance, and always offer manual/AI fallback.
5. **BMI recommendation becomes medical advice** — use product-preference wording, avoid treatment/weight-change claims, add Vietnamese disclaimer, and require product/legal copy approval.
6. **Bulk media lacks stable identity** — use deterministic Cloudinary `public_id`, store `publicId`, preview imports, make imports idempotent, and block deletes while assets are in use.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Model and API Foundation

**Rationale:** Shared models and indexes unblock every feature and reduce later rework.  
**Delivers:** Core schemas, validation, indexes, migrations/backfills if needed, and API scaffolding for campaigns, entitlements, ratings, media assets, recommendations, and barcode fields.  
**Addresses:** Stack additions, model/API contracts, source compatibility for existing mobile/admin flows.  
**Avoids:** Unindexed entitlement/code lookups, duplicated recommendation rules, and media data debt.

### Phase 2: Campaign Entitlements and Scan Quota

**Rationale:** This is the highest business urgency and highest cost/security risk. It touches AI scan billing and must stabilize before printed campaign QA.  
**Delivers:** Campaign/code generation, hashed single-use redemption, admin CSV export/search, mobile code entry/QR scan, entitlement visibility, and `/api/food/scan` quota bypass for active entitlements.  
**Addresses:** Campaign CRUD, bulk codes, QR redemption, backend entitlement enforcement, user expiry display.  
**Avoids:** Guessable/leaked codes, client-side unlocks, duplicate redemption, unclear expiry, and AI cost runaway.

### Phase 3: Barcode Food Scan Supplement

**Rationale:** Barcode scan uses the same camera stack but should land after campaign QR routing and scan entitlement behavior are stable.  
**Delivers:** Barcode fields on food items, local lookup, Open Food Facts fallback/cache, mobile barcode scan mode, review/edit confirmation, and manual/AI fallback.  
**Addresses:** Packaged food logging, barcode fallback states, source/provenance.  
**Avoids:** Duplicate scan callbacks, barcodes stored as numbers, inaccurate nutrition logged without confirmation, and dead-end unknown barcode UX.

### Phase 4: BMI Milk Recommendation

**Rationale:** Low technical risk and strong branded product value, but final copy and boundary rules need product approval.  
**Delivers:** Backend deterministic rule service, recommendation endpoint, optional need chips, mobile recommendation card, selected flavor persistence.  
**Addresses:** BMI-to-U flavor guidance, saved flavor, secondary need-based options.  
**Avoids:** client-only rules, BMI boundary ambiguity, medical/therapeutic claims, and preference overwrite after BMI changes.

### Phase 5: Admin Exercise Media Operations

**Rationale:** Operationally important for hundreds of records but isolated from urgent user entitlement flows. Can ship after core commercial/user features unless content rollout blocks launch.  
**Delivers:** `MediaAsset` catalog, multi-upload endpoint, missing-image queue, deterministic filename matching, preview/confirm, audit fields, and usage-safe deletion.  
**Addresses:** Bulk exercise image management and admin productivity.  
**Avoids:** duplicate Cloudinary assets, orphaned images, broken exercise references, oversized mobile image payloads, and unsigned-upload exposure.

### Phase 6: Feedback and Ratings

**Rationale:** Lowest dependency and easiest to cut if schedule compresses. Internal feedback is useful, but it should not block campaign launch.  
**Delivers:** Internal stars/comment model, prompt status, mobile prompt coordinator with cooldown, admin feedback table, optional `expo-store-review` prompt after compliant positive moments.  
**Addresses:** App rating prompt and product feedback loop.  
**Avoids:** review gating, asking at launch/errors, confusing private feedback with public store reviews, and repeated prompts.

### Phase Ordering Rationale

- Build backend contracts before UI because campaign, barcode, recommendation, feedback, and media all require new models and API shapes.
- Put campaign entitlements before other user-facing features because printed codes and AI cost controls are hardest to reverse after launch.
- Split barcode from campaign even though both use camera scanning; their backend semantics and data quality risks are different.
- Keep BMI recommendation separate because it needs copy/rule approval, not infrastructure depth.
- Keep media and feedback late because both are valuable but independently releasable and cuttable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Requires threat modeling, rate-limit numbers, QR payload decision, code storage/export policy, and exact expiry semantics.
- **Phase 3:** Needs Vietnam packaged-product coverage validation and decision on trusted local/third-party barcode data.
- **Phase 4:** Needs final product/legal review of Vietnamese recommendation copy, disclaimers, and BMI boundary rules.
- **Phase 5:** Needs operational design for image source naming, import batch rollback, QA state, and Cloudinary cleanup policy.

Phases with standard patterns where research can be light:
- **Phase 1:** Mostly standard Mongoose/API scaffolding once schemas are accepted.
- **Phase 6:** Standard feedback CRUD and platform review API integration; planning should focus on trigger timing and policy constraints.

## Recommended Build Order

1. Lock product decisions: code expiry rule, QR payload format, campaign fixed-window vs duration, BMI `23.0` handling, and required barcode nutrition fields.
2. Add models, indexes, validation, and typed API contracts.
3. Implement campaign redemption and entitlement-aware scan quota with integration tests.
4. Build admin campaign generation/export/search and mobile redeem entry/QR scan.
5. Add barcode lookup and mobile barcode scan with manual fallback.
6. Add BMI recommendation service, UI, copy, and selected-flavor persistence.
7. Add admin media operations if content rollout requires it before release; otherwise ship after user-facing features.
8. Add feedback/rating prompt last, or cut to internal feedback only.

## Scope Cuts for Fast Release

- Campaign: CSV export first; QR ZIP only if operations explicitly require image files.
- Campaign: counts/search only; defer analytics dashboards, revenue attribution, templates, and vendor integrations.
- Entitlement: one clear expiry policy; defer stacking variants, transfers, gifts, and referral logic.
- Barcode: local DB + Open Food Facts read-only fallback; defer paid data, crowdsourcing, and admin moderation queues.
- BMI: static backend rule table; defer admin rule CMS, AI explanations, inventory, checkout, and push campaigns.
- Media: missing-image queue + deterministic matching; defer crop editor, AI matching, rollback UI beyond batch audit, and mobile uploads.
- Ratings: one internal feedback prompt threshold; defer A/B testing, sentiment analysis, and support-ticket workflow.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing Expo/Express/Mongo/Cloudinary/TanStack stack fits all v2.0 features; official docs support camera, store review, Cloudinary, and API choices. |
| Features | MEDIUM-HIGH | Table stakes are clear; campaign printing/export workflow and exact expiry semantics need product/vendor confirmation. |
| Architecture | HIGH | Repo patterns align with domain modules, Mongoose models, admin route groups, and backend-owned quota/recommendation logic. |
| Pitfalls | MEDIUM-HIGH | Abuse, AI cost, review policy, barcode quality, and media risks are well documented; Vietnam-specific food-claim copy still needs product/legal review. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Campaign expiry: choose fixed campaign expiry vs N days after redemption, and define stacking behavior.
- QR payload: choose raw code, custom deep link, or HTTPS universal link; HTTPS is better for printed fallback but may require setup.
- Print operations: confirm whether CSV payloads are enough or QR PNG/SVG ZIP export is required.
- Barcode coverage: test real Vietnam products and define minimum nutrition fields before allowing save.
- BMI rule ambiguity: decide BMI `23.0`, lifestyle-signal priority, and final Vietnamese disclaimer/copy.
- Media operations: decide whether v2.0 must replace existing images or only fill missing images.
- Rating trigger: define the first eligible "meaningful success" threshold and cooldown.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack additions, package choices, and what not to add.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, MVP order, and scope cuts.
- `.planning/research/ARCHITECTURE.md` — model/API design, data flows, component boundaries, and build order.
- `.planning/research/PITFALLS.md` — security, abuse, compliance, data-quality, and media workflow risks.
- Expo Camera docs — QR/barcode scanning support.
- Expo StoreReview docs, Apple StoreKit review docs, Google Play In-App Review docs — native review behavior and constraints.
- Cloudinary upload/admin docs — signed uploads, public IDs, asset management.
- Open Food Facts API docs — product lookup by barcode and data limitations.
- OWASP API Security Top 10 2023 API4 — resource consumption and cost-control risk.

### Secondary (MEDIUM confidence)
- GS1 product data quality guidance — barcode/product-data reliability concerns.
- FDA label-claim guidance and Vietnam Circular No. 43/2014/TT-BYT references — health-claim caution; final Vietnamese copy still needs product/legal approval.

---
*Research completed: 2026-05-26*  
*Ready for roadmap: yes*
