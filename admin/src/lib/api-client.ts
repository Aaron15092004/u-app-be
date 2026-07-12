import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

const AUTH_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';
const ROLE_KEY = 'admin_role';

export const authStorage = {
  getAccess: () => localStorage.getItem(AUTH_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY),
  set: (access: string, refresh: string, role: string) => {
    localStorage.setItem(AUTH_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(ROLE_KEY, role);
  },
  clear: () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — refresh on 401 with queue to avoid concurrent refresh storms
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: string) => void; reject: (reason: unknown) => void }> = [];

function processQueue(err: unknown, token: string | null) {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = authStorage.getRefresh();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      const newAccess: string = data.data.accessToken;
      const newRefresh: string = data.data.refreshToken;
      const role = authStorage.getRole() ?? 'admin';
      authStorage.set(newAccess, newRefresh, role);

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (err) {
      processQueue(err, null);
      authStorage.clear();
      window.location.href = '/#/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
