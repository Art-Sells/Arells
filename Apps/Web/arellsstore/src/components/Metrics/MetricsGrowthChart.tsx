'use client';

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import BitcoinChart from '../Assets/Crypto/Bitcoin/BitcoinChart';

export type MetricsChartHistoryPoint = { date: string; price: number };

type AccentPack = {
  color: string;
  activeColor: string;
  markerColor: string;
  gridColor: string;
  backgroundColor: string;
  markerShadow: string;
  gridCss: string;
};

function parseRgb(cssColor: string): { r: number; g: number; b: number } | null {
  const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function packFromRgb(rgb: string): AccentPack {
  const p = parseRgb(rgb);
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

function readTitleBarRgb(): string {
  if (typeof document === 'undefined') return 'rgb(248, 141, 0)';
  const el = document.querySelector('.auth-title-bar');
  if (el) {
    const c = getComputedStyle(el).color;
    if (c && c !== 'rgba(0, 0, 0, 0)') return c;
  }
  const root = getComputedStyle(document.documentElement).color;
  return root || 'rgb(248, 141, 0)';
}

type Props = {
  history: MetricsChartHistoryPoint[];
  loading: boolean;
  onPointHover?: (point: { x: Date; y: number } | null) => void;
};

const CHART_HEIGHT = 200;
const PANEL_HEIGHT = 300;
const TOP_PAD = 8;

export default function MetricsGrowthChart({ history, loading, onPointHover }: Props) {
  const [accent, setAccent] = useState<AccentPack>(() => packFromRgb('rgb(248, 141, 0)'));
  const [chartReady, setChartReady] = useState(false);

  useLayoutEffect(() => {
    setAccent(packFromRgb(readTitleBarRgb()));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAccent(packFromRgb(readTitleBarRgb()));
    }, 600);
    return () => window.clearInterval(id);
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

  const [hoverUi, setHoverUi] = useState<{ x: Date; y: number } | null>(null);

  const onChartPoint = useCallback(
    (point: { x: Date; y: number } | null) => {
      setHoverUi(point);
      handleHover(point);
    },
    [handleHover]
  );

  return (
    <div
      className="metrics-chart-wrap-panel"
      style={{ position: 'relative', height: `${PANEL_HEIGHT}px`, padding: 0 }}
    >
      {hoverUi != null && (
        <div className="asset-chart-date-badge asset-chart-date-badge--bitcoin metrics-chart-date-badge">
          <span className="asset-metric-inline-title--bitcoin">Date:</span>{' '}
          <span className="asset-metric-inline-value">
            {hoverUi.x.toLocaleDateString('en-US', { timeZone: 'UTC' })}
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
        aria-hidden="true"
        className="metrics-chart-bg-grid"
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: 14,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: accent.gridCss,
        }}
      />
      <div
        className={`asset-chart-fade asset-chart-interactive metrics-chart-interactive${
          chartReady && !loading ? ' is-visible' : ''
        }${chartReady && !loading ? '' : ' is-disabled'}`}
      >
        <BitcoinChart
          history={history}
          color={accent.color}
          activeColor={accent.activeColor}
          markerColor={accent.markerColor}
          gridColor="transparent"
          gridSpacing={30}
          height={CHART_HEIGHT}
          interactiveHeight={PANEL_HEIGHT}
          canvasOffsetTop={TOP_PAD}
          backgroundColor={accent.backgroundColor}
          markerShadow={accent.markerShadow}
          animateOn={false}
          animationDurationMs={0}
          onPointHover={(point) => onChartPoint(point)}
        />
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
    const y =
      view === 'retention'
        ? p.retentionPct ?? 0
        : segment === 'sessions'
          ? p.sessions
          : segment === 'signed_in'
            ? p.signedInUsers
            : p.combined;
    let dateIso: string;
    if (p.label.startsWith('W ')) {
      dateIso = `${p.label.slice(2).trim()}T12:00:00.000Z`;
    } else if (p.label.includes('T')) {
      dateIso = p.label;
    } else {
      dateIso = `${p.label}T12:00:00.000Z`;
    }
    return { date: dateIso, price: y };
  });
}
