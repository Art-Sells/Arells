'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import UsdRangeMetric from './UsdRangeMetric';
import ReferralNetworkExamplePyramid from './ReferralNetworkExamplePyramid';
import { formatUsdRangeDisplay } from '../../lib/portfolio/formatUsdRange';
import { groupDisplayMaxUsd } from '../../lib/portfolio/referralShares';
import { WEEKLY_UAR_MAX, WEEKLY_UAR_MIN } from '../../lib/portfolio/financialBenefits';
type PortfolioMe = {
  earningsUsdMin: number;
  earningsUsdMax: number;
  projectedEarningsUsdMax: number;
  topReferrerMaxUsd: number;
};

type PublicEarnings = {
  topReferrerMaxUsd: number;
  fallbackProjectionMaxUsd: number;
};

export type MyFinancialBenefitsPageClientProps = {
  /** Renders signed-out layout without signing out (preview route only). */
  guestPreview?: boolean;
};

const MyFinancialBenefitsPageClient: React.FC<MyFinancialBenefitsPageClientProps> = ({
  guestPreview = false,
}) => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [me, setMe] = useState<PortfolioMe | null>(null);
  const [publicEarnings, setPublicEarnings] = useState<PublicEarnings | null>(null);
  const [loadError, setLoadError] = useState(false);

  const showGuestLayout = guestPreview || (!isSignedIn && !authSessionLoading);

  useEffect(() => {
    if (authSessionLoading && !guestPreview) return;
    if (showGuestLayout) {
      setMe(null);
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch('/api/portfolio/public-earnings', { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch failed');
          const json = (await res.json()) as PublicEarnings;
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

    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) throw new Error('fetch failed');
        const meJson = (await meRes.json()) as PortfolioMe;
        if (!cancelled) {
          setMe(meJson);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, authSessionLoading, showGuestLayout, guestPreview]);

  useEffect(() => {
    if (authSessionLoading && !guestPreview) return;
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
      return groupDisplayMaxUsd(me.topReferrerMaxUsd, me.projectedEarningsUsdMax);
    }
    if (publicEarnings) {
      return groupDisplayMaxUsd(
        publicEarnings.topReferrerMaxUsd,
        publicEarnings.fallbackProjectionMaxUsd
      );
    }
    return 0;
  }, [me, publicEarnings]);

  const guestMaxLabel = formatUsdRangeDisplay(groupMaxUsd, groupMaxUsd).max;

  if (authSessionLoading && !guestPreview) {
    return <div className="myinv-page myinv-page--accent myinv-page--portfolio" />;
  }

  if (showGuestLayout) {
    return (
      <div className="myinv-page myinv-page--accent myinv-page--portfolio myinv-page--weekly-guest">
        <div className="myportfolio-mission-block page-slide-in">
          <div className="myportfolio-mission-icon-static" aria-hidden="true">
            <span className="about-icon" />
          </div>
          <p className="myportfolio-mission-tagline">
            on a mission to ensure
            <br />
            investments never lose value
          </p>
        </div>

        {loadError ? (
          <p className="myportfolio-weekly-guest-signin-pitch">Unable to load earnings info. Try again later.</p>
        ) : (
          <p className="myportfolio-weekly-guest-signin-pitch">
            Sign in to learn how you can earn up to{' '}
            <span className="myinv-metric-value">
              <span className="myinv-metric-symbol">$</span>
              <span className="myinv-metric-integer">{guestMaxLabel}</span>
            </span>{' '}
            a week.
          </p>
        )}

        <Link
          href="/signin"
          className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-learn-more myportfolio-weekly-guest-signin-button"
        >
          sign in
        </Link>
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
            {isSignedIn ? (
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
                        {me ? (
                          <UsdRangeMetric min={me.earningsUsdMin} max={groupMaxUsd} />
                        ) : (
                          <UsdRangeMetric min={0} max={0} />
                        )}{' '}
                        from weekly User Advertising Revenue of{' '}
                        <span className="myportfolio-static-revenue-line">
                          <span className="myinv-metric-symbol">$</span>
                          {WEEKLY_UAR_MIN.toLocaleString('en-US')}
                          <span className="myportfolio-usd-range-sep">–</span>
                          <span className="myinv-metric-symbol">$</span>
                          {WEEKLY_UAR_MAX.toLocaleString('en-US')}
                        </span>{' '}
                        based on 100,000~ WAU (Weekly Active Users).
                      </p>
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        This means the more people you sign up and are active, the more you will earn.
                      </p>

                      <div className="myportfolio-referral-network-nested myinv-accent-border">
                        <p className="myportfolio-about-title">How referral levels add up</p>
                        <ReferralNetworkExamplePyramid groupMaxUsd={groupMaxUsd} />
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
