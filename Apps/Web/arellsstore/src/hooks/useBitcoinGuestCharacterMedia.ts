'use client';

import { useEffect, useState } from 'react';
import { publicAlienImagePath, publicAlienVideoPath } from '../lib/assets/assetSharePath';

function mediaVersionFromHead(res: Response): string {
  const version = (res.headers.get('x-alien-video-version') || '').trim();
  if (version) return version;
  const etag = (res.headers.get('etag') || '').replace(/"/g, '').trim();
  if (etag) return etag;
  const modified = (res.headers.get('last-modified') || '').trim();
  if (modified) return String(Date.parse(modified) || modified);
  return String(Date.now());
}

/**
 * Share-id guest pages start on the personal metaposter.
 * A real 404 means no character, so the page can use the default Bitcoin guest poster.
 * A failed request stays on the personal poster.
 *
 * `bust` is the live S3 object version/ETag so Amplify/browsers cannot keep an
 * old metaloop after regenerate (Date.now() alone was not enough on deploy).
 */
export function useBitcoinGuestCharacterMedia(
  shareId: string | null | undefined,
  enabled: boolean
): { personal: boolean; loopReady: boolean; bust: string } {
  const id = (shareId || '').trim().toLowerCase();
  const [personal, setPersonal] = useState(() => Boolean(id));
  const [loopReady, setLoopReady] = useState(() => Boolean(id));
  const [bust, setBust] = useState(() => String(Date.now()));

  useEffect(() => {
    if (!id) {
      setPersonal(false);
      setLoopReady(false);
      return;
    }
    if (!enabled) return;

    let cancelled = false;
    setPersonal(true);
    setLoopReady(true);

    const probeBust = String(Date.now());
    const posterUrl = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'composed',
      cacheBust: probeBust,
    });
    const loopProbeUrl = publicAlienVideoPath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'guestloop',
      cacheBust: probeBust,
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
        const loopHead = await fetch(loopProbeUrl, { method: 'HEAD', cache: 'no-store' });
        if (cancelled) return;
        if (!loopHead.ok) {
          setLoopReady(false);
          return;
        }
        setBust(mediaVersionFromHead(loopHead));
        setLoopReady(true);
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
