'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MetricsStandaloneLineChart, { formatMetricsUtcBadgeLabel } from './MetricsStandaloneLineChart';

export type MetricsChartHistoryPoint = { date: string; price: number; utcLabel?: string };

type AccentPack = {
  color: string;
  activeColor: string;
  markerColor: string;
  gridColor: string;
  backgroundColor: string;
  markerShadow: string;
  gridCss: string;
};

/** Resolves theme accent for Chart.js (canvas) + inline styles — avoid formats Chart/canvas can't use. */
function parseCssColorToRgb(cssColor: string): { r: number; g: number; b: number } | null {
  const s = cssColor.trim();
  if (!s) return null;
  const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  return null;
}

function packFromRgbTri(p: { r: number; g: number; b: number } | null): AccentPack {
  const r = p?.r ?? 248;
  const g = p?.g ?? 141;
  const b = p?.b ?? 0;
  return {
    color: `rgba(${r},${g},${b},0.5)`,
    activeColor: `rgba(${r},${g},${b},0.6)`,
    markerColor: `rgba(${r},${g},${b},1)`,
    gridColor: `rgba(${r},${g},${b},0.12)`,
    backgroundColor: `rgba(${r},${g},${b},0.14)`,
    markerShadow: `-5px 0 14px rgba(${r},${g},${b},0.26), 0 7px 10px rgba(${r},${g},${b},0.18)`,
    gridCss: `repeating-linear-gradient(to right, rgba(${r},${g},${b},0.1) 0px, rgba(${r},${g},${b},0.1) 1px, transparent 1px, transparent 30px), repeating-linear-gradient(to bottom, rgba(${r},${g},${b},0.1) 0px, rgba(${r},${g},${b},0.1) 1px, transparent 1px, transparent 30px)`,
  };
}

/** Prefer --myinv-accent-color (hex on :root); title bar computed color can be oklch/color() and break naive rgb() parsing. */
function readAccentRgbTri(): { r: number; g: number; b: number } | null {
  if (typeof document === 'undefined') return null;
  const rootStyle = getComputedStyle(document.documentElement);
  const fromVar = parseCssColorToRgb(rootStyle.getPropertyValue('--myinv-accent-color'));
  if (fromVar) return fromVar;
  const selectors = ['.growth-metrics-title-bar', '.auth-title-bar'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const parsed = parseCssColorToRgb(getComputedStyle(el).color);
      if (parsed) return parsed;
    }
  }
  return parseCssColorToRgb(rootStyle.color);
}

type Props = {
  history: MetricsChartHistoryPoint[];
  loading: boolean;
  onPointHover?: (point: { x: Date; y: number } | null) => void;
};

const PLOT_FALLBACK_H = 200;

export default function MetricsGrowthChart({ history, loading, onPointHover }: Props) {
  const [accent, setAccent] = useState<AccentPack>(() => packFromRgbTri(null));
  const [chartReady, setChartReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [plotPx, setPlotPx] = useState(PLOT_FALLBACK_H);

  useLayoutEffect(() => {
    setAccent(packFromRgbTri(readAccentRgbTri()));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAccent(packFromRgbTri(readAccentRgbTri()));
    }, 600);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => {
      const h = Math.max(1, Math.round(el.getBoundingClientRect().height));
      setPlotPx((prev) => (prev === h ? prev : h));
    };
    apply();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(apply);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (loading) {
      setChartReady(false);
      return;
    }
    const t = window.setTimeout(() => setChartReady(true), 150);
    return () => window.clearTimeout(t);
  }, [loading, history]);

  const handleHover = useCallback(
    (point: { x: Date; y: number } | null) => {
      onPointHover?.(point);
    },
    [onPointHover]
  );

  const [hoverUi, setHoverUi] = useState<{ y: number; utcLabel: string } | null>(null);

  const onChartPoint = useCallback(
    (payload: { y: number; utcLabel: string } | null) => {
      setHoverUi(payload);
      handleHover(
        payload
          ? {
              x: new Date(0),
              y: payload.y,
            }
          : null
      );
    },
    [handleHover]
  );

  return (
    <div
      ref={wrapRef}
      className="metrics-chart-wrap-panel"
      style={{
        position: 'relative',
        padding: 0,
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {hoverUi != null && (
        <div className="asset-chart-date-badge asset-chart-date-badge--bitcoin metrics-chart-date-badge">
          <span className="asset-metric-inline-title--bitcoin metrics-growth-toolbar-tone">Date:</span>{' '}
          <span className="asset-metric-inline-value">
            {formatMetricsUtcBadgeLabel(hoverUi.utcLabel)}
          </span>
        </div>
      )}
      <div className={`asset-chart-loader metrics-chart-loader${chartReady && !loading ? ' is-hidden' : ''}`}>
        <div className="asset-chart-grid-shimmer asset-chart-grid-shimmer--metrics">
          <div className="asset-chart-grid-shimmer-thin" />
          <div className="asset-chart-grid-shimmer-thick" />
        </div>
      </div>
      <div
        className={`asset-chart-fade asset-chart-interactive metrics-chart-interactive${
          chartReady && !loading ? ' is-visible' : ''
        }${chartReady && !loading ? '' : ' is-disabled'}`}
        style={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          aria-hidden="true"
          className="metrics-chart-bg-grid"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: accent.gridCss,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <MetricsStandaloneLineChart
            points={history.map((h) => ({
              date: h.date,
              y: h.price,
              utcLabel: h.utcLabel,
            }))}
            color={accent.color}
            markerColor={accent.markerColor}
            backgroundColor={accent.backgroundColor}
            markerShadow={accent.markerShadow}
            height={plotPx}
            interactiveHeight={plotPx}
            canvasOffsetTop={0}
            onPointHover={onChartPoint}
          />
        </div>
      </div>
    </div>
  );
}

export function seriesToChartHistory(
  series: Array<{ label: string; sessions: number; signedInUsers: number; combined: number; retentionPct?: number | null }>,
  segment: 'all' | 'signed_in' | 'sessions',
  view: 'growth' | 'retention'
): MetricsChartHistoryPoint[] {
  return series.map((p) => {
    const rawY =
      view === 'retention'
        ? p.retentionPct ?? 0
        : segment === 'sessions'
          ? p.sessions
          : segment === 'signed_in'
            ? p.signedInUsers
            : p.combined;
    const y = view === 'growth' ? Math.max(0, rawY) : rawY;
    let dateIso: string;
    const utcLabel = p.label;
    if (p.label.startsWith('W ')) {
      dateIso = `${p.label.slice(2).trim()}T00:00:00.000Z`;
    } else if (p.label.includes('T')) {
      dateIso = p.label;
    } else {
      dateIso = `${p.label}T00:00:00.000Z`;
    }
    return { date: dateIso, price: y, utcLabel };
  });
}
