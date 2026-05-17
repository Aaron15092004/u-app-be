import React, { createContext, useContext } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

// TODO Phase 2: implement real auth state with JWT + SecureStore
export function AuthProvider({ children }: Props): React.JSX.Element {
  const value: AuthContextValue = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
