'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FADE_IN_MS = 1000;
const FADE_OUT_MS = 2000;

type LoaderPhase = 'hidden' | 'entering' | 'visible' | 'fading';

export function useAssetSummaryCircleLoader() {
  const [phase, setPhase] = useState<LoaderPhase>('hidden');
  const dismissedRef = useRef(false);

  const show = useCallback(() => {
    dismissedRef.current = false;
    setPhase((current) => {
      if (current === 'entering' || current === 'visible') return current;
      return 'entering';
    });
  }, []);

  const dismissOnSummaryExpandComplete = useCallback(() => {
    setPhase((current) => {
      if (current === 'hidden' || current === 'fading') return current;
      dismissedRef.current = true;
      return 'fading';
    });
  }, []);

  const dismissImmediately = useCallback(() => {
    dismissedRef.current = true;
    setPhase('hidden');
  }, []);

  useEffect(() => {
    if (phase !== 'entering') return;
    let raf2 = 0;
    const raf1 = globalThis.requestAnimationFrame(() => {
      raf2 = globalThis.requestAnimationFrame(() => {
        setPhase((current) => (current === 'entering' ? 'visible' : current));
      });
    });
    return () => {
      globalThis.cancelAnimationFrame(raf1);
      if (raf2) globalThis.cancelAnimationFrame(raf2);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const timer = globalThis.setTimeout(() => setPhase('hidden'), FADE_OUT_MS);
    return () => globalThis.clearTimeout(timer);
  }, [phase]);

  return {
    mounted: phase !== 'hidden',
    visible: phase === 'visible',
    fadingOut: phase === 'fading',
    show,
    dismissOnSummaryExpandComplete,
    dismissImmediately,
  };
}

export { FADE_IN_MS, FADE_OUT_MS };
