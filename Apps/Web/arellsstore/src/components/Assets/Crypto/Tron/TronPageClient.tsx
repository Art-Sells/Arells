'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import AssetFooterPortfolioButton from '../../shared/AssetFooterPortfolioButton';
import AssetQuestionsSupport from '../../shared/AssetQuestionsSupport';
import AssetFooterHold from '../../shared/AssetFooterHold';
import Tron from './tron';
import { useUser } from '../../../../context/UserContext';
import { iconAssetUrl } from '../../../../lib/iconAssetUrl';
import { CRYPTO_ASSET_BY_ID } from '../../../../lib/assets/cryptoAssetRegistry';

const ASSET = CRYPTO_ASSET_BY_ID.tron;

/** Opaque viewport tint for overscroll (TRON red wash, not plain white). */
const TRON_PAGE_OVERSCROLL_BG = 'rgb(255, 238, 238)';

const TronPageClient: React.FC = () => {
  const { email, isSignedIn, authSessionLoading } = useUser();
  const isGuest = !authSessionLoading && !email && !isSignedIn;

  // Set global background immediately for overscroll beyond the asset page.
  useEffect(() => {
    // Use an opaque tint so overscroll can never blend back to browser white.
    const bg = TRON_PAGE_OVERSCROLL_BG;
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    // Hard-force actual background color too (some browsers show viewport bg during overscroll).
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  useEffect(() => {
    const badgeUrl = iconAssetUrl(ASSET.faviconPath);
    document
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="shortcut icon"], link[rel="icon"][type="image/svg+xml"], link[rel="apple-touch-icon"][type="image/svg+xml"]'
      )
      .forEach((link) => link.setAttribute('href', badgeUrl));
  }, []);

  return (
    <div className={`asset-page asset-page--${ASSET.cssModifier}`}>
      <header className={`asset-header asset-header--${ASSET.cssModifier}`} />
      <AssetFooterHold />

      <Tron />

      {!isGuest && (
        <footer className="asset-footer">
          {!!email && <AssetFooterPortfolioButton cssModifier={ASSET.cssModifier} />}
          <Link
            href="/"
            className={`asset-action-button asset-action-button--${ASSET.cssModifier} asset-action-button--invest-show asset-view-more-assets asset-view-more-assets--footer asset-footer-viewmore`}
          >
            <span className="asset-view-more-assets-text">view</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">more</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">assets</span>
          </Link>
          <Link
            className={`asset-action-button asset-action-button--${ASSET.cssModifier} asset-action-button--invest-show asset-footer-about-button`}
            href="/about"
          >
            <span className="asset-footer-about-text">about</span>
          </Link>
        </footer>
      )}
      {!isGuest && <AssetQuestionsSupport cssModifier={ASSET.cssModifier} />}
    </div>
  );
};

export default TronPageClient;
