'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import HomeAboutMountLoader from '../HomeAboutMountLoader';
import UsdRangeMetric from './UsdRangeMetric';
import PortfolioUsdAmount from './PortfolioUsdAmount';
import PortfolioLeaderboard, { type PortfolioLeaderboardRow } from './PortfolioLeaderboard';
import PortfolioWeeklyGuestPageView from './PortfolioWeeklyGuestPageView';
import { usePublicEarningsGuestPitch } from './usePublicEarningsGuestPitch';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { USERS_POOL_WEEKLY_MAX } from '../../lib/portfolio/financialBenefits';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import { buildShareUrl } from '../../lib/auth/referral';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';

/** Matches inline `max-height` transition on `.myinv-slide` (fallback if `transitionend` is skipped). */
const PORTFOLIO_SHELL_MAX_HEIGHT_MS = 2000;

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
  const shellSlideRef = useRef<HTMLDivElement | null>(null);
  const shellRevealDoneRef = useRef(false);
  const [showBelowPanels, setShowBelowPanels] = useState(false);
  const [showBelowContent, setShowBelowContent] = useState(false);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [data, setData] = useState<PortfolioMePayload | null>(initialPortfolioMe);
  const [leaderboardRows, setLeaderboardRows] = useState<PortfolioLeaderboardRow[]>(
    initialLeaderboardRows
  );
  const [loadError, setLoadError] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareResetRef = useRef<number | null>(null);
  const { guestMaxLabel, loadError: guestPitchLoadError } =
    usePublicEarningsGuestPitch(showGuestLayout, initialPublicEarnings);

  useEffect(() => {
    if (showGuestLayout) {
      setData(null);
      setLeaderboardRows([]);
      return;
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
  }, [showGuestLayout, showSignedInPanel, guestPreview, data]);

  useEffect(() => {
    if (showGuestLayout) return;
    setOpen(false);
    setShowBelowPanels(false);
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
    if (open) {
      setSlideIn(true);
      setShowBelowPanels(true);
    }
  }, [open]);

  const revealBelowContent = useCallback(() => {
    if (shellRevealDoneRef.current) return;
    shellRevealDoneRef.current = true;
    setShowBelowContent(true);
  }, []);

  useEffect(() => {
    if (showGuestLayout || shellRevealDoneRef.current) return;
    if (!open || shellMaxHeight <= 0) return;

    const el = shellSlideRef.current;
    if (!el) return;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'max-height') return;
      revealBelowContent();
    };

    const fallback = window.setTimeout(revealBelowContent, PORTFOLIO_SHELL_MAX_HEIGHT_MS);

    el.addEventListener('transitionend', onTransitionEnd);
    return () => {
      el.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(fallback);
    };
  }, [open, shellMaxHeight, showGuestLayout, revealBelowContent]);

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

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  const shareUrl = useMemo(() => {
    if (!data?.referralCode) return '';
    if (typeof window !== 'undefined') {
      return buildShareUrl(window.location.origin, data.referralCode);
    }
    return data.shareUrl ?? '';
  }, [data?.referralCode, data?.shareUrl]);

  const onShare = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      shareResetRef.current = window.setTimeout(() => {
        setShareCopied(false);
        shareResetRef.current = null;
      }, 3000);
    } catch {
      // Clipboard unavailable — button label unchanged; no message below button.
    }
  }, [shareUrl]);

  const portfolioMetricsReady = !!data && !loadError;

  const shareEarnUpToLabel = formatUsdRangeDisplay(
    USERS_POOL_WEEKLY_MAX,
    USERS_POOL_WEEKLY_MAX
  ).max;

  if (showGuestLayout) {
    return (
      <PortfolioWeeklyGuestPageView
        guestMaxLabel={guestMaxLabel}
        loadError={guestPitchLoadError}
      />
    );
  }

  return (
    <>
      <HomeAboutMountLoader />
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
            ref={shellSlideRef}
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
                                max={data?.earningsUsdMax ?? 0}
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
                        <div className="myportfolio-share-copy-nested myinv-accent-border">
                          <p className="myportfolio-share-invite-copy">
                            <span className="myportfolio-share-invite-line-one">
                              <span className="myportfolio-share-invite-signup">
                                Sign up 2 (or more) people
                              </span>{' '}
                              <span className="myportfolio-share-invite-lead-range">
                                <span className="myportfolio-share-invite-lead">to earn up to</span>{' '}
                                {!loadError ? (
                                  <PortfolioUsdAmount
                                    amount={shareEarnUpToLabel}
                                    loading={false}
                                    className="myportfolio-inline-usd"
                                  />
                                ) : null}
                              </span>
                            </span>{' '}
                            <span className="myportfolio-share-invite-tail">
                              a week by copying and sharing this link:
                            </span>
                          </p>
                          <div className="myportfolio-share-copy-row">
                            <button
                              type="button"
                              className="auth-submit auth-submit--accent asset-range-button myportfolio-share-copy-button"
                              onClick={onShare}
                              disabled={!shareUrl}
                            >
                              {shareCopied ? 'copied' : 'copy'}
                            </button>
                            <div
                              className="myportfolio-share-url-display myinv-accent-border"
                              title={shareUrl || undefined}
                            >
                              {shareUrl}
                            </div>
                          </div>
                        </div>

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

        {showBelowPanels && showSignedInPanel ? (
          <div className="myportfolio-portfolio-below-shell myportfolio-stack page-slide-in">
            <div className="myinv-panel-group myportfolio-portfolio-below-panel page-slide-in">
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

            <div className="myinv-panel-group myportfolio-portfolio-below-panel page-slide-in">
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

        {showBelowContent ? (
          <>
            <div className="myinv-about-wrap page-slide-in">
              <Link className="myinv-about-button" href="/about">
                <span className="myinv-about-button-bg" aria-hidden="true" />
                <span className="myinv-about-button-text">about</span>
              </Link>
            </div>

            <SiteSocialFooter variant="accent" />
          </>
        ) : null}
      </div>
    </>
  );
};

export default MyPortfolioPageClient;
