'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '../../context/UserContext';
import { assetSharePath } from '../../lib/assets/assetSharePath';
import { isPendingNavTarget, usePendingNavHref } from '../../lib/client/navCircleLoader';
import BitcoinSeasonTeaser from '../Assets/Crypto/Bitcoin/BitcoinSeasonTeaser';

/** Signed-in home CTA: Bitcoin badge + Season One dynamic → /bitcoin. */
export default function HomeBitcoinAlienRaceCard() {
  const { shareId } = useUser();
  const href = assetSharePath('/bitcoin', shareId);
  usePendingNavHref();
  const badgeLoading = isPendingNavTarget(href);

  return (
    <div className="home-assets-wrapper home-asset-category-card shadow-border-wrap page-slide-down">
      <span className="shadow-border" aria-hidden="true" />
      <Link
        href={href}
        className="home-bitcoin-alien-race-card home-asset-bitcoin"
        aria-label="Bitcoin"
      >
        <div className="asset-bitcoin-season-teaser-badge">
          <div
            className={`myinv-asset-home-card home-asset-bitcoin bitcoin-alien-race-asset-card${
              badgeLoading ? ' is-nav-loading' : ''
            }`}
            aria-busy={badgeLoading || undefined}
          >
            <div className="home-assets-cell home-assets-asset">
              <span className="home-asset-label home-asset-label-bitcoin">
                <span
                  className={`home-asset-name asset-action-button asset-action-button--bitcoin asset-action-button--home-asset-chip${
                    badgeLoading ? ' is-nav-loading-chip' : ''
                  }`}
                >
                  Bitcoin
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="home-bitcoin-alien-race-card-season" aria-hidden="true">
          <BitcoinSeasonTeaser seasonOnly />
        </div>
      </Link>
    </div>
  );
}
