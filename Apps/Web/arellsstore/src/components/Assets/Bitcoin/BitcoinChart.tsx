import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

Chart.register(...registerables);

interface PricePoint {
  x: Date;
  y: number;
}

type RangeDays = number | null;

const RANGE_PRESETS: { label: string; days: RangeDays }[] = [
  { label: '24 hours', days: 1 },
  { label: '1 wk', days: 7 },
  { label: '1 mnth', days: 30 },
  { label: '3 mnths', days: 90 },
  { label: '1 yr', days: 365 },
  { label: 'All', days: null }
];

const BitcoinChart: React.FC = () => {
  const [vapa, setVapa] = useState<number>(0);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [rangeDays, setRangeDays] = useState<RangeDays>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [statusModalMode, setStatusModalMode] = useState<'Bull' | 'Sloth'>('Bull');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/vapa');
        const data = res.data || {};
        const hist = Array.isArray(data.history) ? data.history : [];
        const parsedHistory: PricePoint[] = hist
          .map((entry: any) => {
            const d = new Date(entry.date);
            const price = Number(entry.price);
            if (Number.isNaN(d.getTime()) || Number.isNaN(price)) return null;
            return { x: d, y: price };
          })
          .filter(Boolean) as PricePoint[];
        parsedHistory.sort((a, b) => a.x.getTime() - b.x.getTime());
        if (isMounted) {
          setVapa(typeof data.vapa === 'number' ? data.vapa : 0);
          setHistory(parsedHistory);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    if (rangeDays == null) return history;
    const latestTs = history[history.length - 1].x.getTime();
    const startTs = latestTs - rangeDays * 24 * 60 * 60 * 1000;
    return history.filter((p) => p.x.getTime() >= startTs);
  }, [history, rangeDays]);

  const percentageIncrease = useMemo(() => {
    if (filteredHistory.length < 1) return null;
    const start = filteredHistory[0].y;
    const end = filteredHistory[filteredHistory.length - 1].y;
    if (start === 0) return null;
    return ((end - start) / start) * 100;
  }, [filteredHistory]);

  const marketStatus = useMemo(() => {
    if (percentageIncrease === null) return 'Sloth';
    return percentageIncrease > 0 ? 'Bull' : 'Sloth';
  }, [percentageIncrease]);

  const chartData: ChartData<'line', PricePoint[]> = useMemo(
    () => ({
      datasets: [
        {
          label: 'Bitcoin',
          data: filteredHistory,
          borderColor: 'rgba(248, 141, 0, 0.9)',
          backgroundColor: 'rgba(248, 141, 0, 0.15)',
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 0,
          pointBorderWidth: 0,
          cubicInterpolationMode: 'monotone',
          tension: 0.25,
          fill: false,
          borderWidth: 3
        }
      ]
    }),
    [filteredHistory]
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy'
          },
          adapters: { date: { locale: enUS } },
          ticks: { display: false },
          grid: { display: false }
        },
        y: {
          beginAtZero: false,
          ticks: { display: false },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          displayColors: false,
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: (ctx) => {
              const y = ctx.parsed.y;
              return y != null ? `$${y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
            }
          },
          // Simplify tooltip box
          boxPadding: 0,
          padding: 6,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderWidth: 0
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }),
    [filteredHistory]
  );

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '...';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (value: number | null) => {
    if (value == null) return '...';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', border: '1px solid #333', borderRadius: '8px', padding: '16px', background: '#161616', opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>(Bitcoin): ${formatCurrency(vapa)}</div>
        <div>
          <button
            type="button"
            onClick={() => {
              setStatusModalMode(marketStatus === 'Bull' ? 'Bull' : 'Sloth');
              setShowStatusModal(true);
            }}
            style={{
              background: 'transparent',
              color: '#00e5ff',
              border: '1px solid #00e5ff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '4px 10px'
            }}
          >
            {marketStatus === 'Bull' ? 'Bull 🐂 Market' : 'Sloth 🦥 Market'}
          </button>
        </div>
        <div>+{formatPercent(percentageIncrease)}%</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {RANGE_PRESETS.map((r) => {
            const isActive = rangeDays === r.days;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeDays(isActive ? null : r.days)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #00e5ff' : '1px solid #333',
                  background: isActive ? '#0b2f33' : '#202020',
                  color: isActive ? '#00e5ff' : '#f5f5f5',
                  cursor: 'pointer'
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {loading && <div>Loading chart...</div>}
        {error && !loading && <div>Error loading chart</div>}
        {!loading && !error && filteredHistory.length > 0 && (
          <Line
            data={chartData}
            options={options}
            height={200}
          />
        )}
        {!loading && !error && filteredHistory.length === 0 && <div>No data</div>}
      </div>
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            style={{
              background: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '16px',
              minWidth: '280px',
              color: '#f5f5f5'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>
              {statusModalMode === 'Bull' ? 'Bull Market' : 'Sloth Market'}
            </div>
            {statusModalMode === 'Bull' ? (
              <div style={{ marginBottom: '12px' }}>A market in which investments increase.</div>
            ) : (
              <div style={{ marginBottom: '12px' }}>A market in which investments stagnate.</div>
            )}
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              style={{ padding: '6px 12px', border: '1px solid #555', background: '#00e5ff', color: '#000', borderRadius: '6px', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BitcoinChart;