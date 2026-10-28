'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../lib/assets/assetSharePath';

/** True once the signed-in user has a portrait for this asset (My Character photo). */
export function useAlienCharacterPresent(assetId?: string | null) {
  const { isSignedIn } = useUser();
  const [hasCharacter, setHasCharacter] = useState(false);

  useEffect(() => {
    if (!assetId || !isSignedIn) {
      setHasCharacter(false);
      return;
    }
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

  return hasCharacter;
}
