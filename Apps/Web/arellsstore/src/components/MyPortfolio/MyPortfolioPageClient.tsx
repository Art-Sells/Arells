'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { WEEKLY_USERS_POOL_USD } from '../../lib/portfolio/financialBenefits';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';

/** Plain site link for the share row (not a referral link). */
const PORTFOLIO_SHARE_URL = 'https://arells.com';
const PAYOUTS_MODAL_FADE_MS = 500;

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
  const { isSignedIn, authSessionLoading, emailInvestments, emailInvestmentsReady } = useUser();
  // Holdings are not in the portfolio earnings SSR snapshot — they load via UserContext.
  // Wait for auth + aggregator so we don't flash empty-portfolio title/layout.
  const holdingsPending =
    authSessionLoading ||
    ((!!initialPortfolioMe || isSignedIn) && !emailInvestmentsReady);
  const hasInvestments = emailInvestments.length > 0;
  const showGuestLayout =
    guestPreview || (!authSessionLoading && !isSignedIn && !initialPortfolioMe);
  const showSignedInPanel = isSignedIn || !!initialPortfolioMe;
  const [slideIn, setSlideIn] = useState(false);
  const [data, setData] = useState<PortfolioMePayload | null>(initialPortfolioMe);
  const [loadError, setLoadError] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  /** null = not loaded yet; false = should show Stripe payouts intro modal. */
  const [payoutsMessageChecked, setPayoutsMessageChecked] = useState<boolean | null>(null);
  const [payoutsModalMounted, setPayoutsModalMounted] = useState(false);
  const [payoutsModalVisible, setPayoutsModalVisible] = useState(false);
  const [payoutsAckSaving, setPayoutsAckSaving] = useState(false);
  const shareResetRef = useRef<number | null>(null);
  const payoutsFadeTimerRef = useRef<number | null>(null);
  const { guestMaxLabel, loadError: guestPitchLoadError } =
    usePublicEarningsGuestPitch(showGuestLayout, initialPublicEarnings);

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      if (payoutsFadeTimerRef.current !== null) {
        window.clearTimeout(payoutsFadeTimerRef.current);
      }
    };
  }, []);

  const onCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_SHARE_URL);
      setShareCopied(true);
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      shareResetRef.current = window.setTimeout(() => {
        setShareCopied(false);
        shareResetRef.current = null;
      }, 3000);
    } catch {
      // Clipboard unavailable — button label unchanged.
    }
  }, []);

  const onAcknowledgePayoutsMessage = useCallback(() => {
    if (payoutsAckSaving || !payoutsModalVisible) return;
    setPayoutsAckSaving(true);
    setPayoutsModalVisible(false);

    void fetch('/api/user/prefs', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutsMessageChecked: true }),
    }).catch(() => {
      // Keep dismissed locally; next visit will re-check S3 if write failed.
    });

    if (payoutsFadeTimerRef.current !== null) {
      window.clearTimeout(payoutsFadeTimerRef.current);
    }
    payoutsFadeTimerRef.current = window.setTimeout(() => {
      setPayoutsMessageChecked(true);
      setPayoutsModalMounted(false);
      setPayoutsAckSaving(false);
      payoutsFadeTimerRef.current = null;
    }, PAYOUTS_MODAL_FADE_MS);
  }, [payoutsAckSaving, payoutsModalVisible]);

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
    if (guestPreview || showGuestLayout || !showSignedInPanel) {
      setPayoutsMessageChecked(null);
      setPayoutsModalMounted(false);
      setPayoutsModalVisible(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/prefs', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('prefs fetch failed');
        const json = (await res.json()) as { payoutsMessageChecked?: boolean };
        if (!cancelled) {
          setPayoutsMessageChecked(json.payoutsMessageChecked === true);
        }
      } catch {
        // Leave null — don't block the page or flash the modal on a failed prefs read.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guestPreview, showGuestLayout, showSignedInPanel]);

  useEffect(() => {
    if (payoutsMessageChecked !== false) return;
    setPayoutsModalMounted(true);
  }, [payoutsMessageChecked]);

  useEffect(() => {
    if (!payoutsModalMounted || payoutsMessageChecked !== false) return;
    let rafOuter = 0;
    let rafInner = 0;
    rafOuter = window.requestAnimationFrame(() => {
      rafInner = window.requestAnimationFrame(() => {
        setPayoutsModalVisible(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(rafOuter);
      window.cancelAnimationFrame(rafInner);
    };
  }, [payoutsModalMounted, payoutsMessageChecked]);

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
    WEEKLY_USERS_POOL_USD,
    WEEKLY_USERS_POOL_USD
  ).max;

  if (showGuestLayout) {
    return (
      <PortfolioWeeklyGuestPageView
        guestMaxLabel={guestMaxLabel}
        loadError={guestPitchLoadError}
      />
    );
  }

  const showPayoutsMessageModal =
    showSignedInPanel && !guestPreview && payoutsModalMounted;

  return (
    <>
      <HomeAboutMountLoader fadeStartMs={400} hideMs={900} />
      {showPayoutsMessageModal ? (
        <div
          className={`myportfolio-payouts-overlay${payoutsModalVisible ? ' is-visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="myportfolio-payouts-message-title"
        >
          <div className="myportfolio-payouts-modal-wrap shadow-border-wrap">
            <span className="shadow-border" aria-hidden="true" />
            <div className="myportfolio-payouts-modal myinv-accent-border">
              <span className="myportfolio-payouts-arells-icon" aria-hidden="true" />
              <p
                id="myportfolio-payouts-message-title"
                className="myportfolio-payouts-message myportfolio-text-chunks myportfolio-text-chunks--stack"
              >
                <span>We&apos;ll be sending you</span>
                <span>an e-mail to connect</span>
                <span>your Stripe account</span>
                <span>to get payments</span>
                <span>from Arells soon.</span>
              </p>
              <span
                className="site-social-footer-rule myportfolio-payouts-divider"
                aria-hidden="true"
              />
              <p className="myportfolio-payouts-spam-note myportfolio-text-chunks myportfolio-text-chunks--stack">
                <span>Check your</span>
                <span className="myportfolio-payouts-spam-emphasis">spam/junk</span>
                <span>folder in the</span>
                <span>next few</span>
                <span>days/weeks</span>
                <span>in case you</span>
                <span>don&apos;t receive it</span>
                <span>in your inbox.</span>
              </p>
              <button
                type="button"
                className="auth-submit auth-submit--accent asset-range-button myportfolio-payouts-ok"
                onClick={onAcknowledgePayoutsMessage}
                disabled={payoutsAckSaving}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
          <span className="myportfolio-mission-tagline page-slide-in">
            on a mission to ensure
            <br />
            your investments never lose value
          </span>
        </div>

        <div className="myinv-shell shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div className="myportfolio-shell-body myportfolio-stack">
              {showSignedInPanel ? (
                <>
                  {loadError ? (
                    <span className="myportfolio-body-copy">Unable to load portfolio. Try again later.</span>
                  ) : null}

                  <div className={`myinv-summary-block myinv-accent-border myportfolio-metric-panel${slideIn ? ' page-slide-in-no-opacity' : ''}`}>
                    <div className="myinv-summary-section">
                      <div className="myinv-summary-shell">
                        <span className="myportfolio-about-title">My Weekly Projected Earnings</span>
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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="myinv-panel-group myinv-panel-group--bordered myportfolio-portfolio-share-group">
                    <div className="myinv-panel-section myinv-accent-border">
                      <div className="myinv-panel myinv-panel--shell myportfolio-share-panel">
                        <div className="myportfolio-share-copy-nested myinv-accent-border">
                          <span className="myportfolio-share-invite-copy myportfolio-text-chunks">
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
                            </span>
                            <span className="myportfolio-share-invite-tail">
                              a week by engaging with your investments
                            </span>
                            <span className="myportfolio-share-invite-tail">
                              and investment updates.
                            </span>
                          </span>
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
                {holdingsPending || hasInvestments
                  ? 'My Investment Updates'
                  : 'Investment Updates'}
              </div>
              <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
                <span className="shadow-border" aria-hidden="true" />
                <div className="myinv-panel-section myinv-accent-border myportfolio-metric-panel">
                  <div className="myinv-panel myinv-panel--shell">
                    <MyAssetsUpdates holdingsPending={holdingsPending} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="myportfolio-portfolio-below-shell myportfolio-stack">
            <div className="myinv-panel-group myportfolio-portfolio-below-panel">
              <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">
                Help others join our mission
              </div>
              <div className="myportfolio-portfolio-below-panel-wrap shadow-border-wrap">
                <span className="shadow-border" aria-hidden="true" />
                <div className="myinv-panel-section myinv-accent-border myportfolio-metric-panel">
                  <div className="myinv-panel myinv-panel--shell">
                    <div className="myportfolio-wau-share-nested myinv-accent-border">
                      <div className="myportfolio-share-copy-row">
                        <button
                          type="button"
                          className="auth-submit auth-submit--accent asset-range-button myportfolio-share-copy-button"
                          onClick={onCopyShareUrl}
                        >
                          {shareCopied ? 'copied' : 'copy'}
                        </button>
                        <div className="myportfolio-share-url-display myinv-accent-border" title={PORTFOLIO_SHARE_URL}>
                          {PORTFOLIO_SHARE_URL}
                        </div>
                      </div>
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
