# Phase 1: v2 Data Foundation - Validation Architecture

**Created:** 2026-05-26  
**Source:** `.planning/phases/01-v2-data-foundation/01-RESEARCH.md`  
**Status:** Ready for execution sampling

## Validation Goal

Validate that Phase 1 creates durable backend data contracts for v2.0 without implementing full feature workflows. The highest-risk contract is CODE-11: redeem codes must be stored hashed at rest and designed for atomic single-use redemption.

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner with `tsx/cjs`, `supertest`, and `mongodb-memory-server` |
| Config file | No standalone test config; commands are package scripts |
| Quick command | `cd backend && npm run typecheck` |
| Existing affected suites | `cd backend && npm run test:food` and `cd backend && npm run test:admin` |

## Requirement Coverage

| Req ID | Behavior | Test Type | Expected Test File |
|--------|----------|-----------|--------------------|
| CODE-11 | `RedeemCode` stores `codeHash` and no raw reusable code field | model/unit | `backend/src/models/RedeemCode.test.ts` |
| CODE-11 | Duplicate `codeHash` violates unique index | model/integration | `backend/src/models/RedeemCode.test.ts` |
| CODE-11 | Hash utility normalizes hyphens/spaces/case consistently and never returns raw input | unit | `backend/src/services/redeem-code.service.test.ts` |
| CODE-11 | Future redemption primitive can use status-guarded atomic update | service/integration | `backend/src/api/campaigns/campaigns.integration.test.ts` |

## Decision Coverage

| Decision | Validation Expectation |
|----------|------------------------|
| D-01 | No `code`, `rawCode`, `plainCode`, or reusable plaintext field exists on `RedeemCode` |
| D-02 | QR payload helper/contract produces HTTPS redeem URLs, not app-only deep links |
| D-03 | Campaign/code model supports entitlement duration after redemption |
| D-04 | Entitlement quota policy supports high daily quota mode |
| D-05 | `FoodScanAttempt` supports entitlement/source metadata |
| D-06 | Barcode validation requires name, kcal, protein, carbs, and fat before save |
| D-07 | `FoodItem.barcodes` is `string[]`; tests preserve leading zeros |
| D-08 | `NutMilkPreference` is a separate model |
| D-09 | Recommendation rules are static backend config/constants |
| D-10 | `Exercise.imageUrl` remains and `imageAssetId` is optional |
| D-11 | `MediaAsset` includes source, batchId, status, and basic metadata |
| D-12 | `FeedbackPromptState` is a separate model |
| D-13 | `AppRating` stores internal feedback; store review remains optional metadata/trigger |

## Sampling Plan

### Per Task

- Run targeted typecheck or targeted model/service tests after each implementation task.
- For model-only tasks, run the new model test file plus `npm run typecheck`.

### Per Wave

- Wave 1 package/security utility work: `cd backend && npm run typecheck` and new redeem-code service tests.
- Wave 2 model work: model tests for new schemas and compatibility tests for extended schemas.
- Wave 3 route/validation scaffolds: integration tests for auth/route availability and validation behavior.
- Wave 4 mobile/admin contracts: mobile/admin typecheck where package scripts exist.
- Wave 5 verification consolidation: all new Phase 1 tests plus existing affected `test:food` and `test:admin`.

### Phase Gate

Before marking Phase 1 complete:

```bash
cd backend
npm run typecheck
npm run test:food
npm run test:admin
```

Run any new Phase 1 test files directly if they are not yet included in package scripts.

## Wave 0 Gaps To Fill During Execution

- `backend/src/models/RedeemCode.test.ts`
- `backend/src/services/redeem-code.service.test.ts`
- `backend/src/api/campaigns/campaigns.integration.test.ts`
- Model tests for `Campaign`, `UserScanEntitlement`, `MediaAsset`, `AppRating`, `FeedbackPromptState`, and `NutMilkPreference`
- Compatibility checks for `FoodItem.barcodes`, `Exercise.imageAssetId`, and `FoodScanAttempt` entitlement metadata

## Non-Goals

- Do not validate full campaign generation/export UI in Phase 1.
- Do not validate barcode camera scan UI in Phase 1.
- Do not validate full media batch assignment UI in Phase 1.
- Do not validate rating prompt timing UX in Phase 1.

