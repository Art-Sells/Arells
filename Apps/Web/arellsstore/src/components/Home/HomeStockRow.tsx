'use client';

import React from 'react';
import type { MarketCatalogEntry } from '../../lib/market/marketCatalogTypes';

type HomeStockRowProps = {
  stock: MarketCatalogEntry;
};

const HomeStockRow: React.FC<HomeStockRowProps> = ({ stock }) => {
  return (
    <div className="home-asset-row home-stock-row">
      <div className="home-asset-card home-stock-card">
        <div className="home-assets-cell home-assets-asset home-stock-card-label-cell">
          <span className="home-stock-label">
            {stock.symbol} — {stock.name}
          </span>
        </div>
        <div className="home-stock-coming-soon-overlay" aria-hidden="true">
          <span>coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default HomeStockRow;
