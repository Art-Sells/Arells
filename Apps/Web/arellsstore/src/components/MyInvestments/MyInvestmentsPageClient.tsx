'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';
import { useUser } from '../../context/UserContext';

const formatCurrency = (value: number) =>
  (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MyInvestmentsPageClient: React.FC = () => {
  const {
    isSignedIn,
    email,
    openSignIn,
    emailInvestments,
    emailTotals,
    emailTotalsLiquid,
    emailLoading,
    refreshEmailAggregator,
    assetsPresentInEmail,
    assetsMissingInEmail,
  } = useUser();
  const forceEmptyEmailPreview = true;
  const effectiveSignedIn = forceEmptyEmailPreview ? true : isSignedIn;
  const effectiveEmail = forceEmptyEmailPreview ? 'preview@arells.com' : email;
  const effectiveInvestments = forceEmptyEmailPreview ? [] : emailInvestments;
  const effectiveAssetsPresent = forceEmptyEmailPreview ? [] : assetsPresentInEmail;
  const effectiveAssetsMissing = forceEmptyEmailPreview ? ['bitcoin', 'ethereum'] : assetsMissingInEmail;

  const [open, setOpen] = useState(false);
  const [isLiquidMode, setIsLiquidMode] = useState(false);
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setSlideIn(true), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = '#ffffff';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    refreshEmailAggregator();
  }, [isSignedIn, refreshEmailAggregator]);

  const hasAny = effectiveInvestments.length > 0;
  const displayTotals = isLiquidMode ? emailTotalsLiquid : emailTotals;
  const totalProfit = (displayTotals?.acdVatop || 0) as number;
  const profitLabel = totalProfit >= 0 ? 'Profits' : 'Losses';
  const profitPrefix = totalProfit >= 0 ? '+$' : '-$';

  return (
    <>
      {showLoading && (
        <div className={`asset-loader-overlay myinv-loader-overlay${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div className="asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--myinv">
            <div className="asset-reality-toggle-row">
              <button type="button" className="asset-reality-toggle asset-reality-toggle--loader" aria-hidden="true">
                <span className="asset-loader-toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`myinv-page${effectiveSignedIn ? '' : ' myinv-page--guest'}`}>
        <div className={`myinv-header-outside${slideIn ? ' page-slide-in' : ''}`}>
          <div className="myinv-title">my investments</div>
          <div className={`myinv-slogan asset-header-slogan${isLiquidMode ? ' is-hidden' : ''}`}>
            if they never lost value
          </div>
        </div>
        <div className="myinv-shell">
          <div
            className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
            style={{ maxHeight: open ? '2200px' : '0px', transition: 'max-height 2s ease' }}
          >
            <div className="myinv-wrapper">
            <div className={`myinv-topbar${slideIn ? ' page-slide-in' : ''}`}>
            <span />
          </div>

          {!effectiveSignedIn ? (
            <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-cta-row">
                <button type="button" className="myinv-cta-button" onClick={openSignIn}>
                  <span className="myinv-cta-button-bg" aria-hidden="true" />
                  <span className="myinv-cta-button-text">Sign In</span>
                </button>
              </div>
            </div>
          ) : !hasAny ? (
            <div className={`myinv-panel myinv-panel--shell${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-panel-title">Add Investments</div>
              <div className={`myinv-asset-options${effectiveAssetsMissing.length === 1 ? ' is-single' : ''}`}>
                {/* If user has email but no investments at all, show both asset buttons */}
                {effectiveAssetsMissing.length
                  ? effectiveAssetsMissing.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const icon = asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`missing-${asset}`} href={href} className={`myinv-asset-button myinv-asset-button--${asset}`} aria-label={label}>
                          <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                        </Link>
                      );
                    })
                  : null}
              </div>
            </div>
          ) : (
            <>
              <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                <div className="myinv-panel-title">{emailLoading ? 'Loading…' : 'Investments'}</div>
                <div className="myinv-totals">
                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                    <span className="myinv-metric-title">Purchased Value</span>
                    <span className="asset-money-wrap">
                      <span className="myinv-metric-symbol">$</span>
                      <span className="myinv-metric-value">{formatCurrency(displayTotals?.acVatop || 0)}</span>
                    </span>
                  </div>
                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                    <span className="myinv-metric-title">Current Value</span>
                    <span className="asset-money-wrap">
                      <span className="myinv-metric-symbol">$</span>
                      <span className="myinv-metric-value">{formatCurrency(displayTotals?.acVact || 0)}</span>
                    </span>
                  </div>
                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                    <span className="myinv-metric-title">{profitLabel}</span>
                    <span className="asset-money-wrap">
                      <span className="myinv-metric-inline-symbol">{profitPrefix}</span>
                      <span className="myinv-metric-value">{formatCurrency(Math.abs(totalProfit || 0))}</span>
                    </span>
                  </div>
                </div>

                {!!effectiveEmail && (
                  <div className="asset-reality-toggle-row" style={{ marginTop: 21 }}>
                    <span className={`asset-reality-toggle-label${isLiquidMode ? ' is-active' : ''}`}>Liquid</span>
                    <button
                      type="button"
                      className={`asset-reality-toggle${!isLiquidMode ? ' is-fantasy' : ''}`}
                      aria-pressed={isLiquidMode}
                      aria-label="Toggle Liquid/Solid mode"
                      onClick={() => setIsLiquidMode((v) => !v)}
                    >
                      <span className="asset-reality-toggle-knob" aria-hidden="true" />
                    </button>
                    <span className={`asset-reality-toggle-label${!isLiquidMode ? ' is-active' : ''}`}>Solid</span>
                  </div>
                )}
              </div>

              {effectiveAssetsMissing.length > 0 && (
                <div className={`myinv-panel myinv-panel--shell${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title">Add Investments</div>
                  <div className={`myinv-asset-options${effectiveAssetsMissing.length === 1 ? ' is-single' : ''}`}>
                    {effectiveAssetsMissing.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const icon = asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`missing-${asset}`} href={href} className={`myinv-asset-button myinv-asset-button--${asset}`} aria-label={label}>
                          <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {effectiveAssetsPresent.length > 0 && (
                <div className={`myinv-panel myinv-panel--shell${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title">Add More Investments</div>
                  <div className={`myinv-asset-options${effectiveAssetsPresent.length === 1 ? ' is-single' : ''}`}>
                    {effectiveAssetsPresent.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const icon = asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`more-${asset}`} href={href} className={`myinv-asset-button myinv-asset-button--${asset}`} aria-label={label}>
                          <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`myinv-footnote${slideIn ? ' page-slide-in' : ''}`}>
                {effectiveEmail ? `Signed in as ${effectiveEmail}` : null}
              </div>
            </>
          )}
        </div>
      </div>
        </div>
        <div className={`myinv-about-wrap${slideIn ? ' page-slide-in' : ''}`}>
          <Link className="myinv-about-button" href="/about">
            <span className="myinv-about-button-bg" aria-hidden="true" />
            <span className="myinv-about-button-text">about</span>
          </Link>
        </div>
    </div>
    </>
  );
};

export default MyInvestmentsPageClient;

