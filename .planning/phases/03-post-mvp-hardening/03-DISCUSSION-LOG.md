# Phase 3: Post-MVP Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 3-Post-MVP Hardening
**Areas discussed:** QR redeem polish, Barcode hardening, Admin operations, Store review prompt, Exercise media workflow, Release edge cases & tests

---

## QR Redeem Polish

| Option | Description | Selected |
|--------|-------------|----------|
| Deep link first | QR opens URL; installed app handles redeem, web/fallback otherwise. | |
| In-app scanner | User opens app camera to scan QR. | |
| Both now | Deep link plus scanner polish. | |
| Manual code only | Reduce scope by keeping code entry only; no QR. | ✓ |

**User's choice:** Manual code only.
**Notes:** The user explicitly cut QR scope: "giảm scope bằng cách điền code thôi không cần mã QR". Follow-up choices locked manual-code polish and status-specific Vietnamese errors.

---

## Barcode Hardening

| Option | Description | Selected |
|--------|-------------|----------|
| Typed barcode + better review | Keep typed barcode but improve review/edit before save. | |
| Camera barcode scanner | Use camera to scan packaged-food barcode in app. | ✓ |
| Cache/backend quality first | Improve backend cache/provenance/local fallback first. | |
| Scanner + review | Scan with camera and review/edit before save. | |

**User's choice:** Camera barcode scanner.
**Notes:** Follow-up decisions: always open review before saving; backend should do cache DB + local-first lookup then external fallback.

---

## Admin Operations

| Option | Description | Selected |
|--------|-------------|----------|
| Campaign search/filter | Filter campaign codes by campaign/status/date/redeemed user/expiry. | |
| Export/audit | Better metadata exports and batch history. | |
| Operations dashboard | Totals, redeemed rate, active campaigns, near-expiry campaigns. | ✓ |
| Search/filter + export/audit | Operational tools without dashboard first. | |

**User's choice:** Operations dashboard for campaign/code.
**Notes:** Ratings should get feedback dashboard with average rating, distribution, and recent comments. Media admin should prioritize filename-based auto mapping.

---

## Store Review Prompt

| Option | Description | Selected |
|--------|-------------|----------|
| After 5-star internal rating | Most conservative positive-only trigger. | |
| After 4-5 stars | Broader positive feedback trigger. | ✓ |
| Success events + 4-5 stars | Requires more usage signals before native prompt. | |
| Do not implement | Keep internal ratings only. | |

**User's choice:** Trigger native store review after 4-5 star internal rating.
**Notes:** Cooldown/dismiss is 14 days. If native review is unavailable or does not display, show App Store / Google Play fallback link.

---

## Exercise Media Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Filename = exercise slug/id | Exact mapping; admin names files correctly. | ✓ |
| Fuzzy match by exercise name | More convenient but riskier. | |
| Both | Exact first, fuzzy fallback. | |

**User's choice:** Filename must equal exercise slug/id.
**Notes:** Exact match can apply directly without mandatory preview. Phase 3 only needs audit log; undo batch and soft replacement are deferred.

---

## Release Edge Cases & Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Redeem/quota abuse | Brute force, duplicate redeem, expired/revoked, quota reset. | ✓ |
| Barcode/provider failures | Timeout, missing data, stale cache, scanner permission. | |
| Media batch safety | Wrong filename, duplicate filename, failed upload, partial apply. | |
| All A→B→C | Broader ordered hardening sweep. | |

**User's choice:** Redeem/quota abuse first.
**Notes:** Anti-abuse should add rate limiting by user/IP. Verification should include backend integration tests plus mobile/admin typecheck.

---

## the agent's Discretion

- Choose exact UI placement for barcode scanner/review based on existing food scan navigation.
- Choose exact dashboard composition as long as selected metrics are visible.
- Choose store URL config mechanism for review fallback.

## Deferred Ideas

- QR redeem scanner and deep-link polish.
- Admin barcode data-quality moderation queue.
- Media batch undo/soft replacement.
- Automated E2E tests.
