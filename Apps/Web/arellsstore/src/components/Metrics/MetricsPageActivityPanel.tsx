'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MetricsPageActivityPayload } from '../../lib/metrics/metricsPageMounts';
import AssetSummaryCircleLoader from '../Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../Assets/shared/useAssetSummaryCircleLoader';

const STORAGE_KEY = 'metrics_api_key';
const POLL_MS = 60_000;

type Props = {
  initialApiKey?: string;
};

export default function MetricsPageActivityPanel({ initialApiKey = '' }: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsPageActivityPayload | null>(null);
  const [kpisReveal, setKpisReveal] = useState(false);
  const alive = useRef(true);
  const refreshOnNextLoadRef = useRef(true);
  const showedLoaderRef = useRef(false);
  const {
    mounted: circleMounted,
    visible: circleVisible,
    fadingOut: circleFadingOut,
    show: showCircleLoader,
    dismissOnSummaryExpandComplete: dismissCircleLoader,
    dismissImmediately: dismissCircleLoaderNow,
  } = useAssetSummaryCircleLoader();

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
    async (opts?: { silent?: boolean; bustCache?: boolean }) => {
      const silent = opts?.silent === true;
      let bustCache = opts?.bustCache === true;
      let mountRefresh = false;
      if (refreshOnNextLoadRef.current && !silent) {
        bustCache = true;
        mountRefresh = true;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams();
        if (apiKey) params.set('key', apiKey);
        if (bustCache || process.env.NODE_ENV === 'development') params.set('nocache', '1');
        const res = await fetch(`/api/metrics/page-activity?${params.toString()}`, {
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => ({}))) as MetricsPageActivityPayload & { error?: string };
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
        setData(json as MetricsPageActivityPayload);
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
    [apiKey]
  );

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

  useEffect(() => {
    const onSiteActivity = () => {
      refreshOnNextLoadRef.current = true;
      void load({ silent: true, bustCache: true });
    };
    window.addEventListener('arells-metrics-page-mount', onSiteActivity);
    return () => window.removeEventListener('arells-metrics-page-mount', onSiteActivity);
  }, [load]);

  useEffect(() => {
    if (loading && !data) {
      showedLoaderRef.current = true;
      setKpisReveal(false);
      showCircleLoader();
      return;
    }
    if (data) {
      if (showedLoaderRef.current) {
        dismissCircleLoader();
        let raf2 = 0;
        const raf1 = globalThis.requestAnimationFrame(() => {
          raf2 = globalThis.requestAnimationFrame(() => setKpisReveal(true));
        });
        return () => {
          globalThis.cancelAnimationFrame(raf1);
          if (raf2) globalThis.cancelAnimationFrame(raf2);
        };
      }
      setKpisReveal(true);
      dismissCircleLoaderNow();
      return;
    }
    setKpisReveal(false);
    dismissCircleLoaderNow();
  }, [loading, data, showCircleLoader, dismissCircleLoader, dismissCircleLoaderNow]);

  const awaitingLoader = loading && !data;
  const showCircle = awaitingLoader || circleMounted;
  /** Stay fully opaque while waiting; hook fade-in would otherwise delay first paint. */
  const circleIsVisible = awaitingLoader || circleVisible;
  /** Keep the three-card layout mounted while loading so height does not jump when data arrives. */
  const showKpiShell = awaitingLoader || Boolean(data) || circleMounted;

  return (
    <section className="metrics-activity-section myinv-summary-block myinv-accent-border metrics-chart-wrap">
      {error && <p className="metrics-error">{error}</p>}
      {showKpiShell ? (
        <div
          className={`metrics-kpi-grid metrics-page-activity-kpis asset-mount-fade-2s${
            kpisReveal ? ' is-visible' : ''
          }`}
          aria-hidden={!kpisReveal}
        >
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">DAU</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active today or yesterday (UTC)</div>
            <div className="metrics-kpi-value">{data ? data.dau.toLocaleString() : '\u00a0'}</div>
          </div>
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">WAU</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active in last 7 UTC days</div>
            <div className="metrics-kpi-value">{data ? data.wau.toLocaleString() : '\u00a0'}</div>
          </div>
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">MAU</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active in last 30 UTC days</div>
            <div className="metrics-kpi-value">{data ? data.mau.toLocaleString() : '\u00a0'}</div>
          </div>
        </div>
      ) : null}
      {showCircle ? (
        <div
          className="metrics-activity-loader-slot is-overlay"
          aria-busy={awaitingLoader}
          aria-hidden={!awaitingLoader}
          aria-label={awaitingLoader ? 'Loading activity' : undefined}
        >
          <AssetSummaryCircleLoader
            cssModifier="metrics"
            mounted
            visible={circleIsVisible}
            fadingOut={circleFadingOut}
          />
        </div>
      ) : null}
    </section>
  );
}
