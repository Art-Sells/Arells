'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend, Filler);

type PricePoint = { x: Date; y: number };

type Props = {
  history?: { date: string; price: number }[];
  color?: string;
  activeColor?: string;
  markerColor?: string;
  gridColor?: string;
  gridSpacing?: number;
  height?: number;
  interactiveHeight?: number;
  canvasOffsetTop?: number;
  onPointHover?: (point: PricePoint | null, index: number | null) => void;
  backgroundColor?: string;
  markerShadow?: string;
  animationDurationMs?: number;
  yRangeOverride?: { min: number; max: number } | null;
};

const EthereumChart: React.FC<Props> = ({
  history = [],
  color = 'rgba(107, 114, 168, 0.9)',
  activeColor = 'rgba(107, 114, 168, 1)',
  markerColor = 'rgba(107, 114, 168, 1)',
  gridColor = 'rgba(107, 114, 168, 0.2)',
  gridSpacing = 20,
  height = 240,
  interactiveHeight,
  canvasOffsetTop = 0,
  onPointHover,
  backgroundColor = '#161616',
  markerShadow = '-8px 0 14px rgba(107, 114, 168, 0.28), 0 7px 10px rgba(107, 114, 168, 0.2)',
  animationDurationMs = 1000,
  yRangeOverride = null,
}) => {
  const chartRef = useRef<ChartJS<'line', PricePoint[], unknown> | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const cubicAt = useCallback((p0: number, c1: number, c2: number, p1: number, t: number) => {
    const u = 1 - t;
    return (
      u * u * u * p0 +
      3 * u * u * t * c1 +
      3 * u * t * t * c2 +
      t * t * t * p1
    );
  }, []);

  const solveTForX = useCallback(
    (xTarget: number, x0: number, x1: number, x2: number, x3: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 24; i += 1) {
        const mid = (lo + hi) / 2;
        const x = cubicAt(x0, x1, x2, x3, mid);
        if (x < xTarget) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    },
    [cubicAt]
  );

  const dataPoints = useMemo<PricePoint[]>(() => {
    const points = (history || [])
      .map((item) => {
        const raw = String(item?.date ?? '');
        const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00.000Z`);
        return { x: d, y: item.price } as PricePoint;
      })
      .filter((p) => Number.isFinite(p.x.getTime()) && Number.isFinite(p.y))
      .sort((a, b) => a.x.getTime() - b.x.getTime());

    // Deduplicate identical timestamps (prevents hover "bouncing" when x-values repeat).
    const deduped: PricePoint[] = [];
    for (const p of points) {
      const t = p.x.getTime();
      const last = deduped[deduped.length - 1];
      if (last && last.x.getTime() === t) {
        deduped[deduped.length - 1] = p;
      } else {
        deduped.push(p);
      }
    }
    return deduped;
  }, [history]);

  const yRange = useMemo(() => {
    if (yRangeOverride) {
      const min = yRangeOverride.min;
      const max = yRangeOverride.max;
      if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
      const baseRange = Math.max(max - min, Math.max(Math.abs(max), 1) * 0.05);
      const pad = baseRange * 2;
      return { min: min - pad, max: max + pad };
    }
    if (!dataPoints.length) return null;
    const values = dataPoints.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const baseRange = Math.max(max - min, Math.max(Math.abs(max), 1) * 0.05);
    // Expand Y range to visually shorten the line without shrinking chart canvas height.
    const pad = baseRange * 2;
    return { min: min - pad, max: max + pad };
  }, [dataPoints, yRangeOverride]);

  const xRange = useMemo(() => {
    if (!dataPoints.length) return null;
    const times = dataPoints.map((p) => p.x.getTime()).filter((t) => Number.isFinite(t));
    if (!times.length) return null;
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [dataPoints]);

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          label: 'Price',
          data: dataPoints,
          // Keep borderColor stable so hover doesn't trigger a chart update (which would hide the marker).
          borderColor: color,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0, // disable Chart.js hover dot; we render our own
          pointHoverBorderWidth: 0,
          pointHoverBorderColor: color,
          pointHoverBackgroundColor: backgroundColor,
          pointHitRadius: 20,
          // When the 24h range collapses to 2 points, keep the segment perfectly straight.
          tension: dataPoints.length < 3 ? 0 : 0.25,
          borderWidth: 6.5,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
          clip: 12,
        },
      ],
    };
  }, [dataPoints, color, backgroundColor]);

  const resolvePointAtPixel = useCallback(
    (pixelX: number | null) => {
      const chart = chartRef.current;
      if (!chart || pixelX == null) return null;
      const xScale: any = chart.scales?.x;
      const yScale: any = chart.scales?.y;
      if (!xScale || !yScale) return null;
      let xVal: any = xScale.getValueForPixel(pixelX);
      if (xVal == null) return null;
      let time = typeof xVal === 'number' ? xVal : new Date(xVal).getTime();
      const min = typeof xScale.min === 'number' ? xScale.min : null;
      const max = typeof xScale.max === 'number' ? xScale.max : null;
      if (min != null && max != null) {
        if (!Number.isFinite(time)) return null;
        time = Math.min(Math.max(time, min), max);
      }
      if (!Number.isFinite(time)) return null;
      const sorted = dataPoints;
      if (!sorted.length) return null;

      let segIdx = 0;
      for (let i = 0; i < sorted.length - 1; i += 1) {
        const t0 = sorted[i].x.getTime();
        const t1 = sorted[i + 1].x.getTime();
        if (time >= t0 && time <= t1) {
          segIdx = i;
          break;
        }
        if (time > t1) segIdx = i;
      }
      segIdx = Math.max(0, Math.min(segIdx, Math.max(sorted.length - 2, 0)));

      const xTargetPx = xScale.getPixelForValue(time);

      const meta: any = chart.getDatasetMeta?.(0);
      const elems: any[] | undefined = meta?.data;
      const e0: any = elems?.[segIdx];
      const e1: any = elems?.[segIdx + 1];

      const fallbackLinear = () => {
        const left = sorted[segIdx] ?? sorted[sorted.length - 1];
        const right = sorted[segIdx + 1] ?? left;
        let y = left.y;
        if (right && right !== left) {
          const x0 = left.x.getTime();
          const x1 = right.x.getTime();
          const t = x1 !== x0 ? (time - x0) / (x1 - x0) : 0;
          y = left.y + (right.y - left.y) * Math.min(Math.max(t, 0), 1);
        }
        return {
          point: { x: new Date(time), y },
          idx: segIdx,
          pixel: { x: xTargetPx, y: yScale.getPixelForValue(y) },
        };
      };

      if (!e0 || !e1 || typeof e0.x !== 'number' || typeof e1.x !== 'number') {
        return fallbackLinear();
      }

      // For 2-point (or effectively 2-point) lines, enforce straight-line marker behavior.
      if ((elems?.length ?? 0) < 3) {
        const p0x = e0.x;
        const p0y = e0.y;
        const p1x = e1.x;
        const p1y = e1.y;
        const tLin = p1x !== p0x ? (xTargetPx - p0x) / (p1x - p0x) : 0;
        const tt = Math.min(Math.max(tLin, 0), 1);
        const px = p0x + (p1x - p0x) * tt;
        const py = p0y + (p1y - p0y) * tt;
        const xValOnLine: any = xScale.getValueForPixel(px);
        const timeOnLine = typeof xValOnLine === 'number' ? xValOnLine : new Date(xValOnLine).getTime();
        const yValOnLine = yScale.getValueForPixel(py);
        return {
          point: { x: new Date(timeOnLine), y: yValOnLine },
          idx: segIdx,
          pixel: { x: px, y: py },
        };
      }

      const p0x = e0.x;
      const p0y = e0.y;
      const p1x = e1.x;
      const p1y = e1.y;
      const c1x = typeof e0.controlPointNextX === 'number' ? e0.controlPointNextX : (p0x + p1x) / 2;
      const c1y = typeof e0.controlPointNextY === 'number' ? e0.controlPointNextY : p0y;
      const c2x = typeof e1.controlPointPreviousX === 'number' ? e1.controlPointPreviousX : (p0x + p1x) / 2;
      const c2y = typeof e1.controlPointPreviousY === 'number' ? e1.controlPointPreviousY : p1y;

      const t = solveTForX(xTargetPx, p0x, c1x, c2x, p1x);
      const px = cubicAt(p0x, c1x, c2x, p1x, t);
      const py = cubicAt(p0y, c1y, c2y, p1y, t);

      const xValOnCurve: any = xScale.getValueForPixel(px);
      const timeOnCurve =
        typeof xValOnCurve === 'number' ? xValOnCurve : new Date(xValOnCurve).getTime();
      const yValOnCurve = yScale.getValueForPixel(py);

      return {
        point: { x: new Date(timeOnCurve), y: yValOnCurve },
        idx: segIdx,
        pixel: { x: px, y: py },
      };
    },
    [dataPoints, cubicAt, solveTForX]
  );

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 0, autoPadding: false },
      animation: {
        duration: animationDurationMs,
        easing: 'easeOutQuart' as const,
      },
      interaction: { mode: 'nearest' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
    },
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
          ticks: { display: false }
      },
      y: {
          display: false,
          min: yRange?.min,
          max: yRange?.max,
          grid: { display: false, drawBorder: false },
          border: { display: false },
          ticks: { display: false }
      }
    },
      onHover: () => {},
    };
  }, [xRange, yRange, animationDurationMs]);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.update();
    }
  }, [chartData]);

  const updateMarker = useCallback(
    (pixel: { x: number; y: number } | null, point: PricePoint | null, idx: number | null) => {
      const marker = markerRef.current;
      if (!marker) return;
      if (!pixel || !point) {
        marker.style.display = 'none';
        setIsInteracting(false);
        onPointHover?.(null, null);
        return;
      }
      setIsInteracting(true);
      const chart = chartRef.current as any;
      const canvas: HTMLCanvasElement | null | undefined = chart?.canvas;
      const rect = canvas?.getBoundingClientRect();
      const radius = 11.5;
      // Let the dot travel fully to the left/right edges (half-dot clipped by overflow:hidden),
      // but keep it fully visible vertically.
      const maxX = rect ? rect.width : pixel.x;
      const maxY = rect ? rect.height - radius : pixel.y;
      const clampedX = Math.min(Math.max(pixel.x, 0), maxX);
      const clampedY = Math.min(Math.max(pixel.y, radius), maxY);
      marker.style.left = `${clampedX - radius}px`;
      marker.style.top = `${canvasOffsetTop + clampedY - radius}px`;
      marker.style.display = 'block';
      marker.style.background = markerColor;
      marker.style.boxShadow = markerShadow;
      onPointHover?.(point, idx);
    },
    [onPointHover, markerColor, markerShadow, canvasOffsetTop]
  );

  const handlePointer = useCallback(
    (clientX: number, clientY: number, target: HTMLDivElement) => {
      const chart = chartRef.current as any;
      const canvas: HTMLCanvasElement | null | undefined = chart?.canvas;
      const rect = (canvas ?? target).getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        updateMarker(null, null, null);
        return;
      }
      const resolved = resolvePointAtPixel(x);
      if (resolved) {
        updateMarker(resolved.pixel, resolved.point, resolved.idx);
      } else {
        updateMarker(null, null, null);
      }
    },
    [resolvePointAtPixel, updateMarker]
  );

  return (
    <div
      style={{ height: interactiveHeight ?? height, position: 'relative', overflow: 'hidden', borderRadius: 14 }}
      onMouseMove={(e) => {
        handlePointer(e.clientX, e.clientY, e.currentTarget as HTMLDivElement);
      }}
      onTouchMove={(e) => {
        const touch = e.touches?.[0];
        if (!touch) return;
        handlePointer(touch.clientX, touch.clientY, e.currentTarget as HTMLDivElement);
      }}
      onMouseLeave={() => {
        updateMarker(null, null, null);
      }}
      onMouseDown={(e) => {
        handlePointer(e.clientX, e.clientY, e.currentTarget as HTMLDivElement);
      }}
      onClick={(e) => {
        handlePointer(e.clientX, e.clientY, e.currentTarget as HTMLDivElement);
      }}
      onTouchEnd={() => {
        updateMarker(null, null, null);
      }}
      onTouchStart={(e) => {
        const touch = e.touches?.[0];
        if (!touch) return;
        handlePointer(touch.clientX, touch.clientY, e.currentTarget as HTMLDivElement);
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: 14,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `repeating-linear-gradient(to right, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent ${gridSpacing}px), repeating-linear-gradient(to bottom, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent ${gridSpacing}px)`,
        }}
      />
      <div style={{ height, position: 'relative', marginTop: canvasOffsetTop }}>
      <Line ref={chartRef as any} data={chartData} options={options} />
        </div>
      <div
        ref={markerRef}
        style={{
          position: 'absolute',
          width: 23,
          height: 23,
          borderRadius: '50%',
          border: 'none',
          background: markerColor,
          boxShadow: markerShadow,
          pointerEvents: 'none',
          display: 'none',
          zIndex: 2,
          transition: 'background 1s ease, box-shadow 1s ease',
        }}
      />
    </div>
  );
};

export default EthereumChart;
