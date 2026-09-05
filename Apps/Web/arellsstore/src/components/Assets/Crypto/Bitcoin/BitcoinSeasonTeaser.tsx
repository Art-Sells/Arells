'use client';

import React, { useState } from 'react';
import GuestTrailerPlayer from '../../../GuestTrailerPlayer';
import StorylineOpening from '../../../StorylineOpening';
import AlienRaceDailyUpdates from '../../../AlienRaceDailyUpdates';
import { SIGNED_IN_TRAILER_POSTER, SIGNED_IN_TRAILER_SOURCES } from '../../../../lib/guestTrailer';

const SEASON_ONE_TEASER_SRC = '/images/banners/assets/crypto/Bitcoin/SeasonOneTeaser.jpg';

export default function BitcoinSeasonTeaser() {
  const [teaserLoaded, setTeaserLoaded] = useState(false);

  return (
    <div className="asset-bitcoin-season-teaser">
      <div className="asset-bitcoin-season-teaser-storyline">
        <StorylineOpening assetName="Bitcoin" className="storyline-opening--bitcoin-teaser" />
      </div>
      <div className="asset-bitcoin-season-teaser-show">
        <h2 className="asset-bitcoin-season-teaser-show-title">The Bitcoin Alien Race</h2>
        <div className="asset-bitcoin-season-teaser-trailer">
          <GuestTrailerPlayer
            theme="bitcoin"
            sources={SIGNED_IN_TRAILER_SOURCES}
            poster={SIGNED_IN_TRAILER_POSTER}
          />
        </div>
        <div className="asset-bitcoin-season-teaser-season">
          <h3 className="asset-bitcoin-season-teaser-season-title">Season One</h3>
          <div className={`asset-bitcoin-season-teaser-frame${teaserLoaded ? ' is-loaded' : ''}`}>
            {!teaserLoaded ? (
              <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
                <div className="asset-bitcoin-season-teaser-loader-ring" />
              </div>
            ) : null}
            <img
              src={SEASON_ONE_TEASER_SRC}
              alt="Season One coming soon"
              width={2341}
              height={590}
              className={`asset-bitcoin-season-teaser-img${teaserLoaded ? ' is-visible' : ''}`}
              onLoad={() => setTeaserLoaded(true)}
            />
          </div>
        </div>
        <AlienRaceDailyUpdates variant="bitcoin" />
        <div className="asset-bitcoin-season-teaser-cadence-wrap">
          <p className="asset-bitcoin-season-teaser-cadence">
            <span>New Episode</span>
            <span>every Saturday</span>
          </p>
        </div>
      </div>
    </div>
  );
}
