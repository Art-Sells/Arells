'use client';

import { useEffect, useState } from 'react';
import type { TBARDay } from '../../../../lib/assets/crypto/TBAR/media';

export function useTBAR() {
  const [days, setDays] = useState<TBARDay[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/assets/crypto/bitcoin/tbar', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { days: [] }))
      .then((body: { days?: TBARDay[] }) => {
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
