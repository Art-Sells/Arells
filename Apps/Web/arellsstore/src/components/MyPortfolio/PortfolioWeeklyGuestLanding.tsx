'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import GuestLandingCopyright from '../GuestLandingCopyright';
import PortfolioUsdAmount from './PortfolioUsdAmount';
import {
  PORTFOLIO_METRIC_FADE_FAST,
  PORTFOLIO_METRIC_REVEAL_FAST,
} from './usePortfolioMetricReveal';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

export type PortfolioWeeklyGuestLandingProps = {
  guestMaxLabel: string;
  loading: boolean;
  loadError: boolean;
};

const PortfolioWeeklyGuestLanding: React.FC<PortfolioWeeklyGuestLandingProps> = ({
  guestMaxLabel,
  loading,
  loadError,
}) => {
  return (
    <div className="home-guest-landing">
      <div className="home-guest-landing-stack">
        <span className="home-guest-icon-wrap home-guest-mount-slide home-guest-mount-slide--icon" aria-hidden="true">
          <span className="home-guest-icon-tint" aria-hidden="true" />
          <Image
            loader={imageLoader}
            alt=""
            width={60}
            height={60}
            className="home-guest-icon-img"
            src="images/Arells-Icon.png"
            priority
          />
        </span>
        <p className="home-guest-slogan myportfolio-weekly-guest-pitch home-guest-mount-slide home-guest-mount-slide--logo">
          {loadError ? (
            <>Unable to load earnings info. Try again later.</>
          ) : (
            <span className="myportfolio-weekly-guest-pitch-earn">
              <span className="myportfolio-weekly-guest-pitch-earn-accent">earn</span>
              <br />
              up to{' '}
              <PortfolioUsdAmount
                amount={guestMaxLabel}
                loading={loading}
                className="myportfolio-weekly-guest-usd-amount"
                symbolClassName="myinv-metric-symbol myportfolio-weekly-guest-dollar"
                fadeClassName={PORTFOLIO_METRIC_FADE_FAST}
                revealTiming={PORTFOLIO_METRIC_REVEAL_FAST}
              />{' '}
              a week
            </span>
          )}
        </p>
        <div className="home-guest-signin-shell shadow-border-wrap home-guest-mount-slide home-guest-mount-slide--slogan">
          <span className="shadow-border" aria-hidden="true" />
          <div className="home-guest-signin-panel myinv-accent-border">
            <div className="home-guest-signin-inner">
              <p className="home-guest-signin-lead">Sign In to learn more</p>
              <Link
                href="/signin"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <p className="home-guest-slogan myportfolio-weekly-guest-mission home-guest-mount-slide home-guest-mount-slide--signin">
          on a mission to ensure investments
          <br />
          never lose value
        </p>
        <GuestLandingCopyright
          variant="home"
          className="myportfolio-weekly-guest-copyright home-guest-mount-slide home-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
};

export default PortfolioWeeklyGuestLanding;
