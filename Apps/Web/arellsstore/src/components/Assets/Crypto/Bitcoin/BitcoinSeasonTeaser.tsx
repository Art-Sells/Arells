'use client';

import React, { useState } from 'react';
import GuestTrailerPlayer from '../../../GuestTrailerPlayer';
import { SIGNED_IN_TRAILER_POSTER, SIGNED_IN_TRAILER_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/videos';
import { EPISODE_ONE_POSTER, EPISODE_ONE_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodeone';

const SEASON_ONE_TEASER_SRC =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/SeasonOneCopy.jpg';

export default function BitcoinSeasonTeaser() {
  const [teaserLoaded, setTeaserLoaded] = useState(false);

  return (
    <div className="asset-bitcoin-season-teaser">
      <div className="asset-bitcoin-season-teaser-show">
        <div className="asset-bitcoin-season-teaser-trailer">
          <GuestTrailerPlayer
            theme="bitcoin"
            sources={SIGNED_IN_TRAILER_SOURCES}
            poster={SIGNED_IN_TRAILER_POSTER}
          />
        </div>
        <div className="asset-bitcoin-season-teaser-season">
          <div className={`asset-bitcoin-season-teaser-frame${teaserLoaded ? ' is-loaded' : ''}`}>
            {!teaserLoaded ? (
              <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
                <div className="asset-bitcoin-season-teaser-loader-ring" />
              </div>
            ) : null}
            <img
              src={SEASON_ONE_TEASER_SRC}
              alt="Season One coming soon"
              width={2660}
              height={382}
              className={`asset-bitcoin-season-teaser-img${teaserLoaded ? ' is-visible' : ''}`}
              onLoad={() => setTeaserLoaded(true)}
            />
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode One</span>
            </p>
            <GuestTrailerPlayer
              theme="bitcoin"
              sources={EPISODE_ONE_SOURCES}
              poster={EPISODE_ONE_POSTER}
              notchPlay
            />
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode Two</span>
            </p>
            <div className="asset-bitcoin-season-teaser-cadence-wrap">
              <p className="asset-bitcoin-season-teaser-cadence">
                <span>Coming October 31st 2026</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
