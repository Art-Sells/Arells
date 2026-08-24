'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import GuestLandingCopyright from '../../GuestLandingCopyright';
import GuestTrailerPlayer from '../../GuestTrailerPlayer';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

type AssetGuestLandingProps = {
  cssModifier: string;
  ticker: string;
  title: string;
  slogan?: string;
};

export default function AssetGuestLanding({
  cssModifier,
  title,
}: AssetGuestLandingProps) {
  const showTrailer = cssModifier === 'bitcoin';

  return (
    <div className={`asset-page-content asset-page-content--${cssModifier} asset-guest-landing`}>
      <div className="asset-guest-landing-stack">
        <span
          className="home-guest-icon-wrap asset-guest-icon-wrap asset-guest-mount-slide asset-guest-mount-slide--badge"
          aria-hidden="true"
        >
          <span className="home-guest-icon-tint asset-guest-icon-tint" aria-hidden="true" />
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
        <span
          className="asset-guest-wordmark asset-guest-mount-slide asset-guest-mount-slide--title"
          role="img"
          aria-label="Arells"
        />
        <p
          className={`home-guest-slogan asset-guest-landing-mission asset-guest-landing-mission--${cssModifier} asset-guest-mount-slide asset-guest-mount-slide--slogan`}
        >
          On a mission to ensure
          <br />
          <span className="asset-guest-landing-mission-tail">
            {title} never loses value.
          </span>
        </p>
        <div
          className={`asset-guest-action-shell shadow-border-wrap asset-guest-action-shell--${cssModifier}${
            showTrailer ? ' asset-guest-trailer-shell' : ''
          } asset-guest-mount-slide asset-guest-mount-slide--signin`}
        >
          <span className="shadow-border" aria-hidden="true" />
          {showTrailer ? <GuestTrailerPlayer theme="bitcoin" hideSeek /> : null}
          <div className={`asset-guest-signin-nested asset-panel asset-panel--${cssModifier}`}>
            <div className="asset-guest-signin-inner">
              <p className="asset-signin-believe-prompt">Sign in to get involved</p>
              <Link
                href="/signin"
                className={`asset-action-button asset-action-button--save-signin asset-action-button--save-signin-empty asset-action-button--${cssModifier}`}
              >
                <span className="asset-save-signin-text">Sign In</span>
              </Link>
            </div>
          </div>
        </div>
        <GuestLandingCopyright
          variant="asset"
          cssModifier={cssModifier}
          className="asset-guest-mount-slide asset-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
}
