import { createHash } from 'crypto';

/**
 * Stable opaque id for linking analytics to signed-in users without storing email in analytics JSON.
 */
export function hashEmailForAnalytics(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const pepper = process.env.ANALYTICS_USER_HASH_PEPPER || process.env.AUTH_JWT_SECRET || '';
  if (!pepper || pepper.length < 8) return null;
  return createHash('sha256').update(`${pepper}:${normalized}`).digest('hex');
}
