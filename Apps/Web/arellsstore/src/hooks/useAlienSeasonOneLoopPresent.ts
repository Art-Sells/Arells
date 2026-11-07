'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../lib/assets/assetSharePath';

/** True once the signed-in user has a personal Season One loop for this asset. */
export function useAlienSeasonOneLoopPresent(assetId?: string | null) {
  const { isSignedIn } = useUser();
  const [hasLoop, setHasLoop] = useState(false);

  useEffect(() => {
    if (!assetId || !isSignedIn) {
      setHasLoop(false);
      return;
    }
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(
          `/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=seasononeloop`,
          { method: 'HEAD', credentials: 'include', cache: 'no-store' }
        );
        if (!cancelled) setHasLoop(res.ok);
      } catch {
        if (!cancelled) setHasLoop(false);
      }
    };

    void check();

    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string; seasononeloop?: boolean }>).detail;
      if (detail?.assetId !== assetId) return;
      if (detail.seasononeloop) {
        setHasLoop(true);
        return;
      }
      void check();
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => {
      cancelled = true;
      window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    };
  }, [assetId, isSignedIn]);

  return hasLoop;
}
