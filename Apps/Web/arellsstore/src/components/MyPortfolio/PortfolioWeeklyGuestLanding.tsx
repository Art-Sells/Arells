'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import GuestLandingCopyright from '../GuestLandingCopyright';
const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

const PREMIER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(guest).jpg';
const POSTER_WIDTH = 2000;
const POSTER_HEIGHT = 1166;

const PortfolioWeeklyGuestLanding: React.FC = () => {
  const [posterLoaded, setPosterLoaded] = useState(false);
  const posterImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = posterImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setPosterLoaded(true);
  }, []);

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
          investments can live forever
        </p>
        <div className="home-guest-signin-shell shadow-border-wrap home-guest-trailer-shell home-guest-mount-slide home-guest-mount-slide--signin">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`asset-guest-poster-frame${posterLoaded ? ' is-loaded' : ''}`}
            style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
          >
            {!posterLoaded ? (
              <div className="asset-guest-poster-loader" aria-hidden="true">
                <div className="asset-guest-poster-loader-ring" />
              </div>
            ) : null}
            <img
              ref={posterImgRef}
              src={PREMIER_POSTER}
              alt="The Bitcoin Alien Race"
              width={POSTER_WIDTH}
              height={POSTER_HEIGHT}
              className={`asset-guest-poster-img${posterLoaded ? ' is-visible' : ''}`}
              onLoad={() => setPosterLoaded(true)}
            />
          </div>
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
