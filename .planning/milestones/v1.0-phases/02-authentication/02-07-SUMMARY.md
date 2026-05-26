# 02-07 Summary — OAuth + Logout

**Plan**: 02-07-PLAN.md
**Wave**: Wave 5 (final wave of Phase 2)
**Status**: COMPLETE
**Completed**: 2026-05-18

---

## What Was Built

### Backend — Google OAuth + Apple Sign In verification

- `backend/package.json`: Added `google-auth-library@^9.0.0`, `apple-signin-auth@^2.0.0`
- `backend/.env.example`: Added `GOOGLE_OAUTH_CLIENT_ID_WEB`, `_IOS`, `_ANDROID`, `APPLE_BUNDLE_ID=com.uapp.health`
- `backend/src/api/auth/auth.validation.ts`: Added `googleSignInSchema` (idToken), `appleSignInSchema` (identityToken + optional nonce)
- `backend/src/api/auth/auth.service.ts`:
  - `googleSignIn(idToken)` — verifies via `OAuth2Client`, upserts by providerId → email → creates new
  - `appleSignIn(identityToken, nonce?)` — verifies via apple-signin-auth, handles missing email with `${sub}@apple.local` synthetic email
  - `_googleClient` exported as test hook (mutable OAuth2Client instance)
  - `_appleSigninDeps` exported as mutable indirection object (`{ verifyIdToken }`) — same pattern as `_emailDeps`
- `backend/src/api/auth/auth.controller.ts`: Added `googleSignIn`, `appleSignIn` handlers
- `backend/src/api/auth/auth.routes.ts`: Added `POST /google`, `POST /apple` (both public, no `authenticate`)
- `backend/src/api/auth/auth.integration.test.ts`: Tests 18–24 (Google: new user, same providerId, verifier throws, email match; Apple: new user, same providerId, verifier throws). **24/24 pass**.

### Mobile — Google Sign In + Apple Sign In + logout

- `mobile/package.json`: Added `@react-native-google-signin/google-signin@^13.0.0`, `expo-apple-authentication@~7.0.0`
- `mobile/app.json`: Added plugins for google-signin (iosUrlScheme placeholder), expo-apple-authentication. Added `ios.usesAppleSignIn: true`
- `mobile/src/lib/auth/google-signin.ts`: `signInWithGoogle()` (native SDK, returns idToken), `signOutGoogle()`
- `mobile/src/lib/auth/apple-signin.ts`: `isAppleAuthAvailable()`, `signInWithApple()` (returns identityToken + nonce)
- `mobile/src/components/ui/SocialAuthButton.tsx`: Google (white bg, `logo-google`) and Apple (black bg, `logo-apple`) variants with loading state
- `mobile/src/lib/api/auth.api.ts`: Added `googleSignInApi`, `appleSignInApi`
- `mobile/src/providers/AuthProvider.tsx`: Added `loginWithGoogle`, `loginWithApple`. Logout calls `signOutGoogle()` best-effort
- `mobile/src/app/(auth)/login.tsx`: Real `SocialAuthButton` components. Google always shown; Apple only when `Platform.OS === 'ios' && appleAvailable`. `oauthLoading` state. CANCELLED errors silenced
- `mobile/src/app/(tabs)/index.tsx`: Real logout button with `Alert.alert` confirmation calling `auth.logout()`

---

## Key Decisions

- **`_appleSigninDeps` indirection** (not direct namespace re-export): `import * as appleSigninLib` creates a sealed CJS namespace that tests cannot monkey-patch. Same mutable-object pattern as `_emailDeps` solves this
- **`${sub}@apple.local` synthetic email**: Apple only sends `email` on first sign-in. Returning users have no email — synthetic email prevents unique constraint violation while preserving the `providerId` lookup path
- **Apple button gated on `isAppleAuthAvailable()`**: `expo-apple-authentication` requires iOS 13+ and a physical device; must not render on Android or simulator

---

## Test Results

```
tests 24
pass  24
fail  0
```

All integration tests pass including token rotation enforcement (bcrypt SHA-256 pre-hash fix), Google OAuth upsert, Apple Sign In upsert, verifier-throws paths.
