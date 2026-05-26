# Roadmap — Ủ App v2.0

## Overview

**Project**: Ủ App — v2.0 urgent commercial feature release  
**Coverage**: 36/36 v2.0 requirements mapped  
**Granularity**: MVP-compressed (3 phases)  
**Last updated**: 2026-05-26  
**Phase numbering**: Reset to Phase 1 for v2.0

---

## Phases

- [x] **Phase 1: v2 Data Foundation** — Shared models, indexes, validation, contracts, and package additions for v2.0 features. (completed 2026-05-26)
- [ ] **Phase 2: MVP Fast Release Pack** — Ship the minimum commercial release: bulk campaign codes, manual redeem, high scan quota, external barcode lookup, saved Ủ milk preference, and internal rating.
- [ ] **Phase 3: Post-MVP Hardening** — Add scanner polish, external barcode fallback/cache, advanced admin operations, store review prompt, full media audit, and release-quality edge cases after MVP launch.

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

### Phase 2: MVP Fast Release Pack

**Goal**: Ship the fastest usable v2.0 MVP release by implementing only the minimum workflows needed for commercial milk-code activation, barcode-assisted food logging, Ủ milk preference capture, and lightweight feedback.  
**Depends on**: Phase 1  
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, CODE-07, CODE-08, CODE-09, CODE-10, CODE-12, BAR-01, BAR-02, BAR-03, BAR-04, BAR-05, BAR-06, BAR-07, MILK-01, MILK-02, MILK-03, MILK-04, MILK-05, MILK-06, RATE-01, RATE-02, RATE-03, RATE-04, RATE-05

**Success Criteria**:

1. Admin can create a campaign, generate bulk single-use codes, and export CSV rows that include raw code plus HTTPS redeem/QR payload data for printing.
2. User can enter a code manually in-app and receive clear Vietnamese success/error status; QR/deep-link handling is included only if it fits without delaying MVP.
3. Redemption is atomic: the same code cannot be redeemed twice, and revoked/expired codes never create entitlement.
4. `/api/food/scan` uses an entitlement-aware quota resolver so active users receive the finite high daily scan quota until `activeUntil`.
5. Barcode MVP uses an external provider such as Open Food Facts, preserves digit strings and leading zeros, and lets users log a save-ready result after basic serving/weight adjustment.
6. Profile-based Ủ milk MVP returns deterministic backend rules, displays safe Vietnamese non-medical copy, and persists the user's selected flavor.
7. Rating MVP lets users submit star/comment feedback after key success events and lets admin view stored entries.

**Plans**: TBD by `$gsd-plan-phase 2`

**Cut scope for speed**: full QR scanner polish, native store review prompt, exercise media operations, media batch audit/orphan cleanup, advanced admin filters, and non-critical UX edge cases move to Phase 3.

---

### Phase 3: Post-MVP Hardening

**Goal**: Harden the MVP release after launch with complete scanner flows, external data fallback, stronger admin operations, store review integration, media audit tooling, and edge-case coverage.  
**Depends on**: Phase 2  
**Requirements**: CODE-01 through CODE-12, BAR-01 through BAR-07, MILK-01 through MILK-06, MEDIA-01 through MEDIA-06, RATE-01 through RATE-05

**Success Criteria**:

1. QR/deep-link redeem flow is polished across supported devices and camera permission states.
2. Barcode lookup adds external provider fallback, caching, provenance display, and data-quality review for unknown/incomplete products.
3. Admin campaign, code, rating, and media screens gain search/filter/export/audit tools suitable for operations.
4. Native store review prompt is enabled only after positive internal feedback and respects platform policy.
5. Exercise media operations include batch status, replacement policy, orphan cleanup review, and rollback/audit metadata.
6. Edge cases from MVP launch are covered by regression tests and release notes.

**Milk rule baseline**:

| Flavor | BMI fit | Need group |
|--------|---------|------------|
| Rau má sữa dừa | BMI > 23 | Thanh nhiệt & kiểm soát cân nặng |
| Rau má - Hạt sen | Mọi chỉ số BMI | Giảm stress & ngủ ngon sâu giấc |
| Gạo lứt - Mè đen - Hạt sen | BMI 18.5-22.9 | Duy trì vóc dáng & đẹp da, chống lão hóa |
| Gạo lứt - Óc chó - Hạnh nhân | BMI < 18.5 | Bổ sung dinh dưỡng & tăng cường trí não |
| Hạt sen - Óc chó | Mọi chỉ số BMI | Phục hồi năng lượng & trí nhớ bền bỉ |

**Plans**: TBD by `$gsd-plan-phase 3`

**Research flags**: Validate real Vietnam barcode products, legal/product review of milk copy, QR scan behavior on target devices, and Cloudinary cleanup policy.

---

## Progress Table

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | v2 Data Foundation | 5/5 | Complete   | 2026-05-26 |
| 2 | MVP Fast Release Pack | 0/TBD | Pending | — |
| 3 | Post-MVP Hardening | 0/TBD | Pending | — |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| CODE-01 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-05 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-06 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-07 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-08 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-09 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-10 | Phase 2 MVP, Phase 3 hardening | Pending |
| CODE-11 | Phase 1 | Complete |
| CODE-12 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-01 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-05 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-06 | Phase 2 MVP, Phase 3 hardening | Pending |
| BAR-07 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-01 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-05 | Phase 2 MVP, Phase 3 hardening | Pending |
| MILK-06 | Phase 2 MVP, Phase 3 hardening | Pending |
| MEDIA-01 | Phase 3 hardening | Pending |
| MEDIA-02 | Phase 3 hardening | Pending |
| MEDIA-03 | Phase 3 hardening | Pending |
| MEDIA-04 | Phase 3 hardening | Pending |
| MEDIA-05 | Phase 3 hardening | Pending |
| MEDIA-06 | Phase 3 hardening | Pending |
| RATE-01 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-02 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-03 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-04 | Phase 2 MVP, Phase 3 hardening | Pending |
| RATE-05 | Phase 2 MVP, Phase 3 hardening | Pending |

**Total mapped: 36/36**

---

## Archived Previous Milestone

Previous v1.0 phase directories were archived to `.planning/milestones/v1.0-phases/` before resetting v2.0 phase numbering to Phase 1.

---

*Created: 2026-05-26*
*Updated: 2026-05-26 — compressed to Option C MVP fast release*
