'use client';

import Image from 'next/image';
import React from 'react';
import StorylineOpening from '../../../StorylineOpening';

const TEASER_SRC = '/images/banners/assets/crypto/Bitcoin/BTCS1TeaserPoster.jpg';

export default function BitcoinSeasonTeaser() {
  return (
    <div className="asset-bitcoin-season-teaser">
      <div className="asset-bitcoin-season-teaser-storyline">
        <StorylineOpening assetName="Bitcoin" className="storyline-opening--bitcoin-teaser" />
      </div>
      <div className="asset-bitcoin-season-teaser-poster">
        <div className="asset-bitcoin-season-teaser-frame">
          <Image
            src={TEASER_SRC}
            alt="Bitcoin Season 1 teaser"
            width={2000}
            height={2303}
            className="asset-bitcoin-season-teaser-img"
            sizes="(max-width: 750px) 92vw, 340px"
          />
        </div>
      </div>
    </div>
  );
}
