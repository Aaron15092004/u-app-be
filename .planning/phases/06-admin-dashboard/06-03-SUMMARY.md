---
phase: 6
plan: 3
subsystem: admin-frontend
tags: [react, vite, tailwind-v4, shadcn-ui, tanstack-query, axios, jwt, spa]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [admin-spa-shell, admin-login, admin-protected-routes]
  affects: [admin]
tech_stack:
  added:
    - tailwindcss@4 + @tailwindcss/vite (CSS-first, no config file)
    - tw-animate-css
    - shadcn/ui (new-york style, zinc base, CSS variables)
    - "@tanstack/react-query v5"
    - "@tanstack/react-table v5"
    - react-hook-form + @hookform/resolvers + zod
    - lucide-react
    - clsx + tailwind-merge + class-variance-authority
    - axios (already present, interceptor added)
    - sonner (toast replacement — shadcn deprecated toast)
    - next-themes (installed by shadcn for Toaster theming)
    - "@fontsource-variable/geist" (installed by shadcn init)
  patterns:
    - axios Bearer interceptor + 401 refresh queue (concurrent-safe)
    - React.lazy + Suspense for code-split CRUD pages
    - ProtectedRoute via React Router Outlet pattern
    - authStorage abstraction over localStorage keys
key_files:
  created:
    - admin/src/lib/api-client.ts
    - admin/src/lib/auth-api.ts
    - admin/src/lib/utils.ts
    - admin/src/providers/QueryProvider.tsx
    - admin/src/components/layout/ProtectedRoute.tsx
    - admin/src/components/layout/AppShell.tsx
    - admin/src/pages/LoginPage.tsx
    - admin/src/pages/ExercisesPage.tsx
    - admin/src/pages/FoodItemsPage.tsx
    - admin/src/pages/UsersPage.tsx
    - admin/src/index.css
    - admin/src/vite-env.d.ts
    - admin/components.json
    - admin/.env.example
    - admin/src/components/ui/ (16 shadcn components)
  modified:
    - admin/vite.config.ts
    - admin/tsconfig.json
    - admin/src/App.tsx
    - admin/src/main.tsx
    - admin/package.json
    - admin/package-lock.json
decisions:
  - "Tailwind v4 CSS-first: no tailwind.config.js — @tailwindcss/vite plugin handles all config"
  - "shadcn toast deprecated in latest shadcn CLI — replaced with sonner; Toaster imported from @/components/ui/sonner"
  - "Refresh endpoint confirmed as POST /api/auth/refresh (matches backend auth.routes.ts)"
  - "@/ alias configured in both vite.config.ts (resolve.alias) and tsconfig.json (paths) — required for both bundler and TS server"
  - "React.lazy stub pages allow Plan 03 to typecheck before Plan 04 writes real CRUD implementations"
  - "vite-env.d.ts created manually (scaffold missing it) — required for import.meta.env TS types"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-20"
  tasks_completed: 16
  files_changed: 30
---

# Phase 6 Plan 03: Admin Frontend Setup Summary

**One-liner:** Vite + Tailwind v4 + shadcn/ui SPA shell with axios JWT refresh queue, ProtectedRoute, AppShell sidebar, and LoginPage — ready for Plan 04 CRUD pages.

## What Was Built

The bare `admin/` scaffold was transformed into a fully working React SPA shell:

1. **Dependencies installed** — Tailwind v4, shadcn/ui (new-york/zinc), TanStack Query v5, react-hook-form, zod, lucide-react, clsx/tailwind-merge/class-variance-authority.

2. **Vite config updated** — `@tailwindcss/vite` plugin, `@/` alias via `path.resolve`, `/api` proxy to `http://localhost:3000`, port 3001.

3. **TypeScript config updated** — `baseUrl: "."` and `paths: { "@/*": ["./src/*"] }` for TS language server to resolve `@/` imports.

4. **Tailwind v4 CSS** — `admin/src/index.css` with `@import "tailwindcss"`, shadcn theme variables (oklch color palette, sidebar vars, chart vars), dark mode via `@custom-variant`.

5. **shadcn/ui initialized** — `components.json` created; 16 UI components written to `admin/src/components/ui/`.

6. **axios client** (`api-client.ts`) — singleton with Bearer interceptor and a concurrent-safe 401 refresh queue. Refresh calls `POST /api/auth/refresh`. On persistent failure, clears localStorage and hard-redirects to `/login`.

7. **Auth helpers** (`auth-api.ts`) — `loginAdmin()` POSTs credentials, validates `role === "admin"`, stores tokens. `logout()` clears storage + redirects.

8. **QueryProvider** — TanStack Query v5 `QueryClient` with 60s staleTime, retry=1.

9. **ProtectedRoute** — checks `localStorage.getItem('admin_role') === 'admin'`; renders `<Outlet>` or `<Navigate to="/login">`.

10. **AppShell** — sidebar with Bài tập/Thực phẩm/Người dùng nav links (lucide icons) + Đăng xuất button. `<Outlet>` for main content.

11. **LoginPage** — email + password form with loading state and error display using shadcn Card/Input/Button.

12. **App.tsx** — BrowserRouter + Routes: `/login` -> LoginPage, protected routes -> AppShell -> lazy-loaded CRUD stubs.

13. **Stub pages** — ExercisesPage, FoodItemsPage, UsersPage (Plan 04 will overwrite).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing vite-env.d.ts**
- **Found during:** Task 7 (typecheck after creating api-client.ts)
- **Issue:** `tsc --noEmit` reported `TS2339: Property 'env' does not exist on type 'ImportMeta'` because the Vite scaffold created by Plan 01 was missing `src/vite-env.d.ts`
- **Fix:** Created `admin/src/vite-env.d.ts` with `/// <reference types="vite/client" />`
- **Files modified:** `admin/src/vite-env.d.ts` (created)
- **Commit:** bbf75aa

**2. [Rule 1 - Bug] shadcn toast component deprecated**
- **Found during:** Task 5 (shadcn add)
- **Issue:** `npx shadcn@latest add toast` exits with "The toast component is deprecated. Use the sonner component instead."
- **Fix:** Used `sonner` component instead. Updated App.tsx to import `Toaster` from `@/components/ui/sonner` (not `@/components/ui/toaster`)
- **Files modified:** `admin/src/App.tsx` (Toaster import updated)
- **Commit:** bbf75aa

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| ExercisesPage | `admin/src/pages/ExercisesPage.tsx` | Intentional — Plan 04 will overwrite with full CRUD implementation |
| FoodItemsPage | `admin/src/pages/FoodItemsPage.tsx` | Intentional — Plan 04 will overwrite with full CRUD implementation |
| UsersPage | `admin/src/pages/UsersPage.tsx` | Intentional — Plan 04 will overwrite with full CRUD implementation |

These stubs are intentional and documented in the plan. They allow Plan 03's App.tsx (with React.lazy imports) to typecheck before Plan 04 provides the real implementations.

## Verification Results

- `npm run typecheck` from `admin/` — exits 0, no errors
- `npm run dev` from `admin/` — starts on port 3001 without errors ("ready in 3718 ms")
- `admin/src/components/ui/` — 16 shadcn component files present
- `admin/components.json` — exists
- No `tailwind.config.js` in `admin/` — Tailwind v4 CSS-first constraint satisfied

## Commits

| Commit | Description |
|--------|-------------|
| f8b3e95 | feat(06-03): install admin frontend deps (initial npm installs) |
| 511117f | feat(06-03): install admin frontend deps (Tailwind v4, shadcn/ui, TanStack Query v5) |
| bbf75aa | feat(06-03): wire admin auth shell — api-client, ProtectedRoute, AppShell, LoginPage |

## Self-Check: PASSED

Files confirmed present:
- admin/src/lib/api-client.ts — FOUND
- admin/src/lib/auth-api.ts — FOUND
- admin/src/providers/QueryProvider.tsx — FOUND
- admin/src/components/layout/ProtectedRoute.tsx — FOUND
- admin/src/components/layout/AppShell.tsx — FOUND
- admin/src/pages/LoginPage.tsx — FOUND
- admin/components.json — FOUND
- admin/src/vite-env.d.ts — FOUND

Commits confirmed:
- f8b3e95 — FOUND
- 511117f — FOUND
- bbf75aa — FOUND
