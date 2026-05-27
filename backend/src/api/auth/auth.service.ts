import crypto from 'crypto';
import User, { IUser } from '../../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { hashPassword, comparePassword, hashToken, compareTokenHash } from '../../utils/password';
import * as emailService from '../../services/email.service';
import { OAuth2Client } from 'google-auth-library';
import * as appleSigninLib from 'apple-signin-auth';

// Indirection object so tests can swap out the implementation without
// fighting tsx/CJS's sealed namespace exports.
export const _emailDeps = {
  sendPasswordResetEmail: (toEmail: string, rawToken: string): Promise<void> =>
    emailService.sendPasswordResetEmail(toEmail, rawToken),
};

// Google OAuth client — exported as test hook so tests can swap verifyIdToken
export const _googleClient = new OAuth2Client();

// Apple signin indirection — exported as test hook so tests can swap verifyIdToken
export const _appleSigninDeps = {
  verifyIdToken: (identityToken: string, options: { audience: string; nonce?: string }): Promise<{ sub: string; email?: string }> =>
    appleSigninLib.verifyIdToken(identityToken, options) as Promise<{ sub: string; email?: string }>,
};

// bcrypt truncates input to 72 bytes — JWT tokens share the same header bytes
// so we SHA-256 the token first to produce a fixed-size, high-entropy input.
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profileCompleted: boolean;
  profile?: {
    heightCm?: number;
    weightKg?: number;
    goalType?: 'lose' | 'maintain' | 'gain';
    waterGoal?: number;
    age?: number;
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function toSafeUser(user: IUser): SafeUser {
  const p = user.profile;
  const hasProfile = p && (
    p.heightCm != null || p.weightKg != null || p.goalType != null ||
    p.waterGoal != null || p.age != null
  );
  return {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    profileCompleted: user.profileCompleted,
    profile: hasProfile ? {
      heightCm: p!.heightCm,
      weightKg: p!.weightKg,
      goalType: p!.goalType,
      waterGoal: p!.waterGoal,
      age: p!.age,
    } : undefined,
  };
}

async function issueTokenPair(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: (user._id as { toString(): string }).toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: (user._id as { toString(): string }).toString(), jti });
  const refreshTokenHash = await hashToken(sha256(refreshToken));
  const expiryMs = 7 * 24 * 60 * 60 * 1000;
  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash,
    refreshTokenExpiry: new Date(Date.now() + expiryMs),
  });
  return { accessToken, refreshToken };
}

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

export async function registerWithEmail(
  email: string,
  password: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw makeError('Email này đã được sử dụng. Đăng nhập hoặc dùng email khác', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email: normalizedEmail, passwordHash, profileCompleted: false });

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash) {
    throw makeError('Email hoặc mật khẩu không đúng', 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw makeError('Email hoặc mật khẩu không đúng', 401);
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);
  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function rotateRefreshToken(
  rawRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw makeError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw makeError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  if (!user.refreshTokenHash) {
    throw makeError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  const tokenValid = await compareTokenHash(sha256(rawRefreshToken), user.refreshTokenHash);
  if (!tokenValid) {
    throw makeError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
    throw makeError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  return issueTokenPair(user);
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null, refreshTokenExpiry: null });
}

export async function issuePasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Return early for unknown email — prevents user enumeration
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash = await hashToken(rawToken);

  await User.findByIdAndUpdate(user._id, {
    passwordResetTokenHash: hash,
    passwordResetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  await _emailDeps.sendPasswordResetEmail(user.email, rawToken);
}

export async function consumePasswordReset(
  rawToken: string,
  newPassword: string
): Promise<{ message: string }> {
  const candidates = await User.find({
    passwordResetTokenHash: { $ne: null },
    passwordResetTokenExpiry: { $gt: new Date() },
  });

  let matchedUser: IUser | null = null;
  for (const candidate of candidates) {
    const matches = await compareTokenHash(rawToken, candidate.passwordResetTokenHash!);
    if (matches) {
      matchedUser = candidate;
      break;
    }
  }

  if (!matchedUser) {
    throw makeError('Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.', 401);
  }

  await User.findByIdAndUpdate(matchedUser._id, {
    passwordHash: await hashPassword(newPassword),
    passwordResetTokenHash: null,
    passwordResetTokenExpiry: null,
    refreshTokenHash: null,
    refreshTokenExpiry: null,
  });

  return { message: 'Đặt lại mật khẩu thành công' };
}

export async function googleSignIn(
  idToken: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  let payload: import('google-auth-library').TokenPayload | undefined;
  try {
    const audience = [
      process.env.GOOGLE_OAUTH_CLIENT_ID_WEB,
      process.env.GOOGLE_OAUTH_CLIENT_ID_IOS,
      process.env.GOOGLE_OAUTH_CLIENT_ID_ANDROID,
    ].filter(Boolean) as string[];
    const ticket = await _googleClient.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    throw makeError('Đăng nhập Google thất bại. Vui lòng thử lại.', 401);
  }
  if (!payload?.sub || !payload?.email) {
    throw makeError('Đăng nhập Google thất bại. Vui lòng thử lại.', 401);
  }

  const providerId = payload.sub;
  const email = payload.email.toLowerCase();

  let user = await User.findOne({ 'authProviders.provider': 'google', 'authProviders.providerId': providerId });
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.authProviders.push({ provider: 'google', providerId });
      await user.save();
    } else {
      user = await User.create({
        email,
        name: payload.name ?? '',
        avatar: payload.picture ?? null,
        authProviders: [{ provider: 'google', providerId }],
        profileCompleted: false,
      });
    }
  }

  const tokens = await issueTokenPair(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function appleSignIn(
  identityToken: string,
  nonce?: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  let payload: { sub: string; email?: string };
  try {
    payload = await _appleSigninDeps.verifyIdToken(identityToken, {
      audience: process.env.APPLE_BUNDLE_ID ?? 'com.uapp.health',
      nonce,
    });
  } catch {
    throw makeError('Đăng nhập Apple thất bại. Vui lòng thử lại.', 401);
  }

  const providerId = payload.sub;
  const email = payload.email ?? null;

  let user = await User.findOne({ 'authProviders.provider': 'apple', 'authProviders.providerId': providerId });
  if (!user) {
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.authProviders.push({ provider: 'apple', providerId });
        await user.save();
      }
    }
    if (!user) {
      // Apple may not provide email for returning users — use synthetic email
      const syntheticEmail = email ? email.toLowerCase() : `${providerId}@apple.local`;
      user = await User.create({
        email: syntheticEmail,
        name: '',
        authProviders: [{ provider: 'apple', providerId }],
        profileCompleted: false,
      });
    }
  }

  const tokens = await issueTokenPair(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function updateProfile(
  userId: string,
  payload: {
    name: string;
    age: number;
    heightCm: number;
    weightKg: number;
    goalType: 'lose' | 'maintain' | 'gain';
  }
): Promise<SafeUser> {
  const dateOfBirth = new Date();
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - payload.age);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: payload.name,
      'profile.dateOfBirth': dateOfBirth,
      'profile.age': payload.age,
      'profile.heightCm': payload.heightCm,
      'profile.weightKg': payload.weightKg,
      'profile.goalType': payload.goalType,
      profileCompleted: true,
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw makeError('Người dùng không tồn tại', 404);
  }

  return toSafeUser(user);
}
