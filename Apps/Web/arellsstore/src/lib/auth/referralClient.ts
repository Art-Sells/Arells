export const REFERRAL_CODE_COOKIE = 'arells_ref';
const REFERRAL_CODE_COOKIE_MAX_AGE_DAYS = 30;

export function captureReferralFromSearchParams(search: string): void {
  if (typeof window === 'undefined') return;
  const ref = new URLSearchParams(search).get('ref')?.trim().toLowerCase();
  if (!ref || !/^[a-f0-9]{12}$/.test(ref)) return;

  const maxAge = REFERRAL_CODE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${REFERRAL_CODE_COOKIE}=${encodeURIComponent(ref)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('ref')) return;
    url.searchParams.delete('ref');
    const next = url.pathname + (url.search || '') + url.hash;
    window.history.replaceState({}, '', next);
  } catch {
    // ignore
  }
}

export function readReferralCodeFromDocumentCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_CODE_COOKIE}=([^;]*)`));
  if (!match) return undefined;
  try {
    const decoded = decodeURIComponent(match[1]).trim().toLowerCase();
    return decoded || undefined;
  } catch {
    return undefined;
  }
}
