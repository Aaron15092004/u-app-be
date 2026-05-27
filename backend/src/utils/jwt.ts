import jwt from 'jsonwebtoken';

// Resolve secrets lazily so tests can set process.env before calling functions.
// In production, a missing secret causes the first token operation to throw,
// which the Express error middleware will surface on startup or first auth request.
function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET environment variable is required');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  return secret;
}

export interface AccessTokenPayload {
  sub: string;
  role: 'user' | 'admin';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const expires = process.env.JWT_ACCESS_EXPIRES ?? '15m';
  return jwt.sign(payload, getAccessSecret(), { expiresIn: expires as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const expires = process.env.JWT_REFRESH_EXPIRES ?? '7d';
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: expires as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
}
