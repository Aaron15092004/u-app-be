# Phase 6: Admin Web Dashboard - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Web interface tại `admin/` cho admins quản lý nội dung: exercise library (CRUD + image), food database (CRUD + image), và user list (view + ban + delete). Admin đăng nhập bằng email/password — reuse `/api/auth/login`, role check phía frontend. Không build e-commerce, không premium system trong v1.

</domain>

<decisions>
## Implementation Decisions

### D-84 — D-87: Admin Frontend Stack
- **D-84:** Admin UI library: **shadcn/ui + Tailwind CSS** — `admin/` skeleton đã có React 18 + Vite + react-router-dom v6 + axios; cài thêm shadcn/ui + Tailwind.
- **D-85:** shadcn/ui components cần cài: Button, Input, Table, Form, Dialog, Toast, Badge, Card, Select, Textarea, Tabs, DropdownMenu, Checkbox, Switch, Pagination, Skeleton, Avatar.
- **D-86:** Data fetching: **TanStack Query v5** — nhất quán với mobile (useQuery/useMutation pattern).
- **D-87:** Admin JWT token: **localStorage** — internal tool, XSS risk thấp hơn public app. Lưu cả accessToken + refreshToken.

### D-88 — D-91: Admin Auth
- **D-88:** Admin login: **reuse `/api/auth/login`** — cùng endpoint với mobile, JWT trả về có `role: 'admin'`. Frontend admin kiểm tra role sau khi login, redirect về `/` nếu không phải admin.
- **D-89:** Admin account đầu tiên: **seed script `npm run seed:admin`** — đọc `ADMIN_EMAIL` + `ADMIN_PASSWORD` từ env, idempotent (không tạo lại nếu đã tồn tại).
- **D-90:** Backend bảo vệ: **`requireAdmin` middleware mount trên toàn bộ `/api/admin/*` router** — `authenticate` + check `req.user.role === 'admin'`. Không áp dụng per-route.
- **D-91:** Admin refresh token: **có**, reuse existing `/api/auth/refresh-token` logic — admin không bị kick ra khỏi phiên làm việc.

### D-92 — D-94: Image Upload
- **D-92:** Upload route: **backend proxy** — admin upload → `POST /api/admin/upload` → Cloudinary. Cloudinary credentials không bao giờ expose ra browser (consistent với CLAUDE.md rule "AI APIs phải proxy qua backend").
- **D-93:** Food items **cũng có `imageUrl`** — extends ADM-03 beyond plain text fields. FoodItem model cần thêm/confirm `imageUrl` field. Same upload endpoint as exercises.
- **D-94:** File size limit: **5MB** — consistent với multer config Phase 4 (`uploadSingle`).

### D-95 — D-97: Exercise & User Management
- **D-95:** Exercise movement list editor: **dynamic rows** — UI có button "+ Thêm động tác", mỗi row có input tên + số phút + nút xóa. Không dùng JSON textarea.
- **D-96:** User management scope: **view + ban + delete** — danh sách users với email/ngày đăng ký/role; ban → `isActive: false`; delete → xóa record.
- **D-97:** `User.isActive` field: **thêm vào User schema** (boolean, default `true`). `authenticate` middleware phải check `isActive` và trả 401 nếu bị ban.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §ADMIN — ADM-01 (login), ADM-02 (exercise CRUD), ADM-03 (food CRUD, extended với imageUrl), ADM-04 (user list, extended với ban/delete)

### Existing Backend Models (đọc trước khi viết admin API)
- `backend/src/models/User.ts` — role field, cần thêm isActive
- `backend/src/models/Exercise.ts` — exercise schema, movements array
- `backend/src/models/FoodItem.ts` — food schema, confirm/add imageUrl
- `backend/src/middleware/auth.middleware.ts` — authenticate + AuthRequest interface, thêm requireAdmin

### Existing Services (tái sử dụng, không viết lại)
- `backend/src/services/cloudinary.service.ts` — upload helper đã có, tái dùng cho admin image upload
- `backend/src/middleware/upload.middleware.ts` — multer config 5MB đã có

### Admin Frontend Skeleton
- `admin/package.json` — React 18, Vite, react-router-dom v6, axios đã cài; cần thêm shadcn/ui + Tailwind + TanStack Query v5
- `admin/src/App.tsx` — entry point rỗng, planner viết từ đây

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/middleware/auth.middleware.ts` → `authenticate` middleware: tái dùng cho `/api/admin/*`, chỉ cần thêm `requireAdmin` check sau.
- `backend/src/services/cloudinary.service.ts` → upload function: gọi thẳng trong admin upload controller, không viết lại.
- `backend/src/middleware/upload.middleware.ts` → `uploadSingle` multer 5MB: tái dùng cho `/api/admin/upload`.
- `backend/src/api/auth/auth.routes.ts` → `/api/auth/login` + `/api/auth/refresh-token`: admin dùng lại y nguyên.

### Established Patterns
- **IDOR protection**: admin endpoints dùng params từ URL, không từ body — nhất quán với Phase 2-5.
- **Zod validation**: tất cả PATCH/POST body phải có Zod schema — nhất quán với backend pattern.
- **Response format**: `{ success, data, message }` via `backend/src/utils/response.ts` — tất cả admin endpoints phải dùng.
- **TanStack Query v5**: `useQuery`/`useMutation` với `queryClient.invalidateQueries` sau mutation — nhất quán với mobile.

### Integration Points
- Admin thêm/sửa Exercise → mobile exercise list endpoint `/api/exercises` query đọc từ cùng collection → changes appear immediately.
- Admin thêm/sửa FoodItem → mobile food search `/api/food/search` đọc từ cùng collection → changes searchable immediately.
- Admin ban user → `User.isActive = false` → `authenticate` middleware check → user's next request trả 401.

</code_context>

<specifics>
## Specific Ideas

- Admin dashboard UI: shadcn/ui style (clean, minimal, table-heavy cho CRUD) — không cần match mobile green theme.
- Movement list: dạng table nhỏ trong form Exercise với 2 cột (Tên động tác | Thời gian phút) + icon xóa cuối mỗi row.
- User ban: hiển thị badge "Bị cấm" (đỏ) bên cạnh email trong user table, nút "Ban/Unban" toggle.

</specifics>

<deferred>
## Deferred Ideas

- **Premium system** (v2): Users mua sản phẩm sữa hạt từ công ty → nhận QR code / voucher code → admin kích hoạt premium cho user đó → unlock thêm lượt scan AI, mở khóa tính năng trả phí. Cần: `User.isPremium`, `User.premiumExpiry`, bảng `Voucher`, admin UI quản lý voucher, backend API kích hoạt. Scope lớn — để v2.
- **Admin tạo/quản lý habit templates** (v2): Các thói quen mặc định hiện tại hard-coded trong seed data. Admin CRUD habit templates → v2.

</deferred>

---

*Phase: 6-Admin Web Dashboard*
*Context gathered: 2026-05-19*
