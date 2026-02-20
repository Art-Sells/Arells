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
}) => {
  const chartRef = useRef<ChartJS<'line', PricePoint[], unknown> | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const dataPoints = useMemo<PricePoint[]>(() => {
    return (history || []).map((item) => ({ x: new Date(item.date), y: item.price }));
  }, [history]);

  const yRange = useMemo(() => {
    if (!dataPoints.length) return null;
    const values = dataPoints.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const baseRange = Math.max(max - min, Math.max(Math.abs(max), 1) * 0.05);
    // Expand Y range to visually shorten the line without shrinking chart canvas height.
    const pad = baseRange * 0.3;
    return { min: min - pad, max: max + pad };
  }, [dataPoints]);

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
          borderColor: isInteracting ? activeColor : color,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0, // disable Chart.js hover dot; we render our own
          pointHoverBorderWidth: 0,
          pointHoverBorderColor: color,
          pointHoverBackgroundColor: backgroundColor,
          pointHitRadius: 20,
          tension: 0.25,
          borderWidth: 6.5,
          borderCapStyle: 'butt' as const,
          borderJoinStyle: 'miter' as const,
          clip: 12,
        },
      ],
    };
  }, [dataPoints, color, activeColor, backgroundColor, isInteracting]);

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

      let nearestIdx = 0;
      for (let i = 0; i < sorted.length; i += 1) {
        if (sorted[i].x.getTime() >= time) {
          nearestIdx = i;
          break;
        }
        nearestIdx = i;
      }

      const left = sorted[nearestIdx] ?? sorted[sorted.length - 1];
      const right = sorted[nearestIdx + 1] ?? left;
      let y = left.y;
      if (right && right !== left) {
        const x0 = left.x.getTime();
        const x1 = right.x.getTime();
        const t = x1 !== x0 ? (time - x0) / (x1 - x0) : 0;
        y = left.y + (right.y - left.y) * Math.min(Math.max(t, 0), 1);
      }

      return {
        point: { x: new Date(time), y },
        idx: nearestIdx,
        pixel: { x: xScale.getPixelForValue(time), y: yScale.getPixelForValue(y) },
      };
    },
    [dataPoints]
  );

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 0, autoPadding: false },
      animation: { duration: 1000, easing: 'easeOutQuart' as const },
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
  }, [xRange, yRange]);

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
      marker.style.left = `${pixel.x - 11.5}px`;
      marker.style.top = `${canvasOffsetTop + pixel.y - 11.5}px`;
      marker.style.display = 'block';
      marker.style.background = markerColor;
      marker.style.boxShadow = markerShadow;
      onPointHover?.(point, idx);
    },
    [onPointHover, markerColor, markerShadow, canvasOffsetTop]
  );

  const handlePointer = useCallback(
    (clientX: number, clientY: number, target: HTMLDivElement) => {
      const rect = target.getBoundingClientRect();
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
      style={{ height: interactiveHeight ?? height, position: 'relative' }}
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
