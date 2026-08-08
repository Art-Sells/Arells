'use client';

import React, { useEffect } from 'react';
import BitcoinSeasonTeaser from '../../components/Assets/Crypto/Bitcoin/BitcoinSeasonTeaser';

const TheBitcoinAlienRacePageClient: React.FC = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bg = 'rgb(255, 247, 236)';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  return (
    <div className="asset-page asset-page--bitcoin bitcoin-alien-race-page">
      <div className="bitcoin-alien-race-page-inner">
        <BitcoinSeasonTeaser showAssetBadge animateOnMount />
      </div>
    </div>
  );
};

export default TheBitcoinAlienRacePageClient;
