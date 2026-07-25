import React from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import PortfolioMetricNumberSlot from './PortfolioMetricNumberSlot';
import {
  PORTFOLIO_METRIC_FADE_FAST,
  PORTFOLIO_METRIC_REVEAL_FAST,
  type PortfolioMetricRevealTiming,
} from './usePortfolioMetricReveal';

type Props = {
  min: number;
  max: number;
  loading?: boolean;
  className?: string;
  fadeClassName?: string;
  revealTiming?: PortfolioMetricRevealTiming;
};

const UsdRangeMetric: React.FC<Props> = ({
  min,
  max,
  loading = false,
  className = '',
  fadeClassName = PORTFOLIO_METRIC_FADE_FAST,
  revealTiming = PORTFOLIO_METRIC_REVEAL_FAST,
}) => {
  const isReady = !loading;
  const { min: minStr, max: maxStr } = formatUsdRangeDisplay(min, max);
  const isSingleAmount = Math.abs(min - max) < 0.0000001;

  return (
    <span className={`asset-money-wrap myportfolio-usd-range ${className}`.trim()}>
      <span className="myinv-metric-symbol">$</span>
      <PortfolioMetricNumberSlot
        value={minStr}
        isReady={isReady}
        fadeClassName={fadeClassName}
        revealTiming={revealTiming}
      />
      {!isSingleAmount ? (
        <>
          <span className="myportfolio-usd-range-sep">–</span>
          <span className="myinv-metric-symbol">$</span>
          <PortfolioMetricNumberSlot
            value={maxStr}
            isReady={isReady}
            fadeClassName={fadeClassName}
            revealTiming={revealTiming}
          />
        </>
      ) : null}
    </span>
  );
};

export default UsdRangeMetric;
