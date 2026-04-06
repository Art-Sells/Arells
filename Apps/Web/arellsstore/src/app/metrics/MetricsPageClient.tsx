'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AuthPageShell from '../../components/Auth/AuthPageShell';

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

export default function MetricsPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/summary');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Request failed');
        setData(null);
        return;
      }
      setData(json as Summary);
    } catch {
      setError('Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthPageShell title="Growth Metrics" wide>
      <div className="metrics-stack">
        <p className="metrics-page-intro">
          Public summary from <code>analytics/session-meta/</code> in S3. Enable collection with{' '}
          <code>NEXT_PUBLIC_ANALYTICS_ENABLED=1</code>.
        </p>
        <p className="metrics-refresh-row">
          <button type="button" className="metrics-refresh-btn" onClick={() => void load()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </p>
        {error && <p className="metrics-error">{error}</p>}
        {data && (
          <>
            <section className="metrics-panel myinv-summary-block myinv-accent-border">
              <h2 className="metrics-panel-title">Overview</h2>
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
              <h2 className="metrics-panel-title">New sessions by first-seen day (UTC)</h2>
              <pre className="metrics-pre">{JSON.stringify(data.byFirstSeenDay, null, 2)}</pre>
            </section>
            <section className="metrics-panel myinv-summary-block myinv-accent-border">
              <h2 className="metrics-panel-title">Recent sessions (up to 150)</h2>
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
      </div>
    </AuthPageShell>
  );
}
