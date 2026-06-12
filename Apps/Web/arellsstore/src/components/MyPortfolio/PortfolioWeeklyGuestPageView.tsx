'use client';

import React from 'react';
import PortfolioWeeklyGuestLanding, {
  type PortfolioWeeklyGuestLandingProps,
} from './PortfolioWeeklyGuestLanding';

const PortfolioWeeklyGuestPageView: React.FC<PortfolioWeeklyGuestLandingProps> = (props) => {
  return (
    <div className="myinv-page myinv-page--accent myinv-page--portfolio myinv-page--weekly-guest">
      <PortfolioWeeklyGuestLanding {...props} />
    </div>
  );
};

export default PortfolioWeeklyGuestPageView;
