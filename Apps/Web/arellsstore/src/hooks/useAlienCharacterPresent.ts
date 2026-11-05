'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../lib/assets/assetSharePath';

/** Portrait check for this asset. `ready` is false while the request is still in flight. */
export function useAlienCharacterPresent(assetId?: string | null): {
  hasCharacter: boolean;
  ready: boolean;
} {
  const { isSignedIn } = useUser();
  const [hasCharacter, setHasCharacter] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!assetId || !isSignedIn) {
      setHasCharacter(false);
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=portrait`,
          { credentials: 'include', cache: 'no-store' }
        );
        if (!cancelled) setHasCharacter(res.ok);
      } catch {
        if (!cancelled) setHasCharacter(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string }>).detail;
      if (detail?.assetId === assetId) setHasCharacter(true);
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => {
      cancelled = true;
      window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    };
  }, [assetId, isSignedIn]);

  return { hasCharacter, ready };
}
