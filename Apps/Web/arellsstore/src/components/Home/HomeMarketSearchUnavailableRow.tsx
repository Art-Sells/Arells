'use client';

import React from 'react';
import type { MarketCatalogEntry } from '../../lib/market/marketCatalogTypes';

type HomeMarketSearchUnavailableRowProps = {
  entry: MarketCatalogEntry;
};

function displayName(entry: MarketCatalogEntry): string {
  return entry.name.replace(/\s+Common Stock\s*$/i, '').trim();
}

const HomeMarketSearchUnavailableRow: React.FC<HomeMarketSearchUnavailableRowProps> = ({ entry }) => {
  const name = displayName(entry);

  return (
    <div className="home-asset-row home-market-search-result-row home-market-search-result--unavailable">
      <div className="home-asset-card home-market-search-unavailable-card myinv-accent-border">
        <div className="home-assets-cell home-assets-asset home-market-search-unavailable-label-cell">
          <span className="home-market-search-unavailable-symbol">{entry.symbol}</span>
          <span className="home-market-search-unavailable-name">{name}</span>
        </div>
        <div className="home-market-search-unavailable-overlay" aria-hidden="true">
          <span>coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default HomeMarketSearchUnavailableRow;
