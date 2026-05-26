---
phase: "04"
plan: "02"
subsystem: "ai-food-scan"
tags: [backend, models, ai, openai, mongoose, food]
dependency_graph:
  requires:
    - 04-01 (openai npm package installed)
  provides:
    - Updated FoodLog schema (no mealType, with sodium/vitaminC)
    - FoodItem model for Vietnamese food database
    - analyzeImage() GPT-4o-mini vision implementation
  affects:
    - backend/src/models/FoodLog.ts
    - backend/src/models/FoodItem.ts
    - backend/src/services/ai-food.service.ts
tech_stack:
  added: []
  patterns:
    - GPT-4o-mini vision with response_format json_object
    - OpenAI client instantiated at call time (not module scope) for testability
    - MongoDB text index with default_language 'none' for Vietnamese diacritics
    - Response normalization: Number() || 0 coerces all numeric fields
key_files:
  created:
    - backend/src/models/FoodItem.ts
  modified:
    - backend/src/models/FoodLog.ts
    - backend/src/services/ai-food.service.ts
decisions:
  - "FoodLog mealType removed from both IFoodLog interface and FoodLogSchema (D-61)"
  - "FoodLog.foods sodium/vitaminC added with default 0 (D-63)"
  - "FoodItem text index uses default_language: 'none' to prevent English stemming on Vietnamese diacritics (RESEARCH Pitfall 8)"
  - "analyzeImage() instantiates OpenAI client at call time — not module scope — allowing OPENAI_API_KEY test override (T-04-02-03)"
  - "NutritionResult.imageUrl changed from string to string|null; always returns null in Phase 4 (D-62)"
  - "Response normalization: Number(field) || 0 prevents NaN; recalculate totals from foods if AI omits them (T-04-02-02, Pitfall 5)"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-05-19"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 4 Plan 02: FoodLog Update + FoodItem Model + AI Service Summary

**One-liner:** Update FoodLog schema (remove mealType, add sodium/vitaminC), create FoodItem Vietnamese food database model with Vietnamese-safe text index, and implement GPT-4o-mini vision analyzeImage() with full response normalization.

## What Was Built

### Task 1: FoodLog schema update (D-61/D-63)

Updated `backend/src/models/FoodLog.ts`:

- **Removed** `mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'` from both `IFoodLog` interface and `FoodLogSchema` (was `required: true` — causing Mongoose validation errors on all POST /api/food/logs calls before this fix)
- **Added** `sodium?: number` and `vitaminC?: number` to `IFoodLog.foods` array element type
- **Added** `sodium: { type: Number, default: 0 }` and `vitaminC: { type: Number, default: 0 }` to the foods subdocument in FoodLogSchema
- Compound index `{ userId: 1, date: -1 }` preserved unchanged

Verified: `node --require tsx/cjs` schema introspection confirms `schema.path('mealType')` is undefined and `schema.path('foods.sodium')` exists.

### Task 2: FoodItem model + ai-food.service.ts (D-65/D-58/D-59/D-60)

**Created `backend/src/models/FoodItem.ts`:**
- `IFoodItem` interface: `name` (required), `nameEn` (optional), `kcalPer100g` (required), `protein/carbs/fat/fiber/sugar/sodium/vitaminC` (all default 0), `category` (optional), `source: 'openfoods' | 'manual'`
- Text index: `{ name: 'text', nameEn: 'text' }` with `{ default_language: 'none' }` — prevents English stemmer from mangling Vietnamese diacritics (phở, bún, cơm)
- No `{ userId: 1, date: -1 }` compound index — this is a shared food database, not a user-scoped collection

**Replaced `backend/src/services/ai-food.service.ts`:**
- Updated `NutritionResult` interface: added `sodium`, `vitaminC`, `tags: string[]` per food item (D-60); changed `imageUrl` from `string` to `string | null` (D-62)
- Removed second `imageUrl` parameter from `analyzeImage()` signature (D-62 — no Cloudinary in Phase 4)
- Implementation: GPT-4o-mini vision, `response_format: { type: 'json_object' }`, Vietnamese system prompt defining full 10-field JSON schema, `max_tokens: 1000`
- OpenAI client instantiated inside function body (not at module level) — allows `process.env.OPENAI_API_KEY` to be set by test stubs before function runs (T-04-02-03)
- Response normalization:
  - `Number(field) || 0` on all numeric fields (prevents NaN from string values or missing keys)
  - `tags` defaults to `[]` if AI omits it
  - Totals recalculated from foods sum if AI response omits any totals field
  - Empty foods array throws `Error('Không nhận dạng được thức ăn trong ảnh')` (Pitfall 5)
- Returns `aiProvider: 'openai'` and `imageUrl: null` always (D-62)

## Verification Results

| Check | Result |
|-------|--------|
| `schema.path('mealType')` is undefined | PASSED |
| `schema.path('foods.sodium')` exists | PASSED |
| `schema.path('foods.vitaminC')` exists | PASSED |
| `npx tsc --noEmit` zero errors | PASSED (0 error count) |
| `FoodItem.ts` contains `default_language: 'none'` | PASSED |
| `ai-food.service.ts` contains `gpt-4o-mini` | PASSED |
| `ai-food.service.ts` contains `json_object` | PASSED |
| `ai-food.service.ts` contains `imageUrl: null` | PASSED |

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | 778bce2 | feat(04-02): update FoodLog schema — remove mealType, add sodium/vitaminC |
| Task 2 | 2bd121e | feat(04-02): create FoodItem model + implement analyzeImage with GPT-4o-mini |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate IFoodItem export caused TypeScript error TS2484**

- **Found during:** Task 2 TypeScript verification
- **Issue:** Plan specified `export { IFoodItem };` in addition to `export interface IFoodItem` — the interface declaration already exports the symbol, making the named re-export a conflict (`Export declaration conflicts with exported declaration of 'IFoodItem'`).
- **Fix:** Removed the redundant `export { IFoodItem };` line. The interface is already exported at declaration.
- **Files modified:** backend/src/models/FoodItem.ts
- **Commit:** 2bd121e

## Known Stubs

None. Both models are fully implemented with no placeholder values or TODO comments.

## Threat Flags

None. No new network endpoints introduced in this plan. The `analyzeImage()` function is a service — it is only callable from backend route handlers (not directly exposed). Threat mitigations from the threat register were implemented as required:

- T-04-02-02: Response normalization (`Number(field) || 0`, empty foods check, tags default []) — IMPLEMENTED
- T-04-02-03: OpenAI client at call time, key from env only, never logged — IMPLEMENTED
- T-04-02-04: FoodItem text index with `$text` operator (not raw regex from user input) — IMPLEMENTED via schema

## Self-Check: PASSED

- [x] `backend/src/models/FoodLog.ts` updated (mealType removed, sodium/vitaminC added)
- [x] `backend/src/models/FoodItem.ts` created with text index `default_language: 'none'`
- [x] `backend/src/services/ai-food.service.ts` implements `analyzeImage(buffer)` with GPT-4o-mini
- [x] `npx tsc --noEmit` returns 0 errors
- [x] Commits 778bce2 and 2bd121e exist in git log
