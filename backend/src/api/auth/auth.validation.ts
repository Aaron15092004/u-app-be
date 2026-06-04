import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng').max(254),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128),
});

export const loginSchema = registerSchema;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const completeProfileSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập họ và tên của bạn').max(100).trim().optional(),
  age: z.number().int().min(10).max(120),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  goalType: z.enum(['lose', 'maintain', 'gain']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128),
});

export const googleSignInSchema = z.object({ idToken: z.string().min(1) });

export const appleSignInSchema = z.object({
  identityToken: z.string().min(1),
  nonce: z.string().optional(),
  fullName: z.string().min(1).max(100).trim().optional(),
});
