import apiClient from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  CompleteProfileRequest,
  CompleteProfileResponse,
} from './types';

export async function registerApi(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<{ success: boolean; data: RegisterResponse }>(
    '/api/auth/register',
    body,
  );
  return res.data.data;
}

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/api/auth/login',
    body,
  );
  return res.data.data;
}

export async function refreshApi(refreshToken: string): Promise<RefreshResponse> {
  const res = await apiClient.post<{ success: boolean; data: RefreshResponse }>(
    '/api/auth/refresh',
    { refreshToken },
  );
  return res.data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function completeProfileApi(
  body: CompleteProfileRequest,
): Promise<CompleteProfileResponse> {
  const res = await apiClient.patch<{ success: boolean; data: CompleteProfileResponse }>(
    '/api/auth/complete-profile',
    body,
  );
  return res.data.data;
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ success: boolean; data: { message: string } }>(
    '/api/auth/forgot-password',
    { email },
  );
  return res.data.data;
}

export async function resetPasswordApi(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const res = await apiClient.post<{ success: boolean; data: { message: string } }>(
    '/api/auth/reset-password',
    { token, password },
  );
  return res.data.data;
}

export async function googleSignInApi(idToken: string): Promise<LoginResponse> {
  const res = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/api/auth/google',
    { idToken },
  );
  return res.data.data;
}

export async function appleSignInApi(
  identityToken: string,
  nonce?: string,
  fullName?: string,
): Promise<LoginResponse> {
  const res = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/api/auth/apple',
    { identityToken, nonce, fullName },
  );
  return res.data.data;
}
