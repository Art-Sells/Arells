'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { USERS_POOL_WEEKLY_MAX } from '../../lib/portfolio/financialBenefits';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';

export function usePublicEarningsGuestPitch(
  enabled: boolean,
  initialPublicEarnings: PublicEarningsPayload | null = null
) {
  const [publicEarnings, setPublicEarnings] = useState<PublicEarningsPayload | null>(
    initialPublicEarnings
  );
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (publicEarnings) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/portfolio/public-earnings', { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const json = (await res.json()) as PublicEarningsPayload;
        if (!cancelled) {
          setPublicEarnings(json);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, publicEarnings]);

  const guestMaxLabel = useMemo(() => {
    if (!enabled) return '';
    return formatUsdRangeDisplay(USERS_POOL_WEEKLY_MAX, USERS_POOL_WEEKLY_MAX).max;
  }, [enabled]);

  return { guestMaxLabel, loadError };
}
