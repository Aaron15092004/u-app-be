---
phase: 6
plan: 4
subsystem: admin-web-dashboard
tags: [react, tanstack-query, react-hook-form, zod, crud, data-table]
dependency_graph:
  requires: [06-01, 06-02, 06-03]
  provides: [admin-exercises-crud, admin-food-items-crud, admin-users-management]
  affects: [admin-spa-shell]
tech_stack:
  added: []
  patterns:
    - DataTable<T> generic component with @tanstack/react-table
    - TanStack Query v5 feature hooks pattern
    - useFieldArray for dynamic steps editor
    - FormResolver cast for zod v4 + @hookform/resolvers v5 compatibility
key_files:
  created:
    - admin/src/components/data-table/DataTable.tsx
    - admin/src/components/ui/ImageUploadField.tsx
    - admin/src/features/exercises/useExercises.ts
    - admin/src/features/food-items/useFoodItems.ts
    - admin/src/features/users/useUsers.ts
  modified:
    - admin/src/pages/ExercisesPage.tsx
    - admin/src/pages/FoodItemsPage.tsx
    - admin/src/pages/UsersPage.tsx
decisions:
  - zodResolver cast to FormResolver<T> to fix Zod v4 ZodPipe type mismatch with @hookform/resolvers v5
  - NumericField union type for MACRO_FIELDS to prevent null value spreading to Input elements
  - sonner toast() replaces useToast (file does not exist in base-nova shadcn setup)
  - useFieldArray rows keyed by field.id (not index) per TanStack/react-hook-form best practice
  - Admin rows in UsersPage return null for actions cell — cannot be banned or deleted from UI
metrics:
  duration: ~25 minutes
  completed_date: "2026-05-20"
  tasks_completed: 8
  files_created: 5
  files_modified: 3
---

# Phase 6 Plan 4: Admin CRUD Pages Summary

## One-liner

Full CRUD management pages for Exercises, Food Items, and Users with reusable DataTable, image upload, and dynamic step editor.

## What Was Built

**Task 1 — DataTable component** (`admin/src/components/data-table/DataTable.tsx`): Generic `DataTable<TData, TValue>` using `@tanstack/react-table` v8 with pagination (Previous/Trước, Next/Sau), skeleton loading rows (5 rows × column count), and empty state ("Không có dữ liệu."). Accepts `columns`, `data`, `pageSize`, and `isLoading` props.

**Task 2 — ImageUploadField component** (`admin/src/components/ui/ImageUploadField.tsx`): Uploads image via `POST /api/admin/upload?folder={exercises|food-items}` using FormData (no manual Content-Type). Shows skeleton during upload, image preview with remove button when done, error message on failure. Integrates with react-hook-form via `value`/`onChange` props.

**Task 3 — useExercises hooks** (`admin/src/features/exercises/useExercises.ts`): `useExercises(page, search)`, `useCreateExercise()`, `useUpdateExercise()`, `useDeleteExercise()` — all TanStack Query v5 object-form syntax. Exports `Exercise` and `ExerciseStep` interfaces.

**Task 4 — useFoodItems hooks** (`admin/src/features/food-items/useFoodItems.ts`): `useFoodItems(page, search)`, `useCreateFoodItem()`, `useUpdateFoodItem()`, `useDeleteFoodItem()`. Exports `FoodItem` interface.

**Task 5 — useUsers hooks** (`admin/src/features/users/useUsers.ts`): `useUsers(page, search)`, `useBanUser()`, `useDeleteUser()`. Exports `AdminUser` interface.

**Task 6 — ExercisesPage** (`admin/src/pages/ExercisesPage.tsx`): Full CRUD — DataTable with columns (name, category badge, difficulty, duration, calories, actions), debounced search input, Dialog with react-hook-form + Zod validation, `useFieldArray` for dynamic steps editor (+ Thêm động tác / × remove), image upload, sonner toasts on success/error. `field.id` used as React key (not index).

**Task 7 — FoodItemsPage** (`admin/src/pages/FoodItemsPage.tsx`): Full CRUD — DataTable with columns (name, kcal/100g, protein, carbs, fat, actions), debounced search, Dialog with all 9 macro/nutrient fields (kcalPer100g, protein, carbs, fat, fiber, sugar, sodium, vitaminC, category), image upload, sonner toasts.

**Task 8 — UsersPage** (`admin/src/pages/UsersPage.tsx`): User management — DataTable with email/name, role badge (Admin/User), status badge (Hoạt động/Bị khóa), registration date. Ban toggle (ShieldOff when active → ShieldCheck when banned). Admin rows return `null` for actions cell — cannot be banned or deleted from UI. Debounced search by email.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `useToast` from `@/hooks/use-toast` with `sonner`**
- **Found during:** Task 6 implementation review (per prompt instructions)
- **Issue:** The plan code imports `useToast` from `@/hooks/use-toast` but this file does not exist in the base-nova shadcn setup. The project uses `sonner` (documented in Phase 6 Plan 03 decisions).
- **Fix:** All three page files use `import { toast } from 'sonner'` with `toast('...')` for success and `toast.error('...')` for errors.
- **Files modified:** ExercisesPage.tsx, FoodItemsPage.tsx, UsersPage.tsx

**2. [Rule 1 - Bug] Fix Zod v4 `z.coerce.number()` TypeScript incompatibility with `@hookform/resolvers` v5**
- **Found during:** Task 6 typecheck (`npm run typecheck` exit code 2)
- **Issue:** `z.coerce.number()` in Zod v4 creates `ZodPipe<ZodString, ZodNumber>` with `_input: string`. The `@hookform/resolvers` v5 zodResolver infers the form input type as `string` for coerced fields, creating a type mismatch with `useForm<ExerciseFormValues>` which expects `FieldValues`.
- **Fix:** Cast `zodResolver(schema)` to `FormResolver<FormValues>` using `import type { Resolver as FormResolver } from 'react-hook-form'`. This preserves runtime behavior (zod coercion still works) while satisfying TypeScript.
- **Files modified:** ExercisesPage.tsx, FoodItemsPage.tsx

**3. [Rule 1 - Bug] Narrow `MACRO_FIELDS` type to prevent `null` spreading to `<Input>` value**
- **Found during:** Task 7 typecheck
- **Issue:** `Array<{ name: keyof FoodFormValues; label: string }>` widens `field.value` to the union of all form field types, which includes `string | number | null | undefined` (from `imageUrl: z.string().nullable().optional()`). The `null` is not assignable to `InputHTMLAttributes.value`.
- **Fix:** Defined `type NumericField = 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium' | 'vitaminC'` and typed `MACRO_FIELDS` with that narrower type.
- **Files modified:** FoodItemsPage.tsx

## Verification

- `npm run typecheck` — exit 0 (0 errors)
- `npm run dev` — starts on port 3001 in 1318ms, no errors
- ExercisesPage exports `ExercisesPage` named export (React.lazy compatible)
- FoodItemsPage exports `FoodItemsPage` named export
- UsersPage exports `UsersPage` named export

## Known Stubs

None — all three pages are fully implemented (no hardcoded empty data, no placeholder text flowing to UI).

## Threat Flags

None — no new network endpoints or auth paths introduced in this plan (all API calls go through the existing `apiClient` which applies the JWT interceptor from Plan 03).

## Self-Check: PASSED
