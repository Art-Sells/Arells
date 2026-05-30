'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MetricsPageActivityPayload } from '../../lib/metrics/metricsPageMounts';

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

  return (
    <section className="metrics-activity-section myinv-summary-block myinv-accent-border metrics-chart-wrap">
      {error && <p className="metrics-error">{error}</p>}
      {loading && !data ? (
        <p className="metrics-page-intro metrics-growth-toolbar-tone">Loading…</p>
      ) : data ? (
        <div className="metrics-kpi-grid metrics-page-activity-kpis">
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">DAUt</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active today or yesterday (UTC)</div>
            <div className="metrics-kpi-value">{data.dau.toLocaleString()}</div>
          </div>
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">WAUt</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active in last 7 UTC days</div>
            <div className="metrics-kpi-value">{data.wau.toLocaleString()}</div>
          </div>
          <div className="metrics-kpi-card myinv-accent-border">
            <div className="metrics-kpi-label metrics-growth-toolbar-tone">MAUt</div>
            <div className="metrics-kpi-sublabel metrics-growth-toolbar-tone">Active in last 30 UTC days</div>
            <div className="metrics-kpi-value">{data.mau.toLocaleString()}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
