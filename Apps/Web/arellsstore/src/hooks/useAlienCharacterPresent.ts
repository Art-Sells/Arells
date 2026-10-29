'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';

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
    return () => {
      cancelled = true;
    };
  }, [assetId, isSignedIn]);

  return hasCharacter;
}
