import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../auth/auth-store';
import { getRefreshToken, saveRefreshToken, clearTokens } from '../auth/token-storage';
import { refreshApi } from './auth.api';
import { clearCachedUser } from '../storage/mmkv';

// ---------------------------------------------------------------------------
// Simple event bus — avoids Node.js `events` module (unsafe in RN bundlers)
// ---------------------------------------------------------------------------
const _sessionExpiredListeners: Array<() => void> = [];
export const authEvents = {
  on: (cb: () => void): (() => void) => {
    _sessionExpiredListeners.push(cb);
    return () => {
      const i = _sessionExpiredListeners.indexOf(cb);
      if (i > -1) _sessionExpiredListeners.splice(i, 1);
    };
  },
  emit: (): void => {
    _sessionExpiredListeners.forEach((cb) => cb());
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://u-app-be.onrender.com',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-U-Client-Platform': Platform.OS,
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach access token from Zustand (in-memory only, D-22)
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((requestConfig: AxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && requestConfig.headers) {
    (requestConfig.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  if (requestConfig.headers) {
    (requestConfig.headers as Record<string, string>)['X-U-Client-Platform'] = Platform.OS;
  }
  return requestConfig as Parameters<typeof apiClient.interceptors.request.use>[0] extends (config: infer C) => infer R ? R : never;
});

// ---------------------------------------------------------------------------
// Queue for requests that arrive while a token refresh is in flight
// ---------------------------------------------------------------------------
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach((entry) => {
    if (token) {
      entry.resolve(token);
    } else {
      entry.reject(error);
    }
  });
  refreshQueue = [];
}

// ---------------------------------------------------------------------------
// Response interceptor — 401 refresh-and-retry
// ---------------------------------------------------------------------------
// Extend config type to carry our custom retry flag
interface RetryableConfig extends AxiosRequestConfig {
  __isRetry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (err: unknown) => {
    if (!axios.isAxiosError(err)) return Promise.reject(err);

    const axiosErr = err as AxiosError;
    const originalConfig = axiosErr.config as RetryableConfig | undefined;
    const status = axiosErr.response?.status;

    // Only attempt refresh on 401
    if (status !== 401 || !originalConfig) return Promise.reject(err);

    // Never retry the refresh endpoint itself (avoid infinite loop)
    const url = originalConfig.url ?? '';
    if (url.includes('/api/auth/refresh')) {
      clearTokens().catch(() => {});
      clearCachedUser();
      useAuthStore.getState().clear();
      authEvents.emit();
      return Promise.reject(err);
    }

    // Never retry a request that has already been retried
    if (originalConfig.__isRetry) {
      return Promise.reject(err);
    }

    // Queue concurrent requests while refresh is in progress
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        const headers = originalConfig.headers as Record<string, string> | undefined;
        if (headers) {
          headers.Authorization = `Bearer ${newToken}`;
        }
        const retryConfig: RetryableConfig = { ...originalConfig, __isRetry: true };
        return apiClient(retryConfig);
      });
    }

    // Start refresh
    isRefreshing = true;

    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) throw new Error('No refresh token');

      const result = await refreshApi(storedRefreshToken);
      await saveRefreshToken(result.refreshToken);
      useAuthStore.setState({ accessToken: result.accessToken });

      processQueue(null, result.accessToken);

      const headers = originalConfig.headers as Record<string, string> | undefined;
      if (headers) {
        headers.Authorization = `Bearer ${result.accessToken}`;
      }
      const retryConfig: RetryableConfig = { ...originalConfig, __isRetry: true };
      return apiClient(retryConfig);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await clearTokens();
      clearCachedUser();
      useAuthStore.getState().clear();
      authEvents.emit();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
