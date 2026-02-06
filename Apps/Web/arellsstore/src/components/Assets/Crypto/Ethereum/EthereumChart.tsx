'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type PricePoint = { x: Date; y: number };

type Props = {
  history?: { date: string; price: number }[];
  color?: string;
};

const EthereumChart: React.FC<Props> = ({ history = [], color = 'rgba(125, 92, 255, 0.9)' }) => {
  const chartRef = useRef<ChartJS<'line', PricePoint[], unknown> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
          tension: 0.25,
        },
      ],
    };
  }, [dataPoints, color]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx: any) => {
            const v = ctx?.parsed?.y;
            return typeof v === 'number' ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day' },
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.08)' },
        ticks: {
          callback: (value: number | string) => {
            const num = typeof value === 'number' ? value : Number(value);
            return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
          }
        }
      }
    },
    onHover: (event: any, active: any[]) => {
      if (active?.length) {
        setSelectedIndex(active[0].index);
      } else {
        setSelectedIndex(null);
      }
    }
  }), [setSelectedIndex]);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.update('none');
    }
  }, [chartData]);

  return (
    <div style={{ height: 240 }}>
      <Line ref={chartRef as any} data={chartData} options={options} />
      {selectedIndex != null && dataPoints[selectedIndex] && (
        <div style={{ marginTop: 8, color: '#f5f5f5' }}>
          {dataPoints[selectedIndex].x.toLocaleDateString('en-US')}: $
          {dataPoints[selectedIndex].y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

export default EthereumChart;
