'use client';

import React from 'react';
import Link from 'next/link';
import { getCryptoAssetMeta } from '../../lib/assets/cryptoAssetRegistry';

type MyInvAssetBadgeGridProps = {
  assets: string[];
  linkKeyPrefix: string;
};

const MyInvAssetBadgeGrid: React.FC<MyInvAssetBadgeGridProps> = ({ assets, linkKeyPrefix }) => (
  <div className="myinv-panel myinv-panel--shell myinv-panel--asset-buttons myinv-asset-hub-badge-grid">
    <div
      className={`myinv-asset-options${assets.length === 1 ? ' is-single' : ''}${assets.length > 2 ? ' is-many' : ''}`}
    >
      {assets.map((asset) => {
        const meta = getCryptoAssetMeta(asset);
        const href = meta?.href ?? '/';
        const label = meta?.label ?? asset;
        return (
          <Link
            key={`${linkKeyPrefix}-${asset}`}
            href={href}
            className={`myinv-asset-home-card home-asset-${asset}`}
            aria-label={label}
          >
            <div className="home-assets-cell home-assets-asset">
              <span className={`home-asset-label home-asset-label-${asset}`}>
                <span
                  className={`home-asset-name asset-action-button asset-action-button--${asset} asset-action-button--home-asset-chip`}
                >
                  {label}
                </span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default MyInvAssetBadgeGrid;
