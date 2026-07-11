'use client';

import type { ImageLoaderProps } from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MarketCatalogEntry, MarketCatalogSnapshot } from '../../lib/market/marketCatalogTypes';
import { searchMarketCatalog } from '../../lib/market/searchMarketCatalog';
import HomeCryptoAssetRow, { type HomeCryptoAssetRowData } from './HomeCryptoAssetRow';
import HomeMarketSearchUnavailableRow from './HomeMarketSearchUnavailableRow';

type HomeMarketSearchCardProps = {
  enabled: boolean;
  catalog: MarketCatalogSnapshot | null;
  displayIsLiquidMode: boolean;
  imageLoader: (props: ImageLoaderProps) => string;
  getCryptoRow: (assetId: string) => HomeCryptoAssetRowData | null;
  onEnsureCryptoLoaded: (assetIds: string[]) => void;
};

const HomeMarketSearchCard: React.FC<HomeMarketSearchCardProps> = ({
  enabled,
  catalog,
  displayIsLiquidMode,
  imageLoader,
  getCryptoRow,
  onEnsureCryptoLoaded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchResults = useMemo(
    () => searchMarketCatalog(catalog, searchQuery),
    [catalog, searchQuery]
  );

  const showResults = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!showResults) return;
    const ids = searchResults
      .filter((entry) => entry.arellsAvailable && entry.arellsAssetId)
      .map((entry) => entry.arellsAssetId as string);
    if (ids.length > 0) onEnsureCryptoLoaded(ids);
  }, [showResults, searchResults, onEnsureCryptoLoaded]);

  if (!enabled) return null;

  const renderResult = (entry: MarketCatalogEntry) => {
    if (entry.arellsAvailable && entry.arellsAssetId && entry.type === 'crypto') {
      const row = getCryptoRow(entry.arellsAssetId);
      if (row) {
        const hasData = row.liquidPrice > 0 || row.solidPrice > 0;
        return (
          <HomeCryptoAssetRow
            key={`${entry.type}-${entry.symbol}`}
            row={row}
            displayIsLiquidMode={displayIsLiquidMode}
            cardNumbersVisible={hasData}
            cardShimmersFading={false}
            cardFadeStyle={
              hasData
                ? { opacity: 1, transition: 'opacity 0.35s ease' }
                : { opacity: 0, transition: 'opacity 0.35s ease' }
            }
            imageLoader={imageLoader}
            className="home-asset-row home-asset-row--appended home-market-search-result-row"
          />
        );
      }
    }

    return <HomeMarketSearchUnavailableRow key={`${entry.type}-${entry.symbol}`} entry={entry} />;
  };

  return (
    <div className="home-assets-wrapper home-asset-category-card shadow-border-wrap home-market-search-card page-slide-down">
      <span className="shadow-border" aria-hidden="true" />
      <div className="home-assets-table-shell myinv-accent-border home-market-search-shell">
        <form
          className="home-market-search-row"
          onSubmit={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <span className="home-market-search-field-wrap myinv-accent-border">
            <input
              ref={inputRef}
              type="text"
              className="home-market-search-field"
              placeholder="ticker or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search ticker or name"
              autoComplete="off"
              spellCheck={false}
            />
          </span>
          <button type="submit" className="home-market-search-submit">
            search
          </button>
        </form>
        {showResults ? (
          <div className="home-assets-rows-shell home-market-search-results">
            {searchResults.length > 0 ? (
              searchResults.map(renderResult)
            ) : (
              <div className="home-market-search-empty">no matches</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HomeMarketSearchCard;
