'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter, { SOCIAL_TELEGRAM } from '../SiteSocialFooter';
import GuestLandingCopyright from '../GuestLandingCopyright';
import PortfolioUsdAmount from './PortfolioUsdAmount';
import UsdRangeMetric from './UsdRangeMetric';
import ReferralNetworkExamplePyramid from './ReferralNetworkExamplePyramid';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { groupDisplayMaxUsd } from '../../lib/portfolio/referralShares';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';
import type { PortfolioMePayload } from '../../lib/portfolio/fetchPortfolioDataServer';
import { USERS_POOL_WEEKLY_MAX, USERS_POOL_WEEKLY_MIN, WAU_ACTIVATION_TARGET } from '../../lib/portfolio/financialBenefits';
import type { ReferralPyramidSnapshot } from '../../lib/portfolio/referralShares';
import {
  PORTFOLIO_METRIC_FADE_FAST,
  PORTFOLIO_METRIC_REVEAL_FAST,
} from './usePortfolioMetricReveal';

type PortfolioMe = Pick<
  PortfolioMePayload,
  | 'earningsUsdMin'
  | 'earningsUsdMax'
  | 'projectedEarningsUsdMin'
  | 'projectedEarningsUsdMax'
  | 'topReferrerMaxUsd'
  | 'referralPyramid'
>;

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

export type MyFinancialBenefitsPageClientProps = {
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

const MyFinancialBenefitsPageClient: React.FC<MyFinancialBenefitsPageClientProps> = ({
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
      <div className="myinv-page myinv-page--accent myinv-page--portfolio myinv-page--weekly-guest">
        <div className="home-guest-landing">
          <div className="home-guest-landing-stack">
            <span className="home-guest-icon-wrap home-guest-mount-slide home-guest-mount-slide--icon" aria-hidden="true">
              <span className="home-guest-icon-tint" aria-hidden="true" />
              <Image
                loader={imageLoader}
                alt=""
                width={60}
                height={60}
                className="home-guest-icon-img"
                src="images/Arells-Icon.png"
                priority
              />
            </span>
            <p className="home-guest-slogan myportfolio-weekly-guest-pitch home-guest-mount-slide home-guest-mount-slide--logo">
              {loadError ? (
                <>Unable to load earnings info. Try again later.</>
              ) : (
                <span className="myportfolio-weekly-guest-pitch-earn">
                  <span className="myportfolio-weekly-guest-pitch-earn-accent">earn</span>
                  <br />
                  up to{' '}
                  <PortfolioUsdAmount
                    amount={guestMaxLabel}
                    loading={!publicEarnings}
                    className="myportfolio-weekly-guest-usd-amount"
                    symbolClassName="myinv-metric-symbol myportfolio-weekly-guest-dollar"
                    fadeClassName={PORTFOLIO_METRIC_FADE_FAST}
                    revealTiming={PORTFOLIO_METRIC_REVEAL_FAST}
                  />{' '}
                  a week
                </span>
              )}
            </p>
            <div className="home-guest-signin-shell shadow-border-wrap home-guest-mount-slide home-guest-mount-slide--slogan">
              <span className="shadow-border" aria-hidden="true" />
              <div className="home-guest-signin-panel myinv-accent-border">
                <div className="home-guest-signin-inner">
                  <p className="home-guest-signin-lead">Sign In to learn more</p>
                  <Link
                    href="/signin"
                    className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
            <p className="home-guest-slogan myportfolio-weekly-guest-mission home-guest-mount-slide home-guest-mount-slide--signin">
              on a mission to ensure investments
              <br />
              never lose value
            </p>
            <GuestLandingCopyright
              variant="home"
              className="myportfolio-weekly-guest-copyright home-guest-mount-slide home-guest-mount-slide--copyright"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="myinv-page myinv-page--accent myinv-page--portfolio">
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
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        Your weekly earnings will be derived from the 65% of advertising revenue (User Ad Revenue
                        (UAR)) Arells generates, Arells will keep 35%.
                      </p>
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        Out of the 65%, you currently will get{' '}
                        {!loadError ? (
                          <UsdRangeMetric
                            min={me ? explainerMinUsd : 0}
                            max={me ? groupMaxUsd : 0}
                            loading={!me}
                          />
                        ) : null}{' '}
                        from weekly User Advertising based on 100,000~ WAU (Weekly Active Users).
                      </p>

                      {me?.referralPyramid ? (
                        <div className="myportfolio-referral-network-nested myinv-accent-border">
                          <p className="myportfolio-about-title">How referral levels add up</p>
                          <ReferralNetworkExamplePyramid
                            pyramid={me.referralPyramid}
                            groupMaxUsd={groupMaxUsd}
                          />
                        </div>
                      ) : null}

                      <div className="myportfolio-referral-network-nested myinv-accent-border myportfolio-telegram-support">
                        <p className="myportfolio-telegram-support-copy">
                          Questions/Concerns? Message us on Telegram:{' '}
                          <a
                            href={SOCIAL_TELEGRAM}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="myportfolio-telegram-support-link"
                            aria-label="Message Arells on Telegram"
                          >
                            <span className="myportfolio-telegram-support-icon" aria-hidden="true" />
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`myinv-panel-group myinv-panel-group--bordered${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-section myinv-accent-border myportfolio-cta-panel">
                    <Link
                      href="/my-portfolio"
                      className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button"
                    >
                      back to my portfolio
                    </Link>
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

export default MyFinancialBenefitsPageClient;
