# Roadmap — Ủ App v2.0

## Overview

**Project**: Ủ App — v2.0 urgent commercial feature release  
**Coverage**: 36/36 v2.0 requirements mapped  
**Granularity**: Standard (6 phases)  
**Last updated**: 2026-05-26  
**Phase numbering**: Reset to Phase 1 for v2.0

---

## Phases

- [ ] **Phase 1: v2 Data Foundation** — Shared models, indexes, validation, contracts, and package additions for v2.0 features.
- [ ] **Phase 2: Campaign Codes & Unlimited Scan Entitlements** — Admin creates bulk bottle codes; users redeem by text/QR; active entitlements bypass AI scan limit with safeguards.
- [ ] **Phase 3: Barcode Food Scan** — Users scan packaged-food barcodes, review nutrition, and log with local/external lookup fallback.
- [ ] **Phase 4: Ủ Milk Recommendation** — BMI-based Ủ milk suggestions with safe Vietnamese copy and saved user preference.
- [ ] **Phase 5: Exercise Media Operations** — Admin can bulk upload, map, preview, and audit exercise images for hundreds of records.
- [ ] **Phase 6: Feedback & Ratings** — In-app star/comment feedback, cooldown prompt logic, admin review table, optional native store review.

---

## Phase Details

### Phase 1: v2 Data Foundation

**Goal**: Establish v2.0 backend contracts and data foundations so later phases can build without schema churn or security shortcuts.  
**Depends on**: Existing v1 app complete  
**Requirements**: CODE-11

**Success Criteria**:

1. Backend has Mongoose models/indexes for Campaign, RedeemCode, UserScanEntitlement, AppRating, MediaAsset, and recommendation/preference storage.
2. RedeemCode stores only hashed code lookup material, never raw reusable code values beyond controlled generation/export response.
3. FoodItem and Exercise schemas support barcode/media additions while preserving existing mobile compatibility.
4. Shared validation schemas and API route scaffolds exist for campaign, barcode, recommendation, rating, and media domains.
5. Required packages are added narrowly: QR generation, CSV import/export, optional ZIP export only if needed, and mobile store review support.

**Plans**: TBD by `$gsd-plan-phase 1`

**Cross-cutting constraints**: Keep v2.0 in existing Expo/Express/Mongo/Cloudinary architecture; backend remains source of truth for entitlement, recommendation, barcode normalization, and rating persistence.

---

### Phase 2: Campaign Codes & Unlimited Scan Entitlements

**Goal**: Admins can generate milk-bottle redeem codes and users can redeem them to unlock time-boxed unlimited AI scans with backend cost and abuse controls.  
**Depends on**: Phase 1  
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, CODE-07, CODE-08, CODE-09, CODE-10, CODE-12

**Success Criteria**:

1. Admin can create a campaign, generate bulk single-use codes, export CSV with QR/deep-link payloads, and search/filter/revoke codes.
2. User can enter a code manually or scan a QR code from a milk bottle and receive clear Vietnamese status messaging.
3. Redemption is atomic: the same code cannot be redeemed twice, and revoked/expired codes never create entitlement.
4. `/api/food/scan` uses an entitlement-aware quota resolver so active users bypass the normal daily scan limit until `activeUntil`.
5. User can see entitlement status and expiry in-app, rendered in Vietnam time from UTC source data.
6. Redemption attempts and high scan volume remain rate-limited/fair-use protected despite the product wording "unlimited".

**Plans**: TBD by `$gsd-plan-phase 2`

**Research flags**: Decide fixed campaign expiry vs N days after redemption, stacking behavior, QR payload format, and whether CSV alone is enough for print operations.

---

### Phase 3: Barcode Food Scan

**Goal**: Food logging supports packaged-product barcode scan as a supplement to AI image scan and manual food search.  
**Depends on**: Phase 1, Phase 2 camera routing patterns  
**Requirements**: BAR-01, BAR-02, BAR-03, BAR-04, BAR-05, BAR-06, BAR-07

**Success Criteria**:

1. User can choose barcode mode in the food scan flow and scan common packaged-food barcodes through the existing camera stack.
2. Backend searches local FoodItem barcode fields first, then calls Open Food Facts fallback and caches normalized results.
3. Barcode values preserve leading zeros and are never stored as numbers.
4. Result screen clearly shows source/provenance and allows edit-before-log.
5. Unknown or incomplete barcode results offer manual search and AI image scan fallback without dead ends.
6. Saved food logs from barcode include source metadata for support and future data-quality review.

**Plans**: TBD by `$gsd-plan-phase 3`

**Research flags**: Test real Vietnam products and define minimum nutrition fields required before allowing save.

---

### Phase 4: Ủ Milk Recommendation

**Goal**: Users receive safe, deterministic Ủ milk flavor guidance from BMI and can save their preferred flavor.  
**Depends on**: Phase 1, existing BMI feature  
**Requirements**: MILK-01, MILK-02, MILK-03, MILK-04, MILK-05, MILK-06

**Success Criteria**:

1. Backend recommendation endpoint returns deterministic flavor options from BMI and optional need signals.
2. BMI screen displays recommendations with Vietnamese product-preference copy and a clear non-medical disclaimer.
3. Rule boundaries are implemented and tested: BMI < 18.5, BMI 18.5-22.9, BMI > 23, plus any-BMI options.
4. User can save one selected Ủ flavor and see it persist in BMI/profile context.
5. Recalculating BMI updates recommendations but does not silently overwrite the user's saved preference.

**Milk rule baseline**:

| Flavor | BMI fit | Need group |
|--------|---------|------------|
| Rau má sữa dừa | BMI > 23 | Thanh nhiệt & kiểm soát cân nặng |
| Rau má - Hạt sen | Mọi chỉ số BMI | Giảm stress & ngủ ngon sâu giấc |
| Gạo lứt - Mè đen - Hạt sen | BMI 18.5-22.9 | Duy trì vóc dáng & đẹp da, chống lão hóa |
| Gạo lứt - Óc chó - Hạnh nhân | BMI < 18.5 | Bổ sung dinh dưỡng & tăng cường trí não |
| Hạt sen - Óc chó | Mọi chỉ số BMI | Phục hồi năng lượng & trí nhớ bền bỉ |

**Plans**: TBD by `$gsd-plan-phase 4`

**Research flags**: Final product/legal review of Vietnamese copy, disclaimer, and BMI boundary handling.

---

### Phase 5: Exercise Media Operations

**Goal**: Admins can add and manage exercise images at scale without manually editing hundreds of exercise records one by one.  
**Depends on**: Phase 1, existing admin exercise CRUD  
**Requirements**: MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-04, MEDIA-05, MEDIA-06

**Success Criteria**:

1. Admin can filter exercises missing images and see a queue optimized for bulk work.
2. Admin can upload multiple images through signed backend upload and preview them before assignment.
3. Admin can map images to exercises by deterministic filename and manually correct mismatches.
4. Confirming a batch updates exercise records while preserving `imageUrl` compatibility for existing mobile screens.
5. Admin can inspect batch status, assignment errors, and audit metadata.
6. Backend prevents unsafe delete/replacement that would leave broken exercise image references.

**Plans**: TBD by `$gsd-plan-phase 5`

**Research flags**: Decide naming convention, rollback/audit needs, replacement policy, and Cloudinary orphan cleanup policy.

---

### Phase 6: Feedback & Ratings

**Goal**: Collect lightweight user feedback after meaningful feature usage and expose it to admins for release feedback loops.  
**Depends on**: Phase 1  
**Requirements**: RATE-01, RATE-02, RATE-03, RATE-04, RATE-05

**Success Criteria**:

1. Mobile prompt coordinator triggers only after meaningful success events and respects cooldown/dismissal state.
2. User can submit star rating and optional comment in Vietnamese UI.
3. Feedback is persisted with feature context, app version, and user metadata needed by admin support.
4. Admin can view and filter feedback entries.
5. Positive internal feedback can optionally trigger native store review through platform-supported API without gating or pressure.

**Plans**: TBD by `$gsd-plan-phase 6`

**Cuttable scope**: If schedule compresses, ship internal star/comment feedback first and defer native store review prompt.

---

## Progress Table

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | v2 Data Foundation | 2/5 | In Progress | — |
| 2 | Campaign Codes & Unlimited Scan Entitlements | 0/TBD | Pending | — |
| 3 | Barcode Food Scan | 0/TBD | Pending | — |
| 4 | Ủ Milk Recommendation | 0/TBD | Pending | — |
| 5 | Exercise Media Operations | 0/TBD | Pending | — |
| 6 | Feedback & Ratings | 0/TBD | Pending | — |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| CODE-01 | Phase 2 | Pending |
| CODE-02 | Phase 2 | Pending |
| CODE-03 | Phase 2 | Pending |
| CODE-04 | Phase 2 | Pending |
| CODE-05 | Phase 2 | Pending |
| CODE-06 | Phase 2 | Pending |
| CODE-07 | Phase 2 | Pending |
| CODE-08 | Phase 2 | Pending |
| CODE-09 | Phase 2 | Pending |
| CODE-10 | Phase 2 | Pending |
| CODE-11 | Phase 1 | Complete |
| CODE-12 | Phase 2 | Pending |
| BAR-01 | Phase 3 | Pending |
| BAR-02 | Phase 3 | Pending |
| BAR-03 | Phase 3 | Pending |
| BAR-04 | Phase 3 | Pending |
| BAR-05 | Phase 3 | Pending |
| BAR-06 | Phase 3 | Pending |
| BAR-07 | Phase 3 | Pending |
| MILK-01 | Phase 4 | Pending |
| MILK-02 | Phase 4 | Pending |
| MILK-03 | Phase 4 | Pending |
| MILK-04 | Phase 4 | Pending |
| MILK-05 | Phase 4 | Pending |
| MILK-06 | Phase 4 | Pending |
| MEDIA-01 | Phase 5 | Pending |
| MEDIA-02 | Phase 5 | Pending |
| MEDIA-03 | Phase 5 | Pending |
| MEDIA-04 | Phase 5 | Pending |
| MEDIA-05 | Phase 5 | Pending |
| MEDIA-06 | Phase 5 | Pending |
| RATE-01 | Phase 6 | Pending |
| RATE-02 | Phase 6 | Pending |
| RATE-03 | Phase 6 | Pending |
| RATE-04 | Phase 6 | Pending |
| RATE-05 | Phase 6 | Pending |

**Total mapped: 36/36**

---

## Archived Previous Milestone

Previous v1.0 phase directories were archived to `.planning/milestones/v1.0-phases/` before resetting v2.0 phase numbering to Phase 1.

---

*Created: 2026-05-26*
*Updated: 2026-05-26 — v2.0 roadmap created from research synthesis*
