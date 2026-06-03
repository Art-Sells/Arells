import React from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';

type Props = {
  min: number;
  max: number;
  className?: string;
};

const UsdRangeMetric: React.FC<Props> = ({ min, max, className = '' }) => {
  const { min: minStr, max: maxStr } = formatUsdRangeDisplay(min, max);
  return (
    <span className={`asset-money-wrap myportfolio-usd-range ${className}`.trim()}>
      <span className="myinv-metric-symbol">$</span>
      <span className="myinv-metric-value">
        <span className="myinv-metric-integer">{minStr}</span>
      </span>
      <span className="myportfolio-usd-range-sep">–</span>
      <span className="myinv-metric-symbol">$</span>
      <span className="myinv-metric-value">
        <span className="myinv-metric-integer">{maxStr}</span>
      </span>
    </span>
  );
};

export default UsdRangeMetric;
