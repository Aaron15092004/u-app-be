# Phase 6: Admin Web Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 6-Admin Web Dashboard
**Areas discussed:** Admin UI framework, Admin auth & seed, Image upload UX, Movement list editor

---

## Admin UI framework

| Option | Description | Selected |
|--------|-------------|----------|
| Ant Design | Table/Form/Modal/Upload sẵn có — phù hợp admin CRUD, nhanh nhất để ship | |
| shadcn/ui + Tailwind | Consistent với mobile NativeWind, đẹp hơn nhưng cần setup | ✓ |
| Plain CSS / MUI | Nhẹ nhưng tốn thời gian / React 18 quirks | |

**shadcn components:** Button, Input, Table, Form, Dialog, Toast, Badge, Card, Select, Textarea, Tabs, DropdownMenu, Checkbox, Switch, Pagination, Skeleton, Avatar (bộ đầy đủ)

**State management:** TanStack Query v5 (nhất quán với mobile)

**Token storage:** localStorage (internal tool, XSS risk thấp)

---

## Admin auth & seed

| Option | Description | Selected |
|--------|-------------|----------|
| Dùng lại /api/auth/login | Cùng endpoint, JWT có role, frontend check | ✓ |
| /api/admin/login riêng | Tách biệt nhưng duplicate logic | |

| Option | Description | Selected |
|--------|-------------|----------|
| Seed script | npm run seed:admin, ADMIN_EMAIL + ADMIN_PASSWORD từ env | ✓ |
| Manual MongoDB insert | Không cần code thêm nhưng không an toàn | |
| /setup first-run page | Phức tạp hơn | |

**requireAdmin:** mount toàn bộ /api/admin/* router (không per-route)

**Refresh token:** Có — reuse existing logic, admin không bị kick ra

---

## Image upload UX

| Option | Description | Selected |
|--------|-------------|----------|
| Backend proxy | Admin → /api/admin/upload → Cloudinary. Credentials an toàn | ✓ |
| Cloudinary Upload Widget | Direct browser → Cloudinary, cần unsigned preset | |

**Food items có ảnh:** Có (extends ADM-03, cùng upload endpoint)

**File size limit:** 5MB (consistent với Phase 4 multer config)

---

## Movement list editor

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic rows | Table với "+ Thêm động tác", delete per row | ✓ |
| JSON textarea | Nhanh cho dev nhưng không thân thiện | |

**User management scope:**
- User hỏi về premium system (QR voucher từ mua sữa hạt → unlock premium features)
- Quyết định v1: view + ban (isActive=false) + delete
- Premium system → deferred v2

---

## Claude's Discretion

None — tất cả quyết định đã được user chọn trực tiếp.

## Deferred Ideas

- **Premium system** (v2): QR voucher từ mua sản phẩm → admin kích hoạt premium user → thêm lượt scan AI, unlock tính năng trả phí. Cần User.isPremium, Voucher model, admin UI quản lý voucher.
- **Admin habit template CRUD** (v2): hiện tại hard-coded trong seed data.
