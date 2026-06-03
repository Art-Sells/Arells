'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { normalizeReferralCode } from '../../lib/auth/referralClient';

const REFERRAL_COOKIE = 'arells_ref';
const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

function setReferralCookie(code: string) {
  const maxAge = REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Persist ?ref= from home or signup into a first-party cookie for registration attribution. */
export default function ReferralCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const raw = searchParams?.get('ref');
    const code = normalizeReferralCode(raw);
    if (!code) return;

    setReferralCookie(code);

    if (pathname !== '/' && pathname !== '/signup') return;

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      const next = url.pathname + url.search + url.hash;
      window.history.replaceState(window.history.state, '', next || '/');
    } catch {
      // ignore
    }
  }, [searchParams, pathname]);

  return null;
}
