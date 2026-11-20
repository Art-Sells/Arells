'use client';

import type { ImageLoaderProps } from 'next/image';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';
import { useGuestPreview } from '../hooks/useGuestPreview';
import HomeAboutMountLoader from './HomeAboutMountLoader';
import HomeBitcoinAlienRaceCard from './Home/HomeBitcoinAlienRaceCard';
import PortfolioWeeklyGuestPageView from './MyPortfolio/PortfolioWeeklyGuestPageView';

const Index = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const { email, authSessionLoading } = useUser();
  const guestPreview = useGuestPreview();
  const showGuestLanding =
    guestPreview || (!authSessionLoading && !email);
  const showSignedInHome =
    !guestPreview && (authSessionLoading || !!email);

  // Home should always own/reset the global background so asset-page tint never bleeds into `/`.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
  }, []);

  const [homeSlideIn, setHomeSlideIn] = useState(false);
  useEffect(() => {
    if (!showSignedInHome) {
      setHomeSlideIn(false);
      return;
    }
    const t = window.setTimeout(() => setHomeSlideIn(true), 50);
    return () => window.clearTimeout(t);
  }, [showSignedInHome]);

  return (
    <>
      {showSignedInHome ? <HomeAboutMountLoader /> : null}

      {showSignedInHome ? (
        <>
          <div
            className={`home-header-inner${homeSlideIn ? ' page-slide-down' : ''}`}
          >
            <Image
              loader={imageLoader}
              alt=""
              width={70}
              height={23}
              id="word-logoo"
              src="images/Arells-Logo-Ebony.png"
              priority
            />
          </div>
          <div className={`home-slogan-layer${homeSlideIn ? ' page-slide-down' : ''}`}>
            <div id="descriptioner-wrapper">
              <p
                id="descriptioner"
                className="home-slogan-text"
                style={{ letterSpacing: '0px', marginLeft: '0px' }}
              >
                investments never die
              </p>
            </div>
          </div>

          <div className="home-asset-category-stack">
            <HomeBitcoinAlienRaceCard />
          </div>

          <div className={`home-assets-about-wrap${homeSlideIn ? ' page-slide-in' : ''}`}>
            <Link className="myinv-about-button home-assets-about-button" href="/about">
              <span className="myinv-about-button-bg" aria-hidden="true" />
              <span className="myinv-about-button-text">about</span>
            </Link>
          </div>
        </>
      ) : null}

      {showGuestLanding ? <PortfolioWeeklyGuestPageView /> : null}
    </>
  );
};

export default Index;
