import axios from 'axios';
import { getAccessToken } from '../auth/token-storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (requestConfig) => {
  const token = await getAccessToken();
  if (token && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      // TODO Phase 2: implement token refresh interceptor
      console.warn('401 received — token refresh needed (Phase 2)');
    }
    return Promise.reject(err);
  }
);

export default apiClient;
