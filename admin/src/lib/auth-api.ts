import axios from 'axios';
import { authStorage } from './api-client';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface LoginResponse {
  success: boolean;
  data: {
    user: { id: string; email: string; name: string; role: string };
    accessToken: string;
    refreshToken: string;
  };
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  const { data } = await axios.post<LoginResponse>(`${BASE_URL}/api/auth/login`, {
    email,
    password,
  });

  if (!data.success) throw new Error('Đăng nhập thất bại');
  if (data.data.user.role !== 'admin') throw new Error('Tài khoản không có quyền quản trị');

  authStorage.set(data.data.accessToken, data.data.refreshToken, data.data.user.role);
}

export function logout(): void {
  authStorage.clear();
  window.location.href = '/#/login';
}
