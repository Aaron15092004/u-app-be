# Phase 1: v2 Data Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 1-v2 Data Foundation
**Areas discussed:** Redeem Code Foundation, Entitlement & Scan Attempt Model, Barcode Data Shape, Ủ Milk Preference Storage, Media Asset Foundation, Rating/Feedback Foundation

---

## Redeem Code Foundation

| Option | Description | Selected |
|--------|-------------|----------|
| Raw code export only | Raw code only appears during generate/export; DB stores hash only. | ✓ |
| Encrypted raw code | Raw code can be viewed later by admin through decryptable storage. | |
| Plaintext raw code | DB stores raw code plaintext. | |

**User's choice:** `1A`  
**Notes:** Locks hashed-at-rest code storage and one-time raw export behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| HTTPS redeem link | QR payload is an HTTPS URL such as `https://.../redeem?code=...`. | ✓ |
| App deep link | QR payload uses `uapp://redeem?code=...`. | |
| Raw code only | QR contains only the code string. | |

**User's choice:** `2A`  
**Notes:** Printed bottle QR should have fallback behavior beyond app-only deep links.

| Option | Description | Selected |
|--------|-------------|----------|
| Campaign fixed expiry | Entitlement ends at campaign expiry. | |
| N days after redeem | Entitlement duration starts when the user redeems. | ✓ |
| Deadline + duration | Campaign redemption deadline plus entitlement duration after redeem. | |

**User's choice:** `3B`  
**Notes:** Phase 1 model should support entitlement duration after redemption.

---

## Entitlement & Scan Attempt Model

| Option | Description | Selected |
|--------|-------------|----------|
| Full limit bypass + fair-use | Active entitlement bypasses daily limit but keeps backend fair-use. | |
| Very high daily quota | Active entitlement gets a very high daily quota. | ✓ |
| Bonus quota | Entitlement adds quota but is not positioned as unlimited. | |

**User's choice:** `4B`  
**Notes:** Product wording can say unlimited, but backend should model a high cap for cost control.

---

## Barcode Data Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Name + kcal | Allow save with only product name and calories. | |
| Name + kcal + macros | Require product name, kcal, protein, carbs, and fat. | ✓ |
| Full nutrition | Require macro and micronutrient completeness. | |

**User's choice:** `5B`  
**Notes:** Missing macro data should trigger review/manual fallback.

| Option | Description | Selected |
|--------|-------------|----------|
| FoodItem barcode strings | Add `FoodItem.barcodes: string[]` for local lookup. | ✓ |
| Separate BarcodeProduct | Use a separate model for barcode products. | |
| Both local array and cache model | Use `FoodItem.barcodes` plus `BarcodeProduct` external cache. | |

**User's choice:** `6A`  
**Notes:** Keep Phase 1 simple with array-of-string local lookup. Preserve leading zeros.

---

## Ủ Milk Preference Storage

| Option | Description | Selected |
|--------|-------------|----------|
| User.profile field | Store only current preference in embedded profile. | |
| NutMilkPreference model | Store preference in a separate model for history/analytics. | ✓ |
| Both profile field and history model | Store current embedded value plus history. | |

**User's choice:** `7B`  
**Notes:** History and analytics matter enough to justify a separate model.

| Option | Description | Selected |
|--------|-------------|----------|
| Static backend config | Recommendation rules live as type-safe backend constants/config. | ✓ |
| Seeded MongoDB rules | Rules are database documents seeded by script. | |
| Admin editable rules | Admin can edit recommendation rules immediately. | |

**User's choice:** `8A`  
**Notes:** Release fast; no admin-editable rules in Phase 1.

---

## Media Asset Foundation

| Option | Description | Selected |
|--------|-------------|----------|
| imageUrl + imageAssetId | Preserve `Exercise.imageUrl`, add optional `imageAssetId`. | ✓ |
| imageAssetId only | Replace image URL with asset resolution. | |
| imageUrl only | Avoid `MediaAsset` model. | |

**User's choice:** `9A`  
**Notes:** Mobile compatibility is required while enabling future media library.

| Option | Description | Selected |
|--------|-------------|----------|
| MediaAsset batch metadata | `MediaAsset` stores source, batchId, status, and basic metadata. | ✓ |
| MediaBatch model | Add separate model for preview/confirm/errors/rollback. | |
| No audit | Upload and set URL only. | |

**User's choice:** `10A`  
**Notes:** Keep Phase 1 lightweight; no separate batch model yet.

---

## Rating/Feedback Foundation

| Option | Description | Selected |
|--------|-------------|----------|
| User.profile feedback state | Embed prompt state in user profile. | |
| FeedbackPromptState model | Store prompt state in a separate model. | ✓ |
| Mobile local-only state | Store prompt status only on device. | |

**User's choice:** `11B`  
**Notes:** Separate backend prompt-state model avoids repeated prompts across devices/reinstalls.

| Option | Description | Selected |
|--------|-------------|----------|
| Internal first, store optional | Internal feedback is source of truth; store review optional after positive feedback. | ✓ |
| Internal only | No native store review in v2.0. | |
| Store review first | Native store review is primary. | |

**User's choice:** `12A`  
**Notes:** AppRating is internal feedback; native store review remains optional and policy-compliant.

---

## the agent's Discretion

- Exact model/service/route file names may follow existing codebase conventions.
- Exact DTO/type names may be chosen during planning.

## Deferred Ideas

None.
