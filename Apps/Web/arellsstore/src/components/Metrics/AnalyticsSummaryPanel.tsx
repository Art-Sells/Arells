'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Summary = {
  generatedAt: number;
  humanThresholdMs: number;
  totalSessions: number;
  uniqueIps: number;
  signedInSessions: number;
  humanLikelyCount: number;
  botLikelyCount: number;
  avgDurationMs: number;
  byFirstSeenDay: Record<string, number>;
  recentSessions: Array<{
    sessionId: string;
    firstSeenAt: number;
    lastSeenAt: number;
    durationMs: number;
    humanLikely: boolean;
    lastIp: string;
    userAgent: string;
    signedIn: boolean;
    heartbeats: number;
    pageviews: number;
    lastPath?: string;
  }>;
};

const POLL_MS = 5000;

function formatUpdatedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function AnalyticsSummaryPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Summary | null>(null);
  const [silentBusy, setSilentBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean; forceRecompute?: boolean }) => {
    const silent = opts?.silent === true;
    const forceRecompute = opts?.forceRecompute === true;
    if (silent) setSilentBusy(true);
    else {
      setLoading(true);
      setError(null);
    }
    try {
      const url = forceRecompute ? '/api/analytics/summary?nocache=1' : '/api/analytics/summary';
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (!alive.current) return;
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Request failed');
        if (!silent) setData(null);
        return;
      }
      setData(json as Summary);
      if (!silent) setError(null);
    } catch {
      if (!alive.current) return;
      if (!silent) {
        setError('Network error');
        setData(null);
      }
    } finally {
      if (!alive.current) return;
      if (silent) setSilentBusy(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void load({ silent: true });
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <>
      <h2 className="metrics-section-title">Traffic quality (session-meta)</h2>
      <p className="metrics-page-intro">
        Pre-aggregated <code>analytics/metrics-aggregate.json</code> when fresh. Beacons write{' '}
        <code>analytics/session-meta/*.json</code>. <code>NEXT_PUBLIC_ANALYTICS_ENABLED=1</code>.
      </p>
      <p className="metrics-refresh-row metrics-refresh-meta">
        <button
          type="button"
          className="metrics-refresh-btn"
          onClick={() => void load({ forceRecompute: true })}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        {data && (
          <span className="metrics-last-updated">
            Last updated {formatUpdatedAt(data.generatedAt)}
            {silentBusy ? ' · refreshing…' : ''}
          </span>
        )}
      </p>
      {error && <p className="metrics-error">{error}</p>}
      {data && (
        <>
          <section className="metrics-panel myinv-summary-block myinv-accent-border">
            <h3 className="metrics-panel-title">Overview</h3>
            <ul className="metrics-list">
              <li>Total sessions (meta files): {data.totalSessions}</li>
              <li>Unique IPs (last seen): {data.uniqueIps}</li>
              <li>Sessions with signed-in user hash: {data.signedInSessions}</li>
              <li>
                Human-likely (duration ≥ {data.humanThresholdMs / 1000}s): {data.humanLikelyCount}
              </li>
              <li>Bot-likely (shorter): {data.botLikelyCount}</li>
              <li>Avg session span (last − first seen): {data.avgDurationMs} ms</li>
            </ul>
          </section>
          <section className="metrics-panel myinv-summary-block myinv-accent-border">
            <h3 className="metrics-panel-title">New sessions by first-seen day (UTC)</h3>
            <pre className="metrics-pre">{JSON.stringify(data.byFirstSeenDay, null, 2)}</pre>
          </section>
          <section className="metrics-panel myinv-summary-block myinv-accent-border">
            <h3 className="metrics-panel-title">Recent sessions (up to 150)</h3>
            <div className="metrics-table-wrap">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Duration</th>
                    <th>Human?</th>
                    <th>IP</th>
                    <th>Auth</th>
                    <th>HB / PV</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions.map((r) => (
                    <tr key={r.sessionId}>
                      <td className="metrics-table-session">{r.sessionId.slice(0, 12)}…</td>
                      <td>{Math.round(r.durationMs / 1000)}s</td>
                      <td>{r.humanLikely ? 'yes' : 'no'}</td>
                      <td>{r.lastIp}</td>
                      <td>{r.signedIn ? 'yes' : '—'}</td>
                      <td>
                        {r.heartbeats} / {r.pageviews}
                      </td>
                      <td className="metrics-table-path">{r.lastPath || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
