'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import SiteSocialFooter from '../SiteSocialFooter';
import UsdRangeMetric from './UsdRangeMetric';
import { WEEKLY_UAR_MAX, WEEKLY_UAR_MIN } from '../../lib/portfolio/financialBenefits';

type PortfolioMe = {
  earningsUsdMin: number;
  earningsUsdMax: number;
};

type LeaderboardRow = {
  obfuscatedEmail: string;
  activeReferralCount: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

const MyFinancialBenefitsPageClient: React.FC = () => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);
  const [me, setMe] = useState<PortfolioMe | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setMe(null);
      setRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/portfolio/leaderboard', { credentials: 'include', cache: 'no-store' }),
        ]);
        if (!meRes.ok || !lbRes.ok) throw new Error('fetch failed');
        const meJson = (await meRes.json()) as PortfolioMe;
        const lbJson = (await lbRes.json()) as { rows: LeaderboardRow[] };
        if (!cancelled) {
          setMe(meJson);
          setRows(Array.isArray(lbJson.rows) ? lbJson.rows : []);
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
  }, [isSignedIn, me, rows]);

  useLayoutEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setShellMaxHeight(Math.max(0, node.scrollHeight + 24));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [me, rows, isSignedIn]);

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

  return (
    <div className="myinv-page myinv-page--accent myinv-page--portfolio">
      <div className="myinv-header-inner myinv-header-inner--liquid-forever is-liquid page-slide-in">
        <div className="myinv-title">my financial benefits</div>
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
                  <p className="myportfolio-body-copy">Unable to load financial benefits. Try again later.</p>
                ) : null}

                <div className={`myinv-summary-block myinv-accent-border myportfolio-explainer${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-summary-section">
                    <div className="myinv-summary-shell">
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        Your Financial Benefits will be derived from the 65% of advertising revenue (User Ad
                        Revenue (UAR)) Arells generates, Arells will keep 35%.
                      </p>
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        Out of the 65%, you currently will get{' '}
                        {me ? <UsdRangeMetric min={me.earningsUsdMin} max={me.earningsUsdMax} /> : <UsdRangeMetric min={0} max={0} />}{' '}
                        from weekly User Advertising Revenue of{' '}
                        <span className="myportfolio-static-revenue-line">
                          <span className="myinv-metric-symbol">$</span>
                          {WEEKLY_UAR_MIN.toLocaleString('en-US')}
                          <span>–</span>
                          <span className="myinv-metric-symbol">$</span>
                          {WEEKLY_UAR_MAX.toLocaleString('en-US')}
                        </span>{' '}
                        based on 100,000~ WAU (Weekly Active Users).
                      </p>
                      <p className="myportfolio-body-copy" style={{ textAlign: 'left' }}>
                        This means the more people you sign up and are active, the more advertising revenue you
                        receive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`myinv-panel-group myinv-panel-group--bordered${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Leaderboard</div>
                  <div className="myinv-panel-section myinv-accent-border">
                    <div className="myinv-panel myinv-panel--shell myportfolio-leaderboard-wrap">
                      {rows.length === 0 ? (
                        <p className="myportfolio-leaderboard-empty">No referral activity yet.</p>
                      ) : (
                        <table className="myportfolio-leaderboard">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Users Signed-up and Active Weekly</th>
                              <th>Weekly Potential Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.obfuscatedEmail}>
                                <td>{row.obfuscatedEmail}</td>
                                <td>{row.activeReferralCount.toLocaleString('en-US')}</td>
                                <td>
                                  <UsdRangeMetric min={row.earningsUsdMin} max={row.earningsUsdMax} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
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

      <SiteSocialFooter variant="accent" />
    </div>
  );
};

export default MyFinancialBenefitsPageClient;
