# Phase 2: Authentication - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Toàn bộ auth flow cho Ủ App: 3 màn onboarding bắt buộc (lần đầu), đăng ký email/password, đăng nhập email/password, Google OAuth, Apple Sign In, JWT session management (access token in-memory + refresh token rotate-on-use), password reset qua email, màn "Hoàn thiện hồ sơ" bắt buộc sau signup, và đăng xuất.

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08

**Success criteria (từ ROADMAP.md):**
1. First-time user thấy cả 3 màn onboarding trước khi đến login
2. User đăng ký email/password (min 8 ký tự, confirm, Terms) → màn "Hoàn thiện hồ sơ" → main app
3. User đăng nhập email/password, nhận JWT persist qua app restart (refresh token)
4. User trigger password reset email + set mật khẩu mới qua link
5. Google OAuth + Apple Sign In hoạt động trên iOS không có redirect errors
6. User đăng xuất → Login screen, session cleared

</domain>

<decisions>
## Implementation Decisions

### Email Service (Resend)

- **D-26:** Email provider: **Resend** (free tier 3000 emails/month). ENV var: `RESEND_API_KEY`. Package: `resend` npm.
- **D-27:** Password reset token validity: **1 giờ**. Token được hash (bcrypt) trước khi lưu vào MongoDB. Xóa token sau khi dùng hoặc hết hạn.
- **D-28:** Email templates: **100% Tiếng Việt**. Subject: `"Khôi phục mật khẩu Ủ App"`. Plain text + HTML (inline styling, không dùng framework template engine).
- **D-29:** Không gửi email xác thực sau đăng ký — user vào app ngay lập tức. Chỉ dùng Resend cho password reset (AUTH-04).

### Profile Setup Flow

- **D-30:** Sau khi đăng ký email/password hoặc OAuth xong → redirect bắt buộc đến màn **"Hoàn thiện hồ sơ"** trước khi vào main tabs. Không có nút skip.
- **D-31:** Màn "Hoàn thiện hồ sơ" thu thập: **Tên + Tuổi + Chiều cao (cm) + Cân nặng (kg) + Mục tiêu sức khỏe** (`lose` / `maintain` / `gain`). Tất cả required — không thể submit nếu thiếu field nào.
- **D-32:** Form đăng ký email chỉ thu thập: **email + password + confirm password + Terms checkbox**. Tên KHÔNG thu thập tại bước đăng ký — thu thập tại màn profile setup.
- **D-33:** Backend cần update `User` model: `name` field từ `required: true` → có thể null/empty tại lúc tạo account, được điền sau qua `PATCH /api/auth/complete-profile`. User được coi là "onboarded" khi profile complete. Middleware bảo vệ main app routes phải check `profile.heightCm` (hoặc flag `profileCompleted`) để redirect về complete-profile nếu chưa xong.

### Onboarding Behavior

- **D-34:** "Đã xem onboarding" được track bằng **MMKV key `onboarding_seen` (boolean)**. Set thành `true` khi user nhấn "Bắt đầu" ở Screen 3.
- **D-35:** **Không có nút "Bỏ qua"** — cả 3 màn onboarding là bắt buộc. User điều hướng bằng nút "Tiếp tục" (Screen 1, 2) và "Bắt đầu" (Screen 3).
- **D-36:** Screen 3 "Bắt đầu" → **Login screen** (`/(auth)/login`). Từ Login, user có thể navigate đến Register bằng link "Chưa có tài khoản? Đăng ký".
- **D-37:** Flag `onboarding_seen` **KHÔNG bị xóa khi đăng xuất** — user quay lại app sau khi logout sẽ thấy Login trực tiếp, không phải onboarding.

### Cold Start Auth UX

- **D-38:** App startup: giữ splash screen bằng `SplashScreen.preventAutoHideAsync()` trong `app/_layout.tsx`. AuthProvider thực hiện auto-refresh attempt từ `expo-secure-store`. Sau khi resolve → `SplashScreen.hideAsync()` → route đến đúng screen.
- **D-39:** Nếu refresh token hết hạn (>7 ngày) hoặc bị thu hồi → redirect đến Login screen + hiển thị toast: **"Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."** Xóa token cũ khỏi SecureStore.
- **D-40:** Đăng xuất (AUTH-08): xóa refresh token khỏi `expo-secure-store`, clear access token khỏi Zustand store, gọi `queryClient.clear()` để invalidate TanStack Query cache. MMKV `onboarding_seen` flag **giữ nguyên**.

### Carried Forward from Phase 1 (locked — không thay đổi)

- **D-22:** JWT access token: 15 phút, in-memory only (Zustand). Refresh token: 7 ngày, hashed trong MongoDB, stored trong `expo-secure-store`, rotate on use.
- **D-23:** Apple Sign In bắt buộc (App Store Guideline 4.8) — implement song song với Google OAuth.
- **D-19:** Google OAuth: `@react-native-google-signin/google-signin` (native SDK, không dùng `expo-auth-session`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, phase dependencies
- `.planning/REQUIREMENTS.md` — AUTH-01 đến AUTH-08 (8 requirements Phase 2)
- `.planning/PROJECT.md` — Stack, screen inventory (Login/Register/Onboarding screens), design system (green primary)
- `CLAUDE.md` — Critical rules: JWT storage, Apple Sign In bắt buộc, không AsyncStorage

### Prior Phase Decisions
- `.planning/phases/01-infrastructure/01-CONTEXT.md` — D-15 đến D-25 (all locked library choices, D-22 JWT strategy, D-23 Apple, D-19 Google OAuth)

### Research
- `.planning/research/PITFALLS.md` — AsyncStorage insecurity pitfall, Expo managed workflow gap (all auth libraries cần native modules)
- `.planning/research/STACK.md` — Library versions nếu tồn tại

### Existing Code (must read before planning)
- `mobile/src/providers/AuthProvider.tsx` — Stub với TODO Phase 2, cần implement đầy đủ
- `mobile/src/app/(auth)/_layout.tsx` — Auth route group skeleton
- `mobile/src/app/(onboarding)/_layout.tsx` — Onboarding route group skeleton
- `backend/src/models/User.ts` — User model schema (cần update `name` từ required → optional)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mobile/src/providers/AuthProvider.tsx` — Stub với context shape `{ isAuthenticated, isLoading, user }`. Phase 2 mở rộng để có JWT logic, user object type, login/logout/refresh actions.
- `mobile/src/providers/QueryProvider.tsx` — TanStack Query client đã setup. Dùng `queryClient.clear()` khi logout.
- `mobile/src/app/(auth)/_layout.tsx` — Route group layout skeleton, sẵn sàng thêm screens.
- `mobile/src/app/(onboarding)/_layout.tsx` — Route group layout skeleton, sẵn sàng thêm screens.
- `backend/src/models/User.ts` — Fully defined: email, passwordHash (nullable), authProviders array, profile object (heightCm, weightKg, goalType), notifications settings. Index `{ email: 1 }` đã có.
- `backend/src/middleware/` — `error.middleware.ts` và `upload.middleware.ts` đã có. Phase 2 thêm `auth.middleware.ts` (JWT verify).

### Established Patterns
- API response shape: `{ success: boolean, data: T, error?: string }` — dùng cho tất cả auth endpoints.
- Backend layered architecture: `api/auth/` folder với `auth.routes.ts` + `auth.controller.ts` + `auth.service.ts`.
- Expo Router file-based routing: auth screens trong `app/(auth)/`, profile setup trong `app/(auth)/complete-profile.tsx`.
- Root layout `app/_layout.tsx` handles route protection: check `onboarding_seen` → check `isAuthenticated` → check `profileCompleted` → route đến đúng group.

### Integration Points
- `backend/src/app.ts` (hoặc `server.ts`) — mount `authRouter` tại `/api/auth`.
- `mobile/src/lib/api-client.ts` — Axios/fetch client cần Axios interceptor: tự động refresh access token khi nhận 401.
- `mobile/src/app/_layout.tsx` — `SplashScreen.preventAutoHideAsync()` gọi ở top-level, `hideAsync()` sau khi AuthProvider resolve.

</code_context>

<specifics>
## Specific Ideas

- Tên màn profile setup: "Hoàn thiện hồ sơ" (matching app Vietnamese tone)
- Toast khi session expired: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
- Onboarding navigation: "Tiếp tục" (Screens 1-2), "Bắt đầu" (Screen 3)
- Email subject line: "Khôi phục mật khẩu Ủ App"
- Backend `User` model cần patch: `name` field — đổi từ `required: true` thành có thể tạo user với tên rỗng, sau đó update qua `PATCH /api/auth/complete-profile`. Hoặc thêm field `profileCompleted: boolean` để phân biệt user mới chưa setup với user đầy đủ.
- Figma mockup của Login screen: Email + password + "Quên mật khẩu" link + Google button + Apple button.
- Figma mockup của Register screen: Email + password + confirm password + Terms checkbox.

</specifics>

<deferred>
## Deferred Ideas

- **Social login khác (Facebook, Zalo)** — Figma chỉ có Google + Apple. Zalo OAuth phức tạp (Vietnamese platform), để v2.
- **Biometric authentication (Face ID / Touch ID)** — Có thể add sau login bằng `expo-local-authentication`. Để Phase 5 hoặc v2.
- **Multi-device session management** — Quản lý danh sách thiết bị đã login, revoke session từ xa. v2.
- **Account deletion** — User tự xóa tài khoản. v2.

</deferred>

---

*Phase: 2-Authentication*
*Context gathered: 2026-05-17*
