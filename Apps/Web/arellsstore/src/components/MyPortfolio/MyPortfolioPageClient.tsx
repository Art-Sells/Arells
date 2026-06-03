'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import UsdRangeMetric from './UsdRangeMetric';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { WEEKLY_UAR_MAX, WEEKLY_UAR_MIN } from '../../lib/portfolio/financialBenefits';

type PortfolioMe = {
  shareUrl: string;
  referralCode: string;
  earningsUsdMin: number;
  earningsUsdMax: number;
  projectedEarningsUsdMin: number;
  projectedEarningsUsdMax: number;
  activeReferralCount: number;
  wau: number;
  usersUntilActivation: number;
  wauActivationTarget: number;
};

const staticRevenue = formatUsdRangeDisplay(WEEKLY_UAR_MIN, WEEKLY_UAR_MAX);

const MyPortfolioPageClient: React.FC = () => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [data, setData] = useState<PortfolioMe | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const json = (await res.json()) as PortfolioMe;
        if (!cancelled) {
          setData(json);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    setOpen(false);
    const raf = window.requestAnimationFrame(() => {
      const h = wrapperRef.current?.scrollHeight ?? 0;
      setShellMaxHeight(Math.max(0, h + 24));
      window.requestAnimationFrame(() => setOpen(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isSignedIn, data]);

  useLayoutEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setShellMaxHeight(Math.max(0, node.scrollHeight + 24));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [data, isSignedIn]);

  useEffect(() => {
    if (open) setSlideIn(true);
  }, [open]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  const onShare = useCallback(async () => {
    const url = data?.shareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote('Link copied.');
    } catch {
      setShareNote('Copy the link from your browser bar after tapping share.');
    }
    window.setTimeout(() => setShareNote(null), 4000);
  }, [data?.shareUrl]);

  const projected = data
    ? formatUsdRangeDisplay(data.projectedEarningsUsdMin, data.projectedEarningsUsdMax)
    : { min: '0', max: '0' };

  return (
    <>
      <div className="myinv-page myinv-page--accent myinv-page--portfolio">
        <div className="myinv-header-inner myinv-header-inner--liquid-forever is-liquid page-slide-in">
          <div className="myinv-title">my portfolio</div>
        </div>
        <div className="myinv-slogan-layer" aria-hidden="true" />

        <div className="myinv-shell shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
            style={{ maxHeight: open ? `${shellMaxHeight}px` : '0px', transition: 'max-height 2s ease' }}
          >
            <div ref={wrapperRef} className="myinv-wrapper myportfolio-stack">
              {!isSignedIn && !authSessionLoading ? (
                <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-cta-row">
                    <Link href="/signin" className="myinv-cta-button">
                      <span className="myinv-cta-button-bg" aria-hidden="true" />
                      <span className="myinv-cta-button-text">Sign In</span>
                    </Link>
                  </div>
                </div>
              ) : isSignedIn ? (
                <>
                  {loadError ? (
                    <p className="myportfolio-body-copy">Unable to load portfolio. Try again later.</p>
                  ) : null}

                  <div className={`myinv-summary-block myinv-accent-border myportfolio-metric-panel${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-summary-section">
                      <div className="myinv-summary-shell">
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                          <span className="myinv-metric-title">My Weekly Potential Earnings</span>
                        </div>
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                          {data ? (
                            <UsdRangeMetric min={data.earningsUsdMin} max={data.earningsUsdMax} />
                          ) : (
                            <UsdRangeMetric min={0} max={0} />
                          )}
                        </div>
                        <p className="metrics-growth-toolbar-tone myportfolio-benefits-sublabel">
                          per week at ~100k WAU
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`myinv-panel-group myinv-panel-group--bordered${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-panel-section myinv-accent-border">
                      <div className="myinv-panel myinv-panel--shell myportfolio-share-panel">
                        <p className="myportfolio-body-copy">
                          Sign-up 2–3 friends/family to potentially earn{' '}
                          <span className="myinv-metric-value myportfolio-inline-usd">
                            <span className="myinv-metric-symbol">$</span>
                            <span className="myinv-metric-integer">{projected.min}</span>
                            <span className="myportfolio-usd-range-sep">–</span>
                            <span className="myinv-metric-symbol">$</span>
                            <span className="myinv-metric-integer">{projected.max}</span>
                          </span>{' '}
                          a week from our mission to ensure your investments never lose value by using this
                          link:
                        </p>
                        <button
                          type="button"
                          className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-share-button"
                          onClick={onShare}
                          disabled={!data?.shareUrl}
                        >
                          share
                        </button>
                        {shareNote ? <p className="myportfolio-share-note">{shareNote}</p> : null}

                        <div className="myportfolio-about-nested myinv-accent-border">
                          <p className="myportfolio-about-title">About My Financial Benefits</p>
                          <p className="myportfolio-body-copy">
                            Your financial benefits will be derived from our advertising revenue once we have
                            100,000~ Weekly Active Users (WAU).
                          </p>
                          <p className="myportfolio-body-copy">
                            Estimated weekly User Advertising revenue from 100,000~ WAU:{' '}
                            <span className="myportfolio-static-revenue">
                              <span className="myinv-metric-symbol">$</span>
                              <span className="myinv-metric-integer">{staticRevenue.min}</span>
                              <span className="myportfolio-usd-range-sep">–</span>
                              <span className="myinv-metric-symbol">$</span>
                              <span className="myinv-metric-integer">{staticRevenue.max}</span>
                            </span>
                          </p>
                          <Link
                            href="/my-financial-benefits"
                            className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-learn-more"
                          >
                            learn more
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`myinv-panel-group myinv-panel-group--bordered${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Weekly Active Users</div>
                    <div className="myinv-panel-section myinv-accent-border myportfolio-metric-panel">
                      <div className="myinv-panel myinv-panel--shell">
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                          <span className="myinv-metric-value myportfolio-count-value">
                            <span className="myinv-metric-integer">
                              {data ? data.wau.toLocaleString('en-US') : '—'}
                            </span>
                          </span>
                        </div>
                        <div className="asset-metric-row" style={{ justifyContent: 'center', marginTop: 12 }}>
                          <span className="myinv-metric-title">Users to gain until Financial Benefits activated:</span>
                        </div>
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                          <span className="myinv-metric-value myportfolio-count-value">
                            <span className="myinv-metric-integer">
                              {data ? data.usersUntilActivation.toLocaleString('en-US') : '—'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`myinv-panel-group myinv-panel-group--bordered${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Add Investments</div>
                    <div className="myinv-panel-section myinv-accent-border myportfolio-cta-panel">
                      <div className="myinv-panel myinv-panel--shell">
                        <Link
                          href="/my-investments"
                          className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button"
                        >
                          view my investments
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <SiteSocialFooter variant="accent" />
      </div>
    </>
  );
};

export default MyPortfolioPageClient;
