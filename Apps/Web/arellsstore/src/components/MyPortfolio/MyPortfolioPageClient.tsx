'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import HomeAboutMountLoader from '../HomeAboutMountLoader';
import UsdRangeMetric from './UsdRangeMetric';
import PortfolioUsdAmount from './PortfolioUsdAmount';
import MyAssetsUpdates from './MyAssetsUpdates';
import PortfolioQuestionsSupport from './PortfolioQuestionsSupport';
import PortfolioWeeklyGuestPageView from './PortfolioWeeklyGuestPageView';
import { usePublicEarningsGuestPitch } from './usePublicEarningsGuestPitch';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { USERS_POOL_WEEKLY_MAX } from '../../lib/portfolio/financialBenefits';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';

export type MyPortfolioPageClientProps = {
  /** Renders signed-out layout without signing out (preview route only). */
  guestPreview?: boolean;
  initialPortfolioMe?: PortfolioMePayload | null;
  /** SSR public earnings for guest pitch (skips client wait when present). */
  initialPublicEarnings?: PublicEarningsPayload | null;
};

const MyPortfolioPageClient: React.FC<MyPortfolioPageClientProps> = ({
  guestPreview = false,
  initialPortfolioMe = null,
  initialPublicEarnings = null,
}) => {
  const router = useRouter();
  const { isSignedIn, authSessionLoading, emailInvestments } = useUser();
  const hasInvestments = emailInvestments.length > 0;
  const showGuestLayout =
    guestPreview || (!authSessionLoading && !isSignedIn && !initialPortfolioMe);
  const showSignedInPanel = isSignedIn || !!initialPortfolioMe;
  const [slideIn, setSlideIn] = useState(false);
  const [data, setData] = useState<PortfolioMePayload | null>(initialPortfolioMe);
  const [loadError, setLoadError] = useState(false);
  const { guestMaxLabel, loadError: guestPitchLoadError } =
    usePublicEarningsGuestPitch(showGuestLayout, initialPublicEarnings);

  useEffect(() => {
    if (showGuestLayout) {
      setData(null);
      return;
    }

    if (guestPreview || !showSignedInPanel) {
      return;
    }
    if (data) return;

    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) throw new Error('fetch failed');
        const json = (await meRes.json()) as PortfolioMePayload;
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
  }, [showGuestLayout, showSignedInPanel, guestPreview, data]);

  useEffect(() => {
    if (showGuestLayout) return;
    setSlideIn(true);
  }, [showGuestLayout, isSignedIn, data]);

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

  const portfolioMetricsReady = !!data && !loadError;

  const interactEarnUpToLabel = formatUsdRangeDisplay(
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
      <HomeAboutMountLoader fadeStartMs={400} hideMs={900} />
      <div className="myinv-page myinv-page--accent myinv-page--portfolio">
        <div className="myportfolio-mission-block">
          <Link
            href="/"
            className="asset-action-button about-icon-button myportfolio-mission-icon-button myportfolio-mission-icon-sticky"
            aria-label="Arells"
          >
            <span className="about-icon" aria-hidden="true" />
          </Link>
          <span className="myportfolio-mission-icon-spacer" aria-hidden="true" />
          <p className="myportfolio-mission-tagline page-slide-in">
            on a mission to ensure
            <br />
            your investments never lose value
          </p>
        </div>

        <div className="myinv-shell shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div className="myportfolio-shell-body myportfolio-stack">
              {showSignedInPanel ? (
                <>
                  {loadError ? (
                    <p className="myportfolio-body-copy">Unable to load portfolio. Try again later.</p>
                  ) : null}

                  <div className={`myinv-summary-block myinv-accent-border myportfolio-metric-panel${slideIn ? ' page-slide-in-no-opacity' : ''}`}>
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

                  <div className="myinv-panel-group myinv-panel-group--bordered myportfolio-portfolio-share-group">
                    <div className="myinv-panel-section myinv-accent-border">
                      <div className="myinv-panel myinv-panel--shell myportfolio-share-panel">
                        <div className="myportfolio-share-copy-nested myinv-accent-border">
                          <p className="myportfolio-share-invite-copy">
                            <span className="myportfolio-share-invite-line-one">
                              <span className="myportfolio-share-invite-signup">
                                Build your portfolio
                              </span>{' '}
                              <span className="myportfolio-share-invite-lead-range">
                                <span className="myportfolio-share-invite-lead">to earn up to</span>{' '}
                                {!loadError ? (
                                  <PortfolioUsdAmount
                                    amount={interactEarnUpToLabel}
                                    loading={false}
                                    className="myportfolio-inline-usd"
                                  />
                                ) : null}
                              </span>
                            </span>{' '}
                            <span className="myportfolio-share-invite-tail">
                              a week by engaging with your investments.
                            </span>
                          </p>
                          <div className="myinv-panel-section myportfolio-cta-panel">
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

        {showSignedInPanel ? (
          <>
          <div className="myportfolio-portfolio-below-shell myportfolio-stack">
            <div className="myinv-panel-group myportfolio-portfolio-below-panel">
              <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">
                {hasInvestments ? 'My Investment Updates' : 'Investment Updates'}
              </div>
              <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
                <span className="shadow-border" aria-hidden="true" />
                <div className="myinv-panel-section myinv-accent-border myportfolio-metric-panel">
                  <div className="myinv-panel myinv-panel--shell">
                    <MyAssetsUpdates />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="myportfolio-portfolio-below-shell myportfolio-stack">
            <div className="myinv-panel-group myportfolio-portfolio-below-panel">
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
          </div>

          <div className="myportfolio-questions-support-shell">
            <div className="site-social-footer-rule myportfolio-questions-support-rule" aria-hidden="true" />
            <PortfolioQuestionsSupport />
          </div>

          <div className="myinv-about-wrap">
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
