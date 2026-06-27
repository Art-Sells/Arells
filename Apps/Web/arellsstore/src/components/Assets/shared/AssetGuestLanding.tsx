'use client';

import Link from 'next/link';
import React from 'react';
import GuestLandingCopyright from '../../GuestLandingCopyright';
import GuestWeeklyEarnPitch from '../../MyPortfolio/GuestWeeklyEarnPitch';
import { useInitialPublicEarnings } from '../../MyPortfolio/PublicEarningsGuestContext';
import { usePublicEarningsGuestPitch } from '../../MyPortfolio/usePublicEarningsGuestPitch';

const ASSET_BADGE_HREF: Record<string, string> = {
  bitcoin: 'https://bitcoin.org/en/',
  ethereum: 'https://ethereum.org/',
  xrp: 'https://xrpl.org/',
  bnb: 'https://www.binance.com/en/bnb',
  solana: 'https://solana.org/en/',
  tron: 'https://tron.network/',
  doge: 'https://dogecoin.com/',
  cardano: 'https://cardano.org/',
  bch: 'https://bitcoincash.org/',
};

type AssetGuestLandingProps = {
  cssModifier: string;
  ticker: string;
  title: string;
  slogan?: string;
};

export default function AssetGuestLanding({
  cssModifier,
  ticker,
  title,
  slogan = 'never loses value',
}: AssetGuestLandingProps) {
  const badgeHref = ASSET_BADGE_HREF[cssModifier] ?? '#';
  const initialPublicEarnings = useInitialPublicEarnings();
  const { guestMaxLabel, loadError } = usePublicEarningsGuestPitch(true, initialPublicEarnings);
  const showEarnPitch = Boolean(guestMaxLabel || loadError);

  return (
    <div className={`asset-page-content asset-page-content--${cssModifier} asset-guest-landing`}>
      <div className="asset-guest-landing-stack">
        <a
          className={`asset-title-badge asset-title-badge--section asset-title-badge--${cssModifier} asset-guest-landing-badge asset-guest-mount-slide asset-guest-mount-slide--badge`}
          href={badgeHref}
          target="_blank"
          rel="noreferrer"
        >
          <span className="asset-title-badge-label">{ticker}</span>
        </a>
        <div className="asset-guest-landing-title asset-guest-mount-slide asset-guest-mount-slide--title">
          {title}
        </div>
        <div
          className={`asset-guest-landing-slogan asset-guest-landing-slogan--${cssModifier} asset-guest-mount-slide asset-guest-mount-slide--slogan`}
        >
          {slogan}
        </div>
        <div
          className={`asset-guest-action-shell shadow-border-wrap asset-guest-action-shell--${cssModifier} asset-guest-mount-slide asset-guest-mount-slide--signin`}
        >
          <span className="shadow-border" aria-hidden="true" />
          <div className={`asset-guest-signin-nested asset-panel asset-panel--${cssModifier}`}>
            <div className="asset-guest-signin-inner">
              <p className="asset-signin-believe-prompt">Sign in to get involved</p>
              <Link
                href="/signin"
                className={`asset-action-button asset-action-button--save-signin asset-action-button--save-signin-empty asset-action-button--${cssModifier}`}
              >
                <span className="asset-save-signin-text">Sign In</span>
              </Link>
            </div>
          </div>
        </div>
        {showEarnPitch ? (
          <GuestWeeklyEarnPitch
            guestMaxLabel={guestMaxLabel}
            loadError={loadError}
            layout="inline"
            className="asset-guest-earn-pitch asset-guest-mount-slide asset-guest-mount-slide--earn"
          />
        ) : null}
        <GuestLandingCopyright
          variant="asset"
          cssModifier={cssModifier}
          className="asset-guest-mount-slide asset-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
}
