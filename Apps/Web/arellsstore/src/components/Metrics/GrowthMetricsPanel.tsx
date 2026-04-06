'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MetricsGrowthResponse,
  MetricsHeadlines,
  MetricsRange,
  MetricsSegment,
  MetricsView,
} from '../../lib/metrics/types';
import MetricsGrowthChart, { seriesToChartHistory } from './MetricsGrowthChart';

const STORAGE_KEY = 'metrics_api_key';
const GROWTH_POLL_MS = 60_000;

const EMPTY_HEADLINES: MetricsHeadlines = {
  registeredUserKeys: 0,
  registeredSessionKeys: 0,
  registeredCombined: 0,
  aauUsers: 0,
  aauSessionsAnonymous: 0,
  aauSignedInSessions: 0,
  aauCombined: 0,
  growthLabel: null,
  growthPct: null,
};

function formatPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

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

type Props = {
  initialApiKey?: string;
};

export default function GrowthMetricsPanel({ initialApiKey = '' }: Props) {
  const [view, setView] = useState<MetricsView>('growth');
  const [range, setRange] = useState<MetricsRange>('all');
  const [segment, setSegment] = useState<MetricsSegment>('all');
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsGrowthResponse | null>(null);
  const [silentBusy, setSilentBusy] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ x: Date; y: number } | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const s = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (s && !initialApiKey) setApiKey(s);
    } catch {
      /* ignore */
    }
  }, [initialApiKey]);

  const persistKey = useCallback((k: string) => {
    setApiKey(k);
    try {
      if (k) sessionStorage.setItem(STORAGE_KEY, k);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean; keyOverride?: string }) => {
      const silent = opts?.silent === true;
      const force = opts?.force === true;
      const key = opts?.keyOverride ?? apiKey;
      if (silent) setSilentBusy(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams({
          range,
          segment,
          view,
        });
        if (key) params.set('key', key);
        if (force) params.set('nocache', '1');
        const res = await fetch(`/api/metrics/growth?${params.toString()}`);
        const json = (await res.json().catch(() => ({}))) as MetricsGrowthResponse & { error?: string };
        if (!alive.current) return;
        if (res.status === 401) {
          setError('Metrics API key required. Set METRICS_API_SECRET on the server, then enter the same value below.');
          setData(null);
          return;
        }
        if (!res.ok) {
          setError(typeof json.error === 'string' ? json.error : 'Request failed');
          if (!silent) setData(null);
          return;
        }
        if (typeof json.generatedAt !== 'number') {
          setError('Invalid response');
          if (!silent) setData(null);
          return;
        }
        setData(json as MetricsGrowthResponse);
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
    },
    [apiKey, range, segment, view]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void load({ silent: true });
    };
    const id = window.setInterval(tick, GROWTH_POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    setHoverPoint(null);
  }, [data?.generatedAt, segment, range, view]);

  const chartHistoryForChart = useMemo(() => {
    if (!data?.series?.length) {
      const t = new Date().toISOString();
      return [
        { date: t, price: 0 },
        { date: t, price: 0 },
      ];
    }
    const s = seriesToChartHistory(data.series, segment, view);
    if (s.length >= 2) return s;
    if (s.length === 1) {
      const p = s[0];
      const d = new Date(p.date);
      d.setUTCDate(d.getUTCDate() + 1);
      return [p, { date: d.toISOString(), price: p.price }];
    }
    const t = new Date().toISOString();
    return [
      { date: t, price: 0 },
      { date: t, price: 0 },
    ];
  }, [data, segment, view]);

  const h = data?.headlines ?? EMPTY_HEADLINES;

  const primaryTitle =
    segment === 'all' ? 'All Users' : segment === 'signed_in' ? 'Signed up Users' : 'All Sessions';
  const aauTitle =
    segment === 'all'
      ? 'All Active Users (AAU):'
      : segment === 'signed_in'
        ? 'Signed up Active Users (AAU):'
        : 'Active Sessions (AAU):';

  const basePrimary =
    segment === 'all' ? h.registeredCombined : segment === 'signed_in' ? h.registeredUserKeys : h.registeredSessionKeys;

  const aauValue =
    segment === 'all' ? h.aauCombined : segment === 'signed_in' ? h.aauUsers : h.aauSessionsAnonymous;

  const displayPrimaryStr = useMemo(() => {
    if (hoverPoint) {
      if (view === 'retention') return hoverPoint.y.toFixed(1);
      return Math.round(hoverPoint.y).toLocaleString();
    }
    return basePrimary.toLocaleString();
  }, [hoverPoint, view, basePrimary]);

  const aauDisplayStr = aauValue.toLocaleString();

  const headerReady = !loading && data != null;
  const growthPct = h.growthPct;

  return (
    <div className="metrics-growth-panel">
      <div className="metrics-toolbar">
        <div className="metrics-toolbar-row">
          <span className="metrics-toolbar-label">Mode</span>
          <div className="metrics-toggle-group">
            <button
              type="button"
              className={`metrics-toggle-btn${view === 'growth' ? ' is-active' : ''}`}
              onClick={() => setView('growth')}
            >
              Growth
            </button>
            <button
              type="button"
              className={`metrics-toggle-btn${view === 'retention' ? ' is-active' : ''}`}
              onClick={() => setView('retention')}
            >
              Retention
            </button>
          </div>
        </div>
        <div className="metrics-toolbar-row">
          <span className="metrics-toolbar-label">Range</span>
          <div className="metrics-toggle-group">
            {(
              [
                ['all', 'All'],
                ['1w', '1W'],
                ['1m', '1M'],
                ['3m', '3M'],
                ['1y', '1Y'],
              ] as const
            ).map(([r, label]) => (
              <button
                key={r}
                type="button"
                className={`metrics-toggle-btn${range === r ? ' is-active' : ''}`}
                onClick={() => setRange(r)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="metrics-toolbar-row">
          <span className="metrics-toolbar-label">Segment</span>
          <div className="metrics-toggle-group">
            {(
              [
                ['all', 'All'],
                ['signed_in', 'Signed up'],
                ['sessions', 'Sessions'],
              ] as const
            ).map(([s, label]) => (
              <button
                key={s}
                type="button"
                className={`metrics-toggle-btn${segment === s ? ' is-active' : ''}`}
                onClick={() => setSegment(s)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="metrics-toolbar-row metrics-key-row">
          <label className="metrics-key-label">
            API key
            <input
              className="metrics-key-input"
              type="password"
              autoComplete="off"
              placeholder={apiKey ? '••••••••' : 'METRICS_API_SECRET'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="metrics-refresh-btn metrics-key-save"
            onClick={() => {
              const k = keyInput.trim();
              persistKey(k);
              void load({ force: true, keyOverride: k });
            }}
          >
            Save key
          </button>
          <button
            type="button"
            className="metrics-refresh-btn"
            onClick={() => void load({ force: true })}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {data && (
            <span className="metrics-last-updated">
              {formatUpdatedAt(data.generatedAt)}
              {silentBusy ? ' · refreshing…' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <p className="metrics-error">{error}</p>}

      {data && (
        <>
          <div className="metrics-chart-wrap myinv-summary-block myinv-accent-border">
            <p className="metrics-bucket-hint" style={{ marginTop: 0 }}>
              {view === 'growth' ? 'Activity' : 'Retention'} · bucket <strong>{data.bucket}</strong> · UTC{' '}
              {new Date(data.rangeStart).toISOString().slice(0, 10)} →{' '}
              {new Date(data.rangeEnd).toISOString().slice(0, 10)}
            </p>

            <div className="metrics-price-chart-row">
              <div className="metrics-price-panel-inner">
                <div className="asset-metric-row">
                  <span className="asset-metric-title--bitcoin">{primaryTitle}:</span>
                  <span className="asset-metric-value-wrap">
                    {!headerReady && (
                      <span className="asset-number-loader metrics-number-loader--accent asset-number-loader--overlay" />
                    )}
                    <span className={`asset-metric-value asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                      {displayPrimaryStr}
                    </span>
                  </span>
                </div>
                <div className="asset-metric-row">
                  <span className="asset-metric-title--bitcoin">{aauTitle}</span>
                  <span className="asset-metric-value-wrap">
                    {!headerReady && (
                      <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--wide asset-number-loader--overlay" />
                    )}
                    <span className={`asset-metric-value asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                      {aauDisplayStr}
                    </span>
                  </span>
                </div>
                <div className="asset-metric-row">
                  <span className="asset-metric-value-wrap">
                    {!headerReady && (
                      <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                    )}
                    {headerReady && growthPct != null ? (
                      growthPct >= 0 ? (
                        <span
                          className="asset-metric-trend-icon asset-metric-trend-icon--bitcoin asset-mount-fade-2s is-visible"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="asset-metric-trend-icon asset-metric-trend-icon--down asset-metric-trend-icon--bitcoin asset-mount-fade-2s is-visible"
                          aria-hidden="true"
                        />
                      )
                    ) : null}
                    <span className="asset-metric-inline-title--bitcoin" style={{ marginRight: 6 }}>
                      {h.growthLabel ? `${h.growthLabel} ` : 'Growth '}
                    </span>
                    <span className={`asset-metric-value asset-percentage-value asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                      {headerReady && growthPct != null
                        ? Math.abs(growthPct).toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                            minimumFractionDigits: 0,
                          })
                        : headerReady
                          ? '—'
                          : '\u00A0'}
                    </span>
                    <span
                      className={`asset-metric-symbol--bitcoin asset-metric-percent-symbol--bitcoin asset-mount-fade-2s${
                        headerReady && growthPct != null ? ' is-visible' : ''
                      }`}
                    >
                      %
                    </span>
                  </span>
                </div>
              </div>

              <div className="metrics-chart-column">
                <MetricsGrowthChart
                  history={chartHistoryForChart}
                  loading={loading}
                  onPointHover={setHoverPoint}
                />
              </div>
            </div>
          </div>

          <div className="metrics-kpi-grid">
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">WoW</div>
              <div className="metrics-kpi-value">{formatPct(data.kpis.wowPct)}</div>
            </div>
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">MoM</div>
              <div className="metrics-kpi-value">{formatPct(data.kpis.momPct)}</div>
            </div>
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">YoY</div>
              <div className="metrics-kpi-value">{formatPct(data.kpis.yoyPct)}</div>
            </div>
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">Retention (½→½)</div>
              <div className="metrics-kpi-value">
                {data.kpis.retentionRatePct == null ? '—' : `${data.kpis.retentionRatePct.toFixed(1)}%`}
              </div>
              <div className="metrics-kpi-sub">
                {data.kpis.retentionRetained} / {data.kpis.retentionCohortSize} cohort
              </div>
            </div>
          </div>

          <div className="metrics-kpi-grid metrics-kpi-grid--strict">
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">Strict session DAU</div>
              <div className="metrics-kpi-value">{data.kpis.strictSessionDau}</div>
            </div>
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">Strict session WAU</div>
              <div className="metrics-kpi-value">{data.kpis.strictSessionWau}</div>
            </div>
            <div className="metrics-kpi-card myinv-accent-border">
              <div className="metrics-kpi-label">Strict session MAU</div>
              <div className="metrics-kpi-value">{data.kpis.strictSessionMau}</div>
            </div>
            {segment !== 'sessions' && (
              <>
                <div className="metrics-kpi-card myinv-accent-border">
                  <div className="metrics-kpi-label">Strict user DAU (S3 span)</div>
                  <div className="metrics-kpi-value">{data.kpis.strictUserDau}</div>
                </div>
                <div className="metrics-kpi-card myinv-accent-border">
                  <div className="metrics-kpi-label">Strict user WAU</div>
                  <div className="metrics-kpi-value">{data.kpis.strictUserWau}</div>
                </div>
                <div className="metrics-kpi-card myinv-accent-border">
                  <div className="metrics-kpi-label">Strict user MAU</div>
                  <div className="metrics-kpi-value">{data.kpis.strictUserMau}</div>
                </div>
              </>
            )}
          </div>

          <ul className="metrics-notes">
            {data.notes.map((n) => (
              <li key={n.slice(0, 48)}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
