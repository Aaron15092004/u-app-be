# Phase 2: MVP Fast Release Pack - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 2-MVP Fast Release Pack
**Areas discussed:** MVP cut line, redeem code flow, food scan quota + barcode MVP, milk/rating/media MVP

---

## MVP Cut Line

| Option | Description | Selected |
|--------|-------------|----------|
| 1A. Release kiếm tiền | Focus campaign code, redeem, and high quota scan first; keep other features minimal. | ✓ |
| 1B. Demo đủ feature | Give every feature a visible path, with less campaign polish. | |
| 1C. Cân bằng | Split effort equally across code, barcode, milk, rating, and media. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2A. Backend + UI tối thiểu | Every feature gets real API and basic UI; advanced filter/cache/audit deferred. | ✓ |
| 2B. Backend trước | Prioritize complete API/business logic; UI can be thin. | |
| 2C. UI demo trước | Prioritize visible mobile/admin screens, with simpler data behavior. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3A. Cắt polish/advanced | Keep core flow; defer QR polish, external barcode, native review, media audit, advanced admin filters. | |
| 3B. Cắt non-code features | Keep campaign code first; defer barcode/milk/rating/media if needed. | |
| 3C. Không cắt thêm | Try to ship the selected MVP package, accepting a larger Phase 2. | ✓ |

**User's choice:** `1A, 2A, 3C`
**Notes:** Phase 2 should be monetization-first but still deliver real backend plus minimum UI for selected MVP capabilities.

---

## Redeem Code Flow

| Option | Description | Selected |
|--------|-------------|----------|
| 4A. Campaign + bulk generate + CSV export | Enough for company operations without analytics. | ✓ |
| 4B. Chỉ bulk generate nhanh | Use a default campaign and skip detailed campaign form. | |
| 4C. Campaign đầy đủ hơn | Add search/filter/revoke in MVP. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 5A. Raw code + redeem URL | CSV contains raw code, campaign info, expiry policy, and HTTPS redeem URL. | ✓ |
| 5B. Raw code + QR payload metadata | Add QR payload metadata but not images. | |
| 5C. Raw code + QR image export | Backend generates QR image/ZIP. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 6A. Profile/Settings | Add manual redeem entry in Profile. | |
| 6B. Food scan paywall/quota screen | Show code entry when user reaches quota. | |
| 6C. Cả Profile và Food scan | Support both entry points. | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 7A. Link mở app/web fallback sau | CSV includes HTTPS URL; app supports manual input; scanner polish later. | ✓ |
| 7B. App nhận deep-link code | App prefills code from `redeem?code=...`. | |
| 7C. Full scan QR trong app | Camera scans QR and redeems directly. | |

**User's choice:** `4A, 5A, 6C, 7A`
**Notes:** QR image generation and in-app QR/deep-link polish are explicitly deferred.

---

## Food Scan Quota + Barcode MVP

| Option | Description | Selected |
|--------|-------------|----------|
| 8A. 1000 scans/day | Use Phase 1 high quota constant. | |
| 8B. 200 scans/day | More cost control, weaker "unlimited" claim. | |
| 8C. Config theo campaign | Flexible campaign-level limit. | |
| 8D. 30 scans/day | User-added option: entitlement means 30 AI scans/day. | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 9A. Chỉ cho scan tiếp | Minimal UI; no entitlement emphasis. | |
| 9B. Hiện badge trạng thái | Show active package badge and expiry date. | ✓ |
| 9C. Hiện màn entitlement riêng | Separate entitlement status screen. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 10A. Local FoodItem only | Use local barcode data only. | |
| 10B. Local + manual create | Unknown barcode can become a log but not FoodItem. | |
| 10C. Local + external fallback | More complete but larger. | |
| 10D. External provider | User-added option: use Open Food Facts or equivalent because local has no barcode data. | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 11A. Nếu local/external result đủ macro thì log ngay | Let user adjust serving/weight and save. | ✓ |
| 11B. Luôn mở màn review/edit | Safer but more UI work. | |
| 11C. Chỉ lookup, chưa save | Fastest but low user value. | |

**User's choice:** `8D(30 scan), 9B, 10D(openfoodfact hoặc cái external nào cũng được - local thì không có foods nào đâu), 11A`
**Notes:** External barcode provider is required for MVP value; local barcode-only is not acceptable.

---

## Milk / Rating / Media MVP

| Option | Description | Selected |
|--------|-------------|----------|
| 12A. BMI screen | Show recommendations after BMI calculation. | |
| 12B. Profile only | Keep UI small; user chooses in Profile. | ✓ |
| 12C. BMI + Profile | More complete but more UI. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 13A. App tự đề xuất 1 vị chính | Fast and low-choice. | |
| 13B. Hiển thị danh sách vị phù hợp + user chọn | Flexible and matches preference-saving goal. | ✓ |
| 13C. User tự chọn bất kỳ vị nào | Less algorithmic value. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 14A. Sau khi user lưu food log thành công | Tied to food scan core flow. | |
| 14B. Sau khi redeem code thành công | Tied to campaign success. | ✓ |
| 14C. Nút thủ công trong Profile | Easiest, no prompt logic. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 15A. Bulk update bằng CSV imageUrl | Fastest for hundreds of exercises. | |
| 15B. Admin multi-upload + gán thủ công đơn giản | Easier to use, more UI. | |
| 15C. Giữ form hiện tại, thêm filter missing image | Smallest change but weak for hundreds of items. | |
| 15D. Bỏ khỏi Phase 2 | User-added option: remove exercise image operations from MVP scope. | ✓ |

**User's choice:** `12B, 13B, 14B, 15D`
**Notes:** Exercise image operations are moved out of Phase 2 MVP scope.

---

## the agent's Discretion

- Choose the exact external barcode provider integration during research, with Open Food Facts as the default candidate.
- Choose exact admin/mobile screen organization following existing patterns.
- Choose concise Vietnamese copy for redeem, package badge, milk preference, and rating prompts.

## Deferred Ideas

- In-app QR scanner and deep-link polish.
- QR image/ZIP export.
- Native store review prompt.
- Advanced campaign/code/rating admin filters and analytics.
- Exercise image bulk operations and media audit workflow.
