---
phase: "04"
plan: "04"
subsystem: "ai-food-scan"
tags: [backend, seed, database, vietnamese-food, mongoose]
dependency_graph:
  requires:
    - 04-02 (FoodItem model created)
  provides:
    - vietnamese-foods.json: 150 curated Vietnamese food items (static data)
    - seed-foods.ts: idempotent FoodItem collection seeder
    - seed:foods npm script
  affects:
    - backend/src/scripts/seed-foods.ts
    - backend/src/scripts/data/vietnamese-foods.json
    - backend/package.json
tech_stack:
  added: []
  patterns:
    - Idempotent seeder: countDocuments() >= 50 threshold skips insert
    - TypeScript resolveJsonModule for JSON data import
    - insertMany with ordered:false for bulk write resilience
    - mongoose connect/disconnect pattern from seed-exercises.ts
key_files:
  created:
    - backend/src/scripts/data/vietnamese-foods.json
    - backend/src/scripts/seed-foods.ts
  modified:
    - backend/package.json
decisions:
  - "Static JSON committed to source control — OpenFoodFacts 9GB CSV is impractical (D-66, RESEARCH Pitfall 4)"
  - "Idempotency threshold set to 50 documents (not 150) — allows partial re-seed if needed while preventing duplicate full runs"
  - "source type cast to 'manual' | 'openfoods' union — JSON values are strings, TypeScript needs explicit cast for Mongoose enum"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-19"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 4 Plan 04: Vietnamese Food Database Seed Summary

**One-liner:** 150-item curated Vietnamese food JSON database with idempotent FoodItem seeder script — `npm run seed:foods` populates MongoDB and skips if already seeded (countDocuments >= 50).

## What Was Built

### Task 1: vietnamese-foods.json (150 curated items)

Created `backend/src/scripts/data/vietnamese-foods.json`:

- **150 items** across 7 categories with realistic per-100g nutrition estimates
- **Category breakdown:** bún/phở (26), cơm (24), bánh (24), thịt/cá (24), rau/chay (20), đồ uống (16), snack/khô (16)
- **100% coverage:** all 150 items include `nameEn` for improved search coverage
- All items: `source: "manual"`, required fields `name`, `kcalPer100g`, `protein`, `carbs`, `fat`
- Optional fields included: `fiber`, `sugar`, `sodium`, `vitaminC`, `category` — all present for every item

Example items (values per 100g):
- Phở bò: kcal=65, protein=6g, carbs=8g, fat=1.5g, sodium=450mg
- Cơm trắng: kcal=130, protein=2.7g, carbs=28g, fat=0.3g
- Bánh mì thịt: kcal=220, protein=10g, carbs=30g, fat=7g, sodium=580mg
- Trà sữa: kcal=90, protein=1.5g, carbs=18g, fat=1.8g, sugar=16g
- Gà nướng: kcal=190, protein=28g, carbs=0g, fat=9g

### Task 2: seed-foods.ts + seed:foods npm script

Created `backend/src/scripts/seed-foods.ts`:

```typescript
import 'dotenv/config';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem';
import foodData from './data/vietnamese-foods.json';
```

Script flow:
1. Assert `MONGODB_URI` environment variable exists
2. Connect to MongoDB Atlas via `mongoose.connect(process.env.MONGODB_URI)`
3. Log `Found ${count} existing FoodItem documents`
4. **Idempotency gate:** if `FoodItem.countDocuments() >= 50` → log skip message → disconnect → return
5. Map JSON data with explicit TypeScript union cast for `source` field
6. `FoodItem.insertMany(items, { ordered: false })` — `ordered: false` ensures partial success if any item fails validation
7. Log `Seeded ${result.length} Vietnamese food items` → disconnect

Error handling: catch block logs error, calls `mongoose.disconnect()`, then `process.exit(1)`.

Updated `backend/package.json`:
```json
"seed:foods": "tsx src/scripts/seed-foods.ts"
```

## Verification Results

| Check | Result |
|-------|--------|
| `node -e "require(...vietnamese-foods.json).length"` outputs 150 | PASSED |
| `npx tsc --noEmit` zero errors for seed-foods.ts | PASSED |
| `grep -c '"seed:foods"' backend/package.json` outputs 1 | PASSED |
| seed-foods.ts contains `FoodItem.countDocuments` | PASSED |
| seed-foods.ts contains `FoodItem.insertMany` | PASSED |
| All 150 items have name + kcalPer100g + protein + carbs + fat + source:'manual' | PASSED |

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | 10f02b9 | feat(04-04): create vietnamese-foods.json with 150 curated food items |
| Task 2 | a78a3c5 | feat(04-04): add seed-foods.ts script and seed:foods npm script |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error on source field string-to-enum assignment**

- **Found during:** Task 2 TypeScript compilation
- **Issue:** `foodData` imported via `resolveJsonModule` types all string fields as `string`. Assigning `item.source` (typed `string`) directly to FoodItem `source: 'manual' | 'openfoods'` would cause TS2322 type mismatch.
- **Fix:** Added explicit cast `(item.source || 'manual') as 'manual' | 'openfoods'` in the items map function.
- **Files modified:** backend/src/scripts/seed-foods.ts
- **Commit:** a78a3c5

**2. [Rule 2 - Missing critical functionality] disconnect() in catch block**

- **Found during:** Task 2 implementation review against threat model T-04-04-01**
- **Issue:** Plan described `console.error + disconnect + process.exit(1)` but the simple catch pattern `seed().catch(err => { console.error(err); process.exit(1); })` would leave the mongoose connection open on error.
- **Fix:** Used `mongoose.disconnect().finally(() => process.exit(1))` in the catch block to ensure connection cleanup before exit.
- **Files modified:** backend/src/scripts/seed-foods.ts
- **Commit:** a78a3c5

## Known Stubs

None. The JSON file contains real nutritional data and the seed script is fully implemented.

## Threat Flags

None. The static JSON file contains only public nutritional information for Vietnamese dishes — no PII, no secrets. The seed script is a one-shot CLI tool, not a server endpoint.

Threat mitigations from the threat register were implemented:
- T-04-04-01: Idempotency via `countDocuments() >= 50` check — IMPLEMENTED
- T-04-04-02: vietnamese-foods.json contains only nutrition data (no PII/secrets) — ACCEPTED
- T-04-04-03: Values marked as estimated; admin correction deferred to Phase 6 — ACCEPTED

## Self-Check: PASSED

- [x] `backend/src/scripts/data/vietnamese-foods.json` exists with 150 items
- [x] `backend/src/scripts/seed-foods.ts` exists with countDocuments + insertMany
- [x] `backend/package.json` has `"seed:foods"` script
- [x] `npx tsc --noEmit` returns 0 errors
- [x] Commits 10f02b9 and a78a3c5 exist in git log
