import { create } from 'zustand';
import type { IAuthUser } from '../api/types';

interface AuthState {
  user: IAuthUser | null;
  accessToken: string | null; // in-memory ONLY — never persist (D-22)
  setUser: (user: IAuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null }),
}));

export type { IAuthUser };
