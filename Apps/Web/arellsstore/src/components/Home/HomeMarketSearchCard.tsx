'use client';

import type { ImageLoaderProps } from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { searchHomeAssets } from '../../lib/market/homeSearchCatalog';
import HomeCryptoAssetRow, { type HomeCryptoAssetRowData } from './HomeCryptoAssetRow';

type HomeMarketSearchCardProps = {
  enabled: boolean;
  displayIsLiquidMode: boolean;
  imageLoader: (props: ImageLoaderProps) => string;
  getCryptoRow: (assetId: string) => HomeCryptoAssetRowData | null;
  onEnsureCryptoLoaded: (assetIds: string[]) => void;
};

const HomeMarketSearchCard: React.FC<HomeMarketSearchCardProps> = ({
  enabled,
  displayIsLiquidMode,
  imageLoader,
  getCryptoRow,
  onEnsureCryptoLoaded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchResults = useMemo(() => searchHomeAssets(searchQuery), [searchQuery]);

  const showResults = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!showResults || searchResults.length === 0) return;
    onEnsureCryptoLoaded(searchResults.map((entry) => entry.assetId));
  }, [showResults, searchResults, onEnsureCryptoLoaded]);

  if (!enabled) return null;

  return (
    <div className="home-assets-wrapper home-asset-category-card shadow-border-wrap home-market-search-card page-slide-down">
      <span className="shadow-border" aria-hidden="true" />
      <div className="asset-slide-panel home-assets-card-slide home-market-search-slide is-open">
        <div className="home-assets-slide-inner">
          <div className="home-assets-list">
            <div className="home-assets-table-shell myinv-accent-border">
              <form
                className="home-market-search-row home-assets-category-button-wrap"
                onSubmit={(e) => {
                  e.preventDefault();
                  inputRef.current?.focus();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="auth-input home-market-search-field"
                  placeholder=" "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search ticker or name"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" className="home-market-search-submit">
                  search
                </button>
              </form>
              {showResults && searchResults.length > 0 ? (
                <div className="home-assets-rows-shell home-market-search-results">
                  {searchResults.map((entry) => {
                    const row = getCryptoRow(entry.assetId);
                    if (!row) return null;
                    const hasData = row.liquidPrice > 0 || row.solidPrice > 0;
                    return (
                      <HomeCryptoAssetRow
                        key={entry.assetId}
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
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeMarketSearchCard;
