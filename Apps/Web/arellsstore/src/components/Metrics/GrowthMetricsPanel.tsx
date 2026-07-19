'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MetricsGrowthResponse,
  MetricsHeadlines,
  MetricsRange,
  MetricsRangePresetsAvailable,
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
  aauUsers: 0,
  growthLabel: null,
  growthPct: null,
};

/** Split KPI % into gray sign + dark body (for toolbar-tone + / − and digits). */
function splitKpiPctParts(n: number | null | undefined): { sign: string; body: string } {
  if (n == null || Number.isNaN(n)) return { sign: '+', body: '0.00' };
  if (n >= 0) return { sign: '+', body: n.toFixed(2) };
  return { sign: '-', body: Math.abs(n).toFixed(2) };
}

/** Retention WoW/MoM are absolute 0–100 rates — no leading +. */
function splitRetentionKpiPctParts(n: number | null | undefined): { sign: string; body: string } {
  if (n == null || Number.isNaN(n)) return { sign: '', body: '0.00' };
  return { sign: '', body: Math.max(0, n).toFixed(2) };
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
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsGrowthResponse | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: Date; y: number } | null>(null);
  const alive = useRef(true);
  const refreshOnNextLoadRef = useRef(true);

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
      let force = opts?.force === true;
      let mountRefresh = false;
      if (refreshOnNextLoadRef.current && !silent) {
        force = true;
        mountRefresh = true;
      }
      const key = opts?.keyOverride ?? apiKey;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams({
          range,
          view,
        });
        if (key) params.set('key', key);
        if (force || process.env.NODE_ENV === 'development') params.set('nocache', '1');
        const res = await fetch(`/api/metrics/growth?${params.toString()}`, { cache: 'no-store' });
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
        if (mountRefresh) refreshOnNextLoadRef.current = false;
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
    [apiKey, range, view]
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
    const onSiteActivity = () => {
      refreshOnNextLoadRef.current = true;
      void load({ silent: true, force: true });
    };
    window.addEventListener('arells-metrics-page-mount', onSiteActivity);
    return () => window.removeEventListener('arells-metrics-page-mount', onSiteActivity);
  }, [load]);

  useEffect(() => {
    setHoverPoint(null);
  }, [data?.generatedAt, range, view]);

  const selectView = useCallback(
    (next: MetricsView) => {
      if (next === view) return;
      setHoverPoint(null);
      setLoading(true);
      setView(next);
    },
    [view]
  );

  const selectRange = useCallback(
    (next: MetricsRange) => {
      if (next === range) return;
      setHoverPoint(null);
      setLoading(true);
      setRange(next);
    },
    [range]
  );

  const rangePresetsAvailable = data?.rangePresetsAvailable ?? ALL_RANGE_PRESETS_TRUE;

  useEffect(() => {
    if (!data?.rangePresetsAvailable || range === 'all') return;
    if (!data.rangePresetsAvailable[range]) {
      setLoading(true);
      setRange('all');
    }
  }, [data?.generatedAt, data?.rangePresetsAvailable, range]);

  const chartMatchesSelection =
    data != null && data.view === view && data.range === range && !loading;

  const chartHistoryForChart = useMemo(() => {
    if (!chartMatchesSelection || !data?.series?.length) {
      const t = new Date().toISOString();
      return [
        { date: t, price: 0 },
        { date: t, price: 0 },
      ];
    }
    const s = seriesToChartHistory(data.series, view);
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
  }, [chartMatchesSelection, data, view]);

  const h = data?.headlines ?? EMPTY_HEADLINES;

  const primaryTitle = 'User Accounts';
  const timeframeHeading = rangeLabelHeading(range);
  const primaryTimeframeHeading =
    view === 'retention' && range === 'all' ? 'All-Time' : timeframeHeading;
  const timeframeBeforeMetric = rangeLabelBeforeMetric(range);
  const primaryHeading = `${primaryTimeframeHeading} ${primaryTitle}`;

  const basePrimary = useMemo(() => h.registeredUserKeys, [h]);

  const displayPrimaryStr = useMemo(() => {
    if (hoverPoint && view === 'growth') {
      const n = Math.max(0, Math.round(hoverPoint.y));
      return n.toLocaleString();
    }
    return basePrimary.toLocaleString();
  }, [hoverPoint, view, basePrimary]);

  const headerReady = !loading && data != null;
  const growthPct = h.growthPct;
  const retentionPct = data?.kpis.retentionRatePct ?? null;

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
  const kpiMetricWordShort = view === 'growth' ? 'Grwth' : 'Retention';

  const renderKpiMetricWord = (opts?: { lower?: boolean }) => {
    const full = opts?.lower ? kpiMetricWord.toLowerCase() : kpiMetricWord;
    const short = opts?.lower ? kpiMetricWordShort.toLowerCase() : kpiMetricWordShort;
    if (view !== 'growth') return full;
    return (
      <>
        <span className="metrics-kpi-metric-word metrics-kpi-metric-word--full">{full}</span>
        <span className="metrics-kpi-metric-word metrics-kpi-metric-word--short" aria-hidden="true">
          {short}
        </span>
      </>
    );
  };

  const kpiPctParts = useMemo(() => {
    if (!data) return null;
    const split = view === 'retention' ? splitRetentionKpiPctParts : splitKpiPctParts;
    return {
      wow: split(data.kpis.wowPct),
      mom: split(data.kpis.momPct),
    };
  }, [data, view]);

  return (
    <div className="metrics-growth-panel">
      {error && <p className="metrics-error">{error}</p>}

      <div className="metrics-growth-outer myinv-summary-block myinv-accent-border">
        <div className="metrics-growth-outer-column">
          <div className="metrics-growth-tier metrics-growth-tier--top myinv-summary-block myinv-accent-border">
            <div className="metrics-growth-tier-inner">
              <div className={`metrics-growth-main-row${loading || data ? ' metrics-growth-main-row--with-chart' : ''}`}>
                {loading || data ? (
                  <div className="metrics-price-panel-inner metrics-growth-headlines">
                    <div className="asset-metric-row">
                      <span className="asset-metric-title--bitcoin metrics-growth-toolbar-tone">{primaryHeading}:</span>
                      <span className="asset-metric-value-wrap">
                        {!headerReady && (
                          <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                        )}
                        <span className={`asset-metric-value asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                          {headerReady ? displayPrimaryStr : '\u00a0'}
                        </span>
                      </span>
                    </div>
                    <div className="asset-metric-row">
                      <span
                        className="asset-metric-inline-title--bitcoin metrics-growth-toolbar-tone"
                        style={{ marginRight: 6 }}
                      >
                        {timeframeBeforeMetric} {view === 'growth' ? 'Growth' : 'Retention'}:
                      </span>
                      <span className="asset-metric-value-wrap">
                        {!headerReady && (
                          <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                        )}
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

                {loading || data ? (
                  <div className="metrics-growth-chart-shell myinv-accent-border">
                    <div className="metrics-growth-chart-shell-inner">
                      <MetricsGrowthChart
                        history={chartHistoryForChart}
                        loading={loading || !chartMatchesSelection}
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
                              onClick={() => selectView('growth')}
                            >
                              Growth
                            </button>
                            <button
                              type="button"
                              className={`metrics-toggle-btn${view === 'retention' ? ' is-active' : ''}`}
                              disabled={view === 'retention'}
                              onClick={() => selectView('retention')}
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
                                    selectRange(r);
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(loading || data) && (
            <div className="metrics-growth-tier metrics-growth-tier--bottom myinv-summary-block myinv-accent-border">
              <div className="metrics-growth-tier-inner">
                <div className="metrics-kpi-grid metrics-kpi-grid--two">
                  <div className="metrics-kpi-card myinv-accent-border">
                    <div className="metrics-kpi-label metrics-growth-toolbar-tone">
                      WoW {renderKpiMetricWord()}
                    </div>
                    <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">
                      Week over Week {renderKpiMetricWord({ lower: true })}
                    </div>
                    <div className="metrics-kpi-value">
                      <span className="asset-metric-value-wrap metrics-kpi-value-wrap">
                        {!headerReady && (
                          <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                        )}
                        <span className={`asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                          {headerReady && kpiPctParts ? (
                            <>
                              {kpiPctParts.wow.sign ? (
                                <span className="metrics-growth-toolbar-tone">{kpiPctParts.wow.sign}</span>
                              ) : null}
                              <span className="metrics-kpi-value-num">{kpiPctParts.wow.body}</span>
                              <span className="metrics-growth-toolbar-tone">%</span>
                            </>
                          ) : (
                            '\u00a0'
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="metrics-kpi-card myinv-accent-border">
                    <div className="metrics-kpi-label metrics-growth-toolbar-tone">
                      MoM {renderKpiMetricWord()}
                    </div>
                    <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">
                      Month over Month {renderKpiMetricWord({ lower: true })}
                    </div>
                    <div className="metrics-kpi-value">
                      <span className="asset-metric-value-wrap metrics-kpi-value-wrap">
                        {!headerReady && (
                          <span className="asset-number-loader metrics-number-loader--accent metrics-number-loader--narrow asset-number-loader--overlay" />
                        )}
                        <span className={`asset-mount-fade-2s${headerReady ? ' is-visible' : ''}`}>
                          {headerReady && kpiPctParts ? (
                            <>
                              {kpiPctParts.mom.sign ? (
                                <span className="metrics-growth-toolbar-tone">{kpiPctParts.mom.sign}</span>
                              ) : null}
                              <span className="metrics-kpi-value-num">{kpiPctParts.mom.body}</span>
                              <span className="metrics-growth-toolbar-tone">%</span>
                            </>
                          ) : (
                            '\u00a0'
                          )}
                        </span>
                      </span>
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
