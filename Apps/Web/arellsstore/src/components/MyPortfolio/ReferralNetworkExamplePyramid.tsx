'use client';

import React from 'react';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import type { ReferralPyramidSnapshot } from '../../lib/portfolio/referralShares';

type Props = {
  pyramid: ReferralPyramidSnapshot;
  /** Top-referrer max with empty-pool fallback (same as my-portfolio headline max). */
  groupMaxUsd: number;
};

function weeklyActiveUsersLabel(count: number): string {
  const formatted = count.toLocaleString('en-US');
  return count === 1 ? `${formatted} weekly active user` : `${formatted} weekly active users`;
}

const ReferralNetworkExamplePyramid: React.FC<Props> = ({ pyramid, groupMaxUsd }) => {
  const topReferrerLabel = formatUsdRangeDisplay(groupMaxUsd, groupMaxUsd).max;
  const l1MinLabel = formatUsdRangeDisplay(pyramid.l1MinUsd, pyramid.l1MinUsd).min;
  const midMinLabel = formatUsdRangeDisplay(pyramid.midMinUsd, pyramid.midMinUsd).min;
  const l1CountFormatted = pyramid.l1ActiveWeekly.toLocaleString('en-US');
  const midCountFormatted = pyramid.midActiveWeekly.toLocaleString('en-US');

  return (
    <div className="myportfolio-referral-pyramid">
      <div className="myportfolio-referral-pyramid-tier myportfolio-referral-pyramid-tier--you">
        <span className="myportfolio-referral-pyramid-node">You</span>
      </div>

      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">You refer:</span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.l1ActiveWeekly)}
          </span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn{' '}
          <span className="myportfolio-referral-pyramid-amount">${l1MinLabel}/wk</span>
        </p>
      </div>

      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">
            Your {l1CountFormatted} Weekly Active Users refer:
          </span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.midActiveWeekly)}
          </span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn{' '}
          <span className="myportfolio-referral-pyramid-amount">${midMinLabel}/wk</span>
        </p>
      </div>

      <div className="myportfolio-referral-pyramid-connector" aria-hidden="true" />
      <div className="myportfolio-referral-pyramid-tier">
        <div className="myportfolio-referral-pyramid-band">
          <span className="myportfolio-referral-pyramid-band-label">
            Your {midCountFormatted} Weekly Active Users refer:
          </span>
          <span className="myportfolio-referral-pyramid-band-count">
            {weeklyActiveUsersLabel(pyramid.bottomActiveWeekly)}
          </span>
        </div>
        <p className="myportfolio-referral-pyramid-tier-meta">
          you earn up to{' '}
          <span className="myportfolio-referral-pyramid-amount">${topReferrerLabel}/wk</span>
        </p>
      </div>
    </div>
  );
};

export default ReferralNetworkExamplePyramid;
