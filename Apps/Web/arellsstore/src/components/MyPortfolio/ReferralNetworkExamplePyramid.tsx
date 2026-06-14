'use client';

import React from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import type { ReferralPyramidSnapshot } from '../../lib/portfolio/referralShares';

type Props = {
  pyramid: ReferralPyramidSnapshot;
};

function weeklyActiveUsersLabel(count: number): string {
  const formatted = count.toLocaleString('en-US');
  return count === 1 ? `${formatted} weekly active user` : `${formatted} weekly active users`;
}

function weeklyActiveUsersReferLabel(count: number): string {
  const formatted = count.toLocaleString('en-US');
  return count === 1
    ? `Your ${formatted} weekly active user refers:`
    : `Your ${formatted} weekly active users refer:`;
}

const ReferralNetworkExamplePyramid: React.FC<Props> = ({ pyramid }) => {
  const topReferrerLabel = formatUsdRangeDisplay(
    pyramid.topReferrerMaxUsd,
    pyramid.topReferrerMaxUsd
  ).max;
  const l1MaxLabel = formatUsdRangeDisplay(pyramid.l1MaxUsd, pyramid.l1MaxUsd).max;
  const midMaxLabel = formatUsdRangeDisplay(pyramid.midMaxUsd, pyramid.midMaxUsd).max;

  return (
    <div className="myportfolio-referral-pyramid">
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">You refer:</span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.l1ActiveWeekly)}
          </span>
        </div>
        <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn up to{' '}
          <span className="myportfolio-referral-pyramid-amount">${l1MaxLabel}</span> a week
        </p>
      </div>

      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">
            {weeklyActiveUsersReferLabel(pyramid.l1ActiveWeekly)}
          </span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.midActiveWeekly)}
          </span>
        </div>
        <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn up to{' '}
          <span className="myportfolio-referral-pyramid-amount">${midMaxLabel}</span> a week
        </p>
      </div>

      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">
            {weeklyActiveUsersReferLabel(pyramid.midActiveWeekly)}
          </span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.bottomActiveWeekly)}
          </span>
        </div>
        <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn up to{' '}
          <span className="myportfolio-referral-pyramid-amount">${topReferrerLabel}</span> a week
        </p>
      </div>
    </div>
  );
};

export default ReferralNetworkExamplePyramid;
