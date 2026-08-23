'use client';

import { useEffect, useState } from 'react';
import type { AlienRaceDay } from '../lib/bitcoinAlienRaceUpdates';

export function useAlienRaceUpdates() {
  const [days, setDays] = useState<AlienRaceDay[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/assets/crypto/bitcoin/alien-race-updates', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { days: [] }))
      .then((body: { days?: AlienRaceDay[] }) => {
        if (cancelled) return;
        setDays(Array.isArray(body.days) ? body.days : []);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setDays([]);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { days, ready };
}
