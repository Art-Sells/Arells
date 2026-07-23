import { randomInt } from 'crypto';

/** Email / password-reset OTP lifetime. */
export const OTP_TTL_MS = 5 * 60 * 1000;

/** After OTP is confirmed for password reset, how long the set-password token lasts. */
export const RESET_SESSION_TTL_MS = 15 * 60 * 1000;

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function normalizeOtpCode(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length !== 6) return null;
  return digits;
}
