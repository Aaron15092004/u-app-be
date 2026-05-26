---
phase: 3
reviewers: [opencode]
reviewed_at: 2026-05-18T00:00:00.000Z
model: minimax-m2.5-free (via OpenCode)
plans_reviewed:
  - 03-01-PLAN.md
  - 03-02-PLAN.md
  - 03-03-PLAN.md
  - 03-04-PLAN.md
  - 03-05-PLAN.md
  - 03-06-PLAN.md
  - 03-07-PLAN.md
  - 03-08-PLAN.md
  - 03-09-PLAN.md
note: "Claude CLI skipped (self — running inside Claude Code). gemini, codex, qwen, cursor not installed."
---

# Cross-AI Plan Review — Phase 3: Core Health Tracking

## OpenCode Review (minimax-m2.5-free)

### Summary

The Phase 3 plans are comprehensive and well-structured, covering all 25 requirements (WO-01 to WO-11, HAB-01 to HAB-07, BMI-01 to BMI-06) with proper wave sequencing (backend first → mobile infra → screens → timer/complete). Security considerations are strong with userId extracted from JWT only, Zod `.strict()` schemas preventing extra fields, and cross-tenant isolation via $match in aggregations. However, there are HIGH-severity issues around seed data language violations, timer accuracy, and potential victory-native/Expo SDK 54 compatibility concerns that could block success criteria.

---

### Strengths

1. **Robust security model** — All endpoints extract `userId` from JWT, never from request body. Zod `.strict()` rejects unknown keys. Cross-tenant isolation enforced in all aggregation pipelines.
2. **Idempotent seed script** — 03-01 correctly implements D-44 (skip if ≥100 exercises exist).
3. **Atomic BMI save** — 03-04 uses `session.withTransaction` with sequential fallback for memory-server, properly implementing D-54.
4. **Optimistic check-in** — 03-08 properly implements rollback on error with `onMutate` → `onError` → `onSettled`.
5. **Client-side BMI recalc** — 03-09 correctly computes BMI on slider drag (D-53), avoiding API calls.
6. **Correct D-47/D-57 semantics** — Stop discards (no WorkoutLog); habit is binary (1 check per day).

---

### Concerns

#### HIGH Severity

1. **[03-01] Seed data contains English names (D-41 violation)** — `seed-exercises.ts` includes English names like "Burpees", "Mountain climbers", "High knees", "Jumping jacks", "Deadlift", "Bent-over row". D-41 explicitly requires every name, description, and steps to be Vietnamese. Directly violates WO-01/WO-02/WO-11 success criteria.

2. **[03-07] setInterval drift in timer** — Using `setInterval(tick, 1000)` will drift over long workouts. For a 30-minute timer, accumulated drift could be several seconds. D-45–D-48 don't specify drift correction. May cause timer to end prematurely or late.

3. **[03-06] FlatList inside ScrollView anti-pattern** — Exercise list uses FlatList nested inside ScrollView with `scrollEnabled={false}`. This is a known React Native anti-pattern causing render performance issues and potential infinite layout loops.

4. **[03-09] victory-native v40 + Expo SDK 54 compatibility unverified** — Plan assumes victory-native@40.2.1 works with Expo SDK 54. Skia + Reanimated plugin ordering conflicts are common. No runtime verification step documented before shipping BMI chart.

5. **[03-09] babel.config.js plugin ordering risk** — Plan ensures reanimated is last plugin, but doesn't check for NativeWind or other plugin conflicts. Unconditional write could create ordering issues.

#### MEDIUM Severity

6. **[03-02] Two separate aggregation pipelines for workout stats** — `getWeeklyStats` runs two separate `$match` pipelines. Could be combined with `$facet` for efficiency.

7. **[03-03] Streak iteration O(365)** — Streak computes by iterating backward up to 365 days. Bounded but inefficient for active users; could aggregate directly.

8. **No mobile test coverage (03-05 to 03-09)** — Plans 03-05 through 03-09 have no test harness. `tsc --noEmit` is the only automated gate. Behavioral regressions (AppState auto-pause, timer state machine, optimistic rollback) unverifiable.

9. **[03-06] No error boundary around exercise list** — If FlatList crashes, the entire screen crashes with no recovery path.

10. **[03-09] BMI chart has no axis labels** — 30-day bar chart without date labels is poor UX; plan says "skip if it complicates Skia font loading."

11. **[03-05] timerStore not cleared on app background** — Store is in-memory but no explicit reset on cold-start. Combined with D-45 auto-pause, edge cases exist when returning to app with stale timer state.

---

### Suggestions

1. **Replace English terms in seed** — Scan `seed-exercises.ts` for English terms and replace: "Burpees" → "Nhảy lò cò", "Deadlift" → "Nâng tạ từ sàn", "Bent-over row" → "Kéo tạ cúi người", "Mountain climbers" → "Leo núi tại chỗ", "High knees" → "Chạy nâng cao gối", "Jumping jacks" → "Nhảy dang tay chân".

2. **Add timer drift correction** — Use `Date.now()` delta in setInterval to correct for drift:
   ```typescript
   const startTimeRef = useRef<number>(0);
   const totalSecondsRef = useRef<number>(0);
   // On start: startTimeRef.current = Date.now(); totalSecondsRef.current = initialSeconds;
   // On tick: remainingSeconds = Math.max(0, totalSecondsRef.current - Math.floor((Date.now() - startTimeRef.current) / 1000));
   ```

3. **Replace FlatList+ScrollView with FlashList or pure ScrollView** — Use `FlashList` from `@shopify/flash-list` (Expo-compatible) or render exercises with `exercises.map()` inside ScrollView. 100 items renders fine either way.

4. **Verify victory-native compatibility before committing** — Add a validation step in 03-09: after install, run `cd mobile && npx expo prebuild --clean && npx tsc --noEmit` to confirm Skia/Reanimated/NativeWind plugins all coexist.

5. **Combine workout stats aggregation with $facet** — Single pipeline call for both weekly stats and todayKcal.

6. **Add minimal BMI chart axis labels** — Add 5 Text labels at positions 0, 7, 14, 21, 30 days below the chart using absolute positioning (no Skia font involvement).

7. **Add explicit timerStore.reset() call on app cold-start** — In the root layout or AuthProvider, clear timerStore state when auth changes.

---

### Risk Assessment

**Overall Risk: MEDIUM-HIGH**

| Risk | Affected Requirements | Likelihood |
|------|----------------------|------------|
| English names in seed (D-41) | WO-01, WO-02, WO-11 | HIGH — planner was instructed to write Vietnamese but 6+ English terms may have slipped through |
| Timer drift | WO-06, WO-07, WO-08, WO-09 | MEDIUM — affects timer precision over 15-30 min sessions |
| victory-native/Skia crash | BMI-06 | MEDIUM — Expo SDK 53/54 + Skia is a common compatibility flashpoint |
| FlatList+ScrollView | WO-01, WO-02 | MEDIUM — degrades performance with 100 items |
| No mobile tests | All WO/HAB/BMI | HIGH (quality risk) — behavioral regressions invisible until manual testing |

The seed data D-41 violation is the highest-priority fix — it's a direct requirement violation and visually obvious to any Vietnamese user.

---

## Consensus Summary

Only one external reviewer (OpenCode/minimax-m2.5-free) was available — Gemini, Codex, Qwen, and Cursor are not installed; Claude CLI was skipped for independence.

### Top Concerns (from OpenCode)

1. **D-41 violation in seed data** — English exercise names must be replaced with Vietnamese before shipping (HIGH)
2. **setInterval timer drift** — Use Date.now() delta for accuracy in long timer sessions (HIGH)
3. **FlatList inside ScrollView** — Known anti-pattern; should use FlashList or plain ScrollView (HIGH)
4. **victory-native/Expo SDK 54 compatibility** — Validate Skia/Reanimated coexistence before committing (MEDIUM)
5. **No mobile test harness** — Quality risk; manual smoke tests are the only safety net (MEDIUM)

### Agreed Strengths

- Security posture is strong (JWT userId, .strict() Zod, ObjectId coercion in aggregations)
- Wave dependency structure is correct and well-reasoned
- Atomic BMI save (D-54) is correctly implemented with fallback
- Optimistic habit check-in with rollback follows correct TanStack Query pattern
- All 25 requirements covered with clear traceability

### Action Recommendation

Run `/gsd:plan-phase 3 --reviews` to incorporate the HIGH-severity concerns before execution, specifically:
1. Patch 03-01 to ensure all seed exercise names/descriptions/steps are Vietnamese
2. Patch 03-07 to use Date.now()-based timer drift correction
3. Patch 03-06 to replace FlatList+ScrollView with FlashList or ScrollView+map
