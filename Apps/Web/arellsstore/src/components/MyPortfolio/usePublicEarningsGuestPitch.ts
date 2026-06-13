'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { groupDisplayMaxUsd, type PublicEarningsPayload } from '../../lib/portfolio/referralShares';

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
    if (!publicEarnings) return '';
    const guestMaxUsd = groupDisplayMaxUsd(
      publicEarnings.topReferrerMaxUsd,
      publicEarnings.fallbackProjectionMaxUsd
    );
    return formatUsdRangeDisplay(guestMaxUsd, guestMaxUsd).max;
  }, [publicEarnings]);

  return { guestMaxLabel, loadError };
}
