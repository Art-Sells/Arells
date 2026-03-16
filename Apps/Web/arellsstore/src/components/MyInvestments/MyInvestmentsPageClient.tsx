'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../../app/css/Home.css';
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

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
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

  const addMissingButtons = useMemo(() => {
    return assetsMissingInEmail.map((asset) => {
      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
      const icon = asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
      const cls = asset === 'bitcoin' ? 'home-voting-button--bitcoin' : 'home-voting-button--ethereum';
      return (
        <Link key={`missing-${asset}`} href={href} className={`home-voting-button ${cls}`}>
          <Image className="home-voting-icon" alt={label} width={22} height={22} src={icon} />
          <span>{label}</span>
        </Link>
      );
    });
  }, [assetsMissingInEmail]);

  const addMoreButtons = useMemo(() => {
    return assetsPresentInEmail.map((asset) => {
      const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
      const icon = asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
      const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
      const cls = asset === 'bitcoin' ? 'home-voting-button--bitcoin' : 'home-voting-button--ethereum';
      return (
        <Link key={`more-${asset}`} href={href} className={`home-voting-button ${cls}`}>
          <Image className="home-voting-icon" alt={label} width={22} height={22} src={icon} />
          <span>{label}</span>
        </Link>
      );
    });
  }, [assetsPresentInEmail]);

  return (
    <div className="myinv-page">
      <div
        className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
        style={{ maxHeight: open ? '2200px' : '0px', transition: 'max-height 2s ease' }}
      >
        <div className="myinv-wrapper">
          <div className="myinv-topbar">
            {isSignedIn ? (
              <Link className="myinv-home-button" href="/" aria-label="Home">
                <Image alt="Arells" width={37} height={37} src="/images/Arells-Icon.png" />
              </Link>
            ) : (
              <span />
            )}
          </div>

          <div className="myinv-header">
            <div className="myinv-title">My Investments</div>
            <div className={`myinv-slogan asset-header-slogan${isLiquidMode ? ' is-hidden' : ''}`}>
              if they never lost value
            </div>
          </div>

          {!isSignedIn ? (
            <div className="myinv-panel">
              <button type="button" className="myinv-signin-button" onClick={openSignIn}>
                Sign In
              </button>
            </div>
          ) : !hasAny ? (
            <div className="myinv-panel">
              <div className="myinv-panel-title">Add Investments</div>
              <div className={`myinv-asset-buttons${assetsMissingInEmail.length === 1 ? ' is-single' : ''}`}>
                {/* If user has email but no investments at all, show both asset buttons */}
                {assetsMissingInEmail.length ? addMissingButtons : null}
              </div>
            </div>
          ) : (
            <>
              <div className="myinv-panel">
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
                <div className="myinv-panel">
                  <div className="myinv-panel-title">Add Investments</div>
                  <div className={`myinv-asset-buttons${assetsMissingInEmail.length === 1 ? ' is-single' : ''}`}>
                    {addMissingButtons}
                  </div>
                </div>
              )}

              {assetsPresentInEmail.length > 0 && (
                <div className="myinv-panel">
                  <div className="myinv-panel-title">Add More Investments</div>
                  <div className={`myinv-asset-buttons${assetsPresentInEmail.length === 1 ? ' is-single' : ''}`}>
                    {addMoreButtons}
                  </div>
                </div>
              )}

              <div className="myinv-footnote">{email ? `Signed in as ${email}` : null}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInvestmentsPageClient;

