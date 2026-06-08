'use client';

import React from 'react';
import PortfolioMetricNumberSlot from './PortfolioMetricNumberSlot';
import {
  PORTFOLIO_METRIC_FADE_FAST,
  PORTFOLIO_METRIC_REVEAL_FAST,
  type PortfolioMetricRevealTiming,
} from './usePortfolioMetricReveal';

type Props = {
  amount: string;
  loading: boolean;
  className?: string;
  symbolClassName?: string;
  fadeClassName?: string;
  revealTiming?: PortfolioMetricRevealTiming;
};

const PortfolioUsdAmount: React.FC<Props> = ({
  amount,
  loading,
  className = '',
  symbolClassName = 'myinv-metric-symbol',
  fadeClassName = PORTFOLIO_METRIC_FADE_FAST,
  revealTiming = PORTFOLIO_METRIC_REVEAL_FAST,
}) => {
  return (
    <span className={`myportfolio-usd-amount ${className}`.trim()}>
      <span className={symbolClassName}>$</span>
      <PortfolioMetricNumberSlot
        value={amount}
        isReady={!loading}
        wrapClassName=""
        fadeClassName={fadeClassName}
        revealTiming={revealTiming}
      />
    </span>
  );
};

export default PortfolioUsdAmount;
