'use client';

import { useCallback, useEffect, useState } from 'react';

type LoaderPhase = 'hidden' | 'entering' | 'visible';

export function useAuthCircleLoader() {
  const [phase, setPhase] = useState<LoaderPhase>('hidden');

  const show = useCallback(() => {
    setPhase((current) => {
      if (current === 'entering' || current === 'visible') return current;
      return 'entering';
    });
  }, []);

  const hide = useCallback(() => {
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

  return {
    mounted: phase !== 'hidden',
    visible: phase === 'visible',
    show,
    hide,
  };
}
