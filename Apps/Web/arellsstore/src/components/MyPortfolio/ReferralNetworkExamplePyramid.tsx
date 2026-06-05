'use client';

import React, { useMemo } from 'react';
import UsdRangeMetric from './UsdRangeMetric';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import {
  referralNetworkExampleTiers,
  referralNetworkExampleTotalMinUsd,
} from '../../lib/portfolio/referralNetworkExample';

type Props = {
  groupMaxUsd: number;
};

const ReferralNetworkExamplePyramid: React.FC<Props> = ({ groupMaxUsd }) => {
  const tiers = useMemo(() => referralNetworkExampleTiers(), []);
  const totalMinUsd = useMemo(() => referralNetworkExampleTotalMinUsd(), []);

  return (
    <div className="myportfolio-referral-pyramid">
      <div className="myportfolio-referral-pyramid-tier myportfolio-referral-pyramid-tier--you">
        <span className="myportfolio-referral-pyramid-node">You</span>
      </div>
      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">Level 1</span>
          <span className="myportfolio-referral-pyramid-band-count">{tiers[0].activeCount} active weekly</span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          example min{' '}
          <span className="myportfolio-referral-pyramid-amount">
            ${formatUsdRangeDisplay(tiers[0].minUsd, tiers[0].minUsd).min}/wk
          </span>
        </p>
      </div>
      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">Level 2</span>
          <span className="myportfolio-referral-pyramid-band-count">{tiers[1].activeCount} active weekly</span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          example min{' '}
          <span className="myportfolio-referral-pyramid-amount">
            ${formatUsdRangeDisplay(tiers[1].minUsd, tiers[1].minUsd).min}/wk
          </span>
        </p>
      </div>
      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">Level 3</span>
          <span className="myportfolio-referral-pyramid-band-count">{tiers[2].activeCount} active weekly</span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          example min{' '}
          <span className="myportfolio-referral-pyramid-amount">
            ${formatUsdRangeDisplay(tiers[2].minUsd, tiers[2].minUsd).min}/wk
          </span>
        </p>
      </div>
      <p className="myportfolio-referral-pyramid-footer">
        Example total{' '}
        <UsdRangeMetric min={totalMinUsd} max={groupMaxUsd} className="myportfolio-referral-pyramid-range" />
        <span className="myportfolio-referral-pyramid-footer-suffix">/wk</span>
      </p>
      <p className="myportfolio-referral-pyramid-disclaimer">
        Example only: if each person you refer signs up 3 active weekly users, and each of them does the same. Not
        your current earnings.
      </p>
    </div>
  );
};

export default ReferralNetworkExamplePyramid;
