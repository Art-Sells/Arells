const REFERRAL_CODE_RE = /^[a-z0-9]{8,12}$/;
export const REFERRAL_COOKIE_NAME = 'arells_ref';

export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  if (!REFERRAL_CODE_RE.test(code)) return null;
  return code;
}

export function readReferralCodeFromDocumentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== REFERRAL_COOKIE_NAME) continue;
    const value = decodeURIComponent(rest.join('='));
    return normalizeReferralCode(value);
  }
  return null;
}
