# Domain Pitfalls: U App v2.0 Feature Release

**Domain:** Expo React Native health app + Express/Node API + MongoDB + React admin dashboard  
**Scope:** v2.0 new features only: redeem codes/QR unlocks, BMI milk recommendation, barcode scan, app rating, bulk exercise images  
**Researched:** 2026-05-26  
**Overall confidence:** HIGH for API abuse/cost/rating/media guidance; MEDIUM for Vietnam-specific food-claim interpretation because implementation should still be reviewed by product/legal.

## Recommended v2.0 Phase Ownership

| Roadmap Phase | Pitfalls It Must Own |
|---------------|----------------------|
| **Phase 1: Commercial Redeem Codes & Scan Entitlements** | Code generation, QR leakage, redemption abuse, unlimited scan cost controls, entitlement expiry, audit logs |
| **Phase 2: Barcode Scan Supplement** | Scanner UX, barcode validation, food-data quality, fallback paths, vendor/API attribution and caching |
| **Phase 3: BMI-Based Ủ Milk Recommendation** | Rule correctness, selected flavor persistence, health-claim wording, disclaimers, product/legal approval |
| **Phase 4: App Rating & Feedback Prompt** | Prompt timing, platform policy compliance, anti-review-gating, internal feedback handling |
| **Phase 5: Bulk Exercise Image Management** | Bulk upload workflow, Cloudinary folder/public_id strategy, dedupe, orphan cleanup, admin auditability |

## Critical Pitfalls

### Pitfall 1: Treating Redeem Codes as Ordinary Coupon Strings

**What goes wrong:** Codes are short, sequential, or derived from campaign names, making them guessable or enumerable. Attackers redeem codes without buying bottled milk, share them publicly, or brute-force the redemption endpoint.

**Why it happens:** Admin bulk generation is often treated as a marketing workflow instead of an entitlement/security workflow.

**Consequences:** Revenue leakage, user support disputes, uncontrolled AI scan spend, and inability to prove which campaign batch leaked.

**Prevention:**
- Generate codes from cryptographically random entropy; do not use sequential IDs, phone-number-like strings, SKU-derived strings, or campaign prefixes that reduce entropy.
- Store only a server-side hash of the code, not the raw code. Show/export raw codes only once at generation time.
- Use a fixed normalized format: uppercase, no ambiguous characters, explicit length, checksum or grouped display for manual entry.
- Make redemption atomic in MongoDB: one request should either consume or bind the code exactly once, with a unique index on normalized code hash and redemption state.
- Add per-user, per-device, per-IP, and per-code-attempt rate limits to redemption endpoints.
- Add an immutable audit log: generatedBy admin, campaignId, batchId, createdAt, expiresAt, redeemedBy, redeemedAt, source (`manual`/`qr`), and failed attempts.

**Detection:**
- Spike in invalid redemption attempts.
- Many attempts from one IP/device across different codes.
- Same campaign batch redeemed much faster than expected bottle distribution.
- Codes appearing in logs, analytics, screenshots, customer support exports, or admin URLs.

**Phase:** Phase 1: Commercial Redeem Codes & Scan Entitlements.

**Confidence:** HIGH. OWASP API guidance treats unrestricted resource consumption and unbounded operations as a top API risk; redeem codes also require standard single-use token controls.

### Pitfall 2: QR Codes Leak the Entitlement Instead of a Redeem Intent

**What goes wrong:** The QR encodes the raw unlock code directly. Anyone who photographs the bottle, receives a forwarded image, scrapes a campaign PDF, or scans a printed code before purchase can redeem the entitlement.

**Why it happens:** QR generation is designed for convenience without modeling the physical supply chain: printing vendors, admin downloads, campaign previews, social sharing, store shelves, and returned bottles.

**Consequences:** Campaign stock is consumed before real customers redeem it. Support cannot distinguish legitimate buyers from leaked-code users.

**Prevention:**
- Prefer QR content that opens an app deep link containing a nonce/redeem token, not a human-readable reusable code.
- If raw codes must be printed, make them single-use and batch-traceable; assume every printed code can become public.
- Separate campaign QR previews from production code exports. Watermark preview PDFs and block preview codes from redemption.
- Add admin export permissions, export audit logs, and short-lived download URLs for QR ZIP/PDF files.
- Track redemption channel and batch leak signals so a compromised batch can be disabled without disabling all campaigns.
- Never put codes in URL paths, crash reports, analytics event names, push notification payloads, or frontend logs.

**Detection:**
- Redemption before campaign launch date.
- Redemption geography/device pattern inconsistent with campaign distribution.
- Multiple failed scans from social platforms/referrer URLs.
- High redemption count from one batch immediately after admin export.

**Phase:** Phase 1: Commercial Redeem Codes & Scan Entitlements.

**Confidence:** HIGH. This is a direct consequence of bearer-token design: possession of the QR/code grants access unless the backend adds single-use binding and audit controls.

### Pitfall 3: "Unlimited AI Scan" Removes the Existing Cost Brake

**What goes wrong:** The current daily AI limit is bypassed completely for unlocked users, so a leaked or legitimately redeemed code can drive unbounded OpenAI/image-processing spend.

**Why it happens:** Product language says "unlimited", but backend budgets still need hard technical ceilings. OWASP explicitly calls out APIs whose requests map to cloud/provider costs.

**Consequences:** Unexpected AI bill, degraded service for all users, emergency disablement of a commercial campaign, and loss of trust in paid/unlocked benefits.

**Prevention:**
- Implement "unlimited within fair-use guardrails", not literally unlimited provider calls.
- Keep server-side cost controls even for unlocked users: per-minute throttles, daily high-water caps, max image size, max retries, timeout budgets, and duplicate-image detection.
- Add campaign-level and global AI budget alarms. When a campaign exceeds expected usage, degrade gracefully to manual/barcode scan before failing hard.
- Track scan source (`daily_free`, `redeem_unlocked`, `barcode`, `manual`) and provider cost per request.
- Cache identical scan requests where feasible and prevent client retry loops from invoking repeated AI calls.
- Ensure entitlement checks are done only on the backend. The mobile app may display status, but must not decide whether a user gets paid-tier scan access.

**Detection:**
- AI requests per redeemed code above expected human behavior.
- High retry count after failed scans.
- Same user/device sending many near-identical images.
- Provider spend increasing faster than redemption count.

**Phase:** Phase 1: Commercial Redeem Codes & Scan Entitlements, with Phase 2 using the same scan-source telemetry.

**Confidence:** HIGH. OWASP API4:2023 highlights unrestricted resource consumption, cost alerts, payload limits, and throttling as core API protections.

### Pitfall 4: Incorrect Entitlement Expiry Semantics

**What goes wrong:** Expiry is interpreted inconsistently: code expires from generation date, first redemption date, campaign end date, or local device time. Users see "unlimited" active in the app while the backend rejects scans, or the backend accepts scans after the intended window.

**Why it happens:** Campaigns mix business dates, local Vietnam time, UTC storage, and per-code activation windows.

**Consequences:** User complaints, support overrides, incorrect campaign reporting, and exploitable clock manipulation if client time is trusted.

**Prevention:**
- Define one rule before implementation: recommended default is `redeemedAt + entitlementDurationDays`, capped by optional `campaignEndsAt`.
- Store all timestamps in UTC; render user-facing dates in Asia/Ho_Chi_Minh.
- Compute active entitlement only on the backend and return an explicit `activeUntil` value to the app.
- Support multiple redeemed codes by choosing a deterministic policy: extend the active window, stack separate windows, or reject overlapping redemption. Recommended: extend from `max(now, currentActiveUntil)` for simple user value and support.
- Add tests around boundary times: midnight Vietnam time, expired campaign, code redeemed seconds before campaign end, multiple code redemption.

**Detection:**
- Support tickets around "code expired early".
- Mobile entitlement badge disagrees with scan endpoint response.
- Multiple code redemptions produce overlapping or lost entitlement periods.

**Phase:** Phase 1: Commercial Redeem Codes & Scan Entitlements.

**Confidence:** HIGH. Time-window bugs are common in entitlement systems and should be contract-tested.

### Pitfall 5: Making BMI Milk Guidance Sound Like Medical or Therapeutic Advice

**What goes wrong:** The recommendation copy implies the milk treats stress, sleep issues, underweight, overweight, fatigue, meal skipping, or other health conditions.

**Why it happens:** Product rules include BMI and lifestyle needs, so marketing language can drift from "suggested flavor" into health claims.

**Consequences:** Regulatory risk, app-store review risk, brand trust damage, and user harm if users treat product guidance as health advice.

**Prevention:**
- Frame the feature as "Gợi ý hương vị phù hợp với mục tiêu/lối sống" rather than diagnosis, treatment, or disease prevention.
- Avoid wording such as "giảm cân", "chữa mất ngủ", "điều trị stress", "ngăn bệnh", "tăng cân an toàn", or any guaranteed outcome.
- Show BMI as a simple category already calculated by the app, then explain that flavor suggestions are product preferences, not medical advice.
- Add Vietnamese disclaimer near the recommendation and in product detail: "Gợi ý tham khảo, không thay thế tư vấn y tế/dinh dưỡng."
- Require product/legal approval for final Vietnamese copy before release.
- Persist selected flavor separately from BMI history so users can choose against the rule without the app repeatedly overriding their preference.

**Detection:**
- Copy or push notifications mention treatment, prevention, disease, guaranteed weight change, or sleep/stress cure.
- Recommendation cannot be dismissed or changed by user.
- Support/marketing asks engineering to encode stronger medical claims into rules.

**Phase:** Phase 3: BMI-Based Ủ Milk Recommendation.

**Confidence:** MEDIUM-HIGH. FDA and Vietnam functional-food references require substantiation for health claims and restrict disease/treatment-style claims; local counsel/product approval is still needed for final Vietnamese wording.

## Moderate Pitfalls

### Pitfall 6: Hard-Coding BMI Rules in UI Components

**What goes wrong:** The flavor rules are duplicated in mobile screens, backend responses, admin copy, and tests. Later product edits create inconsistent recommendations.

**Prevention:**
- Put the canonical rule table in one backend service or configuration document.
- Return both the selected recommendation and the explanation key/copy from the API.
- Version the rules so future campaigns can explain which rule produced an existing user's stored selection.
- Add tests for exact boundaries: BMI `< 18.5`, `18.5-22.9`, `> 23`, and the gap/edge at `23.0` if product truly means `> 23` rather than `>= 23`.

**Phase:** Phase 3: BMI-Based Ủ Milk Recommendation.

**Confidence:** HIGH.

### Pitfall 7: Not Resolving Ambiguity in the Product Rule Table

**What goes wrong:** BMI exactly `23.0` may match neither "18.5-22.9" nor "> 23". "Any BMI" flavors compete with BMI-specific flavors. Stress/sleep and breakfast/energy preferences may be unknown or collected later.

**Prevention:**
- Get product signoff on a deterministic priority order before implementation.
- Recommended logic: BMI-specific rule first when clearly matched; lifestyle-specific "any BMI" alternatives shown as secondary options; "Rau má - Hạt sen" as default universal option when BMI data is missing or user selects stress/sleep.
- Decide whether BMI `23.0` belongs to normal, overweight, or explicit fallback.
- Store user's selected flavor and do not auto-change it after BMI updates unless the user asks for a new recommendation.

**Phase:** Phase 3: BMI-Based Ủ Milk Recommendation.

**Confidence:** HIGH for the engineering risk; LOW on final business priority until product confirms.

### Pitfall 8: Trusting Barcode Databases as Nutrition Ground Truth

**What goes wrong:** Barcode scan returns incomplete, stale, duplicated, non-Vietnam-market, or user-entered nutrition data. The app logs wrong calories/macros with an authoritative-looking result.

**Why it happens:** Open barcode databases are useful but not guaranteed complete or accurate. Open Food Facts explicitly notes its data is voluntarily provided and may have gaps; GS1 guidance emphasizes product data quality and GTIN lifecycle rules.

**Prevention:**
- Treat barcode lookup as a supplement to AI/manual scan, not a replacement for confirmation.
- Show a review/edit screen before logging nutrition from barcode.
- Store data provenance: source API, source product ID/barcode, fetchedAt, confidence/completeness flags, and whether the user edited values.
- Cache successful lookups but allow refresh and local correction.
- Prefer a first-party curated Vietnamese product table for Ủ products and common local foods; use external databases as fallback.
- Validate GTIN/EAN checksum and supported barcode types before calling external APIs.

**Detection:**
- High edit rate after barcode result.
- Frequent missing calories/macros for scanned products.
- Same barcode maps to conflicting product names across sources.

**Phase:** Phase 2: Barcode Scan Supplement.

**Confidence:** HIGH. Open Food Facts API docs and GS1 data-quality guidance both support this risk.

### Pitfall 9: Barcode Scanner Fires Multiple Times Per Scan

**What goes wrong:** `onBarcodeScanned` triggers repeatedly while the camera still sees the barcode. The app sends duplicate lookup requests, navigates multiple times, or redeems the same QR code twice.

**Prevention:**
- Debounce/pause scanning immediately after first successful scan.
- Use an in-flight request guard and require explicit "Scan another" before resuming.
- For redeem QR scans, backend idempotency must still handle duplicate submissions.
- Restrict barcode types to what the feature needs: product EAN/UPC for food, QR for redeem codes. Do not process arbitrary QR URLs as trusted input.

**Phase:** Phase 2: Barcode Scan Supplement and Phase 1 for redeem QR scan.

**Confidence:** HIGH. Expo Camera documents repeated barcode callbacks and barcode data as arbitrary encoded content.

### Pitfall 10: Rating Prompt Becomes an Interruption or Review-Gating Flow

**What goes wrong:** The app asks for stars on launch, after an error, while the user is scanning food, or before unlocking a feature. It may ask "Do you like the app?" before the store prompt, which Google disallows for in-app review flows.

**Consequences:** Lower ratings, user frustration, and possible app-store policy problems.

**Prevention:**
- Trigger only after a successful value moment: completed food scan/log, redeemed a code and completed first unlocked scan, completed workout, or several days of habit/BMI use.
- Never prompt during onboarding, app launch, camera flow, error recovery, paywall/redeem flow, or before granting functionality.
- Maintain local/backend prompt cooldown state independent of platform quotas.
- Use platform review APIs for public store ratings; route low-star internal feedback to a support/comment flow without blocking store review policy.
- Do not incentivize ratings or require rating to unlock scans/codes.

**Detection:**
- Prompt appears before user completes any meaningful action.
- Spike in dismissals or low ratings after prompt launch.
- User reports "I had to rate to continue."

**Phase:** Phase 4: App Rating & Feedback Prompt.

**Confidence:** HIGH. Google Play says to ask after enough user experience, not excessively, and not pre-question users before presenting the review card. Apple recommends asking at appropriate moments, not interrupting activity, and uses system-controlled annual limits.

### Pitfall 11: Confusing Internal Feedback With Store Reviews

**What goes wrong:** The app collects stars and comments internally but users believe they submitted an App Store/Google Play review. Or the app uses internal stars to selectively send only happy users to the store, creating policy risk and biased feedback.

**Prevention:**
- Label internal flow as "Gửi góp ý cho Ủ" and platform flow as store rating.
- Keep a clear support path for unhappy users, but do not gate or manipulate store review prompts based on a pre-question when using Google Play's in-app review API.
- Store internal feedback with app version, platform, feature context, and optional user ID; avoid collecting sensitive health details in comments unless privacy copy covers it.

**Phase:** Phase 4: App Rating & Feedback Prompt.

**Confidence:** HIGH for UX/compliance risk.

### Pitfall 12: Bulk Exercise Images Are Uploaded Without Stable Asset Identity

**What goes wrong:** Hundreds of exercise images are uploaded with random names. Re-running an import creates duplicates; replacing one image breaks references; deleting an exercise leaves orphaned Cloudinary assets.

**Prevention:**
- Define deterministic `public_id` naming: `exercises/{exerciseSlug}/{variant}` or `exercises/{exerciseId}/cover`.
- Store Cloudinary `public_id`, secure URL, dimensions, bytes, format, uploadedBy, and uploadedAt in MongoDB.
- Make imports idempotent: same exercise row + same image path updates the existing asset instead of creating a new one.
- Generate a dry-run report before bulk import: created, updated, skipped, failed, missing exercise match.
- Add orphan detection: assets under `exercises/` with no DB reference.

**Phase:** Phase 5: Bulk Exercise Image Management.

**Confidence:** HIGH. Cloudinary supports authenticated Admin API asset management, upload presets, metadata, and bulk operations, but the app must define its own stable mapping.

### Pitfall 13: Using Client-Side Unsigned Uploads for Admin Bulk Media

**What goes wrong:** Admin dashboard exposes unsigned upload presets. If leaked, anyone can upload files to the Cloudinary account or inflate storage/transformation usage.

**Prevention:**
- Use signed server-side uploads for admin bulk image management.
- Keep Cloudinary API secret only on the backend.
- If an unsigned preset is unavoidable, lock it down: folder, formats, max size, moderation, no overwrite unless intended, and rotate if exposed.
- Do not let mobile users upload exercise library assets.

**Phase:** Phase 5: Bulk Exercise Image Management.

**Confidence:** HIGH. Cloudinary docs distinguish signed/server-side upload from unsigned upload presets and note unsigned uploads are intentionally restricted for security.

## Minor Pitfalls

### Pitfall 14: Admin Code Exports Are Not Operationally Reversible

**What goes wrong:** Admin generates 10,000 codes with wrong expiry, wrong campaign label, or wrong QR template. The system has no batch disable or regeneration workflow.

**Prevention:**
- Every bulk generation must create a batch with status: `draft`, `active`, `disabled`, `expired`.
- Allow disabling an unredeemed batch and marking a replacement batch.
- Require admin confirmation showing quantity, expiry policy, campaign name, and sample code/QR before activation.

**Phase:** Phase 1: Commercial Redeem Codes & Scan Entitlements.

**Confidence:** HIGH.

### Pitfall 15: Logging Sensitive Codes and Health Inputs

**What goes wrong:** Raw redeem codes, QR payloads, BMI, comments, and user identifiers leak into server logs, crash reports, analytics, or admin screenshots.

**Prevention:**
- Redact code values in request logs and error messages.
- Log code hash prefix or batch ID, not raw code.
- Treat BMI, rating comments, and food logs as user health-related data; keep analytics event payloads minimal.
- Review mobile crash reporting and backend logging before launch.

**Phase:** Cross-cutting in all v2 phases, owned first by Phase 1.

**Confidence:** HIGH.

### Pitfall 16: Barcode Results Do Not Fallback Gracefully

**What goes wrong:** Unknown barcode becomes a dead end, even though the user still wants to log food.

**Prevention:**
- Unknown barcode should offer: manual search, AI photo scan, create local custom food, or retry with better lighting.
- Record unknown barcode frequency to prioritize local database additions.

**Phase:** Phase 2: Barcode Scan Supplement.

**Confidence:** HIGH.

### Pitfall 17: Exercise Image Imports Break Mobile Performance

**What goes wrong:** Admin uploads large original images; mobile exercise list loads slow, consumes bandwidth, and janks scrolling.

**Prevention:**
- Enforce max source file size and dimensions on upload.
- Generate/list only optimized thumbnails in exercise cards; reserve larger images for detail screen.
- Store width/height/aspect ratio so mobile cards reserve stable space before image load.
- Use consistent transformations rather than hand-uploaded resized variants.

**Phase:** Phase 5: Bulk Exercise Image Management.

**Confidence:** HIGH.

### Pitfall 18: No Moderation or Review Step for Bulk Images

**What goes wrong:** Wrong image is attached to an exercise, duplicate images appear across unrelated exercises, or low-quality images ship to users.

**Prevention:**
- Add import preview with thumbnail grid and exercise match status.
- Require admin publish step after upload.
- Support bulk replace, rollback by batch, and per-image notes.
- Track visual QA status (`pending`, `approved`, `rejected`) for large batches.

**Phase:** Phase 5: Bulk Exercise Image Management.

**Confidence:** MEDIUM-HIGH. Operational risk depends on how image sources are produced.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Redeem code generation | Guessable, reusable, or leaked codes | Crypto-random codes, hashed storage, single-use atomic redemption, batch audit |
| Redeem QR scan | QR payload treated as trusted input | Deep link validation, single-use backend redemption, no raw code in logs |
| Unlimited scan entitlement | AI cost explosion | Backend fair-use throttles, campaign budgets, scan-source telemetry, provider cost alarms |
| Entitlement expiry | Client/backend date mismatch | UTC storage, backend authority, explicit `activeUntil`, boundary tests |
| Barcode scanning | Duplicate scan callbacks and arbitrary QR data | Pause after first scan, in-flight guard, barcode type allowlist |
| Barcode nutrition | Inaccurate external database values | Provenance, edit-before-log, curated local overrides, completeness flags |
| BMI recommendation | Medical/therapeutic copy | Preference-oriented Vietnamese wording, disclaimer, product/legal approval |
| BMI rules | Boundary and priority ambiguity | Product-signed rule priority, backend canonical rules, exact boundary tests |
| Rating prompt | Interruptive or policy-violating ask | Trigger after successful value moments, use platform APIs, own cooldowns |
| Internal feedback | Users think private feedback is store review | Separate labels and flows; store context and app version |
| Bulk exercise images | Duplicates and orphaned assets | Deterministic `public_id`, idempotent imports, orphan reports |
| Cloudinary security | Leaked upload preset/API secret | Signed backend uploads, strict preset controls, no secrets in frontend |
| Mobile image delivery | Large image payloads | Upload validation, Cloudinary transformations, thumbnail URLs, dimensions in DB |

## Sources

- OWASP API Security Top 10 2023, API4 Unrestricted Resource Consumption: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/  
  **Confidence:** HIGH for rate limits, payload limits, and provider-cost controls.
- Google Play In-App Review API documentation: https://developer.android.com/guide/playcore/in-app-review  
  **Confidence:** HIGH for Android review prompt timing, design, and quota behavior.
- Apple Requesting App Store Reviews / Ratings and Reviews: https://developer.apple.com/documentation/storekit/requesting_app_store_reviews/ and https://developer.apple.com/app-store/ratings-and-reviews/  
  **Confidence:** HIGH for iOS review timing, annual prompt limit, and standardized prompt expectations.
- Expo Camera documentation: https://docs.expo.dev/versions/latest/sdk/camera/  
  **Confidence:** HIGH for barcode callback behavior and barcode data handling.
- Open Food Facts API documentation: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/  
  **Confidence:** HIGH for external food database limitations and staging/production use.
- GS1 US Product Data Quality guidance: https://www.help.gs1us.org/product-data-quality  
  **Confidence:** HIGH for GTIN/product-data quality risks.
- FDA Label Claims for Conventional Foods and Dietary Supplements: https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/label-claims-conventional-foods-and-dietary-supplements  
  **Confidence:** MEDIUM for general health-claim risk framing; not Vietnam-specific legal advice.
- Vietnam Circular No. 43/2014/TT-BYT on functional foods, English translation: https://thuviennhadat.vn/vbpl/circular-no-43-2014-tt-byt-regulating-the-management-of-functional-foods-259930.html  
  **Confidence:** MEDIUM for local food-claim caution; final copy should be approved by product/legal.
- Cloudinary Upload API and Admin API documentation: https://cloudinary.com/documentation/upload_images and https://cloudinary.com/documentation/admin_api  
  **Confidence:** HIGH for signed/unsigned upload security and operational asset-management concerns.

## Research Flags for Roadmap

- **Phase 1 needs deeper threat modeling before implementation.** It controls money, AI spend, and campaign leakage. Require abuse cases, rate-limit numbers, and entitlement expiry rules before coding.
- **Phase 2 needs a product decision on barcode data provider.** Open Food Facts is useful but incomplete; a curated local/Ủ product table should be the trusted source for branded products.
- **Phase 3 needs final Vietnamese copy review.** Engineering can enforce rule logic, but product/legal must approve claims and disclaimers.
- **Phase 4 is standard implementation if platform APIs are used.** Risk is mostly prompt timing and policy compliance, not architecture.
- **Phase 5 needs operational design, not just upload buttons.** Idempotent import, stable asset IDs, QA state, and rollback prevent long-term content debt.
