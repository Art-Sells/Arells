'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../../app/css/Home.css';
import { useUser } from '../../context/UserContext';

const formatCurrency = (value: number) =>
  (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatShortDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
  const [showEditInvestments, setShowEditInvestments] = useState(false);
  const [editInvestmentsOpen, setEditInvestmentsOpen] = useState(false);
  const [visibleEditCount, setVisibleEditCount] = useState(5);
  const [editListHeight, setEditListHeight] = useState(0);
  const editListRef = useRef<HTMLDivElement | null>(null);
  const editCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    refreshEmailAggregator();
  }, [isSignedIn, refreshEmailAggregator]);

  const hasAny = emailInvestments.length > 0;
  const allInvestments = useMemo(
    () =>
      (Array.isArray(emailInvestments) ? emailInvestments : []).map((entry) => ({
        ...entry,
        asset: ((entry?.asset || 'bitcoin') as string).toLowerCase(),
      })),
    [emailInvestments]
  );

  useEffect(() => {
    if (!showEditInvestments) return;
    const node = editListRef.current;
    if (!node) return;
    const update = () => setEditListHeight(node.scrollHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [showEditInvestments, visibleEditCount]);

  useEffect(
    () => () => {
      if (editCloseTimerRef.current) clearTimeout(editCloseTimerRef.current);
    },
    []
  );


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

            {!!email && hasAny && (
              <div className="myinv-panel myinv-panel--edit">
                <button
                  type="button"
                  className="asset-action-button asset-action-button--invest-show myinv-edit-toggle"
                  onClick={() => {
                    if (editCloseTimerRef.current) clearTimeout(editCloseTimerRef.current);
                    if (editInvestmentsOpen) {
                      setEditInvestmentsOpen(false);
                      editCloseTimerRef.current = setTimeout(() => {
                        setShowEditInvestments(false);
                        setVisibleEditCount(5);
                      }, 2000);
                      return;
                    }
                    setShowEditInvestments(true);
                    setTimeout(() => setEditInvestmentsOpen(true), 0);
                  }}
                >
                  {editInvestmentsOpen ? 'Hide Edit Investments' : 'Edit Investments'}
                </button>

                {showEditInvestments && (
                  <div
                    className={`myinv-edit-wrap asset-slide-panel${editInvestmentsOpen ? ' is-open' : ''}`}
                    style={{ maxHeight: editInvestmentsOpen ? `${editListHeight}px` : '0px', transition: 'max-height 2s ease' }}
                  >
                    <div className="myinv-edit-list" ref={editListRef}>
                      <div className="myinv-edit-grid">
                        {allInvestments.slice(0, visibleEditCount).map((entry: any, idx: number) => {
                          const asset = (entry?.asset || 'bitcoin') as string;
                          const isBitcoin = asset === 'bitcoin';
                          const cardClass = isBitcoin ? 'myinv-edit-card--bitcoin' : 'myinv-edit-card--ethereum';
                          const icon = isBitcoin
                            ? '/images/assets/crypto/Bitcoin.svg'
                            : '/images/assets/crypto/Ethereum.svg';
                          const purchased = isLiquidMode
                            ? (entry.lCVatop ?? entry.rCVatop ?? entry.cVatop ?? 0)
                            : (entry.cVatop ?? entry.rCVatop ?? entry.lCVatop ?? 0);
                          const current = isLiquidMode
                            ? (entry.lCVact ?? entry.rCVact ?? entry.cVact ?? 0)
                            : (entry.cVact ?? entry.rCVact ?? entry.lCVact ?? 0);
                          const profitValue = isLiquidMode
                            ? (entry.lCdVatop ?? entry.rCdVatop ?? entry.cdVatop ?? 0)
                            : (entry.cdVatop ?? entry.rCdVatop ?? entry.lCdVatop ?? 0);
                          const amount = entry.cVactTaa ?? entry.lCVactTaa ?? entry.rCVactTaa ?? 0;
                          const isProfit = profitValue > 0.005;
                          const profitTitle = isProfit ? 'Profits' : 'Losses';
                          const profitPrefix = isProfit ? '+$' : '-$';
                          return (
                            <div key={`${asset}-${idx}`} className={`myinv-edit-card ${cardClass}`}>
                              <div className="myinv-edit-card-icon">
                                <Image alt="" width={18} height={18} src={icon} />
                              </div>
                              <div className="myinv-edit-metrics">
                                <div className="myinv-edit-row">
                                  <span className="myinv-edit-title">Purchased Value</span>
                                  <span className="myinv-edit-value">${formatCurrency(purchased)}</span>
                                </div>
                                <div className="myinv-edit-row">
                                  <span className="myinv-edit-title">Current Value</span>
                                  <span className="myinv-edit-value">${formatCurrency(current)}</span>
                                </div>
                                <div className="myinv-edit-row">
                                  <span className="myinv-edit-title">{profitTitle}</span>
                                  <span className="myinv-edit-value">
                                    {profitPrefix}
                                    {formatCurrency(Math.abs(profitValue || 0))}
                                  </span>
                                </div>
                                <div className="myinv-edit-row">
                                  <span className="myinv-edit-title">{isBitcoin ? 'Bitcoin amount' : 'Ethereum amount'}</span>
                                  <span className="myinv-edit-value">
                                    {Number(amount || 0).toLocaleString('en-US', {
                                      minimumFractionDigits: 8,
                                      maximumFractionDigits: 8,
                                    })}
                                  </span>
                                </div>
                                <div className="myinv-edit-row">
                                  <span className="myinv-edit-title">Date purchased</span>
                                  <span className="myinv-edit-value">{formatShortDate(entry.date)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {visibleEditCount < allInvestments.length && (
                        <button
                          type="button"
                          className="asset-action-button asset-action-button--invest-show myinv-edit-load"
                          onClick={() => {
                            setVisibleEditCount((count) => count + 5);
                            requestAnimationFrame(() => {
                              editListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            });
                          }}
                        >
                          Load 5 more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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

