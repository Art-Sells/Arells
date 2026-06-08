import { useEffect, useState } from 'react';

export type PortfolioMetricRevealTiming = {
  /** Pause after loader fade starts before numbers fade in. Default 600ms. */
  revealDelayMs?: number;
};

export const PORTFOLIO_METRIC_REVEAL_FAST = {
  revealDelayMs: 250,
} as const;

export const PORTFOLIO_METRIC_FADE_FAST = 'myportfolio-metric-fade-1s';

/** Home/asset timing: loader fades out (0.5s), pause, numbers fade in (2s). Guest uses shorter pause. */
export function usePortfolioMetricReveal(
  isReady: boolean,
  timing?: PortfolioMetricRevealTiming
) {
  const revealDelayMs = timing?.revealDelayMs ?? 600;
  const [shimmersFading, setShimmersFading] = useState(false);
  const [numbersVisible, setNumbersVisible] = useState(false);

  useEffect(() => {
    if (!isReady) {
      setShimmersFading(false);
      setNumbersVisible(false);
      return;
    }

    setShimmersFading(true);
    const id = window.setTimeout(() => {
      requestAnimationFrame(() => setNumbersVisible(true));
    }, revealDelayMs);
    return () => window.clearTimeout(id);
  }, [isReady, revealDelayMs]);

  return {
    shimmersFading,
    numbersVisible,
    showLoader: !numbersVisible,
  };
}
