'use client';

import { useEffect, useState } from 'react';
import { publicAlienImagePath, publicAlienVideoPath } from '../lib/assets/assetSharePath';

/**
 * Share-id guest pages start on the personal metaposter.
 * A real 404 means no character, so the page can use the default Bitcoin guest poster.
 * A failed request stays on the personal poster.
 */
export function useBitcoinGuestCharacterMedia(
  shareId: string | null | undefined,
  enabled: boolean
): { personal: boolean; loopReady: boolean; bust: number } {
  const id = (shareId || '').trim().toLowerCase();
  const [personal, setPersonal] = useState(() => Boolean(id));
  const [loopReady, setLoopReady] = useState(() => Boolean(id));
  const [bust, setBust] = useState(() => Date.now());

  useEffect(() => {
    if (!id) {
      setPersonal(false);
      setLoopReady(false);
      return;
    }
    if (!enabled) return;

    let cancelled = false;
    const nextBust = Date.now();
    setBust(nextBust);
    setPersonal(true);
    setLoopReady(true);

    const posterUrl = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'composed',
      cacheBust: nextBust,
    });
    const loopUrl = publicAlienVideoPath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'guestloop',
      cacheBust: nextBust,
    });

    void (async () => {
      let missing = false;
      try {
        const posterHead = await fetch(posterUrl, { method: 'HEAD', cache: 'no-store' });
        missing = posterHead.status === 404;
      } catch {
        missing = false;
      }
      if (cancelled) return;
      if (missing) {
        setPersonal(false);
        setLoopReady(false);
        return;
      }
      setPersonal(true);
      try {
        const loopHead = await fetch(loopUrl, { method: 'HEAD', cache: 'no-store' });
        if (!cancelled) setLoopReady(loopHead.ok);
      } catch {
        if (!cancelled) setLoopReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, enabled]);

  return { personal: Boolean(id && personal), loopReady: Boolean(id && personal && loopReady), bust };
}
