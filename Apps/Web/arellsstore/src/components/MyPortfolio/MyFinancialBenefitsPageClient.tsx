'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { financialBenefitsCopy, portfolioCopy } from '../../content/portfolioCopy';
import MyPortfolioPageShell from './MyPortfolioPageShell';

type LeaderboardRow = {
  obfuscatedEmail: string;
  activeReferrals: number;
  sharePctLabel: string;
};

const MyFinancialBenefitsPageClient: React.FC = () => {
  const { isSignedIn, authSessionLoading } = useUser();
  const [sharePctLabel, setSharePctLabel] = useState('0%');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch('/api/portfolio/me', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/portfolio/leaderboard', { credentials: 'include', cache: 'no-store' }),
        ]);
        const me = await meRes.json().catch(() => ({}));
        const lb = await lbRes.json().catch(() => ({}));
        if (cancelled) return;
        if (meRes.ok && typeof me.mySharePctLabel === 'string') {
          setSharePctLabel(me.mySharePctLabel);
        }
        if (lbRes.ok && Array.isArray(lb.rows)) {
          setRows(
            lb.rows.map((r: LeaderboardRow) => ({
              obfuscatedEmail: String(r.obfuscatedEmail ?? ''),
              activeReferrals: Number(r.activeReferrals) || 0,
              sharePctLabel: typeof r.sharePctLabel === 'string' ? r.sharePctLabel : '0%',
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return (
    <MyPortfolioPageShell
      pageTitle="my financial benefits"
      isGuest={!isSignedIn}
      authSessionLoading={authSessionLoading}
    >
      <div className={`myportfolio-stack${loading ? ' myportfolio-stack--loading' : ''}`}>
        <div className="myinv-summary-block myinv-accent-border page-slide-in">
          <div className="myinv-panel-section myinv-accent-border">
            <div className="myinv-panel myinv-panel--shell myportfolio-explainer">
              <p className="myportfolio-body-copy">{financialBenefitsCopy.uarExplainer}</p>
              <p className="myportfolio-body-copy">{financialBenefitsCopy.uarPoolLine(sharePctLabel)}</p>
              <p className="myportfolio-body-copy myportfolio-static-revenue-line">{financialBenefitsCopy.uarBandLine}</p>
              <p className="myportfolio-body-copy">{financialBenefitsCopy.activeReferralLead}</p>
            </div>
          </div>
        </div>

        <div className="myinv-panel-group myinv-panel-group--bordered page-slide-in">
          <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">
            {financialBenefitsCopy.leaderboardTitle}
          </div>
          <div className="myinv-panel-section myinv-accent-border">
            <div className="myinv-panel myinv-panel--shell myportfolio-leaderboard-wrap">
              <table className="myportfolio-leaderboard">
                <thead>
                  <tr>
                    <th>{financialBenefitsCopy.leaderboardColUser}</th>
                    <th>{financialBenefitsCopy.leaderboardColActive}</th>
                    <th>{financialBenefitsCopy.leaderboardColPct}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="myportfolio-leaderboard-empty">
                        No referrers yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={`${row.obfuscatedEmail}-${idx}`}>
                        <td>
                          {idx + 1}. {row.obfuscatedEmail}
                        </td>
                        <td>{row.activeReferrals.toLocaleString('en-US')}</td>
                        <td>{row.sharePctLabel}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </MyPortfolioPageShell>
  );
};

export default MyFinancialBenefitsPageClient;
