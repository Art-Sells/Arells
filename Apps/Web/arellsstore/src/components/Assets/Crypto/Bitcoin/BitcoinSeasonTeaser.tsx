'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import StorylineOpening from '../../../StorylineOpening';

const TEASER_SRC = '/images/banners/assets/crypto/Bitcoin/BTCS1TeaserPoster.jpg';

type BitcoinSeasonTeaserProps = {
  /** My Investments–style Bitcoin card under the poster (Alien Race page). */
  showAssetBadge?: boolean;
  /** Staggered slide-up like Bitcoin guest landing (Alien Race page). */
  animateOnMount?: boolean;
};

export default function BitcoinSeasonTeaser({
  showAssetBadge = false,
  animateOnMount = false,
}: BitcoinSeasonTeaserProps) {
  const [posterLoaded, setPosterLoaded] = useState(false);

  const slide = (phase: 'storyline' | 'poster' | 'badge') =>
    animateOnMount
      ? ` asset-guest-mount-slide bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--${phase}`
      : '';

  return (
    <div className="asset-bitcoin-season-teaser">
      <div className={`asset-bitcoin-season-teaser-storyline${slide('storyline')}`}>
        <StorylineOpening assetName="Bitcoin" className="storyline-opening--bitcoin-teaser" />
      </div>
      <div className={`asset-bitcoin-season-teaser-poster${slide('poster')}`}>
        <div
          className={`asset-bitcoin-season-teaser-frame${posterLoaded ? ' is-loaded' : ''}`}
        >
          {!posterLoaded ? (
            <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
              <div className="asset-bitcoin-season-teaser-loader-ring" />
            </div>
          ) : null}
          <Image
            src={TEASER_SRC}
            alt="Bitcoin Season 1 teaser"
            fill
            sizes="(max-width: 750px) 92vw, 340px"
            className={`asset-bitcoin-season-teaser-img${posterLoaded ? ' is-visible' : ''}`}
            onLoad={() => setPosterLoaded(true)}
            onLoadingComplete={() => setPosterLoaded(true)}
            priority
          />
        </div>
      </div>
      {showAssetBadge ? (
        <div className={`asset-bitcoin-season-teaser-badge${slide('badge')}`}>
          <Link
            href="/bitcoin"
            className="myinv-asset-home-card home-asset-bitcoin bitcoin-alien-race-asset-card"
            aria-label="Bitcoin"
          >
            <div className="home-assets-cell home-assets-asset">
              <span className="home-asset-label home-asset-label-bitcoin">
                <span className="home-asset-name asset-action-button asset-action-button--bitcoin asset-action-button--home-asset-chip">
                  Bitcoin
                </span>
              </span>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
