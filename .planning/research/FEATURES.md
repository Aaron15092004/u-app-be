# Feature Landscape: Ủ App v2.0 New Features

**Domain:** Vietnamese plant-based health app commercial feature release
**Researched:** 2026-05-26
**Scope:** v2.0 new features only; do not revisit v1 fundamentals except as dependencies.
**Overall confidence:** HIGH for app-review/barcode platform behavior and existing-app dependencies; MEDIUM for campaign-code business rules because final packaging/printing workflow is product-specific.

## Executive Recommendation

Ship v2.0 as five practical additions to the existing app, not as a platform rewrite. The fastest valuable release is: admin campaign code generation, user code entry/QR scan, entitlement check that bypasses the current AI scan daily limit, BMI milk recommendation with saved flavor, barcode lookup as an alternate food logging path, native-safe rating prompt plus internal feedback, and bulk exercise image operations in admin.

The critical product rule: redeem codes should grant a time-boxed entitlement, not mutate the global scan limit. Keep the current 20 AI scans/day rule as the default free-tier guardrail, then add a server-side `hasUnlimitedAiScansUntil` check when a valid code is redeemed. This keeps the campaign feature isolated, testable, and reversible.

For urgent launch, avoid anything that depends on printing vendor integration, e-commerce, nutrition claims, app-store review manipulation, or perfect packaged-food coverage in Vietnam. Those are where the schedule will slip.

## Table Stakes

Features users or admins will expect for these v2.0 items. Missing = the feature feels broken or creates support load.

| Feature | Admin Perspective | User Perspective | Why Expected | Complexity | Existing Dependency | Fast Launch Scope |
|---------|-------------------|------------------|--------------|------------|---------------------|-------------------|
| Campaign list | Admin creates and views campaigns by name, expiry window, quantity, status, notes | No direct UI | Bulk codes need grouping for support and reporting | Medium | Admin auth/dashboard, MongoDB | Build simple list/detail; no advanced analytics |
| Bulk redeem code generation | Admin enters quantity, expiry start/end or duration, optional prefix, max redemptions/code default 1 | No direct UI until code is printed/shared | Bottled campaigns require hundreds/thousands of unique codes | Medium | Backend admin routes, requireAdmin | Generate opaque random codes server-side; CSV export |
| QR code export | Admin downloads QR images or CSV containing code + QR payload URL/text | User scans QR from bottle label/cap card | QR is table stakes for physical campaigns | Medium | Admin upload/download patterns; mobile camera | Export CSV first plus optional ZIP of PNGs; QR payload is deep link or raw code |
| Code status tracking | Admin sees generated, redeemed, expired, revoked counts; can search by code | User gets clear messages: activated, already used, expired, invalid | Support needs to answer "why does this code not work?" | Medium | User model, campaign/code collections | Counts + searchable table; defer per-user analytics charts |
| User manual code entry | No direct UI | User types code if QR fails | Camera failure and damaged QR codes are common | Low | Authenticated mobile user; API client | Add entry form on scan-limit/paywall or profile benefits screen |
| User QR scan for redeem | No direct UI | User scans campaign QR and sees benefit unlocked | Expected from QR campaign | Medium | `expo-camera`, route/deep-link support | Reuse scanner component; debounce duplicate scans |
| Server-side entitlement enforcement | Admin can trust redemption limits | User receives unlimited AI scans until expiry | Client-only unlocks are easy to bypass | Medium | Existing food scan rate limit, auth middleware | Add entitlement check in food scan endpoint before daily limit rejection |
| Entitlement visibility | Admin sees active expiry on user/detail or redemption record | User sees "Unlimited scans active until DD/MM/YYYY" | Reduces confusion and support | Low | Profile/home data APIs | One banner/card; no subscription-style benefits page |
| BMI milk recommendation | Product/admin can encode official flavor rules | User sees recommended Ủ milk based on BMI and needs | Turns health tracking into product guidance | Low-Medium | Existing BMI value, profile storage | Static rule table in backend or config; no CMS needed initially |
| Save selected flavor | Admin can later segment users by preference | User chooses/saves flavor; app remembers it | Recommendation without saved choice feels temporary | Low | User profile model/API | Store one `selectedMilkFlavor` enum/string + timestamp |
| Need-based secondary recommendations | No direct UI unless rules managed later | User can select concerns: stress/sleep, skipping breakfast/quick energy | Product rules include "any BMI" flavors by need | Medium | Profile/edit screen or BMI screen | Use two optional chips; no full health questionnaire |
| Barcode scan food lookup | Admin may add barcode field to food items | User scans packaged food barcode and logs result | Common nutrition-app workflow | Medium | Existing food database, food log save flow, camera permission | Local DB lookup first, Open Food Facts fallback, manual fallback |
| Barcode fallback states | Admin can add missing product manually later | User sees "not found" with manual search option | Packaged food databases are incomplete, especially for local products | Low | Manual search screen | Always provide manual search/create-from-scan path |
| Rating prompt trigger | Admin/product defines eligible moments | User sees prompt after successful useful actions, not at app launch | Platform guidance expects timing after positive engagement | Medium | Mobile usage events/local storage | Trigger after 3 successful actions and cooldown |
| Native app-store review flow | No admin UI | User can rate through OS-native flow when appropriate | Required for store-safe public ratings | Medium | iOS/Android native modules or Expo-compatible package | Use native review API where available; do not force display |
| Internal feedback capture | Admin can view comments and low-star feedback | User can leave comment when not ready for store review | Useful for app improvement without manipulating store rating | Medium | Backend CRUD/admin dashboard | Store stars/comment internally; only request native review after compliant timing |
| Exercise bulk image management | Admin can update many exercise images efficiently | User sees better exercise images | Current one-by-one upload does not scale to hundreds | Medium-High | Exercise CRUD, Cloudinary upload | Bulk upload/map by filename + missing-image filter |
| Image validation and preview | Admin catches wrong/missing images before save | User sees fewer broken images | Bulk media changes are error-prone | Medium | Cloudinary, admin UI | Validate type/size/dimensions; preview grid; defer AI matching |

## Differentiators

Features that make v2.0 feel like a branded Ủ commercial release rather than generic health-app maintenance.

| Feature | Value Proposition | Complexity | Recommendation |
|---------|-------------------|------------|----------------|
| Milk campaign entitlement tied to physical bottles | Connects retail product purchase to app utility; clear growth loop | Medium | Build now; this is the core v2.0 business feature |
| BMI-to-Ủ-flavor guidance | Converts BMI tracking into a specific product suggestion | Low-Medium | Build now, but frame as "gợi ý" not medical treatment |
| Need chips over long questionnaire | Lets stress/sleep and breakfast/energy rules influence recommendations without onboarding friction | Low | Build now if UI time allows; otherwise default to BMI-only primary plus secondary options |
| Unified scanner entry point | One camera screen can scan AI food photo, food barcode, and redeem QR | Medium | Build if feasible; otherwise separate buttons using same camera package |
| Admin missing-image queue | Admin can filter exercises without images and process them in batches | Medium | Build now; likely highest ROI for "hundreds of records" |
| Campaign support view | Admin can search a code and see reason it failed | Medium | Build now; prevents operational chaos after bottles are distributed |

## Anti-Features

Explicitly do not build these for urgent v2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Reusable public promo codes | Codes leak online and destroy campaign control | Generate unique single-use codes by default |
| Guessable short numeric codes | Brute force and support abuse risk | Use opaque random codes, normalized for entry, with rate limits |
| Client-side unlimited scan flag only | Users can bypass or stale-cache entitlement | Enforce entitlement only in backend scan endpoint |
| Code unlock with no expiry display | Users will think scans are broken when window ends | Show exact expiry date/time in app |
| Payment/subscription framework | Not needed for bottled milk campaign and adds store policy complexity | Treat codes as promotional entitlement for physical product campaign |
| Full coupon/loyalty platform | Too broad for urgent launch | Campaign, code, redemption, entitlement only |
| Nutritional or medical claims for milk | BMI/product claims can create regulatory and trust risk | Use "gợi ý theo BMI và nhu cầu" with neutral disclaimer |
| AI-generated product recommendation text | Risky health wording and inconsistent brand claims | Use fixed product-approved copy |
| Creating missing barcode products from Open Food Facts writes | Write APIs/auth and data moderation add scope | Read Open Food Facts only; let admins add local products manually |
| Blocking food logging when barcode not found | Barcode coverage is incomplete | Offer manual search and AI photo scan fallback |
| Custom fake app-store rating modal that routes only happy users to stores | Platform review gating risk and dark-pattern smell | Separate internal feedback from native review request timing |
| Asking for reviews at app launch or after errors | Bad UX and lower quality ratings | Ask after successful scan/log/workout/BMI-save moments |
| Bulk image auto-matching by AI vision | High error risk and new AI workflow | Use deterministic filename/SKU/exercise-code matching first |
| Deleting/replacing images without audit trail | Bulk mistakes are hard to unwind | Keep previous URL, updatedBy, updatedAt, and dry-run preview |

## Feature Details

### 1. Bulk Redeem Codes / QR Codes for Bottled Milk Campaigns

**Typical admin workflow**

1. Admin opens `Campaigns` in the dashboard.
2. Admin creates a campaign: name, internal notes, code quantity, campaign start, campaign expiry, unlock duration/expiry behavior, optional code prefix, and status draft/active.
3. Backend generates random opaque codes, stores only normalized code values and campaign metadata, and marks them unredeemed.
4. Admin exports CSV for printer/vendor. Minimum columns: `campaignName`, `code`, `qrPayload`, `expiresAt`.
5. Optional but useful: admin downloads QR PNG ZIP for small campaigns. For large campaigns, CSV is usually more practical for print vendors.
6. Admin can activate/pause/revoke campaign and search an individual code.
7. Admin can see counts: generated, redeemed, active entitlements, expired, revoked.

**Typical user workflow**

1. User taps "Nhập mã" or "Quét QR" from one of these entry points: scan-limit message, food scan screen, profile benefits, or campaign banner.
2. If scanning, camera reads QR. If typing, user enters normalized code; app accepts lower/upper case and ignores spaces/hyphens.
3. Backend validates code: exists, campaign active, within redeem window, not revoked, not already redeemed by another user, not expired.
4. On success, backend creates redemption record and sets or extends user entitlement through the code's expiry window.
5. App shows success state with exact expiry: "Bạn đã mở khóa quét AI không giới hạn đến 23:59, 30/06/2026."
6. During food AI scan, backend checks active entitlement before applying the current daily scan cap.

**Recommended business rules**

| Rule | Recommendation | Rationale |
|------|----------------|-----------|
| Code cardinality | Single-use by default | Physical bottle codes are campaign inventory; reuse invites leakage |
| Same user rescans same code | Return success/idempotent state | Avoid punishing accidental repeat scans |
| Different user scans redeemed code | Reject with "Mã đã được sử dụng" | Clear support message |
| Multiple valid codes per user | Extend to max(existingUntil, newExpiry) for fixed-window campaigns; add duration only if product explicitly wants stacking | Fixed expiry is simpler for printed campaigns |
| QR payload | Prefer app deep link containing code, fallback raw code | Deep link opens app directly; raw code still works if scanned externally |
| Code storage | Store normalized code; for higher security store hash + last4 | Hashing prevents full code leakage from DB exports |
| Abuse controls | Rate limit redeem attempts per user/IP/device | Prevent brute force against code space |

**Complexity:** Medium. The hard parts are edge cases, auditability, and print/export workflow, not QR generation.

**Dependencies on existing app**

- Admin dashboard auth and `requireAdmin` routes exist.
- Mobile auth exists; redemptions should require logged-in users.
- Food AI scan endpoint already has daily rate limiting; add entitlement bypass there.
- `expo-camera` is already installed for food scan and can scan QR/barcodes.

**Release-scope cuts**

- Build CSV export first; QR ZIP only if marketing needs image files immediately.
- Defer campaign analytics beyond counts.
- Defer printer/vendor API integration.
- Defer partial redemption, transfer, gifting, or referral logic.
- Defer "campaign templates"; one create form is enough.

### 2. BMI-Based Ủ Nut Milk Recommendation + Stored Flavor

**Product rule table**

| Condition | Recommended Flavor | Notes |
|-----------|--------------------|-------|
| BMI > 23 | Rau má sữa dừa | Primary recommendation for above-normal BMI per product rule |
| Any BMI; especially stress/sleep | Rau má - Hạt sen | Secondary recommendation when user selects stress/sleep need |
| BMI 18.5-22.9 | Gạo lứt - Mè đen - Hạt sen | Primary recommendation for normal BMI range per product rule |
| BMI < 18.5 | Gạo lứt - Óc chó - Hạnh nhân | Primary recommendation for underweight BMI per product rule |
| Any BMI; especially skipping breakfast/quick energy | Hạt sen - Óc chó | Secondary recommendation when user selects breakfast/energy need |

**Typical admin/product perspective**

- For urgent v2.0, rules can be static constants reviewed by product, not admin-editable.
- Admin does not need a CMS unless flavors change frequently.
- Product copy should be fixed, Vietnamese, and neutral: "Gợi ý phù hợp với chỉ số BMI và nhu cầu bạn chọn" rather than treatment language.

**Typical user workflow**

1. User already has BMI from the existing BMI screen/profile.
2. App shows a milk recommendation card on BMI screen and optionally Home.
3. User can choose optional need chips: "Stress / khó ngủ" and "Bỏ bữa sáng / cần năng lượng nhanh".
4. App displays one primary recommendation from BMI and up to two secondary recommendations from need chips.
5. User taps "Chọn vị này"; backend stores `selectedMilkFlavor`, `selectedMilkFlavorReason`, and timestamp.
6. The selected flavor is visible in profile or BMI screen and can be changed.

**Rule resolution recommendation**

Use deterministic priority:

1. BMI-specific product is primary when BMI is available.
2. Need-based "any BMI" products are secondary.
3. If BMI is missing, show the two "any BMI" options and prompt user to update BMI for a more tailored suggestion.

**Complexity:** Low-Medium. Data model and UI are simple; the risk is health-claim wording.

**Dependencies on existing app**

- Existing BMI computation and profile height/weight.
- Existing user profile API can be extended for selected flavor.
- Home/BMI screens already have relevant entry points.

**Release-scope cuts**

- Static rule table in code or config; no admin rule editor.
- No product inventory, checkout, or order flow.
- No personalized meal-plan claims.
- No AI-generated recommendation explanations.
- No push campaign based on selected flavor in first urgent release.

### 3. Barcode Scan to Supplement Food Scanning

**Typical user workflow**

1. User opens Food Scan and chooses `Barcode` mode, or app provides separate "Quét mã vạch" action.
2. Camera scans EAN/UPC barcode.
3. Backend first looks up local `FoodItem.barcode`.
4. If missing locally, backend calls Open Food Facts product API by barcode.
5. App maps product name, brand, serving size, kcal/macros when available into the existing food result/logging UI.
6. User confirms serving size and saves to FoodLog.
7. If not found or incomplete, app offers manual search and AI photo scan.

**Typical admin workflow**

- Food item CRUD gains optional `barcode`, `brand`, `servingSize`, and `source`.
- Admin can add/edit packaged products manually when scans fail.
- For fast launch, no admin moderation queue is required, but a "not found" count/event would help later.

**Table stakes behavior**

| Behavior | Recommendation |
|----------|----------------|
| Scanner debounce | Disable handler after first valid scan until lookup completes |
| Supported codes | Start with EAN-13, EAN-8, UPC-A/UPC-E where platform supports them |
| Data source order | Local DB first, Open Food Facts second, manual fallback third |
| API boundary | Mobile sends barcode to backend; backend calls external API |
| Logging | Save barcode source as `barcode` or `openfoodfacts` for traceability |
| Missing nutrition | Let user log only if kcal/macros are sufficiently present or editable |

**Complexity:** Medium. Camera scan is straightforward; nutrition data normalization is the real work.

**Dependencies on existing app**

- Existing `FoodItem` model and admin food database.
- Existing manual search and FoodLog save flow.
- Existing camera permission and `expo-camera`.
- Existing backend API proxy pattern for food features.

**Release-scope cuts**

- Read-only Open Food Facts integration.
- Do not attempt full Vietnamese packaged-food coverage.
- Do not add crowd-sourced product creation from mobile in v2.0.
- Do not block users when external data is incomplete; fallback to manual search.

### 4. App Rating Prompt with Stars and Comment

**Important platform distinction**

There are two separate things:

1. **Internal feedback:** custom stars/comment stored in Ủ backend for product/admin review.
2. **Public store review:** OS-native App Store / Google Play review request. The app can request it, but the platform decides whether to display it and limits frequency.

Do not build a flow that filters only 5-star users into public store review and hides review options from lower-star users. Keep internal feedback useful, and request native review only at compliant, positive moments.

**Typical user workflow**

1. User completes meaningful actions: saves AI scan, logs barcode food, completes workout, saves BMI, redeems code successfully.
2. After threshold is reached, app shows a lightweight internal feedback sheet: star rating plus optional comment.
3. If user submits positive feedback and platform/cooldown conditions allow, app may call native review request API at a natural moment. The app must tolerate no dialog appearing.
4. If user submits low rating/comment, thank them and store feedback for admin; do not nag immediately.

**Typical admin workflow**

- Admin can view feedback list: stars, comment, app version, platform, feature trigger, created date, user ID/email if allowed.
- Admin can filter low ratings and mark reviewed/resolved.
- For urgent launch, feedback can live in a simple admin table; no ticketing integration.

**Trigger recommendation**

| Trigger | Use? | Notes |
|---------|------|-------|
| App launch | No | Too early and intrusive |
| After first successful AI scan save | Maybe | Good moment, but wait until user has used a few features |
| After redeem success | Maybe | Positive moment, but avoid asking immediately if user is trying to scan food |
| After workout completion | Yes | Clear success moment |
| After 3 successful feature actions | Yes | Best default threshold |
| After error, invalid code, scan failure | No | Bad timing |

**Complexity:** Medium. Internal feedback is easy; native store review requires platform-aware implementation and cooldown storage.

**Dependencies on existing app**

- Existing mobile screens with success events.
- Existing profile/admin dashboard for feedback review.
- App version/platform metadata from mobile runtime.

**Release-scope cuts**

- Build internal feedback table and one prompt trigger threshold.
- Use native review request API if available; no custom public-review routing.
- Defer sentiment analysis, notifications to admin, and response workflow.
- Store local cooldown so the prompt does not repeat aggressively.

### 5. Easier Image Management for Hundreds of Exercise Records

**Typical admin workflow**

1. Admin opens Exercises and filters "Thiếu ảnh" or "Ảnh lỗi".
2. Admin bulk uploads images.
3. System matches images to exercises by deterministic filename convention: exercise slug/code/id.
4. Admin reviews preview grid: exercise name, current image, proposed image, match status.
5. Admin confirms selected matches.
6. Backend uploads to Cloudinary, updates exercise `imageUrl`, and records audit metadata.
7. Admin can export missing-image list for content team.

**Recommended filename convention**

Use deterministic naming for urgent launch:

```text
<exerciseSlug>.jpg
<exerciseId>.jpg
<category>__<exerciseSlug>.jpg
```

Avoid fuzzy matching in v2.0. For hundreds of records, predictable naming beats clever matching.

**Table stakes behavior**

| Behavior | Recommendation |
|----------|----------------|
| Missing-image filter | Required |
| Bulk upload | Required |
| Preview before commit | Required |
| Validation | Enforce image type, max size, and reasonable dimensions |
| Audit | Store previous URL, new URL, updatedBy, updatedAt |
| Retry | Failed uploads should not abort successful independent files |
| Delete old Cloudinary images | Defer unless storage cost is urgent |

**Complexity:** Medium-High. Upload UI, batching, and partial failure handling need care.

**Dependencies on existing app**

- Existing `Exercise.imageUrl`.
- Existing admin upload endpoint and Cloudinary service.
- Existing admin exercise table and form.

**Release-scope cuts**

- Build missing-image queue + bulk deterministic matching.
- Defer drag-and-drop reordering and crop editor.
- Defer AI image generation or AI matching.
- Defer CDN transformation management beyond current Cloudinary defaults.

## Feature Dependencies

```text
Existing auth + admin role
  -> Campaign admin routes
  -> Bulk code generation
  -> Redemption audit/support

Existing mobile auth
  -> User code redemption
  -> Entitlement stored per user
  -> Food AI scan limit bypass

Existing expo-camera
  -> QR redeem scan
  -> Barcode food scan

Existing FoodItem + FoodLog
  -> Barcode lookup
  -> Barcode result confirmation
  -> Food diary save

Existing BMI save/profile
  -> Milk recommendation
  -> Store selected flavor

Existing admin exercise CRUD + Cloudinary
  -> Missing image queue
  -> Bulk upload/match/update

Feature success events
  -> Internal feedback prompt
  -> Native app review request timing
```

## MVP Recommendation

Prioritize in this order for a fast urgent launch:

1. **Redeem code entitlement backend first**
   - Campaign/code/redemption models.
   - Admin generate/export/search.
   - Mobile enter/scan redeem.
   - Food AI scan endpoint bypasses current daily cap when entitlement is active.

2. **BMI milk recommendation**
   - Static product rule table.
   - Recommendation card on BMI screen.
   - Save selected flavor to profile.

3. **Barcode scan**
   - Add barcode field to food items.
   - Camera barcode mode.
   - Local lookup + Open Food Facts fallback.
   - Reuse existing confirm/save food log UI.

4. **Exercise image management**
   - Missing-image filter.
   - Bulk upload with deterministic filename matching.
   - Preview and confirm.

5. **Rating/feedback prompt**
   - Internal stars/comment after threshold.
   - Admin feedback list.
   - Native review API call only after compliant timing.

## Release-Scope Cuts

Cut these from urgent v2.0 unless explicitly required by launch operations:

| Cut | Reason |
|-----|--------|
| QR PNG ZIP for very large campaigns | CSV with QR payload is usually enough for print vendors |
| Campaign revenue attribution dashboard | Counts/search solve launch operations |
| Admin-editable milk recommendation rules | Static product rules are known and faster |
| Barcode crowd-sourcing | Needs moderation and data quality controls |
| Full Open Food Facts write/contribution integration | Not needed for logging packaged food |
| In-app purchase/subscription unlocks | Campaign code unlock is not a digital subscription launch |
| Rating prompt A/B testing | Premature for urgent release |
| AI auto-matching/generating exercise images | Higher error/risk than deterministic bulk upload |
| Mobile exercise image upload | Admin-only content workflow is enough |

## Suggested Phase Split

| Phase | Name | Delivers | Rationale |
|-------|------|----------|-----------|
| 1 | Campaign Entitlements | Models, admin generation/export, mobile redeem, scan-limit bypass | Highest business urgency and deepest dependency surface |
| 2 | Product Recommendations | BMI milk rules, selected flavor persistence, UI card | Fast product value using existing BMI infrastructure |
| 3 | Barcode Food Scan | Barcode camera mode, local/OFF lookup, log confirmation | Complements food scanning after entitlement path is stable |
| 4 | Admin Media Operations | Missing-image queue, bulk image upload/match, audit | Admin productivity, isolated from user flows |
| 5 | Feedback and Ratings | Internal feedback, admin review table, native review request | Low dependency, can ship last or partly cut |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Redeem campaigns | MEDIUM-HIGH | Standard promo-code pattern; exact printing/export needs product/vendor confirmation |
| BMI recommendation | HIGH | Product rules are explicit; implementation is straightforward |
| Barcode scan | HIGH | Existing stack has `expo-camera`; Open Food Facts supports product lookup by barcode, but Vietnam coverage may be incomplete |
| Rating prompt | HIGH | Apple/Google docs clearly define native review request constraints and quotas |
| Exercise image admin workflow | HIGH | Existing admin CRUD/upload makes this an incremental workflow improvement |

## Open Questions for Planning

- Should a campaign code unlock until a fixed campaign expiry, or for N days after redemption? Fixed expiry is recommended for bottle campaigns unless product wants stacking.
- Will the printer/vendor accept CSV with QR payload, or do they require PNG/SVG files generated by the app?
- What exact QR payload should be printed: raw code, universal link, or custom deep link? Universal link is best for production but may take setup time.
- Should selected milk flavor be visible/editable in Profile, BMI screen, or both?
- Which packaged-food nutrition fields are required before allowing barcode result save?
- Do admins need to replace existing exercise images in bulk, or only fill missing images?

## Sources

- Local project context: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, existing backend/mobile/admin packages and admin CRUD implementation. Confidence: HIGH.
- Apple Developer Documentation, `SKStoreReviewController.requestReview(in:)`: platform controls whether review UI appears, limits display frequency, and warns not to call directly from a button tap. https://developer.apple.com/documentation/StoreKit/SKStoreReviewController/requestReview%28in%3A%29 Confidence: HIGH.
- Google Play In-App Review API: lets apps request in-app ratings/reviews without leaving the app; Google enforces quotas and design/timing guidance. https://developer.android.com/guide/playcore/in-app-review Confidence: HIGH.
- Open Food Facts API documentation: read operations for product lookup do not require authentication beyond a custom User-Agent; product endpoints support barcode lookup. https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ Confidence: HIGH.
- Open Food Facts product by barcode API v3 documentation. https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/ Confidence: HIGH.
- Expo Camera documentation: `CameraView`/camera APIs support barcode scanning and scan result data; platform barcode behavior differs. https://docs.expo.dev/versions/latest/sdk/camera/ Confidence: HIGH.
