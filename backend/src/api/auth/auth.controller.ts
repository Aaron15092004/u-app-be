import { Request, Response } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema, refreshSchema, completeProfileSchema, forgotPasswordSchema, resetPasswordSchema, googleSignInSchema, appleSignInSchema } from './auth.validation';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const { email, password } = parsed.data;
  const result = await authService.registerWithEmail(email, password);
  success(res, result, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const { email, password } = parsed.data;
  const result = await authService.loginWithEmail(email, password);
  success(res, result, 200);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const { refreshToken } = parsed.data;
  const result = await authService.rotateRefreshToken(refreshToken);
  success(res, result, 200);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  await authService.revokeRefreshToken(userId);
  res.status(204).end();
}

export async function completeProfile(req: Request, res: Response): Promise<void> {
  const parsed = completeProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    error(res, parsed.error.errors[0].message, 400);
    return;
  }

  const userId = (req as AuthRequest).user.id;
  const result = await authService.updateProfile(userId, parsed.data);
  success(res, result, 200);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
  await authService.issuePasswordReset(parsed.data.email);
  // Always return same message (prevents user enumeration)
  success(res, { message: 'Email đặt lại mật khẩu đã được gửi! Kiểm tra hộp thư của bạn.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
  const result = await authService.consumePasswordReset(parsed.data.token, parsed.data.password);
  success(res, result);
}

export async function googleSignIn(req: Request, res: Response): Promise<void> {
  const parsed = googleSignInSchema.safeParse(req.body);
  if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
  const result = await authService.googleSignIn(parsed.data.idToken);
  success(res, result);
}

export async function appleSignIn(req: Request, res: Response): Promise<void> {
  const parsed = appleSignInSchema.safeParse(req.body);
  if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
  const result = await authService.appleSignIn(parsed.data.identityToken, parsed.data.nonce);
  success(res, result);
}
