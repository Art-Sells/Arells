'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import { portfolioCopy } from '../../content/portfolioCopy';
import MyPortfolioPageShell from './MyPortfolioPageShell';

type PortfolioMe = {
  shareUrl: string;
  mySharePctLabel: string;
  wau: number;
  usersUntilActivation: number;
};

const MyPortfolioPageClient: React.FC = () => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [data, setData] = useState<PortfolioMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        setData({
          shareUrl: typeof json.shareUrl === 'string' ? json.shareUrl : '',
          mySharePctLabel: typeof json.mySharePctLabel === 'string' ? json.mySharePctLabel : '0%',
          wau: typeof json.wau === 'number' ? json.wau : 0,
          usersUntilActivation: typeof json.usersUntilActivation === 'number' ? json.usersUntilActivation : 0,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const onShare = useCallback(async () => {
    const url = data?.shareUrl;
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNote('Link copied');
      } else {
        window.prompt('Copy your share link:', url);
        setShareNote('Copy the link shown');
      }
    } catch {
      window.prompt('Copy your share link:', url);
      setShareNote('Copy the link shown');
    }
    window.setTimeout(() => setShareNote(null), 2500);
  }, [data?.shareUrl]);

  const formatCount = (n: number) => n.toLocaleString('en-US');

  return (
    <MyPortfolioPageShell
      pageTitle="my portfolio"
      isGuest={!isSignedIn}
      authSessionLoading={authSessionLoading}
    >
      <div className={`myportfolio-stack${loading ? ' myportfolio-stack--loading' : ''}`}>
        <div className="myinv-summary-block myinv-accent-border page-slide-in">
          <div className="myinv-summary-section">
            <div className="myinv-summary-shell">
              <div className="myinv-totals">
                <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                  <span className="myinv-metric-title">{portfolioCopy.benefitsTitle}</span>
                  <span className="myinv-metric-value myportfolio-pct-value">
                    <span className="myinv-metric-integer">{data?.mySharePctLabel ?? '—'}</span>
                  </span>
                </div>
                <p className="metrics-kpi-sublabel metrics-growth-toolbar-tone myportfolio-benefits-sublabel">
                  {portfolioCopy.benefitsSublabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="myinv-panel-group myinv-panel-group--bordered page-slide-in">
          <div className="myinv-panel-section myinv-accent-border">
            <div className="myinv-panel myinv-panel--shell">
              <p className="myportfolio-body-copy">{portfolioCopy.shareLead}</p>
              <button
                type="button"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-share-button"
                onClick={() => void onShare()}
                disabled={!data?.shareUrl}
              >
                {portfolioCopy.shareButton}
              </button>
              {shareNote ? <p className="myportfolio-share-note">{shareNote}</p> : null}
              <div className="myinv-panel-section myinv-accent-border myportfolio-about-nested">
                <div className="myinv-panel myinv-panel--shell">
                  <p className="myportfolio-about-title">{portfolioCopy.aboutTitle}</p>
                  <p className="myportfolio-body-copy">{portfolioCopy.aboutWauGate}</p>
                  <p className="myportfolio-body-copy">{portfolioCopy.aboutRevenueLabel}</p>
                  <p className="myinv-metric-value myportfolio-static-revenue">
                    <span className="myinv-metric-integer">{portfolioCopy.aboutRevenueRange}</span>
                  </p>
                  <Link
                    href="/my-financial-benefits"
                    className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button myportfolio-learn-more"
                  >
                    {portfolioCopy.learnMore}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="myinv-panel-group myinv-panel-group--bordered page-slide-in">
          <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">{portfolioCopy.wauSectionTitle}</div>
          <div className="myinv-panel-section myinv-accent-border">
            <div className="myinv-panel myinv-panel--shell myportfolio-metric-panel">
              <span className="myinv-metric-value myportfolio-count-value">
                <span className="myinv-metric-integer">{formatCount(data?.wau ?? 0)}</span>
              </span>
              <p className="myinv-metric-title myportfolio-metric-label">{portfolioCopy.usersUntilActivationTitle}</p>
              <span className="myinv-metric-value myportfolio-count-value">
                <span className="myinv-metric-integer">{formatCount(data?.usersUntilActivation ?? 0)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="myinv-panel-group myinv-panel-group--bordered page-slide-in">
          <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">{portfolioCopy.addInvestmentsTitle}</div>
          <div className="myinv-panel-section myinv-accent-border">
            <div className="myinv-panel myinv-panel--shell myportfolio-cta-panel">
              <Link
                href="/my-investments"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button"
              >
                {portfolioCopy.viewMyInvestments}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MyPortfolioPageShell>
  );
};

export default MyPortfolioPageClient;
