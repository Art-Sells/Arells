'use client';

import React, { useState } from 'react';
import UsdRangeMetric from './UsdRangeMetric';

export type PortfolioLeaderboardRow = {
  email: string;
  maskedLabel: string;
  activeReferralCount: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

const LEADERBOARD_INITIAL_ROWS = 6;

type Props = {
  rows: PortfolioLeaderboardRow[];
};

const PortfolioLeaderboard: React.FC<Props> = ({ rows }) => {
  const [expanded, setExpanded] = useState(false);
  const canExpand = rows.length > LEADERBOARD_INITIAL_ROWS;
  const visibleRows = expanded || !canExpand ? rows : rows.slice(0, LEADERBOARD_INITIAL_ROWS);

  if (rows.length === 0) {
    return <p className="myportfolio-leaderboard-empty">No verified users yet.</p>;
  }

  return (
    <>
      <table className="myportfolio-leaderboard">
        <thead>
          <tr>
            <th>User</th>
            <th>Users Signed-up and Active Weekly</th>
            <th>Weekly Potential Earnings</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.email}>
              <td>{row.maskedLabel}</td>
              <td>
                {row.activeReferralCount === 0
                  ? '--'
                  : row.activeReferralCount.toLocaleString('en-US')}
              </td>
              <td>
                {row.earningsUsdMin === 0 && row.earningsUsdMax === 0 ? (
                  '--'
                ) : (
                  <UsdRangeMetric min={row.earningsUsdMin} max={row.earningsUsdMax} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canExpand ? (
        <button
          type="button"
          className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button myportfolio-leaderboard-show-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'show less' : 'show more'}
        </button>
      ) : null}
    </>
  );
};

export default PortfolioLeaderboard;
