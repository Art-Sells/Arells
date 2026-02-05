import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [vapaMarketCap, setVapaMarketCap] = useState<number[]>([]);
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
        const vapaResponse = await axios.get('/api/vapa');
        const data = vapaResponse.data || {};
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
          setVapaMarketCap(Array.isArray(data.vapaMarketCap) ? data.vapaMarketCap : []);
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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const selectedXRef = useRef<number | null>(null);
  const chartRef = useRef<Chart<'line'> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [displayHistory, setDisplayHistory] = useState<PricePoint[]>([]);
  const displayedSignatureRef = useRef<string>('');
  const pendingHistoryRef = useRef<PricePoint[] | null>(null);
  const pendingSignatureRef = useRef<string>('');
  const [chartOpacity, setChartOpacity] = useState<number>(0);
  const [opacityDuration] = useState<string>('0.7s');
  const initialFadeRef = useRef<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (!filteredHistory.length) {
      setSelectedIndex(null);
      setSelectedX(null);
      return;
    }
    if (selectedIndex != null && selectedIndex >= filteredHistory.length) {
      setSelectedIndex(filteredHistory.length - 1);
    }
  }, [filteredHistory, selectedIndex]);

  const updateSelection = (chart: Chart<'line'> | null, eventX: number | null) => {
    if (!chart) return;
    if (eventX == null) {
      setSelectedIndex(null);
      setSelectedX(null);
      setSelectedY(null);
      selectedXRef.current = null;
      chart.draw();
      return;
    }
    const { chartArea, scales } = chart;
    const clampedX = Math.min(Math.max(eventX, chartArea.left), chartArea.right);
    setSelectedX(clampedX);
    selectedXRef.current = clampedX;
    const ts = scales.x.getValueForPixel(clampedX) as number;
    if (!displayHistory.length || !Number.isFinite(ts)) {
      setSelectedIndex(null);
      chart.draw();
      return;
    }
    let lo = 0;
    let hi = displayHistory.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (displayHistory[mid].x.getTime() < ts) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    let idx = lo;
    if (idx > 0) {
      const prev = displayHistory[idx - 1].x.getTime();
      const curr = displayHistory[idx].x.getTime();
      if (Math.abs(ts - prev) <= Math.abs(curr - ts)) {
        idx = idx - 1;
      }
    }
    setSelectedIndex(idx);
    const element = chart.getDatasetMeta(0).data[idx] as any;
    setSelectedY(element?.y ?? null);
    chart.draw();
  };

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filteredSignature = useMemo(() => {
    if (!filteredHistory.length) return 'empty';
    const start = filteredHistory[0].x.getTime();
    const end = filteredHistory[filteredHistory.length - 1].x.getTime();
    return `${filteredHistory.length}-${start}-${end}`;
  }, [filteredHistory]);

  useEffect(() => {
    if (!filteredHistory.length) {
      setDisplayHistory([]);
      setChartOpacity(1);
      setIsFadingOut(false);
      pendingHistoryRef.current = null;
      pendingSignatureRef.current = '';
      displayedSignatureRef.current = 'empty';
      return;
    }
    if (!displayHistory.length) {
      setDisplayHistory(filteredHistory);
      setIsFadingOut(false);
      displayedSignatureRef.current = filteredSignature;
      if (!initialFadeRef.current) {
        initialFadeRef.current = true;
        setChartOpacity(0);
        requestAnimationFrame(() => {
          window.setTimeout(() => setChartOpacity(1), 30);
        });
      } else {
        setChartOpacity(1);
      }
      return;
    }
    if (displayedSignatureRef.current === filteredSignature) {
      return;
    }
    setSelectedIndex(null);
    setSelectedX(null);
    selectedXRef.current = null;
    pendingHistoryRef.current = filteredHistory;
    pendingSignatureRef.current = filteredSignature;
    setIsFadingOut(true);
    setChartOpacity(0);
  }, [filteredHistory, filteredSignature, displayHistory.length]);

  const interactiveHistory = displayHistory;

  const activePoint = useMemo(() => {
    if (!interactiveHistory.length) return null;
    if (selectedIndex != null && interactiveHistory[selectedIndex]) {
      return interactiveHistory[selectedIndex];
    }
    return interactiveHistory[interactiveHistory.length - 1];
  }, [interactiveHistory, selectedIndex]);

  const baselinePrice = useMemo(() => {
    if (!interactiveHistory.length) return null;
    return interactiveHistory[0].y;
  }, [interactiveHistory]);

  const percentageIncrease = useMemo(() => {
    if (!activePoint || baselinePrice == null || baselinePrice === 0) return null;
    return ((activePoint.y - baselinePrice) / baselinePrice) * 100;
  }, [activePoint, baselinePrice]);

  const marketStatus = useMemo(() => {
    if (percentageIncrease === null) return 'Sloth';
    return percentageIncrease > 0 ? 'Bull' : 'Sloth';
  }, [percentageIncrease]);

  const activeMarketCap = useMemo(() => {
    if (!activePoint || !history.length || !vapaMarketCap.length) return null;
    const idx = history.findIndex((h) => h.x.getTime() === activePoint.x.getTime());
    if (idx === -1) return null;
    return typeof vapaMarketCap[idx] === 'number' ? vapaMarketCap[idx] : null;
  }, [activePoint, history, vapaMarketCap]);

  const chartData: ChartData<'line', PricePoint[]> = useMemo(
    () => ({
      datasets: [
        {
          label: 'Bitcoin',
          data: displayHistory,
          borderColor: 'rgba(248, 141, 0, 0.9)',
          backgroundColor: 'rgba(248, 141, 0, 0.15)',
          borderCapStyle: 'round',
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 25,
          pointBorderWidth: 0,
          pointHoverBackgroundColor: 'rgba(248, 141, 0, 0.95)',
          pointHoverBorderColor: 'rgba(248, 141, 0, 0)',
          pointHoverBorderWidth: 0,
          cubicInterpolationMode: 'monotone',
          tension: 0.25,
          fill: false,
          borderWidth: 3
        }
      ]
    }),
    [displayHistory]
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
      layout: {
        padding: { top: 10, bottom: 10 }
      },
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
            title: (items) => {
              const item = items[0];
              if (!item || !item.parsed.x) return '';
              return new Date(item.parsed.x as number).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            },
            label: () => '' // hide price in tooltip body
          },
          boxPadding: 0,
          padding: 8,
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderWidth: 0
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      onHover: undefined,
      onLeave: undefined,
      onClick: undefined
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

  const formatMarketCap = (value: number | null) => {
    if (value == null) return '...';
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', border: '1px solid #333', borderRadius: '8px', padding: '16px', background: '#161616', opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
        <div>(Bitcoin)</div>
        <div>
          Price: $
          {formatCurrency(activePoint?.y ?? vapa)}
        </div>
        <div>Market Cap: ${formatMarketCap(activeMarketCap)}</div>
        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '10px', display: 'grid', gap: '10px' }}>
          <div>+{formatPercent(percentageIncrease)}%</div>
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
      </div>
      <div
        ref={chartContainerRef}
        style={{
          position: 'relative',
          minWidth: 0,
          width: '100%',
          opacity: chartOpacity,
          transition: `opacity ${opacityDuration} ease`
        }}
        onMouseLeave={() => updateSelection(chartRef.current, null)}
        onTouchEnd={() => updateSelection(chartRef.current, null)}
        onTransitionEnd={(event) => {
          if (event.propertyName !== 'opacity') return;
          if (!isFadingOut) return;
          const pending = pendingHistoryRef.current;
          if (!pending || !pending.length) {
            setIsFadingOut(false);
            setChartOpacity(1);
            return;
          }
          setDisplayHistory(pending);
          displayedSignatureRef.current = pendingSignatureRef.current;
          pendingHistoryRef.current = null;
          pendingSignatureRef.current = '';
          setIsFadingOut(false);
          requestAnimationFrame(() => setChartOpacity(1));
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            transform: 'none',
            fontSize: 'inherit',
            color: '#f5f5f5',
            background: '#161616',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '4px 8px',
            zIndex: 2,
            pointerEvents: 'none',
            opacity: selectedX != null && activePoint ? 1 : 0
          }}
        >
          {selectedX != null && activePoint
            ? activePoint.x.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : ''}
        </div>
        {selectedX != null && (
          <div
            style={{
              position: 'absolute',
              left: selectedX,
              top: selectedY ?? 0,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#1e1e1e',
              border: '3px solid rgba(248, 141, 0, 0.9)',
              transform: 'translate(-10px, -13px)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}
        {loading && <div>Loading chart...</div>}
        {error && !loading && <div>Error loading chart</div>}
        {!loading && !error && displayHistory.length > 0 && (
          <Line
            ref={chartRef}
            data={chartData}
            options={options}
            height={200}
            onMouseMove={(event) => {
              const chart = chartRef.current;
              if (!chart) return;
              const rect = chart.canvas.getBoundingClientRect();
              const eventX = event.nativeEvent.clientX - rect.left;
              updateSelection(chart, eventX);
            }}
            onClick={(event) => {
              const chart = chartRef.current;
              if (!chart) return;
              const rect = chart.canvas.getBoundingClientRect();
              const eventX = event.nativeEvent.clientX - rect.left;
              updateSelection(chart, eventX);
            }}
            onTouchMove={(event) => {
              const chart = chartRef.current;
              if (!chart) return;
              const rect = chart.canvas.getBoundingClientRect();
              const touch = event.touches[0];
              const eventX = touch ? touch.clientX - rect.left : null;
              updateSelection(chart, eventX);
            }}
            onTouchStart={(event) => {
              const chart = chartRef.current;
              if (!chart) return;
              const rect = chart.canvas.getBoundingClientRect();
              const touch = event.touches[0];
              const eventX = touch ? touch.clientX - rect.left : null;
              updateSelection(chart, eventX);
            }}
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