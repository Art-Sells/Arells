'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { WEEKLY_USERS_POOL_USD } from '../../lib/portfolio/financialBenefits';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';

export function usePublicEarningsGuestPitch(
  enabled: boolean,
  initialPublicEarnings: PublicEarningsPayload | null = null
) {
  const [publicEarnings, setPublicEarnings] = useState<PublicEarningsPayload | null>(
    initialPublicEarnings
  );
  const [loadError, setLoadError] = useState(false);
  // Local preview only: /?forceEarningsError=1 hides the earn pitch (failed-load state).
  const [forceEarningsError, setForceEarningsError] = useState(false);

  useEffect(() => {
    try {
      setForceEarningsError(
        new URLSearchParams(window.location.search).get('forceEarningsError') === '1'
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (forceEarningsError) return;
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
  }, [enabled, forceEarningsError, publicEarnings]);

  const guestMaxLabel = useMemo(() => {
    if (!enabled) return '';
    return formatUsdRangeDisplay(WEEKLY_USERS_POOL_USD, WEEKLY_USERS_POOL_USD).max;
  }, [enabled]);

  return { guestMaxLabel, loadError: forceEarningsError || loadError };
}
