import { createHmac } from 'node:crypto';

export const SCAN_QUOTA_POLICY_MODE = 'high_daily_quota' as const;
export const HIGH_QUOTA_DAILY_LIMIT = 1000;

export function normalizeRedeemCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function hashRedeemCode(
  input: string,
  pepper = process.env.REDEEM_CODE_PEPPER,
): string {
  if (!pepper) {
    throw new Error('REDEEM_CODE_PEPPER is required to hash redeem codes');
  }

  return createHmac('sha256', pepper)
    .update(normalizeRedeemCode(input), 'utf8')
    .digest('hex');
}

export function buildRedeemHttpsUrl(baseUrl: string, rawCode: string): string {
  const url = new URL(baseUrl);

  if (url.protocol !== 'https:') {
    throw new Error('Redeem QR payload requires an HTTPS base URL');
  }

  url.searchParams.set('code', rawCode);
  return url.toString();
}
