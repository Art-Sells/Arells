'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Tooltip, Filler);

export type MetricsLinePoint = {
  date: string;
  y: number;
  /** UTC bucket for hover copy (YYYY-MM-DD or week label like `W 2026-04-07`). */
  utcLabel?: string;
};

type InternalPoint = { x: Date; y: number; utcLabel: string };

type Props = {
  points: MetricsLinePoint[];
  color: string;
  markerColor: string;
  backgroundColor: string;
  markerShadow: string;
  height: number;
  interactiveHeight: number;
  canvasOffsetTop?: number;
  onPointHover?: (payload: { y: number; utcLabel: string } | null) => void;
};

const LINE_WIDTH = 6.5;
const MARKER = 33;
const MARKER_R = MARKER / 2;

function parseChartDate(s: string): Date {
  const raw = String(s ?? '');
  return new Date(raw.includes('T') ? raw : `${raw}T00:00:00.000Z`);
}

export function formatMetricsUtcBadgeLabel(utcLabel: string): string {
  const key = utcLabel.trim();
  if (key.startsWith('W ')) return key;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MetricsStandaloneLineChart({
  points,
  color,
  markerColor,
  backgroundColor,
  markerShadow,
  height,
  interactiveHeight,
  canvasOffsetTop = 0,
  onPointHover,
}: Props) {
  const chartRef = useRef<ChartJS<'line', { x: Date; y: number }[], unknown> | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);

  const dataPoints = useMemo<InternalPoint[]>(() => {
    return points
      .map((p) => {
        const x = parseChartDate(p.date);
        const utcLabel =
          p.utcLabel?.trim() ||
          (p.date.includes('T') ? p.date.slice(0, 10) : p.date);
        return { x, y: Math.max(0, p.y), utcLabel };
      })
      .filter((p) => Number.isFinite(p.x.getTime()))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [points]);

  const yRange = useMemo(() => {
    if (!dataPoints.length) return { min: 0, max: 1 };
    const values = dataPoints.map((p) => p.y);
    const max = Math.max(...values, 0);
    const minY = Math.min(...values, 0);
    const span = Math.max(max - minY, max * 0.05, 1);
    const pad = height < 250 ? span * 0.5 : span * 2;
    return { min: Math.min(0, minY - pad * 0.1), max: max + pad };
  }, [dataPoints, height]);

  const xRange = useMemo(() => {
    if (!dataPoints.length) return null;
    const ts = dataPoints.map((p) => p.x.getTime());
    return { min: Math.min(...ts), max: Math.max(...ts) };
  }, [dataPoints]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: 'Metrics',
          data: dataPoints.map((p) => ({ x: p.x, y: p.y })),
          borderColor: color,
          fill: false,
          tension: 0,
          stepped: false as const,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 24,
          borderWidth: LINE_WIDTH,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'miter' as const,
          clip: 12,
        },
      ],
    }),
    [dataPoints, color]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 0, autoPadding: false },
      animation: { duration: 0 },
      interaction: { mode: 'nearest' as const, intersect: false },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: {
          display: false,
          type: 'time' as const,
          min: xRange?.min,
          max: xRange?.max,
          bounds: 'data' as const,
          offset: false,
          time: { unit: 'day' as const },
          grid: { display: false, drawBorder: false },
          border: { display: false },
          ticks: { display: false },
        },
        y: {
          display: false,
          min: yRange.min,
          max: yRange.max,
          grid: { display: false, drawBorder: false },
          border: { display: false },
          ticks: { display: false },
        },
      },
      onHover: () => {},
    }),
    [xRange, yRange]
  );

  useEffect(() => {
    chartRef.current?.update();
  }, [chartData]);

  const resolveAtPixelX = useCallback(
    (pixelX: number) => {
      const chart = chartRef.current as any;
      if (!chart || !dataPoints.length) return null;
      const xScale = chart.scales?.x;
      const yScale = chart.scales?.y;
      if (!xScale || !yScale) return null;

      let tRaw = xScale.getValueForPixel(pixelX);
      const timeMs =
        typeof tRaw === 'number' ? tRaw : new Date(tRaw as string | Date).getTime();
      if (!Number.isFinite(timeMs)) return null;

      const t0 = dataPoints[0].x.getTime();
      const tLast = dataPoints[dataPoints.length - 1].x.getTime();
      const xMin = typeof xScale.min === 'number' ? xScale.min : t0;
      const xMax = typeof xScale.max === 'number' ? xScale.max : tLast;
      const clamped = Math.min(Math.max(timeMs, xMin), xMax);

      let i = 0;
      for (let j = 0; j < dataPoints.length - 1; j += 1) {
        const a = dataPoints[j].x.getTime();
        const b = dataPoints[j + 1].x.getTime();
        if (clamped >= a && clamped <= b) {
          i = j;
          break;
        }
        if (clamped > b) i = j;
      }
      i = Math.max(0, Math.min(i, dataPoints.length - 2));
      const left = dataPoints[i];
      const right = dataPoints[i + 1] ?? left;
      const xa = left.x.getTime();
      const xb = right.x.getTime();
      const u = xb !== xa ? (clamped - xa) / (xb - xa) : 0;
      const yy = left.y + u * (right.y - left.y);
      const utcLabel = u < 0.5 ? left.utcLabel : right.utcLabel;

      const px = xScale.getPixelForValue(clamped);
      const py = yScale.getPixelForValue(yy);
      return { y: Math.max(0, yy), utcLabel, pixel: { x: px, y: py } };
    },
    [dataPoints]
  );

  const updateMarker = useCallback(
    (pixel: { x: number; y: number } | null, payload: { y: number; utcLabel: string } | null) => {
      const marker = markerRef.current;
      if (!marker || !pixel || !payload) {
        if (marker) marker.style.display = 'none';
        onPointHover?.(null);
        return;
      }
      const chart = chartRef.current as any;
      const canvas: HTMLCanvasElement | undefined = chart?.canvas;
      const rect = canvas?.getBoundingClientRect();
      const maxX = rect ? rect.width : pixel.x;
      const maxY = rect ? rect.height - MARKER_R : pixel.y;
      const clampedX = Math.min(Math.max(pixel.x, 0), maxX);
      const clampedY = Math.min(Math.max(pixel.y, MARKER_R), maxY);
      marker.style.left = `${clampedX - MARKER_R}px`;
      marker.style.top = `${canvasOffsetTop + clampedY - MARKER_R}px`;
      marker.style.display = 'block';
      marker.style.background = `color-mix(in srgb, ${color} 20%, transparent)`;
      marker.style.borderColor = markerColor;
      marker.style.borderWidth = `${LINE_WIDTH}px`;
      marker.style.boxShadow = markerShadow;
      onPointHover?.(payload);
    },
    [onPointHover, canvasOffsetTop, color, markerColor, markerShadow]
  );

  const handlePointer = useCallback(
    (clientX: number, clientY: number, target: HTMLDivElement) => {
      const chart = chartRef.current as any;
      const canvas: HTMLCanvasElement | undefined = chart?.canvas;
      const rect = (canvas ?? target).getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        updateMarker(null, null);
        return;
      }
      const resolved = resolveAtPixelX(x);
      if (resolved) {
        updateMarker(resolved.pixel, { y: resolved.y, utcLabel: resolved.utcLabel });
      } else {
        updateMarker(null, null);
      }
    },
    [resolveAtPixelX, updateMarker]
  );

  useEffect(() => {
    const chart = chartRef.current;
    const canvas = chart?.canvas;
    const parent = canvas?.parentElement;
    if (!chart || !parent) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => chart.resize());
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        height: interactiveHeight,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 14,
      }}
      onMouseMove={(e) => handlePointer(e.clientX, e.clientY, e.currentTarget)}
      onMouseLeave={() => updateMarker(null, null)}
      onMouseDown={(e) => handlePointer(e.clientX, e.clientY, e.currentTarget)}
      onTouchMove={(e) => {
        const touch = e.touches?.[0];
        if (touch) handlePointer(touch.clientX, touch.clientY, e.currentTarget as HTMLDivElement);
      }}
      onTouchEnd={() => updateMarker(null, null)}
      onTouchStart={(e) => {
        const touch = e.touches?.[0];
        if (touch) handlePointer(touch.clientX, touch.clientY, e.currentTarget as HTMLDivElement);
      }}
    >
      <div style={{ height, position: 'relative', marginTop: canvasOffsetTop }}>
        <Line ref={chartRef as any} data={chartData} options={options as any} />
      </div>
      <div
        ref={markerRef}
        style={{
          position: 'absolute',
          width: MARKER,
          height: MARKER,
          borderRadius: '50%',
          border: `${LINE_WIDTH}px solid ${markerColor}`,
          boxSizing: 'border-box',
          background: `color-mix(in srgb, ${color} 20%, transparent)`,
          boxShadow: markerShadow,
          pointerEvents: 'none',
          display: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}
