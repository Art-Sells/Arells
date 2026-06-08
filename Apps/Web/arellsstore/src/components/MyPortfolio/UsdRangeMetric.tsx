import React from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import PortfolioMetricNumberSlot from './PortfolioMetricNumberSlot';

type Props = {
  min: number;
  max: number;
  loading?: boolean;
  className?: string;
};

const UsdRangeMetric: React.FC<Props> = ({ min, max, loading = false, className = '' }) => {
  const isReady = !loading;
  const { min: minStr, max: maxStr } = formatUsdRangeDisplay(min, max);

  return (
    <span className={`asset-money-wrap myportfolio-usd-range ${className}`.trim()}>
      <span className="myinv-metric-symbol">$</span>
      <PortfolioMetricNumberSlot value={minStr} isReady={isReady} />
      <span className="myportfolio-usd-range-sep">–</span>
      <span className="myinv-metric-symbol">$</span>
      <PortfolioMetricNumberSlot value={maxStr} isReady={isReady} />
    </span>
  );
};

export default UsdRangeMetric;
