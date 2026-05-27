import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import QueryProvider from '../providers/QueryProvider';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { getOnboardingSeen } from '../lib/storage/mmkv';

// Prevent auto-hide — splash is dismissed by AuthProvider on cold-start (D-38)
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Route gate — handles all navigation decisions after auth state is resolved
// ---------------------------------------------------------------------------
function RouteGate({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const onboardingSeen = getOnboardingSeen();
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!onboardingSeen && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (onboardingSeen && !isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (
      isAuthenticated &&
      user &&
      !user.profileCompleted &&
      (segments as string[])[1] !== 'complete-profile'
    ) {
      router.replace('/(auth)/complete-profile');
    } else if (isAuthenticated && user?.profileCompleted && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, user, segments]);

  if (isLoading) return null;

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Root layout
// NOTE: Splash dismissal is handled inside AuthProvider (D-38).
//       Do NOT add splash hide logic here.
// ---------------------------------------------------------------------------
export default function RootLayout(): React.JSX.Element {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <RouteGate>
            <Slot />
          </RouteGate>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
