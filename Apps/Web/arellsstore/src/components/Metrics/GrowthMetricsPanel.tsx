'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MetricsGrowthResponse,
  MetricsHeadlines,
  MetricsRange,
  MetricsRangePresetsAvailable,
  MetricsSegment,
  MetricsView,
} from '../../lib/metrics/types';

const ALL_RANGE_PRESETS_TRUE: MetricsRangePresetsAvailable = {
  '1w': true,
  '1m': true,
  '3m': true,
  '1y': true,
};
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

/** Split KPI % into gray sign + dark body (for toolbar-tone + / − and digits). */
function splitKpiPctParts(n: number | null | undefined): { sign: string; body: string } {
  if (n == null || Number.isNaN(n)) return { sign: '+', body: '0.00' };
  if (n >= 0) return { sign: '+', body: n.toFixed(2) };
  return { sign: '-', body: Math.abs(n).toFixed(2) };
}

/** Sentence-style label for headings (e.g. row 1). */
function rangeLabelHeading(r: MetricsRange): string {
  switch (r) {
    case 'all':
      return 'All-time';
    case '1w':
      return '1 Week';
    case '1m':
      return '1 Month';
    case '3m':
      return '3 Months';
    case '1y':
      return '1 Year';
    default:
      return 'All-time';
  }
}

/** Label before Growth / Retention (row 3); only “all-time” caps the A. */
function rangeLabelBeforeMetric(r: MetricsRange): string {
  switch (r) {
    case 'all':
      return 'All-time';
    case '1w':
      return '1 week';
    case '1m':
      return '1 month';
    case '3m':
      return '3 months';
    case '1y':
      return '1 year';
    default:
      return 'All-time';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsGrowthResponse | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: Date; y: number } | null>(null);
  const alive = useRef(true);
  const prevViewRef = useRef<MetricsView>('growth');

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

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean; keyOverride?: string }) => {
      const silent = opts?.silent === true;
      const force = opts?.force === true;
      const key = opts?.keyOverride ?? apiKey;
      if (!silent) {
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
          setError('Metrics API key required (server METRICS_API_SECRET).');
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
        if (!silent) setLoading(false);
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

  useEffect(() => {
    if (view === 'retention') {
      setSegment('signed_in');
    } else if (prevViewRef.current === 'retention' && view === 'growth') {
      setSegment('all');
    }
    prevViewRef.current = view;
  }, [view]);

  const rangePresetsAvailable = data?.rangePresetsAvailable ?? ALL_RANGE_PRESETS_TRUE;

  useEffect(() => {
    if (!data?.rangePresetsAvailable || range === 'all') return;
    if (!data.rangePresetsAvailable[range]) setRange('all');
  }, [data?.generatedAt, data?.rangePresetsAvailable, range]);

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
    view === 'retention'
      ? 'User Accounts'
      : segment === 'all'
        ? 'New User Traffic'
        : segment === 'signed_in'
          ? 'New User Accounts'
          : 'New User Visits';
  const timeframeHeading = rangeLabelHeading(range);
  /** Retention + all-time: match product copy (“All-Time … Accounts”). */
  const primaryTimeframeHeading =
    view === 'retention' && range === 'all' ? 'All-Time' : timeframeHeading;
  const timeframeBeforeMetric = rangeLabelBeforeMetric(range);
  const primaryHeading = `${primaryTimeframeHeading} ${primaryTitle}`;

  /**
   * Visits: distinct anonymous sessions that touched the selected range (aauSessionsAnonymous).
   * Chart hover still shows that bucket’s daily count (can be 0 on quiet days).
   */
  const basePrimary = useMemo(() => {
    if (view === 'retention') return h.registeredUserKeys;
    if (segment === 'all') return h.registeredCombined;
    if (segment === 'signed_in') return h.registeredUserKeys;
    return h.aauSessionsAnonymous;
  }, [segment, h, view]);

  const displayPrimaryStr = useMemo(() => {
    if (hoverPoint && view === 'growth') {
      // Chart hover uses pixel→value math; spline interpolation can yield tiny negatives → Math.round → -0 → "-0" in UI.
      const n = Math.max(0, Math.round(hoverPoint.y));
      return n.toLocaleString();
    }
    return basePrimary.toLocaleString();
  }, [hoverPoint, view, basePrimary]);

  const headerReady = !loading && data != null;
  const growthPct = h.growthPct;
  const retentionPct = data?.kpis.retentionRatePct ?? null;

  /** Headline growth %; fall back to WoW/MoM/YoY KPIs when series is too short for computeWowMom headline. */
  const effectiveGrowthPct = useMemo(() => {
    if (growthPct != null && !Number.isNaN(growthPct)) return growthPct;
    const k = data?.kpis;
    if (!k) return null;
    return k.wowPct ?? k.momPct ?? k.yoyPct ?? null;
  }, [growthPct, data?.kpis]);

  const thirdRowPct = useMemo(() => {
    if (view === 'retention') {
      if (hoverPoint) return Math.max(0, hoverPoint.y);
      return retentionPct ?? 0;
    }
    if (effectiveGrowthPct != null && !Number.isNaN(effectiveGrowthPct)) return effectiveGrowthPct;
    return 0;
  }, [view, hoverPoint, retentionPct, effectiveGrowthPct]);

  const thirdRowPctStr = useMemo(() => {
    if (!headerReady) return null;
    const r = thirdRowPct ?? 0;
    if (Number.isNaN(r)) return '0.00';
    if (view === 'retention') {
      return Math.max(0, r).toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    }
    return Math.abs(r).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }, [headerReady, thirdRowPct, view]);

  /** Growth headline row: gray ±, dark digits (retention uses thirdRowPctStr only). */
  const thirdRowGrowthSignBody = useMemo(() => {
    if (!headerReady || view !== 'growth') return null;
    const r = thirdRowPct ?? 0;
    if (Number.isNaN(r)) return { sign: '+', body: '0.00' };
    const sign = r >= 0 ? '+' : '-';
    const body = Math.abs(r).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    return { sign, body };
  }, [headerReady, view, thirdRowPct]);

  const kpiMetricWord = view === 'growth' ? 'Growth' : 'Retention';

  const kpiPctParts = useMemo(() => {
    if (!data) return null;
    return {
      wow: splitKpiPctParts(data.kpis.wowPct),
      mom: splitKpiPctParts(data.kpis.momPct),
    };
  }, [data]);

  return (
    <div className="metrics-growth-panel">
      {error && <p className="metrics-error">{error}</p>}

      <div className="metrics-growth-outer myinv-summary-block myinv-accent-border">
        <div className="metrics-growth-outer-column">
          <div className="metrics-growth-tier metrics-growth-tier--top myinv-summary-block myinv-accent-border">
            <div className="metrics-growth-tier-inner">
              <div className={`metrics-growth-main-row${data ? ' metrics-growth-main-row--with-chart' : ''}`}>
                {data ? (
                  <div className="metrics-price-panel-inner metrics-growth-headlines">
                    <div className="asset-metric-row">
                      <span className="asset-metric-title--bitcoin metrics-growth-toolbar-tone">{primaryHeading}:</span>
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
                      <span className="asset-metric-value-wrap">
                        {!headerReady && (
                          <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                        )}
                        <span
                          className="asset-metric-inline-title--bitcoin metrics-growth-toolbar-tone"
                          style={{ marginRight: 6 }}
                        >
                          {timeframeBeforeMetric} {view === 'growth' ? 'Growth' : 'Retention'}:
                        </span>
                        <span
                          className={`asset-metric-value asset-percentage-value asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}
                        >
                          {!headerReady ? (
                            '\u00a0'
                          ) : view === 'retention' ? (
                            <span className="metrics-growth-pct-body">{thirdRowPctStr ?? '\u00a0'}</span>
                          ) : thirdRowGrowthSignBody ? (
                            <>
                              <span className="metrics-growth-toolbar-tone">{thirdRowGrowthSignBody.sign}</span>
                              <span className="metrics-growth-pct-body">{thirdRowGrowthSignBody.body}</span>
                            </>
                          ) : (
                            '\u00a0'
                          )}
                        </span>
                        {headerReady && thirdRowPctStr != null ? (
                          <span className="asset-metric-symbol--bitcoin asset-metric-percent-symbol--bitcoin metrics-growth-toolbar-tone asset-mount-fade-2s is-visible">
                            %
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                ) : null}

                {data ? (
                  <div className="metrics-growth-chart-shell myinv-accent-border">
                    <div className="metrics-growth-chart-shell-inner">
                      <MetricsGrowthChart
                        history={chartHistoryForChart}
                        loading={loading}
                        onPointHover={setHoverPoint}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="metrics-growth-toolbar-wrap myinv-summary-block myinv-accent-border">
                  <div className="metrics-growth-toolbar-inner">
                    <div className="metrics-toolbar-block myinv-accent-border">
                      <div className="metrics-toolbar-block-inner">
                        <div className="metrics-toolbar-row">
                          <span className="asset-metric-title--bitcoin metrics-growth-toolbar-tone metrics-toolbar-section-title">
                            Metrics
                          </span>
                          <div className="metrics-toggle-group">
                            <button
                              type="button"
                              className={`metrics-toggle-btn${view === 'growth' ? ' is-active' : ''}`}
                              disabled={view === 'growth'}
                              onClick={() => setView('growth')}
                            >
                              Growth
                            </button>
                            <button
                              type="button"
                              className={`metrics-toggle-btn${view === 'retention' ? ' is-active' : ''}`}
                              disabled={view === 'retention'}
                              onClick={() => setView('retention')}
                            >
                              Retention
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="metrics-toolbar-block myinv-accent-border">
                      <div className="metrics-toolbar-block-inner">
                        <div className="metrics-toolbar-row">
                          <span className="asset-metric-title--bitcoin metrics-growth-toolbar-tone metrics-toolbar-section-title">
                            Timeframe
                          </span>
                          <div className="metrics-toggle-group">
                            {(
                              [
                                ['all', 'All'],
                                ['1w', '1W'],
                                ['1m', '1M'],
                                ['3m', '3M'],
                                ['1y', '1Y'],
                              ] as const
                            ).map(([r, label]) => {
                              const presetOk = r === 'all' || rangePresetsAvailable[r];
                              const isCurrent = range === r;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  className={`metrics-toggle-btn${isCurrent ? ' is-active' : ''}`}
                                  disabled={isCurrent || !presetOk}
                                  title={!presetOk ? 'Not enough history for this window yet' : undefined}
                                  onClick={() => {
                                    if (!presetOk || isCurrent) return;
                                    setRange(r);
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {view !== 'retention' ? (
                      <div className="metrics-toolbar-block myinv-accent-border">
                        <div className="metrics-toolbar-block-inner">
                          <div className="metrics-toolbar-row">
                            <span className="asset-metric-title--bitcoin metrics-growth-toolbar-tone metrics-toolbar-section-title">
                              {segment === 'all'
                                ? 'New User Traffic'
                                : segment === 'signed_in'
                                  ? 'New User Accounts'
                                  : 'New User Visits'}
                            </span>
                            <div className="metrics-toggle-group">
                              {(
                                [
                                  ['all', 'All'],
                                  ['signed_in', 'Accounts'],
                                  ['sessions', 'Visits'],
                                ] as const
                              ).map(([s, label]) => {
                                const isCurrent = segment === s;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    className={`metrics-toggle-btn${isCurrent ? ' is-active' : ''}`}
                                    disabled={isCurrent}
                                    onClick={() => {
                                      if (isCurrent) return;
                                      setSegment(s);
                                    }}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {data && (
            <div className="metrics-growth-tier metrics-growth-tier--bottom myinv-summary-block myinv-accent-border">
              <div className="metrics-growth-tier-inner">
                <div className="metrics-kpi-grid metrics-kpi-grid--two">
                  <div className="metrics-kpi-card myinv-accent-border">
                    <div className="metrics-kpi-label metrics-growth-toolbar-tone">WoW {kpiMetricWord}</div>
                    <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">
                      {`Week over Week ${kpiMetricWord.toLowerCase()}`}
                    </div>
                    <div className="metrics-kpi-value">
                      {kpiPctParts ? (
                        <>
                          <span className="metrics-growth-toolbar-tone">{kpiPctParts.wow.sign}</span>
                          <span className="metrics-kpi-value-num">{kpiPctParts.wow.body}</span>
                          <span className="metrics-growth-toolbar-tone">%</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="metrics-kpi-card myinv-accent-border">
                    <div className="metrics-kpi-label metrics-growth-toolbar-tone">MoM {kpiMetricWord}</div>
                    <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">
                      {`Month over Month ${kpiMetricWord.toLowerCase()}`}
                    </div>
                    <div className="metrics-kpi-value">
                      {kpiPctParts ? (
                        <>
                          <span className="metrics-growth-toolbar-tone">{kpiPctParts.mom.sign}</span>
                          <span className="metrics-kpi-value-num">{kpiPctParts.mom.body}</span>
                          <span className="metrics-growth-toolbar-tone">%</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
