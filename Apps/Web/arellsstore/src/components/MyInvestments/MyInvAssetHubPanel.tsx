'use client';

import React, { useMemo } from 'react';
import { SUPPORTED_STOCK_ASSET_IDS } from '../../lib/assets/stockAssetRegistry';
import MyInvAssetBadgeGrid from './MyInvAssetBadgeGrid';
import MyInvCryptoExpandableSection from './MyInvCryptoExpandableSection';
import MyInvStocksAction from './MyInvStocksAction';

type MyInvAssetHubPanelProps = {
  title: string;
  slideIn: boolean;
  assets: string[];
  linkKeyPrefix: string;
  cryptoMode: 'badges' | 'expandable';
  /** When false (My Assets), hide the company-stocks section entirely. */
  showStocksSection?: boolean;
  stocksOpen?: boolean;
  onStocksOpen?: () => void;
};

const CRYPTO_ID_SET = new Set<string>(['bitcoin']);
const STOCK_ID_SET = new Set<string>(SUPPORTED_STOCK_ASSET_IDS);

const MyInvAssetHubPanel: React.FC<MyInvAssetHubPanelProps> = ({
  title,
  slideIn,
  assets,
  linkKeyPrefix,
  cryptoMode,
  showStocksSection = false,
  stocksOpen = false,
  onStocksOpen,
}) => {
  const cryptoAssets = useMemo(() => assets.filter((id) => CRYPTO_ID_SET.has(id)), [assets]);
  const stockAssets = useMemo(() => assets.filter((id) => STOCK_ID_SET.has(id)), [assets]);

  return (
    <div className={`myinv-panel-group myinv-panel-group--bordered myinv-asset-hub-group${slideIn ? ' page-slide-in' : ''}`}>
      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">{title}</div>
      <div className="myinv-panel-section myinv-accent-border myinv-asset-hub-outer">
        <div className="myinv-panel myinv-panel--shell myinv-asset-hub-outer-shell">
          <div
            className={`myinv-accent-border myinv-asset-hub-crypto${cryptoMode === 'expandable' ? ' is-expanded' : ''}`}
          >
            {cryptoMode === 'badges' ? (
              assets.length > 0 ? (
                <MyInvAssetBadgeGrid assets={assets} linkKeyPrefix={`${linkKeyPrefix}-held`} />
              ) : null
            ) : cryptoAssets.length > 0 ? (
              <MyInvCryptoExpandableSection
                assets={cryptoAssets}
                linkKeyPrefix={`${linkKeyPrefix}-crypto`}
              />
            ) : null}
          </div>
          {showStocksSection && onStocksOpen && stockAssets.length > 0 ? (
            <div className={`myinv-accent-border myinv-asset-hub-stocks${stocksOpen ? ' is-expanded' : ''}`}>
              <MyInvStocksAction
                assets={stockAssets}
                linkKeyPrefix={`${linkKeyPrefix}-stocks`}
                stocksOpen={stocksOpen}
                onStocksOpen={onStocksOpen}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MyInvAssetHubPanel;
