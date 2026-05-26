# Phase 6: Admin Web Dashboard — Research

**Researched:** 2026-05-19
**Domain:** React 18 + Vite + shadcn/ui (Tailwind v4) + TanStack Query v5 + Express admin API
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-84:** Admin UI library: shadcn/ui + Tailwind CSS — `admin/` skeleton already has React 18 + Vite + react-router-dom v6 + axios; install shadcn/ui + Tailwind on top.
- **D-85:** shadcn/ui components needed: Button, Input, Table, Form, Dialog, Toast, Badge, Card, Select, Textarea, Tabs, DropdownMenu, Checkbox, Switch, Pagination, Skeleton, Avatar.
- **D-86:** Data fetching: TanStack Query v5.
- **D-87:** Admin JWT token: localStorage — internal tool, lower XSS risk than public app. Store both accessToken + refreshToken.
- **D-88:** Admin login: reuse `/api/auth/login` — same endpoint as mobile, JWT returned has `role: 'admin'`. Admin frontend checks role after login, redirect to `/` if not admin.
- **D-89:** First admin account: seed script `npm run seed:admin` — reads `ADMIN_EMAIL` + `ADMIN_PASSWORD` from env, idempotent.
- **D-90:** Backend protection: `requireAdmin` middleware mounted on entire `/api/admin/*` router — `authenticate` + check `req.user.role === 'admin'`. Not per-route.
- **D-91:** Admin refresh token: yes, reuse existing `/api/auth/refresh-token` logic.
- **D-92:** Upload route: backend proxy — admin upload → `POST /api/admin/upload` → Cloudinary.
- **D-93:** Food items also have `imageUrl` — FoodItem model needs `imageUrl` field added.
- **D-94:** File size limit: 5MB — consistent with Phase 4 multer config.
- **D-95:** Exercise movement list editor: dynamic rows — UI has "+ Thêm động tác" button, each row has name input + minutes + delete button. No JSON textarea.
- **D-96:** User management scope: view + ban + delete.
- **D-97:** `User.isActive` field: add to User schema (boolean, default `true`). `authenticate` middleware must check `isActive` and return 401 if banned.

### Claude's Discretion

None specified — all major decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Premium system (v2): voucher/QR code activation, `User.isPremium`, `User.premiumExpiry`, admin voucher management UI.
- Admin habit template CRUD (v2): default habits are currently hard-coded seed data.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-01 | Admin logs in via email/password on web dashboard | Reuse `/api/auth/login`; role check on frontend; axios interceptor handles token storage + refresh |
| ADM-02 | Admin CRUD exercises (name, category, difficulty, duration, kcal, image, movement list) | Backend: `/api/admin/exercises` router; Exercise model already has all fields; movements use `steps[]` array; image via `/api/admin/upload` |
| ADM-03 | Admin CRUD food items (name, kcal, macros, micros, imageUrl — extended) | Backend: `/api/admin/food-items` router; FoodItem model needs `imageUrl` added (D-93) |
| ADM-04 | Admin views user list, can ban (isActive=false) and delete | Backend: `/api/admin/users` router; User model needs `isActive` field (D-97); authenticate must check isActive |

</phase_requirements>

---

## Summary

Phase 6 builds a web-only admin dashboard at `admin/` using the existing React 18 + Vite scaffold. The main work is three-tier: (1) frontend setup — install Tailwind v4 + shadcn/ui + TanStack Query v5, wire auth with axios interceptor; (2) new backend router `/api/admin/*` with `requireAdmin` middleware, CRUD endpoints for exercises, food items, and users, plus an image upload endpoint; (3) two model changes — add `User.isActive` and `FoodItem.imageUrl`.

The shadcn/ui CLI now defaults to Tailwind v4 + React 19. Our project uses React 18, which remains fully supported — shadcn/ui's official docs confirm "existing apps with React 18 will still work." The Tailwind v4 config change is CSS-first (`@import "tailwindcss"`) instead of a `tailwind.config.js` file; this is the bigger adjustment. The shadcn CLI `npx shadcn@latest init` detects the project context and will generate components compatible with Tailwind v4.

**Primary recommendation:** Install Tailwind v4 (not v3) because the shadcn CLI defaults to it and component updates have already migrated. Attempting to run `shadcn@latest` against a Tailwind v3 project in 2026 introduces friction — the CLI generates v4 CSS and expects `@tailwindcss/vite`, not `tailwind.config.js`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Admin login form | Browser (React) | — | SPA form, no SSR |
| JWT storage + refresh | Browser (axios interceptor module) | — | localStorage is browser-side; interceptor runs in the browser process |
| Role guard / protected route | Browser (React Router) | — | Role is checked from JWT payload stored in localStorage; pure frontend |
| Exercise / Food / User CRUD UI | Browser (React + TanStack Query) | — | SPA data fetch, optimistic UI via queryClient.invalidateQueries |
| Admin API endpoints | API / Backend (Express) | — | All mutations live server-side behind requireAdmin |
| Image upload | Browser FormData → API (multer) → Cloudinary | — | Browser sends multipart to backend; backend proxies to Cloudinary (CLAUDE.md rule) |
| requireAdmin auth check | API / Backend (middleware) | — | Auth logic must never run in browser |
| User.isActive ban enforcement | API / Backend (authenticate middleware) | — | Ban check happens on every authenticated request server-side |
| FoodItem.imageUrl persistence | Database / Storage (Mongoose) | — | Schema field addition + Cloudinary URL stored |

---

## Stack Setup

### Verified Current Versions

| Package | npm latest | Published | Notes |
|---------|-----------|-----------|-------|
| `tailwindcss` | 4.3.0 | 2026-05-19 | v4 — CSS-first, no tailwind.config.js |
| `@tailwindcss/vite` | 4.3.0 | 2026-05-19 | Vite plugin for Tailwind v4 |
| `tw-animate-css` | 1.4.0 | 2026-02-28 | Replaces tailwindcss-animate for v4 |
| `shadcn` (CLI) | 4.7.0 | 2026-05-05 | CLI to scaffold components |
| `@tanstack/react-query` | 5.100.11 | 2026-05-18 | v5 |
| `@tanstack/react-table` | 8.21.3 | 2026-05-19 | For DataTable |
| `react-hook-form` | 7.76.0 | 2026-05-16 | Form management |
| `@hookform/resolvers` | 5.2.2 | 2025-09-14 | Zod adapter for RHF |
| `lucide-react` | 1.16.0 | 2026-05-14 | Icon set used by shadcn/ui |
| `clsx` | 2.1.1 | 2025-06-27 | Conditional classnames |
| `tailwind-merge` | 3.6.0 | 2026-05-10 | Merge Tailwind classes |
| `class-variance-authority` | 0.7.1 | 2024-11-26 | CVA for component variants |
| `@types/node` | 25.9.0 | current | For `path.resolve` in vite.config |

[VERIFIED: npm registry] — all packages confirmed via `npm view <pkg> version` on 2026-05-19.

### Step-by-Step: Admin Frontend Setup

#### Step 1 — Install dependencies

```bash
# From admin/ directory:
npm install tailwindcss @tailwindcss/vite tw-animate-css
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install -D @types/node
```

shadcn/ui component files are NOT installed via npm — they are generated by the CLI (Step 4).

#### Step 2 — Update `admin/vite.config.ts`

```typescript
// Source: ui.shadcn.com/docs/installation/vite
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
```

**Critical:** `tailwindcss()` plugin replaces the old `tailwind.config.js` approach. Do NOT create a `tailwind.config.js` for Tailwind v4.

#### Step 3 — Update `admin/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

The `admin/` scaffold has a single `tsconfig.json` (no `tsconfig.app.json`). Both `baseUrl` and `paths` go here.

#### Step 4 — Replace `admin/src/index.css` with Tailwind v4 import

```css
/* admin/src/index.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* shadcn/ui theme variables — generated by `shadcn init` */
```

`shadcn init` will add CSS variable declarations for the design system below the imports.

#### Step 5 — Run shadcn init

```bash
# From admin/ directory:
npx shadcn@latest init
```

Interactive prompts:
- Style: `new-york` (default for v4 projects, recommended)
- Base color: `zinc` or `slate` (admin tool — not branded)
- CSS variable: yes

This generates `admin/components.json` and populates `src/index.css` with theme variables.

`components.json` will look like:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Note:** `tailwind.config` is intentionally blank for Tailwind v4.
[CITED: ui.shadcn.com/docs/components-json]

#### Step 6 — Install required shadcn components (D-85)

```bash
# From admin/ directory:
npx shadcn@latest add button input table form dialog toast badge card select textarea tabs dropdown-menu checkbox switch pagination skeleton avatar
```

Components are written to `admin/src/components/ui/`. Each is a plain `.tsx` file you own — no runtime dependency on shadcn.

---

## Package Legitimacy Audit

All packages are JavaScript/TypeScript npm packages (correct ecosystem). No Python packages involved.

| Package | Registry | Age | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|
| `tailwindcss` | npm | ~8 yrs | [OK] | Approved |
| `@tailwindcss/vite` | npm | ~1 yr | [OK] | Approved |
| `tw-animate-css` | npm | ~1 yr | [OK] | Approved |
| `shadcn` | npm | ~3 yrs (CLI) | [OK] | Approved |
| `@tanstack/react-query` | npm | ~5 yrs | [OK] | Approved |
| `@tanstack/react-table` | npm | ~5 yrs | [OK] | Approved |
| `react-hook-form` | npm | ~6 yrs | [OK] | Approved |
| `@hookform/resolvers` | npm | ~5 yrs | [OK] | Approved |
| `lucide-react` | npm | ~4 yrs | [OK] | Approved |
| `clsx` | npm | ~7 yrs | [OK] | Approved |
| `tailwind-merge` | npm | ~3 yrs | [OK] | Approved |
| `class-variance-authority` | npm | ~3 yrs | [OK] | Approved |
| `@types/node` | npm | ~9 yrs | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No suspicious postinstall scripts found on any of the above packages.

---

## Architecture Patterns

### System Architecture Diagram

```
[Browser: Admin SPA]
       |
       | (1) POST /api/auth/login
       | (5) axios interceptor → Bearer header
       |
[Vite dev proxy /api → localhost:3000]   [Production: direct fetch]
       |
[Express: /api/admin/* router]
   authenticate (JWT verify)
   requireAdmin (role === 'admin')
       |
   ┌───┴──────────────────────────────────┐
   │              │              │         │
/admin/exercises /admin/food-items /admin/users /admin/upload
   Controller     Controller     Controller  Controller
       |               |              |          |
  Exercise.ts     FoodItem.ts      User.ts   uploadImage()
  (Mongoose)      (Mongoose)     (Mongoose) (Cloudinary)
       |               |              |
  [MongoDB Atlas — shared with mobile app]
```

Data written by admin endpoints is immediately visible to mobile clients reading from the same collections.

### Recommended Project Structure

```
admin/src/
├── components/
│   ├── ui/              # shadcn/ui generated components (owned by project)
│   ├── layout/          # AppShell, Sidebar, TopBar
│   └── data-table/      # Reusable DataTable<T> with @tanstack/react-table
├── pages/
│   ├── LoginPage.tsx
│   ├── ExercisesPage.tsx
│   ├── FoodItemsPage.tsx
│   └── UsersPage.tsx
├── features/
│   ├── exercises/       # query hooks + mutation hooks + form schemas
│   ├── food-items/
│   └── users/
├── lib/
│   ├── api-client.ts    # axios instance + interceptors
│   ├── auth.ts          # localStorage helpers (getToken, setToken, clearAuth)
│   └── utils.ts         # cn() utility (from shadcn init)
├── providers/
│   └── QueryProvider.tsx
├── App.tsx              # router setup + protected routes
└── main.tsx
```

---

## Patterns

### Pattern 1: TanStack Query v5 Provider Setup

[VERIFIED: tanstack.com/query/v5/docs]

```typescript
// admin/src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute
      retry: 1,
      // v5: status 'loading' renamed to 'pending'
      // v5: onSuccess/onError/onSettled callbacks removed from useQuery
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**v4 → v5 breaking changes the planner must know:**
- `useQuery(key, fn, opts)` → `useQuery({ queryKey, queryFn, ...opts })` (object-only)
- `useMutation(fn, opts)` → `useMutation({ mutationFn, ...opts })`
- `onSuccess`/`onError`/`onSettled` removed from `useQuery` (still exist on `useMutation`)
- `status: 'loading'` renamed to `status: 'pending'`; `isLoading` = `isPending && isFetching`
- `cacheTime` renamed to `gcTime`
- `useErrorBoundary` renamed to `throwOnError`
- `invalidateQueries` signature: `queryClient.invalidateQueries({ queryKey: ['exercises'] })`

### Pattern 2: Axios Instance + JWT Interceptor with Queue

[ASSUMED] — based on established pattern, cross-verified with multiple authoritative sources.

This is the standard pattern for handling concurrent 401 responses without duplicate refresh calls:

```typescript
// admin/src/lib/api-client.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// ---- helpers ----
const AUTH_KEY = "admin_access_token";
const REFRESH_KEY = "admin_refresh_token";

export const authStorage = {
  getAccess: () => localStorage.getItem(AUTH_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(AUTH_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---- request interceptor ----
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- response interceptor with queue ----
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = authStorage.getRefresh();
      if (!refreshToken) throw new Error("No refresh token");

      // Backend endpoint: POST /api/auth/refresh  { refreshToken }
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });
      const newAccess = data.data.accessToken;
      const newRefresh = data.data.refreshToken;
      authStorage.set(newAccess, newRefresh);

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (err) {
      processQueue(err, null);
      authStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
```

**Critical detail:** The backend auth refresh endpoint is `POST /api/auth/refresh` (not `/api/auth/refresh-token` — check `auth.routes.ts` line 9: `router.post('/refresh', ...)` maps to `/api/auth/refresh`). The request body is `{ refreshToken: string }` and response shape is `{ success: true, data: { accessToken, refreshToken } }`.

### Pattern 3: React Router v6 Protected Route

[CITED: react-router-dom v6 docs — outlet pattern]

```typescript
// admin/src/components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "@/lib/api-client";
import { jwtDecode } from "jwt-decode";  // NOT needed — decode manually or store role separately

// Simpler: store role in localStorage at login time, no JWT decode needed
export function ProtectedRoute() {
  const role = localStorage.getItem("admin_role");
  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
```

**At login time** (after `POST /api/auth/login`), store role from the response `user.role` field — the backend returns `{ success: true, data: { user: { id, email, name, role, profileCompleted }, accessToken, refreshToken } }`. No JWT decoding needed on the frontend.

**Router setup in `App.tsx`:**

```typescript
// admin/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/exercises" replace />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="food-items" element={<FoodItemsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Pattern 4: shadcn/ui Form with react-hook-form + Zod + useFieldArray

[CITED: ui.shadcn.com/docs/forms/react-hook-form, react-hook-form.com/docs/usefieldarray]

```typescript
// Exercise form with dynamic movements (steps)
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const movementSchema = z.object({
  instruction: z.string().min(1, "Tên động tác không được trống"),
  durationSeconds: z.coerce.number().min(1),
});

const exerciseFormSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["yoga", "cardio", "weights", "stretching"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  durationMinutes: z.coerce.number().min(1),
  caloriesBurned: z.coerce.number().min(0),
  description: z.string().optional(),
  steps: z.array(movementSchema).min(1, "Cần ít nhất 1 động tác"),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export function ExerciseForm({ onSubmit }: { onSubmit: (v: ExerciseFormValues) => void }) {
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: { steps: [{ instruction: "", durationSeconds: 30 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* static fields ... */}

        {/* Dynamic movement rows */}
        <div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end">
              <FormField
                control={form.control}
                name={`steps.${index}.instruction`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tên động tác</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`steps.${index}.durationSeconds`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Giây</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" onClick={() => remove(index)}>×</Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ instruction: "", durationSeconds: 30 })}
          >
            + Thêm động tác
          </Button>
        </div>

        <Button type="submit">Lưu</Button>
      </form>
    </Form>
  );
}
```

**Important:** Use `field.id` (not `index`) as the React `key` for `useFieldArray` rows — this is required for correct re-render on remove. [CITED: react-hook-form.com/api/usefieldarray]

### Pattern 5: DataTable with @tanstack/react-table

[CITED: ui.shadcn.com/docs/components/data-table]

```typescript
// admin/src/components/data-table/DataTable.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns, data, pageSize = 20,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 py-4">
        <Button variant="outline" size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          Trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <Button variant="outline" size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          Sau
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 6: requireAdmin Middleware (Express 5)

[CITED: backend/src/middleware/auth.middleware.ts — established pattern in codebase]

```typescript
// backend/src/middleware/auth.middleware.ts — ADD this function
import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';
import { AuthRequest } from './auth.middleware';  // self

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'admin') {
    error(res, 'Không có quyền truy cập', 403);
    return;
  }
  next();
}
```

Mount the entire admin router with both middleware in `app.ts`:

```typescript
// backend/src/app.ts — add:
import adminRouter from './api/admin/admin.routes';
// ...
app.use('/api/admin', authenticate, requireAdmin, adminRouter);
```

This means every route under `/api/admin/*` automatically requires authentication AND admin role — no per-route middleware needed (D-90).

### Pattern 7: TanStack Query Mutation + Invalidation

[VERIFIED: tanstack.com/query/v5/docs]

```typescript
// Example: delete exercise
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/exercises/${id}`),
    onSuccess: () => {
      // v5 syntax: object argument required
      queryClient.invalidateQueries({ queryKey: ["admin", "exercises"] });
    },
  });
}
```

### Pattern 8: Image Upload (FormData via axios)

```typescript
// admin/src/features/exercises/useUploadImage.ts
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useUploadImage(folder: "exercises" | "food-items") {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("image", file);
      form.append("folder", folder);
      const { data } = await apiClient.post<{ success: true; data: { url: string } }>(
        "/api/admin/upload",
        form,
        // Do NOT set Content-Type header — axios sets it with boundary automatically
      );
      return data.data.url;
    },
  });
}
```

**Critical:** Do NOT manually set `Content-Type: multipart/form-data`. When you pass a `FormData` object to axios, it automatically sets the correct `Content-Type` header including the boundary. Setting it manually strips the boundary and causes multer to reject the request.

### Pattern 9: Admin Seed Script

Pattern derived from `backend/src/scripts/seed-foods.ts` (idempotent, reads env, connects/disconnects).

```typescript
// backend/src/scripts/seed-admin.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import { hashPassword } from '../utils/password';

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!process.env.ADMIN_EMAIL) throw new Error('ADMIN_EMAIL is not set');
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not set');

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin user already exists: ${process.env.ADMIN_EMAIL}. Skipping.`);
    } else {
      // Promote to admin if exists as regular user
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`Promoted existing user to admin: ${process.env.ADMIN_EMAIL}`);
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
  await User.create({
    email: process.env.ADMIN_EMAIL,
    passwordHash,
    name: 'Admin',
    role: 'admin',
    profileCompleted: true,
  });
  console.log(`Admin user created: ${process.env.ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
```

Add to `backend/package.json` scripts:
```json
"seed:admin": "tsx src/scripts/seed-admin.ts"
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation with error display | Custom validation logic + error state | react-hook-form + Zod + shadcn Form | RHF handles dirty/touched/error states, accessibility, re-render optimization |
| Table sorting / pagination | Manual array slice + state | @tanstack/react-table + DataTable component | Edge cases with sorting, filtering, and page count arithmetic |
| Class name merging | Manual string concatenation | `cn()` from shadcn (clsx + tailwind-merge) | Tailwind class conflicts (e.g., `p-2 p-4` → only `p-4`) |
| Token refresh race condition | Single promise approach | `isRefreshing` flag + `failedQueue` pattern | Without queue: multiple parallel 401 responses each trigger their own refresh call, invalidating each other's tokens |
| Image dimensions/format conversion | Browser Canvas API | Let Cloudinary handle via `transformation: [{ quality: 'auto', fetch_format: 'auto' }]` | Cloudinary already configured this way in cloudinary.service.ts |
| Modal state management | Custom modal stack context | shadcn Dialog component (uncontrolled or controlled via `open`/`onOpenChange`) | shadcn Dialog handles focus trap, escape key, body scroll lock |

---

## Backend Changes Needed

These are model/middleware changes required before admin API can be built. They affect existing mobile functionality.

### Change 1: Add `User.isActive` field (D-97)

**File:** `backend/src/models/User.ts`

Current state: No `isActive` field.

Required additions:
- Interface: `isActive: boolean;`
- Schema: `isActive: { type: Boolean, default: true }`

**File:** `backend/src/middleware/auth.middleware.ts`

The `authenticate` function currently verifies JWT but does NOT check whether the user is banned. Required change: After decoding the token, fetch user from DB to check `isActive`. If `isActive === false`, return 401.

**Warning:** This adds a MongoDB query on every authenticated request. Acceptable for internal admin tool where request volume is low. This is consistent with how `requireProfile` already does a DB lookup.

Updated `authenticate`:
```typescript
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    // D-97: check isActive
    const user = await User.findById(payload.sub).select('role isActive');
    if (!user || !user.isActive) {
      error(res, 'Tài khoản đã bị vô hiệu hóa', 401);
      return;
    }
    (req as AuthRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
}
```

**Impact on mobile:** Every mobile request now has an extra DB round-trip. If this is a performance concern, it can be mitigated with a short-lived cache (Redis) or by only checking on role-sensitive endpoints — but for v1, the simple approach is acceptable.

### Change 2: Add `FoodItem.imageUrl` field (D-93)

**File:** `backend/src/models/FoodItem.ts`

Current state: `imageUrl` field is ABSENT from both the interface and schema. Confirmed by reading the file.

Required additions:
- Interface: `imageUrl: string | null;`
- Schema: `imageUrl: { type: String, default: null }`

This is backward-compatible — existing documents without `imageUrl` will return `null` for the field via Mongoose's default.

### Change 3: Add `requireAdmin` to `auth.middleware.ts` (D-90)

Add the `requireAdmin` function (see Pattern 6 above) to the existing `auth.middleware.ts` file.

### Change 4: Register `/api/admin` router in `app.ts`

Add import and `app.use('/api/admin', authenticate, requireAdmin, adminRouter)` after the existing routes.

### Change 5: Add `ADMIN_EMAIL` + `ADMIN_PASSWORD` to `backend/.env.example`

```
# Admin seed
ADMIN_EMAIL=admin@uapp.vn
ADMIN_PASSWORD=change_me_admin_password
```

### Change 6: Add `http://localhost:3001` to CORS allowed origins

**File:** `backend/.env.example` (and production env)

The existing `ALLOWED_ORIGINS` in `.env.example` already includes `http://localhost:3001` — confirmed. No change needed to the file, but the planner must verify the production CORS config includes the deployed admin URL.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 — No `tailwind.config.js`

**What goes wrong:** Developer creates `tailwind.config.js` because every tutorial from 2023-2024 says to. Nothing works because Tailwind v4 ignores that file.
**Why it happens:** Tailwind v4 switched to CSS-first configuration. The `@tailwindcss/vite` plugin reads from CSS, not a JS config.
**How to avoid:** Use only `src/index.css` with `@import "tailwindcss"`. Add customizations with `@theme` in the CSS file.
**Warning signs:** Tailwind utility classes don't apply; no colors; `tailwind.config.js` exists but `src/index.css` lacks `@import "tailwindcss"`.

### Pitfall 2: shadcn init installs React 19 peer deps if run naively

**What goes wrong:** `npx shadcn@latest init` on some setups attempts to install React 19 peer dependencies, breaking the React 18 project.
**Why it happens:** shadcn 4.x defaults to React 19. The CLI reads the existing `package.json` and will detect React 18, but some component installs (via `npx shadcn@latest add`) may show peer dep warnings.
**How to avoid:** Run `npx shadcn@latest init` normally — the CLI detects React 18 and stays compatible. If npm throws peer dep errors when adding components, use `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`. Do NOT upgrade to React 19 — it is out of scope.
**Warning signs:** `npm ERR! peer dep missing: react@"^19.0.0"` during `shadcn add`.

### Pitfall 3: `Content-Type` header overrides with FormData

**What goes wrong:** Developer sets `Content-Type: multipart/form-data` in axios config or interceptor. Multer returns 400 / "Unexpected end of form".
**Why it happens:** `multipart/form-data` requires a `boundary` parameter (e.g., `multipart/form-data; boundary=----WebKitFormBoundary...`). The boundary is auto-generated by the browser when axios processes a `FormData` object. Setting the header manually sets it without a boundary.
**How to avoid:** Never set `Content-Type` manually for FormData requests. Rely on axios to detect the `FormData` instance and set the correct header.
**Warning signs:** Multer error "Multipart: Boundary not found"; 400 responses from upload endpoint.

### Pitfall 4: Vite proxy does NOT apply in production

**What goes wrong:** API calls work in dev (Vite proxy routes `/api` to backend), break in production because there is no Vite proxy.
**Why it happens:** `vite.config.ts` `server.proxy` only runs in `vite dev`. The built `dist/` is static files.
**How to avoid:** For production, serve the admin build behind the same origin as the backend (e.g., nginx), OR configure `VITE_API_URL` env var so axios uses the full URL. `admin/.env.example` already has `VITE_API_URL=http://localhost:3000`. In production, set this to the backend URL.
**Warning signs:** All API calls return 404 in production; calls work in dev.

### Pitfall 5: TanStack Query v5 — `onSuccess`/`onError` removed from `useQuery`

**What goes wrong:** Developer copies v4 examples that use `onSuccess` in `useQuery`. TypeScript does not catch it (it's a runtime `undefined` prop). Side effects never run.
**Why it happens:** v4 → v5 breaking change. `onSuccess`, `onError`, `onSettled` were removed from `useQuery` to reduce confusion about when they fire.
**How to avoid:** Use `useEffect` watching `data` for query side effects. For mutation side effects, use `onSuccess`/`onError` on `useMutation` — they are still there.
**Warning signs:** Side effects (toast, navigation) silently never trigger.

### Pitfall 6: `authenticate` DB lookup breaks if `User.isActive` field not added before deploy

**What goes wrong:** The updated `authenticate` calls `User.findById(...).select('role isActive')`. If `isActive` field doesn't exist in schema, Mongoose returns `undefined`, and `!user.isActive` evaluates to `true` — every authenticated user gets 401.
**Why it happens:** Mongoose doesn't error on missing fields — it just returns undefined.
**How to avoid:** Add `User.isActive` to schema AND deploy model change BEFORE deploying the updated `authenticate` middleware. Order matters.
**Warning signs:** All mobile users suddenly get 401; new users unaffected only if schema was added before they registered.

### Pitfall 7: `@/` path alias not configured in tsconfig

**What goes wrong:** `import { Button } from "@/components/ui/button"` resolves at runtime via Vite but TypeScript shows red underlines and type errors.
**Why it happens:** Vite alias (`resolve.alias`) handles bundling; TypeScript type resolution needs `paths` in `tsconfig.json` separately.
**How to avoid:** Configure `paths` in `tsconfig.json` (this project has a single tsconfig, not tsconfig.app.json). Both `baseUrl` and `paths` are required.
**Warning signs:** Components from `@/` show TS errors in editor but build succeeds; `tsc --noEmit` fails.

### Pitfall 8: Exercise `steps` array vs D-95 "movement list"

**What goes wrong:** Developer creates a new `movements` array field, causing a mismatch with the existing Exercise schema.
**Why it happens:** D-95 says "dynamic rows (Tên động tác | Thời gian phút)" but the Exercise model uses a `steps[]` array with `{ order, instruction, durationSeconds }`. The mobile app reads this same `steps` array.
**How to avoid:** The admin UI must write to the `steps` array, not a new array. The "Thời gian" column in the UI maps to `durationSeconds` (seconds, not minutes). The admin form should display as seconds or convert.
**Warning signs:** Mobile workout detail screen shows empty steps; data saved by admin not visible in mobile.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node --test`) |
| Config file | None — scripts in `backend/package.json` |
| Quick run command | `node --env-file=.env.test --require tsx/cjs --test src/api/admin/admin.integration.test.ts` |
| Full suite command | All `test:*` scripts in `backend/package.json` |

Admin frontend has no test setup in the scaffold. For Phase 6, backend integration tests are the primary validation gate.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Admin login returns tokens; non-admin blocked | integration | `test:admin` (to create) | ❌ Wave 0 |
| ADM-02 | Exercise CRUD endpoints work; images upload | integration | `test:admin` | ❌ Wave 0 |
| ADM-03 | Food item CRUD with imageUrl | integration | `test:admin` | ❌ Wave 0 |
| ADM-04 | User list, ban (isActive=false), delete | integration | `test:admin` | ❌ Wave 0 |
| ADM-97 | Banned user (isActive=false) gets 401 on all endpoints | integration | `test:auth` (extend) | ❌ extend existing |

### Wave 0 Gaps

- [ ] `backend/src/api/admin/admin.integration.test.ts` — covers ADM-01 through ADM-04
- [ ] Add `test:admin` script to `backend/package.json`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | JWT + bcrypt (existing); admin login reuses same system |
| V3 Session Management | Yes | JWT refresh rotation (existing); localStorage is acceptable for internal admin tool |
| V4 Access Control | Yes | `requireAdmin` middleware on all `/api/admin/*` routes; IDOR protection via URL params |
| V5 Input Validation | Yes | Zod schemas on all admin POST/PATCH bodies |
| V6 Cryptography | No direct new crypto | bcrypt + JWT already in place |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized admin access | Elevation of Privilege | `requireAdmin` checks `role === 'admin'` server-side; frontend role check is defense-in-depth only |
| Horizontal privilege escalation (admin modifying other admins) | Tampering | Seeds only one admin for v1; delete endpoint should check target user is not role === 'admin' |
| File upload abuse (oversized, non-image) | Tampering | multer 5MB limit already configured; `uploadSingle` restricts to 1 file |
| XSS via localStorage | Information Disclosure | Accepted risk per D-87 (internal tool); admin user count is 1; documented in decision |
| CSRF | Tampering | JWT in Authorization header (not cookie) is CSRF-immune by design |
| Mass delete of users | Tampering | Admin delete should not allow deleting users with role === 'admin' |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥20 | Backend + admin build | ✓ (per backend engine spec) | ≥20 | — |
| npm | Package installs | ✓ | (system) | — |
| MongoDB Atlas | Backend data | ✓ (running in phases 1-5) | Atlas | — |
| Cloudinary | Image upload | ✓ (configured in Phase 4) | v2 SDK | — |
| Vite dev server port 3001 | Admin dev | ✓ (configured in vite.config) | 5.x | Change port |
| Backend port 3000 | Vite proxy target | ✓ (running) | Express 5 | — |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.js` | Tailwind v4 CSS-first `@import "tailwindcss"` | Nov 2024 (v4 beta) / stable 2025 | No JS config file; `@theme` in CSS |
| `tailwindcss-animate` | `tw-animate-css` | 2025 | Drop-in replacement for v4 |
| shadcn `default` style | shadcn `new-york` style | 2025 | `new-york` is now default; both still supported |
| TanStack Query v4 `useQuery(key, fn)` | v5 `useQuery({ queryKey, queryFn })` | 2024 | Object-only syntax mandatory |
| `isLoading` for pending state | `isPending` (TanStack Query v5) | 2024 | `isLoading` still exists but has different semantics |
| `cacheTime` | `gcTime` (TanStack Query v5) | 2024 | Renamed for clarity |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The queue-based axios refresh interceptor pattern (isRefreshing + failedQueue) is the correct implementation for this codebase | Patterns > Pattern 2 | Low — multiple sources confirm this is the standard pattern; shape of the refresh response body `{ success, data: { accessToken, refreshToken } }` is confirmed from auth.service.ts |
| A2 | React 18 + shadcn 4.7 + Tailwind 4 will work without forced React 19 upgrade | Stack Setup > Pitfall 2 | Medium — shadcn docs say backward compatible, but peer dep warnings during `shadcn add` may require `--legacy-peer-deps` |
| A3 | The `authenticate` DB lookup for `isActive` will not cause performance issues at admin-tool traffic volumes | Backend Changes > Change 1 | Low — admin tool has 1-2 concurrent users |

---

## Open Questions

1. **`authenticate` performance with DB lookup**
   - What we know: Adding `User.findById` to every authenticated request adds a DB round-trip (~1-5ms on Atlas).
   - What's unclear: Mobile app makes many concurrent requests (home page loads 4-5 parallel queries). This could add measurable latency.
   - Recommendation: Accept for v1. If mobile performance degrades, introduce a short TTL in-memory cache (`Map<userId, { isActive, expiry }>`) in the middleware — but do NOT do this in Phase 6 without profiling first.

2. **Admin delete user — cascade?**
   - What we know: D-96 says delete → delete record.
   - What's unclear: Deleting a user leaves orphaned `DailyLog`, `WorkoutLog`, `HabitLog`, etc. records referencing the deleted `userId`.
   - Recommendation: For v1, simple `User.findByIdAndDelete()` is fine — orphaned logs don't affect mobile UX (user is gone). No cascade needed unless storage cost is a concern.

3. **File type validation on upload endpoint**
   - What we know: `uploadSingle` is configured for 5MB limit, 1 file. No MIME type restriction in the existing multer config.
   - What's unclear: Should the admin upload endpoint reject non-image MIME types?
   - Recommendation: Add `fileFilter` to `uploadSingle` or a new `uploadImage` variant that accepts only `image/*`. This is a small addition. Cloudinary will reject non-images anyway, but returning a clean error from multer is better UX.

---

## Sources

### Primary (HIGH confidence)
- [ui.shadcn.com/docs/installation/vite](https://ui.shadcn.com/docs/installation/vite) — Vite setup steps, tsconfig paths, components.json format
- [ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json) — `tailwind.config` blank for v4
- [ui.shadcn.com/docs/components/data-table](https://ui.shadcn.com/docs/components/data-table) — DataTable + pagination pattern
- [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — v4 migration notes, React 18 compatibility
- [tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5) — v5 breaking changes
- [vite.dev/config/server-options](https://vite.dev/config/server-options) — proxy config syntax
- Codebase: `backend/src/models/User.ts`, `FoodItem.ts`, `Exercise.ts`, `auth.middleware.ts`, `auth.service.ts`, `auth.routes.ts`, `cloudinary.service.ts`, `upload.middleware.ts` — all read directly

### Secondary (MEDIUM confidence)
- [react-hook-form.com/docs/usefieldarray](https://react-hook-form.com) — useFieldArray API (403 on fetch, but cross-verified with shadcn discussions and stable API docs)
- [github.com/shadcn-ui/ui/issues/6585](https://github.com/shadcn-ui/ui/issues/6585) — React 18 + Tailwind v4 confirmed compatible
- npm registry — all package versions verified via `npm view` on 2026-05-19

### Tertiary (LOW confidence)
- Multiple WebSearch results confirming axios interceptor queue pattern — pattern is well-established, implementation details [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified via npm registry on research date
- Architecture: HIGH — derived directly from reading codebase files
- Pitfalls: HIGH (Tailwind v4 CSS-first, FormData boundary) / MEDIUM (React 18 peer deps) — verified via official docs and issue tracker
- Backend changes: HIGH — derived from reading actual model files (FoodItem missing imageUrl confirmed by direct file read)

**Research date:** 2026-05-19
**Valid until:** 2026-06-18 (30 days — Tailwind v4 and shadcn are fast-moving but the patterns here are stable)
