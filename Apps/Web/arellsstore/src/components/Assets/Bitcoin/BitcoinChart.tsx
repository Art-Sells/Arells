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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const selectedXRef = useRef<number | null>(null);
  const frontChartRef = useRef<Chart<'line'> | null>(null);
  const backChartRef = useRef<Chart<'line'> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const [frontHistory, setFrontHistory] = useState<PricePoint[]>([]);
  const [backHistory, setBackHistory] = useState<PricePoint[]>([]);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const frontSignatureRef = useRef<string>('');
  const [displayHistory, setDisplayHistory] = useState<PricePoint[]>([]);
  const displayedSignatureRef = useRef<string>('');

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
      selectedXRef.current = null;
      chart.draw();
      return;
    }
    const { chartArea, scales } = chart;
    const clampedX = Math.min(Math.max(eventX, chartArea.left), chartArea.right);
    setSelectedX(clampedX);
    selectedXRef.current = clampedX;
    const ts = scales.x.getValueForPixel(clampedX) as number;
    if (!filteredHistory.length || !Number.isFinite(ts)) {
      setSelectedIndex(null);
      chart.draw();
      return;
    }
    let lo = 0;
    let hi = filteredHistory.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (filteredHistory[mid].x.getTime() < ts) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    let idx = lo;
    if (idx > 0) {
      const prev = filteredHistory[idx - 1].x.getTime();
      const curr = filteredHistory[idx].x.getTime();
      if (Math.abs(ts - prev) <= Math.abs(curr - ts)) {
        idx = idx - 1;
      }
    }
    setSelectedIndex(idx);
    chart.draw();
  };

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (frontChartRef.current) {
        frontChartRef.current.resize();
      }
      if (backChartRef.current) {
        backChartRef.current.resize();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scheduleSwap = (callback: () => void, delay: number) => {
    if (fadeTimeoutRef.current != null) {
      window.clearTimeout(fadeTimeoutRef.current);
    }
    fadeTimeoutRef.current = window.setTimeout(callback, delay);
  };

  const filteredSignature = useMemo(() => {
    if (!filteredHistory.length) return 'empty';
    const start = filteredHistory[0].x.getTime();
    const end = filteredHistory[filteredHistory.length - 1].x.getTime();
    return `${filteredHistory.length}-${start}-${end}`;
  }, [filteredHistory]);

  useEffect(() => {
    if (!filteredHistory.length) {
      setFrontHistory([]);
      setBackHistory([]);
      setIsTransitioning(false);
      frontSignatureRef.current = 'empty';
      return;
    }
    if (!frontHistory.length) {
      setFrontHistory(filteredHistory);
      setBackHistory([]);
      setIsTransitioning(false);
      frontSignatureRef.current = filteredSignature;
      return;
    }
    if (frontSignatureRef.current === filteredSignature) {
      return;
    }
    setSelectedIndex(null);
    setSelectedX(null);
    selectedXRef.current = null;
    setBackHistory(filteredHistory);
    setIsTransitioning(true);
    scheduleSwap(() => {
      setFrontHistory(filteredHistory);
      setBackHistory([]);
      setIsTransitioning(false);
      frontSignatureRef.current = filteredSignature;
    }, 350);
  }, [filteredHistory, filteredSignature, frontHistory.length]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current != null) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const interactiveHistory = isTransitioning ? backHistory : frontHistory;

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

  const frontChartData: ChartData<'line', PricePoint[]> = useMemo(
    () => ({
      datasets: [
        {
          label: 'Bitcoin',
          data: frontHistory,
          borderColor: 'rgba(248, 141, 0, 0.9)',
          backgroundColor: 'rgba(248, 141, 0, 0.15)',
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
    [frontHistory]
  );

  const backChartData: ChartData<'line', PricePoint[]> = useMemo(
    () => ({
      datasets: [
        {
          label: 'Bitcoin',
          data: backHistory,
          borderColor: 'rgba(248, 141, 0, 0.9)',
          backgroundColor: 'rgba(248, 141, 0, 0.15)',
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
    [backHistory]
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', border: '1px solid #333', borderRadius: '8px', padding: '16px', background: '#161616', opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
        <div>
          (Bitcoin): $
          {formatCurrency(activePoint?.y ?? vapa)}
        </div>
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
      <div
        ref={chartContainerRef}
        style={{
          position: 'relative',
          minWidth: 0,
          width: '100%',
          transition: 'opacity 350ms ease'
        }}
        onMouseLeave={() => updateSelection(isTransitioning ? backChartRef.current : frontChartRef.current, null)}
        onTouchEnd={() => updateSelection(isTransitioning ? backChartRef.current : frontChartRef.current, null)}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#f5f5f5',
            zIndex: 2,
            pointerEvents: 'none'
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
              top: 0,
              bottom: 0,
              left: selectedX,
              width: '2px',
              background: 'rgba(248, 141, 0, 0.45)',
              transform: 'translateX(-1px)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}
        {loading && <div>Loading chart...</div>}
        {error && !loading && <div>Error loading chart</div>}
        {!loading && !error && frontHistory.length > 0 && (
          <div style={{ position: 'relative', height: 200 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 350ms ease',
                pointerEvents: isTransitioning ? 'none' : 'auto'
              }}
            >
              <Line ref={frontChartRef} data={frontChartData} options={options} height={200} />
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: isTransitioning ? 1 : 0,
                transition: 'opacity 350ms ease',
                pointerEvents: isTransitioning ? 'auto' : 'none'
              }}
            >
              <Line ref={backChartRef} data={backChartData} options={options} height={200} />
            </div>
            <div
              style={{ position: 'absolute', inset: 0 }}
              onMouseMove={(event) => {
                const chart = isTransitioning ? backChartRef.current : frontChartRef.current;
                if (!chart) return;
                const rect = chart.canvas.getBoundingClientRect();
                const eventX = event.nativeEvent.clientX - rect.left;
                updateSelection(chart, eventX);
              }}
              onClick={(event) => {
                const chart = isTransitioning ? backChartRef.current : frontChartRef.current;
                if (!chart) return;
                const rect = chart.canvas.getBoundingClientRect();
                const eventX = event.nativeEvent.clientX - rect.left;
                updateSelection(chart, eventX);
              }}
              onTouchMove={(event) => {
                const chart = isTransitioning ? backChartRef.current : frontChartRef.current;
                if (!chart) return;
                const rect = chart.canvas.getBoundingClientRect();
                const touch = event.touches[0];
                const eventX = touch ? touch.clientX - rect.left : null;
                updateSelection(chart, eventX);
              }}
              onTouchStart={(event) => {
                const chart = isTransitioning ? backChartRef.current : frontChartRef.current;
                if (!chart) return;
                const rect = chart.canvas.getBoundingClientRect();
                const touch = event.touches[0];
                const eventX = touch ? touch.clientX - rect.left : null;
                updateSelection(chart, eventX);
              }}
            />
          </div>
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