# Requirements: Ủ App v2.0

**Defined:** 2026-05-26  
**Core Value:** AI food scanning + habit tracking trong một app đơn giản, đẹp, và bản địa hóa hoàn toàn tiếng Việt cho thị trường Việt Nam.

## v2.0 Requirements

### Campaign Codes & Scan Entitlements

- [x] **CODE-01**: Admin can create a campaign with name, description, active window, redemption expiry policy, scan entitlement duration, and status.
- [ ] **CODE-02**: Admin can generate bulk single-use redeem codes for a campaign with configurable quantity and human-readable labels.
- [ ] **CODE-03**: Admin can export generated codes as CSV containing code, campaign metadata, expiry, and QR/deep-link payload for bottle printing.
- [ ] **CODE-04**: Admin can search and filter codes by campaign, status, created date, redeemed user, and expiry state.
- [ ] **CODE-05**: Admin can revoke a campaign or individual code before redemption.
- [ ] **CODE-06**: User can redeem a campaign code by typing it manually in the mobile app.
- [ ] **CODE-07**: User can redeem a campaign code by scanning QR from a milk bottle.
- [ ] **CODE-08**: User sees clear Vietnamese redemption results for success, invalid, already used, expired, revoked, and unauthenticated states.
- [ ] **CODE-09**: User with an active entitlement can use AI food scan beyond the normal daily scan limit until the entitlement expires.
- [ ] **CODE-10**: User can view current scan entitlement status and exact active-until time in the app.
- [x] **CODE-11**: Backend stores redeem codes hashed at rest and redeems them atomically so the same code cannot be reused.
- [x] **CODE-12**: Backend applies anti-abuse controls for redemption attempts and fair-use protection for "unlimited" AI scan traffic.

### Barcode Food Scan

- [x] **BAR-01**: User can open barcode scan mode from the food scan flow.
- [ ] **BAR-02**: User can scan packaged-food barcodes with the existing camera infrastructure.
- [ ] **BAR-03**: Backend can look up barcode products from the local food database before calling an external fallback.
- [ ] **BAR-04**: Backend can query and cache Open Food Facts barcode results with normalized Vietnamese-compatible nutrition fields.
- [ ] **BAR-05**: User can review and edit barcode nutrition data before saving it as a food log.
- [ ] **BAR-06**: User can fall back to manual food search or AI image scan when barcode data is missing or incomplete.
- [x] **BAR-07**: Food logs created from barcode preserve source/provenance for later support and data-quality review.

### Ủ Milk Recommendation

- [x] **MILK-01**: Backend exposes deterministic Ủ milk recommendation rules based on BMI category and optional need signals.
- [ ] **MILK-02**: User can see recommended Ủ milk flavors after BMI calculation or from the BMI screen.
- [ ] **MILK-03**: Recommendation UI explains the suggestion in Vietnamese using product-preference wording, not medical treatment claims.
- [ ] **MILK-04**: User can choose and save one preferred Ủ milk flavor from the recommendation result.
- [ ] **MILK-05**: User's saved milk preference persists across app restarts and remains visible in profile/BMI context.
- [x] **MILK-06**: BMI rule boundaries are explicit and tested: BMI < 18.5, BMI 18.5-22.9, BMI > 23, plus any-BMI lifestyle options.

### Exercise Media Operations

- [x] **MEDIA-01**: Admin can view exercises missing images in a dedicated queue or filter.
- [ ] **MEDIA-02**: Admin can upload multiple exercise images through the existing signed backend upload flow.
- [ ] **MEDIA-03**: Admin can map uploaded images to exercises by deterministic filename or manual selection with preview before applying.
- [ ] **MEDIA-04**: Admin can confirm a batch image assignment and update exercise records without breaking existing `imageUrl` mobile compatibility.
- [ ] **MEDIA-05**: Admin can see image assignment status, upload errors, and batch audit metadata.
- [x] **MEDIA-06**: Backend prevents deletion or replacement from orphaning exercise images without an explicit safe path.

### App Feedback & Ratings

- [x] **RATE-01**: User is prompted for app feedback only after meaningful feature usage, not on first launch or after an error.
- [ ] **RATE-02**: User can submit a star rating and optional comment from inside the mobile app.
- [ ] **RATE-03**: User can dismiss the prompt and will not be repeatedly prompted within the cooldown window.
- [ ] **RATE-04**: Admin can view feedback entries with user, rating, comment, feature context, created date, and app version.
- [x] **RATE-05**: App can optionally trigger the native store review prompt after positive internal feedback when the platform supports it.

## Future Requirements

### Campaigns

- **CODE-F01**: Admin can view campaign revenue attribution and bottle batch analytics.
- **CODE-F02**: Admin can integrate directly with print vendors for QR assets.
- **CODE-F03**: User can stack, transfer, gift, or share entitlements.
- **CODE-F04**: App supports paid subscription or in-app purchase for scan entitlement.

### Barcode

- **BAR-F01**: Admin can moderate and enrich unknown barcode products from user submissions.
- **BAR-F02**: App writes corrected products back to a public barcode database.
- **BAR-F03**: App uses a paid commercial barcode nutrition database.

### Milk Recommendation

- **MILK-F01**: Admin can edit recommendation rules from dashboard.
- **MILK-F02**: App connects milk recommendation to inventory, checkout, or promotional campaigns.
- **MILK-F03**: App uses AI-generated personalized milk explanation.

### Media

- **MEDIA-F01**: Admin can crop, transform, or annotate exercise images in-app.
- **MEDIA-F02**: AI suggests the best image for each exercise.
- **MEDIA-F03**: Full digital asset manager with folders, tagging, and versioning.

### Feedback

- **RATE-F01**: Rating prompt A/B testing and advanced analytics.
- **RATE-F02**: Sentiment analysis and support-ticket workflow from comments.

## Out of Scope

| Feature | Reason |
|---------|--------|
| E-commerce checkout for Ủ milk | Milestone focuses on bottled-code activation and product guidance, not payments. |
| Subscription/paywall SDK | Code-based campaign entitlement is the urgent monetization path. |
| Admin-editable recommendation rule CMS | Static backend rules are faster and safer for release; product/legal copy can be reviewed in code. |
| Paid barcode database | Vietnam coverage must be validated with free/local data first. |
| QR vendor integration | CSV/deep-link export is enough for first print workflow unless operations proves otherwise. |
| Full media DAM | Missing-image queue and batch assignment solve the current hundreds-of-exercises pain. |
| Public store-review gating | App can ask for internal feedback, but cannot condition functionality on public review. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CODE-01 | Phase 2 | Complete |
| CODE-02 | Phase 2 | Pending |
| CODE-03 | Phase 2 | Pending |
| CODE-04 | Phase 2 | Pending |
| CODE-05 | Phase 2 | Pending |
| CODE-06 | Phase 2 | Pending |
| CODE-07 | Phase 3 hardening | Pending |
| CODE-08 | Phase 2 | Pending |
| CODE-09 | Phase 2 | Pending |
| CODE-10 | Phase 2 | Pending |
| CODE-11 | Phase 1 | Complete |
| CODE-12 | Phase 2 | Complete |
| BAR-01 | Phase 2 MVP, Phase 3 hardening | Complete |
| BAR-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-05 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-06 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-07 | Phase 2 MVP, Phase 3 hardening | Complete |
| MILK-01 | Phase 2 MVP, Phase 3 hardening | Complete |
| MILK-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-05 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-06 | Phase 2 MVP, Phase 3 hardening | Complete |
| MEDIA-01 | Phase 3 hardening | Complete |
| MEDIA-02 | Phase 3 hardening | Pending |
| MEDIA-03 | Phase 3 hardening | Pending |
| MEDIA-04 | Phase 3 hardening | Pending |
| MEDIA-05 | Phase 3 hardening | Pending |
| MEDIA-06 | Phase 3 hardening | Complete |
| RATE-01 | Phase 2 MVP, Phase 3 hardening | Complete |
| RATE-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-05 | Phase 3 hardening | Complete |

**Coverage:**
- v2.0 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after Phase 2 MVP scope discussion*
