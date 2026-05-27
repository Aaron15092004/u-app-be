import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashToken(rawToken: string): Promise<string> {
  return bcrypt.hash(rawToken, SALT_ROUNDS);
}

export async function compareTokenHash(rawToken: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawToken, hash);
}
