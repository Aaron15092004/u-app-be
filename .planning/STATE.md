# Project State — Ủ App

## Current Phase
Phase 1 (not started)

## Status
initialized

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Infrastructure | Not Started |
| 2 | Authentication | Not Started |
| 3 | Core Health Tracking | Not Started |
| 4 | AI Food Scan | Not Started |
| 5 | Home Dashboard, Profile & Notifications | Not Started |
| 6 | Admin Web Dashboard | Not Started |

## Current Plan
None — Phase 1 planning not yet started.

## Progress Bar
```
Phase 1 [          ] 0%
Phase 2 [          ] 0%
Phase 3 [          ] 0%
Phase 4 [          ] 0%
Phase 5 [          ] 0%
Phase 6 [          ] 0%
```

## Performance Metrics
- Requirements covered: 62/62
- Phases completed: 0/6
- Plans completed: 0

## Accumulated Context

### Key Decisions Logged
- Stack: Expo SDK 53/54 + Express 5.1 + MongoDB Atlas M2 + LogMeal/GPT-4o-mini + Cloudinary + Firebase FCM
- AI food scan proxied through backend — never called directly from client
- Apple Sign In is required (App Store Guideline 4.8) when any OAuth is present
- Image compression to <500KB before AI scan; rate limit 20 scans/user/day
- Google OAuth uses `@react-native-google-signin/google-signin` (native), not `expo-auth-session`
- MongoDB requires compound index `{ userId: 1, date: -1 }` from Phase 1
- Push notifications use server-side FCM (not local scheduling) for OEM device compatibility

### Open Questions
1. Vietnamese food database source — USDA excludes Vietnamese dishes; needs curation or dietitian
2. LogMeal production pricing — contact sales; fallback is GPT-4o-mini sole provider
3. Apple Developer Account ($99/year) — must be active before Phase 2
4. EAS plan tier — free tier limits builds/month
5. Monetization model — freemium vs. fully free affects scope
6. Admin dashboard timeline — needed before or after launch?

### Blockers
None currently.

### Todos
- [ ] Confirm Vietnamese food data source before Phase 4
- [ ] Activate Apple Developer Account before Phase 2
- [ ] Confirm LogMeal pricing or choose GPT-4o-mini sole provider
- [ ] Decide EAS plan tier

## Session Continuity

**Last action**: ROADMAP.md and STATE.md created by roadmapper agent.
**Next action**: Run `/gsd:plan-phase 1` to decompose Phase 1 into executable plans.

## Last Updated
2026-05-17
