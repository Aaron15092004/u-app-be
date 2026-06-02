import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../lib/auth/auth-store';
import {
  getRefreshToken,
  saveRefreshToken,
  clearTokens,
} from '../lib/auth/token-storage';
import { loginApi, registerApi, refreshApi, logoutApi, completeProfileApi, googleSignInApi, appleSignInApi } from '../lib/api/auth.api';
import { signInWithGoogle, signOutGoogle } from '../lib/auth/google-signin';
import { signInWithApple } from '../lib/auth/apple-signin';
import { authEvents } from '../lib/api/client';
import { setCachedUser, getCachedUser, clearCachedUser } from '../lib/storage/mmkv';
import { queryClient } from '../lib/query/query-client';
import type { IAuthUser, CompleteProfileRequest } from '../lib/api/types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: IAuthUser | null;
  login: (email: string, password: string) => Promise<IAuthUser>;
  register: (email: string, password: string) => Promise<IAuthUser>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  completeProfile: (body: CompleteProfileRequest) => Promise<IAuthUser>;
  loginWithGoogle: () => Promise<IAuthUser>;
  loginWithApple: () => Promise<IAuthUser>;
  sessionExpired: boolean;
  acknowledgeSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: Props): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const storeUser = useAuthStore((s) => s.user);

  // D-38: Cold-start — attempt silent refresh, then hide splash
  useEffect(() => {
    (async () => {
      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) return; // no session

        const result = await refreshApi(storedRefreshToken);
        await saveRefreshToken(result.refreshToken);
        useAuthStore.setState({ accessToken: result.accessToken });

        // No /me endpoint — restore user from MMKV cache
        const cachedUser = getCachedUser();
        if (cachedUser) {
          useAuthStore.setState({ user: cachedUser });
        }
      } catch {
        // Refresh failed — clear everything, treat as new session
        await clearTokens();
        clearCachedUser();
        setSessionExpired(true);
      } finally {
        setIsLoading(false);
        // D-38: hideAsync is here, NOT in _layout.tsx
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  // Subscribe to session-expired events from the 401 interceptor
  useEffect(() => {
    const unsub = authEvents.on(() => {
      setSessionExpired(true);
      useAuthStore.getState().clear();
      clearCachedUser();
    });
    return unsub;
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const login = async (email: string, password: string): Promise<IAuthUser> => {
    const result = await loginApi({ email, password });
    await saveRefreshToken(result.refreshToken);
    useAuthStore.setState({ user: result.user, accessToken: result.accessToken });
    setCachedUser(result.user);
    return result.user;
  };

  const register = async (email: string, password: string): Promise<IAuthUser> => {
    const result = await registerApi({ email, password });
    await saveRefreshToken(result.refreshToken);
    useAuthStore.setState({ user: result.user, accessToken: result.accessToken });
    setCachedUser(result.user);
    return result.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutApi(); // best-effort
    } catch {
      // ignore
    }
    try { await signOutGoogle(); } catch {}
    await clearTokens();
    useAuthStore.getState().clear();
    clearCachedUser();
    queryClient.clear();
    // D-37: onboarding_seen is NOT cleared on logout
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) return null;
      const result = await refreshApi(storedRefreshToken);
      await saveRefreshToken(result.refreshToken);
      useAuthStore.setState({ accessToken: result.accessToken });
      return result.accessToken;
    } catch {
      return null;
    }
  };

  const completeProfile = async (body: CompleteProfileRequest): Promise<IAuthUser> => {
    const result = await completeProfileApi(body);
    useAuthStore.setState({ user: result });
    setCachedUser(result);
    return result;
  };

  const loginWithGoogle = async (): Promise<IAuthUser> => {
    const { idToken } = await signInWithGoogle();
    const res = await googleSignInApi(idToken);
    await saveRefreshToken(res.refreshToken);
    useAuthStore.setState({ user: res.user, accessToken: res.accessToken });
    setCachedUser(res.user);
    return res.user;
  };

  const loginWithApple = async (): Promise<IAuthUser> => {
    const { identityToken, nonce } = await signInWithApple();
    const res = await appleSignInApi(identityToken, nonce);
    await saveRefreshToken(res.refreshToken);
    useAuthStore.setState({ user: res.user, accessToken: res.accessToken });
    setCachedUser(res.user);
    return res.user;
  };

  const acknowledgeSessionExpired = (): void => {
    setSessionExpired(false);
  };

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value: AuthContextValue = {
    isLoading,
    isAuthenticated: storeUser !== null,
    user: storeUser,
    login,
    register,
    logout,
    refreshAccessToken,
    completeProfile,
    loginWithGoogle,
    loginWithApple,
    sessionExpired,
    acknowledgeSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
