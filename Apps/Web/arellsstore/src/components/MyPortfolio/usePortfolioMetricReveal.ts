import { useEffect, useRef, useState } from 'react';

/** Home/asset timing: loader fades out (0.5s), 600ms pause, numbers fade in (2s). */
export function usePortfolioMetricReveal(isReady: boolean) {
  const [shimmersFading, setShimmersFading] = useState(false);
  const [numbersVisible, setNumbersVisible] = useState(false);
  const didRevealRef = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    if (didRevealRef.current) return;
    didRevealRef.current = true;
    setShimmersFading(true);
    const id = window.setTimeout(() => {
      requestAnimationFrame(() => setNumbersVisible(true));
    }, 600);
    return () => window.clearTimeout(id);
  }, [isReady]);

  return {
    shimmersFading,
    numbersVisible,
    showLoader: !numbersVisible,
  };
}
