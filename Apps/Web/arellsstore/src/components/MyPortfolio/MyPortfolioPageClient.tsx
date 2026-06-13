'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import UsdRangeMetric from './UsdRangeMetric';
import PortfolioLeaderboard, { type PortfolioLeaderboardRow } from './PortfolioLeaderboard';
import PortfolioWeeklyGuestPageView from './PortfolioWeeklyGuestPageView';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import {
  groupDisplayMaxUsd,
  headlineDisplayMaxUsd,
  topReferrerWeeklyMaxUsd,
} from '../../lib/portfolio/referralShares';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';

export type MyPortfolioPageClientProps = {
  /** Renders signed-out layout without signing out (preview route only). */
  guestPreview?: boolean;
  initialPortfolioMe?: PortfolioMePayload | null;
  initialLeaderboardRows?: PortfolioLeaderboardRow[];
  /** SSR public earnings for guest pitch (skips client wait when present). */
  initialPublicEarnings?: PublicEarningsPayload | null;
};

const MyPortfolioPageClient: React.FC<MyPortfolioPageClientProps> = ({
  guestPreview = false,
  initialPortfolioMe = null,
  initialLeaderboardRows = [],
  initialPublicEarnings = null,
}) => {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const showGuestLayout = guestPreview || (!isSignedIn && !initialPortfolioMe);
  const showSignedInPanel = isSignedIn || !!initialPortfolioMe;
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [data, setData] = useState<PortfolioMePayload | null>(initialPortfolioMe);
  const [leaderboardRows, setLeaderboardRows] = useState<PortfolioLeaderboardRow[]>(
    initialLeaderboardRows
  );
  const [publicEarnings, setPublicEarnings] = useState<PublicEarningsPayload | null>(
    initialPublicEarnings
  );
  const [loadError, setLoadError] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (showGuestLayout) {
      setData(null);
      setLeaderboardRows([]);
      if (publicEarnings) return;

      let cancelled = false;
      (async () => {
        try {
          const res = await fetch('/api/portfolio/public-earnings', { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch failed');
          const json = (await res.json()) as PublicEarningsPayload;
          if (!cancelled) {
            setPublicEarnings(json);
            setLoadError(false);
          }
        } catch {
          if (!cancelled) setLoadError(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (guestPreview || !showSignedInPanel) {
      return;
    }
    if (data) return;

    let cancelled = false;
    (async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/portfolio/leaderboard', { credentials: 'include', cache: 'no-store' }),
        ]);
        if (!meRes.ok || !lbRes.ok) throw new Error('fetch failed');
        const json = (await meRes.json()) as PortfolioMePayload;
        const lbJson = (await lbRes.json()) as { rows: PortfolioLeaderboardRow[] };
        if (!cancelled) {
          setData(json);
          setLeaderboardRows(Array.isArray(lbJson.rows) ? lbJson.rows : []);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showGuestLayout, showSignedInPanel, guestPreview, data, publicEarnings]);

  useEffect(() => {
    if (showGuestLayout) return;
    setOpen(false);
    const raf = window.requestAnimationFrame(() => {
      const h = wrapperRef.current?.scrollHeight ?? 0;
      setShellMaxHeight(Math.max(0, h + 24));
      window.requestAnimationFrame(() => setOpen(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isSignedIn, data, leaderboardRows, guestPreview, showGuestLayout]);

  useLayoutEffect(() => {
    if (showGuestLayout) return;
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setShellMaxHeight(Math.max(0, node.scrollHeight + 24));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [data, leaderboardRows, isSignedIn, guestPreview, showGuestLayout]);

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

  const portfolioMetricsReady = !!data && !loadError;

  const headlineGroupMaxUsd = data
    ? headlineDisplayMaxUsd(topReferrerWeeklyMaxUsd(leaderboardRows), data.earningsUsdMax)
    : 0;

  const guestMaxUsd = useMemo(() => {
    if (!publicEarnings) return 0;
    return groupDisplayMaxUsd(
      publicEarnings.topReferrerMaxUsd,
      publicEarnings.fallbackProjectionMaxUsd
    );
  }, [publicEarnings]);

  const guestMaxLabel = formatUsdRangeDisplay(guestMaxUsd, guestMaxUsd).max;

  if (showGuestLayout) {
    return (
      <PortfolioWeeklyGuestPageView
        guestMaxLabel={guestMaxLabel}
        loading={!publicEarnings}
        loadError={loadError}
      />
    );
  }

  return (
    <>
      <div className="myinv-page myinv-page--accent myinv-page--portfolio">
        <div className="myportfolio-mission-block page-slide-in">
          <Link href="/" className="asset-action-button about-icon-button myportfolio-mission-icon-button" aria-label="Arells">
            <span className="about-icon" aria-hidden="true" />
          </Link>
          <p className="myportfolio-mission-tagline">
            on a mission to ensure
            <br />
            your investments never lose value
          </p>
        </div>

        <div className="myinv-shell shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
            style={{ maxHeight: open ? `${shellMaxHeight}px` : '0px', transition: 'max-height 2s ease' }}
          >
            <div ref={wrapperRef} className="myinv-wrapper myportfolio-stack">
              {showSignedInPanel ? (
                <>
                  {loadError ? (
                    <p className="myportfolio-body-copy">Unable to load portfolio. Try again later.</p>
                  ) : null}

                  <div className={`myinv-summary-block myinv-accent-border myportfolio-metric-panel${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-summary-section">
                      <div className="myinv-summary-shell">
                        <p className="myportfolio-about-title">My Weekly Projected Earnings</p>
                        <div className="myportfolio-projected-earnings-nested myinv-accent-border">
                          <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                            {!loadError ? (
                              <UsdRangeMetric
                                min={data?.earningsUsdMin ?? 0}
                                max={headlineGroupMaxUsd}
                                loading={!portfolioMetricsReady}
                              />
                            ) : null}
                          </div>
                          <p className="myinv-metric-title myportfolio-benefits-sublabel">
                            per week at ~100k WAU
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`myinv-panel-group myinv-panel-group--bordered myportfolio-portfolio-share-group${slideIn ? ' page-slide-in' : ''}`}>
                    <div className="myinv-panel-section myinv-accent-border">
                      <div className="myinv-panel myinv-panel--shell myportfolio-share-panel">
                        <p className="myportfolio-body-copy">
                          Sign-up 3 or more friends/family to earn{' '}
                          {!loadError ? (
                            <UsdRangeMetric
                              min={data?.projectedEarningsUsdMin ?? 0}
                              max={data?.projectedEarningsUsdMax ?? 0}
                              loading={!portfolioMetricsReady}
                              className="myportfolio-inline-usd"
                            />
                          ) : null}{' '}
                          a week (based on 100k WAU) by using this link:
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

                        <div className="myportfolio-leaderboard-nested myinv-accent-border">
                          <div className="myportfolio-leaderboard-wrap">
                            <PortfolioLeaderboard rows={leaderboardRows} />
                          </div>
                        </div>

                        <div className="myportfolio-about-nested myinv-accent-border">
                          <button
                            type="button"
                            className="asset-range-button myinv-range-button about-cta-button myportfolio-learn-more"
                            onClick={() => router.push('/earn-money-weekly')}
                          >
                            learn more
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {showSignedInPanel ? (
          <div className={`myportfolio-portfolio-below-shell myportfolio-stack${slideIn ? ' page-slide-in' : ''}`}>
            <div className={`myinv-panel-group myportfolio-portfolio-below-panel${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Weekly Active Users</div>
              <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
                <span className="shadow-border" aria-hidden="true" />
                <div className="myinv-panel-section myinv-accent-border myportfolio-metric-panel">
                  <div className="myinv-panel myinv-panel--shell">
                    <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                      <span className="myinv-metric-value myportfolio-count-value">
                        <span className="myinv-metric-integer">
                          {data ? data.wau.toLocaleString('en-US') : '—'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`myinv-panel-group myportfolio-portfolio-below-panel${slideIn ? ' page-slide-in' : ''}`}>
              <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Add Investments</div>
              <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
                <span className="shadow-border" aria-hidden="true" />
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
            </div>
          </div>
        ) : null}

        <div className="myinv-about-wrap">
          <Link className="myinv-about-button" href="/about">
            <span className="myinv-about-button-bg" aria-hidden="true" />
            <span className="myinv-about-button-text">about</span>
          </Link>
        </div>

        <SiteSocialFooter variant="accent" />
      </div>
    </>
  );
};

export default MyPortfolioPageClient;
