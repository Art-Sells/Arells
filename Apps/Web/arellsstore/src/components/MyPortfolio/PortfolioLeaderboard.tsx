'use client';

import React, { useEffect, useState } from 'react';
import UsdRangeMetric from './UsdRangeMetric';

export type PortfolioLeaderboardRow = {
  email: string;
  maskedLabel: string;
  engagementScore: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

const LEADERBOARD_INITIAL_ROWS = 6;

type Props = {
  rows: PortfolioLeaderboardRow[];
};

const PortfolioLeaderboard: React.FC<Props> = ({ rows }) => {
  const [visibleCount, setVisibleCount] = useState(LEADERBOARD_INITIAL_ROWS);

  useEffect(() => {
    setVisibleCount(LEADERBOARD_INITIAL_ROWS);
  }, [rows.length]);

  const canPaginate = rows.length > LEADERBOARD_INITIAL_ROWS;
  const visibleRows = canPaginate ? rows.slice(0, visibleCount) : rows;
  const hasMore = visibleCount < rows.length;

  if (rows.length === 0) {
    return <p className="myportfolio-leaderboard-empty">No verified users yet.</p>;
  }

  return (
    <>
      <table className="myportfolio-leaderboard">
        <thead>
          <tr>
            <th>User</th>
            <th>Weekly Projected Earnings</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.email}>
              <td>{row.maskedLabel}</td>
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
      {canPaginate ? (
        <button
          type="button"
          className="asset-range-button myinv-range-button about-cta-button myportfolio-leaderboard-show-more"
          onClick={() => {
            if (hasMore) {
              setVisibleCount((count) =>
                Math.min(count + LEADERBOARD_INITIAL_ROWS, rows.length)
              );
            } else {
              setVisibleCount(LEADERBOARD_INITIAL_ROWS);
            }
          }}
        >
          {hasMore ? 'show more' : 'show less'}
        </button>
      ) : null}
    </>
  );
};

export default PortfolioLeaderboard;
