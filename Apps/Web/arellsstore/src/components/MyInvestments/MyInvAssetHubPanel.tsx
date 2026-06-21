'use client';

import React from 'react';
import MyInvAssetBadgeGrid from './MyInvAssetBadgeGrid';
import MyInvCryptoExpandableSection from './MyInvCryptoExpandableSection';
import MyInvStocksAction from './MyInvStocksAction';

type MyInvAssetHubPanelProps = {
  title: string;
  slideIn: boolean;
  assets: string[];
  linkKeyPrefix: string;
  cryptoMode: 'badges' | 'expandable';
  cryptoOpen?: boolean;
  onCryptoOpen?: () => void;
  stocksPhase: 'button' | 'coming-soon';
  onStocksClick: () => void;
};

const MyInvAssetHubPanel: React.FC<MyInvAssetHubPanelProps> = ({
  title,
  slideIn,
  assets,
  linkKeyPrefix,
  cryptoMode,
  cryptoOpen = false,
  onCryptoOpen,
  stocksPhase,
  onStocksClick,
}) => (
  <div className={`myinv-panel-group myinv-panel-group--bordered myinv-asset-hub-group${slideIn ? ' page-slide-in' : ''}`}>
    <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">{title}</div>
    <div className="myinv-panel-section myinv-accent-border myinv-asset-hub-outer">
      <div className="myinv-panel myinv-panel--shell myinv-asset-hub-outer-shell">
        <div
          className={`myinv-accent-border myinv-asset-hub-crypto${cryptoMode === 'expandable' && cryptoOpen ? ' is-expanded' : ''}`}
        >
          {cryptoMode === 'badges' ? (
            <MyInvAssetBadgeGrid assets={assets} linkKeyPrefix={linkKeyPrefix} />
          ) : (
            <MyInvCryptoExpandableSection
              assets={assets}
              linkKeyPrefix={linkKeyPrefix}
              cryptoOpen={cryptoOpen}
              onCryptoOpen={onCryptoOpen}
            />
          )}
        </div>
        <div className="myinv-accent-border myinv-asset-hub-stocks">
          <div className="myinv-panel myinv-panel--shell myinv-asset-hub-stocks-shell">
            <MyInvStocksAction phase={stocksPhase} onStocksClick={onStocksClick} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default MyInvAssetHubPanel;
