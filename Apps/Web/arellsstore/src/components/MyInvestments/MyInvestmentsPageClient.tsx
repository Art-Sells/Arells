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

  const hasAny = emailInvestments.length > 0;
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
      <div className={`myinv-page${isSignedIn ? '' : ' myinv-page--guest'}`}>
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
            {isSignedIn ? (
              <Link className="myinv-home-button" href="/" aria-label="Home">
                <Image alt="Arells" width={37} height={37} src="/images/Arells-Icon.png" />
              </Link>
            ) : (
              <span />
            )}
          </div>

          {!isSignedIn ? (
            <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-cta-row">
                <button type="button" className="myinv-cta-button" onClick={openSignIn}>
                  <span className="myinv-cta-button-bg" aria-hidden="true" />
                  <span className="myinv-cta-button-text">Sign In</span>
                </button>
              </div>
            </div>
          ) : !hasAny ? (
            <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-panel-title">Add Investments</div>
              <div className={`myinv-cta-row myinv-cta-row--stack${assetsMissingInEmail.length === 1 ? ' is-single' : ''}`}>
                {/* If user has email but no investments at all, show both asset buttons */}
                {assetsMissingInEmail.length
                  ? assetsMissingInEmail.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`missing-${asset}`} href={href} className="myinv-cta-button">
                          <span className="myinv-cta-button-bg" aria-hidden="true" />
                          <span className="myinv-cta-button-text">{label}</span>
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

                {!!email && (
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

              {assetsMissingInEmail.length > 0 && (
                <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title">Add Investments</div>
                  <div className={`myinv-cta-row myinv-cta-row--stack${assetsMissingInEmail.length === 1 ? ' is-single' : ''}`}>
                    {assetsMissingInEmail.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`missing-${asset}`} href={href} className="myinv-cta-button">
                          <span className="myinv-cta-button-bg" aria-hidden="true" />
                          <span className="myinv-cta-button-text">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {assetsPresentInEmail.length > 0 && (
                <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title">Add More Investments</div>
                  <div className={`myinv-cta-row myinv-cta-row--stack${assetsPresentInEmail.length === 1 ? ' is-single' : ''}`}>
                    {assetsPresentInEmail.map((asset) => {
                      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                      return (
                        <Link key={`more-${asset}`} href={href} className="myinv-cta-button">
                          <span className="myinv-cta-button-bg" aria-hidden="true" />
                          <span className="myinv-cta-button-text">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`myinv-footnote${slideIn ? ' page-slide-in' : ''}`}>{email ? `Signed in as ${email}` : null}</div>
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

