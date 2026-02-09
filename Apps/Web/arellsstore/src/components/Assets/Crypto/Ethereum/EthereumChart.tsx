'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
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
  height?: number;
  onPointHover?: (point: PricePoint | null, index: number | null) => void;
  backgroundColor?: string;
};

const EthereumChart: React.FC<Props> = ({
  history = [],
  color = 'rgba(125, 92, 255, 0.9)',
  height = 240,
  onPointHover,
  backgroundColor = '#161616',
}) => {
  const chartRef = useRef<ChartJS<'line', PricePoint[], unknown> | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);

  const dataPoints = useMemo<PricePoint[]>(() => {
    return (history || []).map((item) => ({ x: new Date(item.date), y: item.price }));
  }, [history]);

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          label: 'Price',
          data: dataPoints,
          borderColor: color,
          backgroundColor: 'rgba(125, 92, 255, 0.1)',
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 0, // disable Chart.js hover dot; we render our own
          pointHoverBorderWidth: 0,
          pointHoverBorderColor: color,
          pointHoverBackgroundColor: backgroundColor,
          pointHitRadius: 20,
          tension: 0.25,
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
      interaction: { mode: 'nearest' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          type: 'time' as const,
          time: { unit: 'day' as const },
          grid: { display: false, drawBorder: false },
          ticks: { display: false }
        },
        y: {
          grid: { display: false, drawBorder: false },
          ticks: { display: false }
        }
      },
      onHover: () => {},
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.update('none');
    }
  }, [chartData]);

  const updateMarker = useCallback(
    (pixel: { x: number; y: number } | null, point: PricePoint | null, idx: number | null) => {
      const marker = markerRef.current;
      if (!marker) return;
      if (!pixel || !point) {
        marker.style.display = 'none';
        onPointHover?.(null, null);
        return;
      }
      marker.style.left = `${pixel.x - 13.5}px`;
      marker.style.top = `${pixel.y - 13.5}px`;
      marker.style.display = 'block';
      onPointHover?.(point, idx);
    },
    [onPointHover]
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
      style={{ height, position: 'relative' }}
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
      onTouchEnd={() => {
        updateMarker(null, null, null);
      }}
    >
      <Line ref={chartRef as any} data={chartData} options={options} />
      <div
        ref={markerRef}
        style={{
          position: 'absolute',
          width: 23,
          height: 23,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          background: backgroundColor,
          pointerEvents: 'none',
          display: 'none',
        }}
      />
    </div>
  );
};

export default EthereumChart;
