'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import GuestLandingCopyright from '../GuestLandingCopyright';
import GuestTrailerPlayer from '../GuestTrailerPlayer';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

const PortfolioWeeklyGuestLanding: React.FC = () => {
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
        <Image
          loader={imageLoader}
          alt="Arells"
          width={70}
          height={23}
          className="home-guest-logo home-guest-mount-slide home-guest-mount-slide--logo"
          src="images/Arells-Logo-Ebony.png"
          priority
        />
        <p className="home-guest-slogan myportfolio-weekly-guest-mission home-guest-mount-slide home-guest-mount-slide--slogan">
          on a mission to ensure
          <br />
          investments never lose value
        </p>
        <div className="home-guest-signin-shell home-guest-trailer-shell shadow-border-wrap home-guest-mount-slide home-guest-mount-slide--signin">
          <span className="shadow-border" aria-hidden="true" />
          <GuestTrailerPlayer theme="home" hideSeek />
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
        <GuestLandingCopyright
          variant="home"
          className="myportfolio-weekly-guest-copyright home-guest-mount-slide home-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
};

export default PortfolioWeeklyGuestLanding;
