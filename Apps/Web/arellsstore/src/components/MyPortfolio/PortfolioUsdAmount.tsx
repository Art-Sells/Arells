'use client';

import React from 'react';
import PortfolioMetricNumberSlot from './PortfolioMetricNumberSlot';

type Props = {
  amount: string;
  loading: boolean;
  className?: string;
  symbolClassName?: string;
};

const PortfolioUsdAmount: React.FC<Props> = ({
  amount,
  loading,
  className = '',
  symbolClassName = 'myinv-metric-symbol',
}) => {
  return (
    <span className={`myportfolio-usd-amount ${className}`.trim()}>
      <span className={symbolClassName}>$</span>
      <PortfolioMetricNumberSlot value={amount} isReady={!loading} wrapClassName="" />
    </span>
  );
};

export default PortfolioUsdAmount;
