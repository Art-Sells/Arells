'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter, { SOCIAL_TELEGRAM } from '../SiteSocialFooter';
import UsdRangeMetric from './UsdRangeMetric';
import ReferralNetworkExamplePyramid from './ReferralNetworkExamplePyramid';
import PortfolioWeeklyGuestPageView from './PortfolioWeeklyGuestPageView';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { groupDisplayMaxUsd } from '../../lib/portfolio/referralShares';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';
import { USERS_POOL_WEEKLY_MAX, USERS_POOL_WEEKLY_MIN, WAU_ACTIVATION_TARGET } from '../../lib/portfolio/financialBenefits';

type PortfolioMe = Pick<
  PortfolioMePayload,
  | 'earningsUsdMin'
  | 'earningsUsdMax'
  | 'projectedEarningsUsdMin'
  | 'projectedEarningsUsdMax'
  | 'topReferrerMaxUsd'
  | 'referralPyramid'
>;

export type EarnMoneyWeeklyPageClientProps = {
  /** Renders signed-out layout without signing out (preview route only). */
  guestPreview?: boolean;
  /** SSR public earnings for guest pitch (skips client wait when present). */
  initialPublicEarnings?: PublicEarningsPayload | null;
  /** SSR portfolio me for signed-in layout (skips client wait when present). */
  initialPortfolioMe?: PortfolioMePayload | null;
};

const toWeeklyMe = (payload: PortfolioMePayload | null): PortfolioMe | null => {
  if (!payload) return null;
  return {
    earningsUsdMin: payload.earningsUsdMin,
    earningsUsdMax: payload.earningsUsdMax,
    projectedEarningsUsdMin: payload.projectedEarningsUsdMin,
    projectedEarningsUsdMax: payload.projectedEarningsUsdMax,
    topReferrerMaxUsd: payload.topReferrerMaxUsd,
    referralPyramid: payload.referralPyramid,
  };
};

const EarnMoneyWeeklyPageClient: React.FC<EarnMoneyWeeklyPageClientProps> = ({
  guestPreview = false,
  initialPublicEarnings = null,
  initialPortfolioMe = null,
}) => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [me, setMe] = useState<PortfolioMe | null>(() => toWeeklyMe(initialPortfolioMe));
  const [publicEarnings, setPublicEarnings] = useState<PublicEarningsPayload | null>(
    initialPublicEarnings
  );
  const [loadError, setLoadError] = useState(false);

  const showGuestLayout = guestPreview || (!isSignedIn && !initialPortfolioMe);
  const showSignedInPanel = isSignedIn || !!initialPortfolioMe;

  useEffect(() => {
    if (showGuestLayout) {
      setMe(null);
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

    if (me) return;
    if (authSessionLoading) return;

    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) throw new Error('fetch failed');
        const meJson = (await meRes.json()) as PortfolioMePayload;
        if (!cancelled) {
          setMe(toWeeklyMe(meJson));
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showGuestLayout, authSessionLoading, publicEarnings, me]);

  useEffect(() => {
    if (!showSignedInPanel && authSessionLoading) return;
    if (showGuestLayout) {
      setOpen(true);
      return;
    }
    setOpen(false);
    const raf = window.requestAnimationFrame(() => {
      const h = wrapperRef.current?.scrollHeight ?? 0;
      setShellMaxHeight(Math.max(0, h + 24));
      window.requestAnimationFrame(() => setOpen(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isSignedIn, me, authSessionLoading, showGuestLayout, guestPreview]);

  useLayoutEffect(() => {
    if (showGuestLayout) return;
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setShellMaxHeight(Math.max(0, node.scrollHeight + 24));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [me, isSignedIn, showGuestLayout, guestPreview]);

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

  const groupMaxUsd = useMemo(() => {
    if (me) {
      const projectionMax = me.projectedEarningsUsdMax > 0 ? me.projectedEarningsUsdMax : USERS_POOL_WEEKLY_MAX;
      return groupDisplayMaxUsd(me.topReferrerMaxUsd, projectionMax);
    }
    if (publicEarnings) {
      return groupDisplayMaxUsd(
        publicEarnings.topReferrerMaxUsd,
        publicEarnings.fallbackProjectionMaxUsd
      );
    }
    return 0;
  }, [me, publicEarnings]);

  /** Personal min when set; else 2-friend projection; else one-referral floor — never $0 on this line. */
  const explainerMinUsd = useMemo(() => {
    if (!me) return 0;
    if (me.earningsUsdMin > 0) return me.earningsUsdMin;
    if (me.projectedEarningsUsdMin > 0) return me.projectedEarningsUsdMin;
    return USERS_POOL_WEEKLY_MIN / WAU_ACTIVATION_TARGET;
  }, [me]);

  const guestMaxLabel = formatUsdRangeDisplay(groupMaxUsd, groupMaxUsd).max;

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
    <div className="myinv-page myinv-page--accent myinv-page--portfolio myinv-page--earn-weekly">
      <div className="myinv-header-inner myinv-header-inner--liquid-forever is-liquid page-slide-in">
        <div className="myinv-title">my weekly earnings</div>
      </div>
      <div className="myinv-slogan-layer" aria-hidden="true" />

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
                  <p className="myportfolio-body-copy">Unable to load weekly earnings. Try again later.</p>
                ) : null}

                <div className={`myinv-summary-block myinv-accent-border myportfolio-explainer${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-summary-section">
                    <div className="myinv-summary-shell">
                      <div className="myportfolio-weekly-uara-intro-nested myinv-accent-border">
                        <div className="myportfolio-weekly-uara-intro-copy">
                          <p className="myportfolio-body-copy myportfolio-weekly-uara-earnings-copy">
                            <span className="myportfolio-weekly-uara-earnings-lead-group">
                              <span className="myportfolio-weekly-uara-earnings-refer-lead">
                                If you refer 2 (or more) users,
                              </span>
                              <span className="myportfolio-weekly-uara-earnings-projected-lead">
                                {' '}
                                you are projected to earn{' '}
                              </span>
                            </span>
                            {!loadError ? (
                              <span className="myportfolio-weekly-uara-earnings-range">
                                <UsdRangeMetric
                                  min={me ? explainerMinUsd : 0}
                                  max={me ? groupMaxUsd : 0}
                                  loading={!me}
                                />
                              </span>
                            ) : null}
                            <span className="myportfolio-weekly-uara-earnings-after-range">
                              <span className="myportfolio-weekly-uara-earnings-week-based">
                                <span className="myportfolio-weekly-uara-earnings-week">
                                  {' '}
                                  a week
                                </span>
                                <span className="myportfolio-weekly-uara-earnings-based-on">
                                  {' '}
                                  based on
                                </span>
                              </span>
                              <span className="myportfolio-weekly-uara-earnings-tail-wau">
                                {' '}
                                100,000~ WAU
                              </span>
                              <span className="myportfolio-weekly-uara-earnings-tail-label">
                                {' '}
                                (Weekly Active Users).
                              </span>
                            </span>
                          </p>
                        </div>
                      </div>

                      {me?.referralPyramid ? (
                        <div className="myportfolio-referral-network-nested myinv-accent-border">
                          <ReferralNetworkExamplePyramid
                            pyramid={me.referralPyramid}
                            groupMaxUsd={groupMaxUsd}
                          />
                        </div>
                      ) : null}

                      <div className="myportfolio-referral-network-nested myinv-accent-border myportfolio-telegram-support">
                        <div className="myportfolio-telegram-support-copy">
                          <p className="myportfolio-telegram-support-copy-lead">Questions/Concerns?</p>
                          <p className="myportfolio-telegram-support-copy-text">Message us on Telegram:</p>
                          <a
                            href={SOCIAL_TELEGRAM}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="site-social-footer-link site-social-footer-link--accent"
                            aria-label="Message Arells on Telegram"
                          >
                            <span className="site-social-footer-icon site-social-footer-icon--telegram" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`myinv-summary-block myinv-accent-border myportfolio-cta-panel myportfolio-weekly-back-panel${slideIn ? ' page-slide-in' : ''}`}>
                  <Link
                    href="/my-portfolio"
                    className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-weekly-back-button"
                  >
                    back to my portfolio
                  </Link>
                </div>

                <div className={`myportfolio-weekly-uara-revenue-panel shadow-border-wrap${slideIn ? ' page-slide-in' : ''}`}>
                  <span className="shadow-border" aria-hidden="true" />
                  <div className="myinv-accent-border myportfolio-weekly-uara-revenue-inner">
                    <div className="myportfolio-weekly-uara-intro-copy">
                      <p className="myportfolio-body-copy myportfolio-weekly-uara-revenue-copy">
                        <span className="myportfolio-weekly-uara-revenue-lead">
                          Your weekly earnings will be derived from the 65% of advertising revenue
                        </span>
                        <span className="myportfolio-weekly-uara-revenue-tail">
                          {' '}
                          (User Ad Revenue (UAR)) Arells generates, Arells will keep 35%.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="myinv-about-wrap">
        <Link className="myinv-about-button" href="/about">
          <span className="myinv-about-button-bg" aria-hidden="true" />
          <span className="myinv-about-button-text">about</span>
        </Link>
      </div>

      <SiteSocialFooter variant="accent" />
    </div>
  );
};

export default EarnMoneyWeeklyPageClient;
