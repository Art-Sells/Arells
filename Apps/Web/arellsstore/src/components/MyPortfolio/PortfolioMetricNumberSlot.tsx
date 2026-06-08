'use client';

import React from 'react';
import { usePortfolioMetricReveal } from './usePortfolioMetricReveal';

type Props = {
  value: string;
  isReady: boolean;
  valueClassName?: string;
  wrapClassName?: string;
};

const PortfolioMetricNumberSlot: React.FC<Props> = ({
  value,
  isReady,
  valueClassName = 'myinv-metric-integer',
  wrapClassName = 'myinv-metric-value',
}) => {
  const { shimmersFading, numbersVisible, showLoader } = usePortfolioMetricReveal(isReady);

  return (
    <span
      className={`asset-metric-value-wrap myportfolio-metric-number-wrap${wrapClassName ? ` ${wrapClassName}` : ''}`}
    >
      {showLoader ? (
        <span
          className={`asset-number-loader metrics-number-loader--accent asset-number-loader--overlay${shimmersFading ? ' is-hidden' : ''}`}
          aria-hidden="true"
        />
      ) : null}
      <span
        className={`myportfolio-metric-fade-2s${numbersVisible ? ' is-visible' : ''}`}
        aria-hidden={!numbersVisible}
      >
        <span className={valueClassName}>{value}</span>
      </span>
    </span>
  );
};

export default PortfolioMetricNumberSlot;
