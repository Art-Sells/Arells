'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useVavity } from '../../../../../context/VavityAggregator';
import BitcoinChart from '../../../../Assets/Crypto/Bitcoin/BitcoinChart';

const VavityBitcoin: React.FC = () => {
  const { sessionId, fetchVavityAggregator, addVavityAggregator, saveVavityAggregator, getAsset } = useVavity();
  const [vavityData, setVavityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEmptyAddForm, setShowEmptyAddForm] = useState<boolean>(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [showAddMoreForm, setShowAddMoreForm] = useState<boolean>(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState<boolean>(false);
  const [selectedRangeDays, setSelectedRangeDays] = useState<number | null>(null);
  const [rangeHistoricalPrice, setRangeHistoricalPrice] = useState<number | null>(null);
  const [rangeLoading, setRangeLoading] = useState<boolean>(false);
  const [profitMiniLoaderVisible, setProfitMiniLoaderVisible] = useState<boolean>(false);
  const [profitMiniLoaderFading, setProfitMiniLoaderFading] = useState<boolean>(false);
  const profitMiniLoaderStartRef = useRef<number>(0);
  const profitMiniLoaderTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const profitMiniLoaderArmedRef = useRef<boolean>(false);
  const [mockEntries, setMockEntries] = useState<any[]>([]);
  const [mockStep, setMockStep] = useState<number>(0);
  const [chartReady, setChartReady] = useState<boolean>(false);
  const assetSnapshot = getAsset('bitcoin');
  const assetPrice = assetSnapshot?.price ?? 0;
  const vapa = assetSnapshot?.vapa ?? 0;
  const history = assetSnapshot?.history ?? [];
  const vapaMarketCap = assetSnapshot?.vapaMarketCap ?? [];
  const [chartRangeDays, setChartRangeDays] = useState<number | null>(null);
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [showInvestmentsList, setShowInvestmentsList] = useState<boolean>(false);
  const [investmentsListOpen, setInvestmentsListOpen] = useState(false);
  const [visibleInvestments, setVisibleInvestments] = useState<number>(5);
  const [closingInvestments, setClosingInvestments] = useState<string[]>([]);
  const [deletingInvestments, setDeletingInvestments] = useState<string[]>([]);
  const [collapsedInvestments, setCollapsedInvestments] = useState<string[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryAnimating, setSummaryAnimating] = useState(false);
  const [isClearingInvestments, setIsClearingInvestments] = useState(false);
  const [slowOpenInvestments, setSlowOpenInvestments] = useState<string[]>([]);
  const isMutatingRef = useRef(false);
  const prevInvestmentIdsRef = useRef<string[]>([]);
  const prevSummaryCountRef = useRef(0);
  const pendingNewIdsRef = useRef<string[]>([]);
  const investmentIdMapRef = useRef<Map<string, string>>(new Map());
  const investmentIdCounterRef = useRef(0);
  const summaryContentRef = useRef<HTMLDivElement | null>(null);
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const headerPanelRef = useRef<HTMLDivElement | null>(null);
  const sloganRef = useRef<HTMLDivElement | null>(null);
  const [summaryHeight, setSummaryHeight] = useState<number>(0);
  const investmentsListRef = useRef<HTMLDivElement | null>(null);
  const [investmentsListHeight, setInvestmentsListHeight] = useState<number>(0);
  const [chartHeight, setChartHeight] = useState<number>(200);
  const chartTopPadding = 0;
  const chartBottomPadding = 0;
  const chartProtrusion = 0;
  const chartExtraPanelHeight = 0;
  const chartHeightAdjusted = Math.max(120, chartHeight - 0);
  const chartPanelHeight = chartHeightAdjusted + chartProtrusion + chartExtraPanelHeight + chartTopPadding + chartBottomPadding;
  const chartCanvasHeight = chartHeightAdjusted;
  const forceChartLoader = false;
  const scrollToBottom = useCallback((delayMs = 500) => {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const maxScroll =
        document.documentElement?.scrollHeight || document.body?.scrollHeight || window.innerHeight;
      window.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }, delayMs);
  }, []);

  const clearProfitMiniLoaderTimers = useCallback(() => {
    profitMiniLoaderTimersRef.current.forEach((t) => clearTimeout(t));
    profitMiniLoaderTimersRef.current = [];
  }, []);

  useEffect(() => {
    // reset when leaving range mode
    if (!selectedRangeDays) {
      // If we're currently showing the loader (e.g. "All" pulse), let it finish fading out.
      if (!profitMiniLoaderVisible) {
        profitMiniLoaderArmedRef.current = false;
        clearProfitMiniLoaderTimers();
        setProfitMiniLoaderVisible(false);
        setProfitMiniLoaderFading(false);
      }
      return;
    }

    if (rangeLoading) {
      profitMiniLoaderArmedRef.current = true;
      if (!profitMiniLoaderVisible) {
        setProfitMiniLoaderVisible(true);
        setProfitMiniLoaderFading(false);
        profitMiniLoaderStartRef.current = Date.now();
      }
      return;
    }

    // Only fade out after we've actually been in a loading phase for this range
    if (!rangeLoading && profitMiniLoaderVisible && profitMiniLoaderArmedRef.current) {
      const elapsed = Date.now() - profitMiniLoaderStartRef.current;
      const waitMs = Math.max(0, 1000 - elapsed);
      clearProfitMiniLoaderTimers();
      const t1 = setTimeout(() => {
        setProfitMiniLoaderFading(true);
        const t2 = setTimeout(() => {
          setProfitMiniLoaderVisible(false);
          setProfitMiniLoaderFading(false);
        }, 1000);
        profitMiniLoaderTimersRef.current.push(t2);
      }, waitMs);
      profitMiniLoaderTimersRef.current.push(t1);
    }
  }, [
    clearProfitMiniLoaderTimers,
    profitMiniLoaderVisible,
    rangeLoading,
    selectedRangeDays,
  ]);

  useEffect(() => {
    return () => {
      clearProfitMiniLoaderTimers();
    };
  }, [clearProfitMiniLoaderTimers]);

  useEffect(() => {
    if (!sessionId || !fetchVavityAggregator) return;

    let isMounted = true;

    const loadData = async () => {
      if (isMutatingRef.current) return;
      setLoading(true);
      try {
        const data = await fetchVavityAggregator(sessionId, 'bitcoin');
        if (isMounted) {
          setVavityData(data);
        }
      } catch (error) {
        // Intentionally quiet to avoid UI noise
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchVavityAggregator, sessionId]);

  useEffect(() => {
    if (!history.length) {
      setChartReady(false);
      return;
    }
    const timer = setTimeout(() => setChartReady(true), 150);
    return () => clearTimeout(timer);
  }, [history.length]);

  useEffect(() => {
    if (showAddForm) {
      const timer = setTimeout(() => setAddFormOpen(true), 0);
      return () => clearTimeout(timer);
    }
    setAddFormOpen(false);
  }, [showAddForm]);

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const height = el.getBoundingClientRect().height;
      const next = Math.max(120, Math.round(height));
      setChartHeight((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const investments = vavityData?.investments || [];
  const getInvestmentId = useCallback((entry: any) => {
    if (entry?.clientId) return entry.clientId;
    if (entry?.id) return entry.id;
    if (entry?._id) return entry._id;
    const signature = `${entry?.date ?? ''}|${entry?.cVactTaa ?? ''}`;
    const existing = investmentIdMapRef.current.get(signature);
    if (existing) return existing;
    const nextId = `inv-${investmentIdCounterRef.current++}`;
    investmentIdMapRef.current.set(signature, nextId);
    return nextId;
  }, []);
  const investmentIds = useMemo(() => investments.map(getInvestmentId), [getInvestmentId, investments]);
  const totals = vavityData?.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
  const hasInvestmentsUI = investments.length > 0 || isClearingInvestments;
  const summaryMaxHeight = summaryOpen && !isClearingInvestments ? `${summaryHeight}px` : '0px';
  const summaryTransition = 'max-height 2s ease';

  useEffect(() => {
    const prev = prevSummaryCountRef.current;
    const next = investments.length;
    if (next === 0) {
      setSummaryOpen(false);
      prevSummaryCountRef.current = next;
      return;
    }
    if (next > prev && !isClearingInvestments) {
      setSummaryOpen(false);
      requestAnimationFrame(() => {
        setSummaryOpen(true);
      });
    }
    prevSummaryCountRef.current = next;
  }, [investments.length, isClearingInvestments]);

  useEffect(() => {
    if (!summaryOpen || isClearingInvestments) {
      setSummaryAnimating(false);
      return;
    }
    setSummaryAnimating(true);
    const timer = window.setTimeout(() => {
      setSummaryAnimating(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [summaryOpen, isClearingInvestments]);

  useEffect(() => {
    if (!summaryOpen || isClearingInvestments) return;
    const node = summaryContentRef.current;
    if (!node) return;
    const nextHeight = node.scrollHeight;
    if (nextHeight !== summaryHeight) {
      setSummaryHeight(nextHeight);
    }
  }, [summaryOpen, isClearingInvestments, investments.length, summaryHeight]);
  const oldestInvestmentDate = useMemo(() => {
    if (investments.length === 0) return null;
    const dates = investments
      .map((entry: any) => entry?.date)
      .filter((value: any) => typeof value === 'string' && value.length > 0)
      .map((value: string) => new Date(value))
      .filter((date: Date) => !Number.isNaN(date.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((date: Date) => date.getTime())));
  }, [investments]);

  useEffect(() => {
    const prevIds = prevInvestmentIdsRef.current;
    const nextIds = investmentIds;
    const newIds = nextIds.filter((id: string) => !prevIds.includes(id));
    if (newIds.length) {
      if (showInvestmentsList && investmentsListOpen) {
        setCollapsedInvestments((prev) => Array.from(new Set([...prev, ...newIds])));
        setSlowOpenInvestments((prev) => Array.from(new Set([...prev, ...newIds])));
        requestAnimationFrame(() => {
          setCollapsedInvestments((prev) => prev.filter((id) => !newIds.includes(id)));
        });
        setTimeout(() => {
          setSlowOpenInvestments((prev) => prev.filter((id) => !newIds.includes(id)));
        }, 3000);
      } else {
        pendingNewIdsRef.current = Array.from(new Set([...pendingNewIdsRef.current, ...newIds]));
      }
    }
    prevInvestmentIdsRef.current = nextIds;
  }, [investmentIds, investmentsListOpen, showInvestmentsList]);

  useEffect(() => {
    if (!showInvestmentsList || !investmentsListOpen) return;
    const pending = pendingNewIdsRef.current;
    if (!pending.length) return;
    setCollapsedInvestments((prev) => Array.from(new Set([...prev, ...pending])));
    setSlowOpenInvestments((prev) => Array.from(new Set([...prev, ...pending])));
    requestAnimationFrame(() => {
      setCollapsedInvestments((prev) => prev.filter((id) => !pending.includes(id)));
    });
    setTimeout(() => {
      setSlowOpenInvestments((prev) => prev.filter((id) => !pending.includes(id)));
    }, 3000);
    pendingNewIdsRef.current = [];
  }, [investmentsListOpen, showInvestmentsList]);
  const oldestInvestmentAgeDays = useMemo(() => {
    if (!oldestInvestmentDate) return 0;
    const diffMs = Date.now() - oldestInvestmentDate.getTime();
    return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
  }, [oldestInvestmentDate]);
  const portfolioRanges = useMemo(
    () => [
      { label: '24 hours', days: 1 },
      { label: '1 wk', days: 7 },
      { label: '1 mnth', days: 30 },
      { label: '3 mnths', days: 90 },
      { label: '1 yr', days: 365 },
      { label: 'All', days: null }
    ],
    []
  );
  useEffect(() => {
    let isMounted = true;
    const loadRangePrice = async () => {
      if (!selectedRangeDays) {
        if (isMounted) {
          setRangeHistoricalPrice(null);
          setRangeLoading(false);
        }
      return;
    }
      setRangeLoading(true);
      const targetDate = new Date(Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000);
      const isoDate = targetDate.toISOString().split('T')[0];
    try {
        const response = await axios.get('/api/assets/crypto/bitcoin/bitcoinVapaHistoricalPrice', {
          params: { date: isoDate }
        });
        const price = response.data?.price;
        if (isMounted) {
          setRangeHistoricalPrice(typeof price === 'number' ? price : null);
        }
      } catch (error) {
        if (isMounted) {
          setRangeHistoricalPrice(null);
        }
      } finally {
        if (isMounted) {
          setRangeLoading(false);
        }
      }
    };
    loadRangePrice();
    return () => {
      isMounted = false;
    };
  }, [selectedRangeDays]);

  const chartHistory = useMemo(() => {
    if (!chartRangeDays || !history.length) return history;
    const cutoff = Date.now() - chartRangeDays * 24 * 60 * 60 * 1000;
    const filtered = history.filter((item) => {
      const t = new Date(item.date).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
    // Ensure we always have at least two points so a line renders
    if (filtered.length >= 2) return filtered;
    if (history.length >= 2) {
      return history.slice(-2);
    }
    if (history.length === 1) {
      return history;
    }
    return filtered;
  }, [chartRangeDays, history]);

  const chartMarketCaps = useMemo(() => {
    if (!chartRangeDays || !history.length || !vapaMarketCap.length) return vapaMarketCap;
    const cutoff = Date.now() - chartRangeDays * 24 * 60 * 60 * 1000;
    const filtered = history
      .map((item, idx) => ({ ...item, cap: vapaMarketCap[idx] }))
      .filter((entry) => {
        const t = new Date(entry.date).getTime();
        return !Number.isNaN(t) && t >= cutoff;
      })
      .map((entry) => entry.cap);
    if (filtered.length >= 2) return filtered;
    if (vapaMarketCap.length >= 2) {
      return vapaMarketCap.slice(-2);
    }
    if (vapaMarketCap.length === 1) {
      return vapaMarketCap;
    }
    return filtered;
  }, [chartRangeDays, history, vapaMarketCap]);

  const activeIndex = useMemo(() => {
    if (!chartHistory.length) return null;
    if (chartHoverIndex != null) return chartHoverIndex;
    return chartHistory.length - 1;
  }, [chartHistory, chartHoverIndex]);

  const activePoint = useMemo(() => {
    if (activeIndex == null) {
      return history.length ? history[history.length - 1] : null;
    }
    return chartHistory[activeIndex] ?? history[history.length - 1] ?? null;
  }, [activeIndex, chartHistory, history]);

  const activeMarketCap = useMemo(() => {
    if (activeIndex != null && chartMarketCaps.length) {
      const val = chartMarketCaps[activeIndex];
      if (typeof val === 'number' && !Number.isNaN(val)) return val;
    }
    const fallback = vapaMarketCap.length ? vapaMarketCap[vapaMarketCap.length - 1] : null;
    return typeof fallback === 'number' && !Number.isNaN(fallback) ? fallback : null;
  }, [activeIndex, chartMarketCaps, vapaMarketCap]);

  const percentageIncrease = useMemo(() => {
    const series =
      chartHistory.length >= 2
        ? chartHistory
        : history.length >= 2
        ? history.slice(-2)
        : chartHistory.length
        ? chartHistory
        : history;
    if (!series || !series.length) return 0;
    const start = series[0]?.price ?? 0;
    const latest = activePoint?.price ?? series[series.length - 1]?.price ?? 0;
    if (!start) return 0;
    return ((latest - start) / start) * 100;
  }, [chartHistory, activePoint, history]);

  const chartRanges = useMemo(
    () => [
      { label: '24 hours', days: 1 },
      { label: '1 wk', days: 7 },
      { label: '1 mnth', days: 30 },
      { label: '3 mnths', days: 90 },
      { label: '1 yr', days: 365 },
      { label: 'All', days: null },
    ],
    []
  );

  const formatMarketCap = useCallback((value: number | null) => {
    if (value == null || Number.isNaN(value)) return '0';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const formatPercent = useCallback((value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }, []);
  const filteredTotals = useMemo(() => {
    if (!selectedRangeDays) {
      return totals;
    }
    if (rangeHistoricalPrice == null) {
      return totals;
            }
    const rangeStart = Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000;
    return investments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const currentValue = Number(entry.cVact) || amount * (vapa || 0);
        const purchaseTime = entry?.date ? new Date(entry.date).getTime() : null;
        const hasValidPurchaseTime = typeof purchaseTime === 'number' && !Number.isNaN(purchaseTime);
        const pastValue =
          hasValidPurchaseTime && purchaseTime > rangeStart
            ? Number(entry.cVatop) || amount * (entry.cpVatop || rangeHistoricalPrice)
            : amount * rangeHistoricalPrice;

        acc.acVatop += pastValue;
        acc.acVact += currentValue;
        acc.acdVatop += currentValue - pastValue;
        acc.acVactTaa += amount;
        return acc;
      },
      { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
    );
  }, [investments, rangeHistoricalPrice, selectedRangeDays, totals, vapa]);

  const formatCurrency = useCallback((value: number) => {
    const abs = Math.abs(value);
    const decimals = abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  const normalizeTokenInput = useCallback((value: string) => {
    const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const hasDot = cleaned.includes('.');
    const [rawInt = '', rawDec = ''] = cleaned.split('.');
    const intPart = rawInt.replace(/^0+(?=\d)/, '');
    const decPart = rawDec.slice(0, 8);
    const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    const prefix = formattedInt || (hasDot ? '0' : '');
    return hasDot ? `${prefix}.${decPart}` : prefix;
  }, []);

  const parseTokenAmount = useCallback((value: string) => {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadMock = async () => {
      try {
        const resp = await axios.get('/api/assets/crypto/bitcoin/bitcoinMockPortfolio');
        const portfolio = Array.isArray(resp.data?.portfolio) ? resp.data.portfolio : [];
        if (isMounted) {
          setMockEntries(portfolio);
        }
      } catch {
        // ignore errors for mock load
      }
    };
    loadMock();
    const interval = setInterval(() => {
      setMockStep((s) => s + 1);
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatDate = useCallback((iso: string) => {
    if (!iso) return '...';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '...';
    return d.toLocaleDateString('en-US');
  }, []);

  const formatMoneyFixed = useCallback((value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const formatShortDate = useCallback((iso?: string) => {
    if (!iso) return '...';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '...';
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  }, []);

  const currentMockEntry = useMemo(() => {
    if (!mockEntries.length) return null;
    return mockEntries[mockStep % mockEntries.length];
  }, [mockEntries, mockStep]);

  useEffect(() => {
    let isMounted = true;
    const loadHistorical = async () => {
      if (!purchaseDate) {
        if (isMounted) {
          setHistoricalPrice(null);
          setHistoricalLoading(false);
        }
        return;
      }

      setHistoricalLoading(true);
      try {
        const response = await axios.get('/api/assets/crypto/bitcoin/bitcoinVapaHistoricalPrice', {
          params: { date: purchaseDate }
        });
        const price = response.data?.price;
        if (isMounted) {
          setHistoricalPrice(typeof price === 'number' ? price : null);
        }
      } catch (error) {
        if (isMounted) {
          setHistoricalPrice(null);
      }
      } finally {
        if (isMounted) {
          setHistoricalLoading(false);
      }
      }
    };

    loadHistorical();
    return () => {
      isMounted = false;
    };
  }, [purchaseDate]);

  const formCpVatop = useMemo(() => {
    if (!purchaseDate) {
      return vapa || 0;
    }
    return historicalPrice ?? assetPrice ?? 0;
  }, [purchaseDate, historicalPrice, assetPrice, vapa]);

  const formCVatop = useMemo(() => {
    const amt = parseTokenAmount(tokenAmount || '0');
    if (Number.isNaN(amt)) return 0;
    return amt * (vapa || 0);
  }, [tokenAmount, parseTokenAmount, vapa]);

  const handleSubmitInvestment = async () => {
    if (!sessionId) return;
    const amt = parseTokenAmount(tokenAmount || '0');
    if (!amt || amt <= 0) return;
    if (!purchaseDate) return;

    const cVactTaa = parseFloat(amt.toFixed(8));
    const newInvestment = {
      cVactTaa,
      date: purchaseDate,
      clientId: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`
    };

    isMutatingRef.current = true;
    setSubmitLoading(true);
    setSubmitPhase('submitting');
    try {
      await addVavityAggregator(sessionId, [newInvestment], 'bitcoin');
      const refreshed = await fetchVavityAggregator(sessionId, 'bitcoin');
      const refreshedInvestments = Array.isArray(refreshed?.investments)
        ? refreshed.investments.map((entry: any) => ({ ...entry }))
        : [];
      let assignedClientId = false;
      const updatedInvestments = refreshedInvestments.map((entry: any) => {
        if (
          !assignedClientId &&
          !entry?.clientId &&
          entry?.date === purchaseDate &&
          Number(entry?.cVactTaa ?? 0) === Number(cVactTaa)
        ) {
          assignedClientId = true;
          return { ...entry, clientId: newInvestment.clientId };
        }
        return entry;
      });
      const refreshedWithId = refreshed
        ? { ...refreshed, investments: updatedInvestments }
        : { investments: updatedInvestments };
      setVavityData(refreshedWithId);
      const addedEntry = updatedInvestments.find((entry: any) => entry?.clientId === newInvestment.clientId);
      if (addedEntry) {
        const addedId = getInvestmentId(addedEntry);
        if (showInvestmentsList && investmentsListOpen) {
          setCollapsedInvestments((prev) => Array.from(new Set([...prev, addedId])));
          setSlowOpenInvestments((prev) => Array.from(new Set([...prev, addedId])));
          requestAnimationFrame(() => {
            setCollapsedInvestments((prev) => prev.filter((id) => id !== addedId));
          });
          setTimeout(() => {
            setSlowOpenInvestments((prev) => prev.filter((id) => id !== addedId));
          }, 3000);
        } else {
          pendingNewIdsRef.current = Array.from(new Set([...pendingNewIdsRef.current, addedId]));
        }
      }
      setTokenAmount('');
      setPurchaseDate('');
      setTimeout(() => {
        setSubmitPhase('submitted');
      }, 2000);
    } catch (err) {
      // Quiet failure per prior behavior
      setSubmitPhase('idle');
    } finally {
      isMutatingRef.current = false;
      setSubmitLoading(false);
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    if (!sessionId) return;
    const indexToRemove = investmentIds.indexOf(investmentId);
    if (indexToRemove === -1) return;
    const updated = investments.filter((_: any, idx: number) => idx !== indexToRemove);
    const isLastInvestment = updated.length === 0;
    if (isLastInvestment) {
      setIsClearingInvestments(true);
      if (showAddForm) {
        setAddFormOpen(false);
        setTimeout(() => {
          setShowAddForm(false);
          setShowEmptyAddForm(false);
        }, 1000);
      } else {
        setShowEmptyAddForm(false);
      }
      if (showAddMoreForm) {
        setAddMoreOpen(false);
        setTimeout(() => {
          setShowAddMoreForm(false);
        }, 1000);
      }
      setTimeout(() => {
        setInvestmentsListOpen(false);
        setShowInvestmentsList(false);
      }, 2000);
      setTimeout(() => {
        setIsClearingInvestments(false);
        setSubmitPhase('idle');
        setVisibleInvestments(5);
      }, 2000);
    }
    isMutatingRef.current = true;
    try {
      setVavityData((prev: any) => (prev ? { ...prev, investments: updated } : prev));
      await saveVavityAggregator(sessionId, updated, 'bitcoin');
      const refreshed = await fetchVavityAggregator(sessionId, 'bitcoin');
      setVavityData(refreshed);
    } finally {
      isMutatingRef.current = false;
    }
  };

  const closeAddForm = useCallback(() => {
    setAddFormOpen(false);
    setTimeout(() => {
      setShowAddForm(false);
      setShowEmptyAddForm(false);
      setSubmitPhase('idle');
    }, 1000);
  }, []);

  const closeAddMoreForm = useCallback(() => {
    setAddMoreOpen(false);
    setTimeout(() => {
      setShowAddMoreForm(false);
      setSubmitPhase('idle');
    }, 2000);
  }, []);

  const renderAddForm = (label: string, onClose: () => void, buttonClass: string) => (
    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '12px', marginTop: '12px', maxWidth: '420px' }}>
      <div className={`asset-submit-form${submitPhase !== 'idle' ? ' is-hidden' : ''}`}>
        <>
      <div style={{ marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      <div style={{ marginBottom: '12px' }}>
        Purchased Value:{' '}
        {tokenAmount && purchaseDate && historicalPrice != null
          ? `$${formatCurrency(parseTokenAmount(tokenAmount || '0') * historicalPrice)}`
          : '...'}
        {purchaseDate && historicalLoading && <span style={{ marginLeft: '8px' }}>(Loading price...)</span>}
      </div>
      <div style={{ marginBottom: '12px' }}>
        Current Value: {tokenAmount ? `$${formatCurrency(formCVatop)}` : '...'}
      </div>
      <div style={{ marginBottom: '12px' }}>
        {(() => {
          if (!tokenAmount) {
            return 'Profits/Losses: ...';
          }
          if (purchaseDate && historicalPrice == null) {
            return 'Profits/Losses: ...';
          }
          const basePrice = purchaseDate ? (historicalPrice ?? 0) : (vapa || 0);
          const profitValue = (vapa - basePrice) * parseTokenAmount(tokenAmount || '0');
          const label = profitValue > 0 ? 'Profits' : 'Losses';
          const formattedValue =
            profitValue > 0
              ? formatCurrency(profitValue)
              : Math.abs(profitValue).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
          const prefix = profitValue > 0 ? '+$' : '$';
          return `${label}: ${prefix}${formattedValue}`;
        })()}
      </div>
      <div style={{ marginBottom: '8px' }}>
        bitcoin amount:
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*\.?[0-9]*$"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(normalizeTokenInput(e.target.value))}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        Date purchased:
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          style={{ marginLeft: '8px' }}
        />
      </div>
      <button
        onClick={handleSubmitInvestment}
        disabled={submitLoading || !tokenAmount || !purchaseDate}
            className={buttonClass}
      >
        {submitLoading ? 'Submitting...' : 'Submit'}
      </button>
        </>
      </div>
      {submitPhase !== 'idle' && (
        <div className="asset-submit-status">
          <div className={`asset-submit-phase${submitPhase === 'submitting' ? ' is-active' : ''}`}>
            <div className="asset-submit-spinner" />
            <div className="asset-home-font-label--bitcoin">Submitting...</div>
          </div>
          <div className={`asset-submit-phase${submitPhase === 'submitted' ? ' is-active' : ''}`}>
            <div className="asset-home-font-label--bitcoin">Submitted.</div>
            <button type="button" className={buttonClass} onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const visibleInvestmentCount = Math.min(visibleInvestments, investments.length);
  const investmentsMaxHeight = investmentsListOpen ? `${investmentsListHeight}px` : '0px';

  useEffect(() => {
    if (!investmentsListOpen) return;
    const node = investmentsListRef.current;
    if (!node) return;
    const nextHeight = node.scrollHeight;
    if (nextHeight !== investmentsListHeight) {
      setInvestmentsListHeight(nextHeight);
    }
  }, [investmentsListOpen, visibleInvestmentCount, investments.length, investmentsListHeight]);

  return (
    <div className="asset-page-content asset-page-content--bitcoin page-slide-down">
      <div
        className="asset-panel asset-panel--bitcoin asset-header-panel asset-section-slide"
        ref={headerPanelRef}
      >
        <div className="asset-section-header">
          <div className="asset-header-title">Bitcoin</div>
          <div
            className="asset-header-slogan"
            ref={sloganRef}
          >
            if bear markets never existed
          </div>
        </div>
        <div
          className="asset-panel asset-panel--bitcoin asset-price-chart-row asset-price-chart-row--combined"
          style={{ overflow: 'visible' }}
      >
          <div
            className="asset-price-panel asset-price-panel--bitcoin asset-section-slide"
            style={{
              padding: '30px',
              background: 'transparent',
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
        }}
      >
            <Link className="asset-home-button asset-home-button--section asset-home-button--bitcoin" href="/">
              <Image
                className="asset-home-icon asset-home-icon--bitcoin"
                alt="Bitcoin"
                width={37}
                height={37}
                src="/images/assets/crypto/Bitcoin.png"
              />
            </Link>
            <div className="asset-metric-row">
              <span className="asset-metric-title--bitcoin">Price:</span>
              <span className="asset-metric-symbol--bitcoin">$</span>
              <span className="asset-metric-value">{formatCurrency(activePoint?.price ?? vapa ?? 0)}</span>
            </div>
            <div className="asset-metric-row">
              <span className="asset-metric-title--bitcoin">Market Cap:</span>
              <span className="asset-metric-symbol--bitcoin">$</span>
              <span className="asset-metric-value">{formatMarketCap(activeMarketCap)}</span>
            </div>
            <div className="asset-metric-row">
              {percentageIncrease > 0 ? (
                <span className="asset-metric-trend-icon asset-metric-trend-icon--bitcoin" aria-hidden="true" />
              ) : percentageIncrease === 0 ? (
                <span
                  className="asset-metric-trend-icon asset-metric-trend-icon--down asset-metric-trend-icon--bitcoin"
                  aria-hidden="true"
                />
              ) : null}
              <span
                key={chartRangeDays ?? 'all'}
                className="asset-metric-value asset-percentage-value"
              >
                {formatPercent(percentageIncrease).replace('%', '').replace('+', '')}
              </span>
              <span className="asset-metric-symbol--bitcoin asset-metric-percent-symbol--bitcoin">%</span>
            </div>
            <div
              className="asset-panel asset-panel--bitcoin asset-section-slide asset-market-controls"
            >
              <div className="asset-market-controls-header">
                <div className="asset-profit-summary asset-profit-summary--bitcoin" style={{ marginBottom: 0 }}>
                  <div className="asset-metric-inline-row">
                    {(() => {
                      const rawLabel = chartRanges.find((r) => r.days === chartRangeDays)?.label ?? 'All';
                      const label =
                        rawLabel === 'All'
                          ? 'All-time'
                          : rawLabel === '1 wk'
                            ? '1 week'
                            : rawLabel === '1 mnth'
                              ? '1 month'
                              : rawLabel === '3 mnths'
                                ? '3 months'
                                : rawLabel === '1 yr'
                                  ? '1 year'
                                  : rawLabel;
                      const marketKey = `${label}-${percentageIncrease > 0 ? 'bull' : 'sloth'}`;
                      return (
                        <>
                          <span
                            key={label}
                            className="asset-metric-inline-title--bitcoin asset-market-status-title"
                          >
                            {label}:
                          </span>{' '}
                          <span
                            key={marketKey}
                            className="asset-metric-inline-value asset-market-status-value"
                          >
                            {percentageIncrease > 0 ? 'Bull Market' : 'Sloth Market'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="asset-price-button-row">
                {chartRanges.map((range) => {
                  const isActive = chartRangeDays === range.days;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      className={`asset-range-button asset-range-button--bitcoin${isActive ? ' is-active' : ''}`}
                      disabled={isActive}
                      onClick={() => {
                        if (isActive) return;
                        setChartRangeDays(range.days);
                      }}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="asset-chart-wrap" ref={chartWrapRef}>
          <div
              className="asset-panel asset-panel--bitcoin asset-section-slide asset-chart-panel asset-chart-panel--bitcoin"
            style={{
              padding: '0px',
                position: 'relative',
                height: `${chartPanelHeight}px`
            }}
          >
            {chartHoverIndex != null && activePoint && (
                <div className="asset-chart-date-badge asset-chart-date-badge--bitcoin">
                <span className="asset-metric-inline-title--bitcoin">Date:</span>{' '}
                <span className="asset-metric-inline-value">{new Date(activePoint.date).toLocaleDateString('en-US')}</span>
              </div>
            )}
              <div className={`asset-chart-loader${chartReady && !forceChartLoader ? ' is-hidden' : ''}`}>
                <div
                  className="asset-chart-loader-ring"
                  style={{ borderColor: 'rgba(248, 141, 0, 0.1)', borderTopColor: 'rgba(248, 141, 0, 0.4)' }}
                >
                  <div
                    className="asset-chart-loader-spinner"
                    style={{ borderColor: 'rgba(248, 141, 0, 0.1)', borderTopColor: 'rgba(248, 141, 0, 0.4)' }}
                  />
                </div>
              </div>
              {!(chartReady && !forceChartLoader) && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 1,
                    borderRadius: 14,
                    pointerEvents: 'none',
                    zIndex: 0,
                    backgroundImage:
                      'repeating-linear-gradient(to right, rgba(248, 141, 0, 0.1) 0px, rgba(248, 141, 0, 0.1) 1px, transparent 1px, transparent 30px), repeating-linear-gradient(to bottom, rgba(248, 141, 0, 0.1) 0px, rgba(248, 141, 0, 0.1) 1px, transparent 1px, transparent 30px)',
                  }}
                />
              )}
              <div
                className={`asset-chart-fade asset-chart-interactive${
                  chartReady && !forceChartLoader ? ' is-visible' : ''
                }${chartReady && !forceChartLoader ? '' : ' is-disabled'}`}
              >
            <BitcoinChart
              history={chartHistory || []}
                  color="rgba(248, 141, 0, 0.5)"
                  activeColor="rgba(248, 141, 0, 0.6)"
                  markerColor="rgba(248, 141, 0, 1)"
                  gridColor="rgba(248, 141, 0, 0.1)"
                  gridSpacing={30}
                  height={chartCanvasHeight}
                  interactiveHeight={chartPanelHeight}
                  canvasOffsetTop={chartTopPadding}
                  backgroundColor="rgba(248, 141, 0, 0.16)"
                  markerShadow="-5px 0 14px rgba(248, 141, 0, 0.26), 0 7px 10px rgba(248, 141, 0, 0.18)"
                  animateOn={chartReady && !forceChartLoader}
                  animateDelayMs={1000}
              onPointHover={(point, idx) => {
                setChartHoverIndex(idx ?? null);
              }}
            />
          </div>
        </div>
              </div>
            </div>

      <div
        className={`asset-panel asset-panel--bitcoin asset-portfolio-center asset-section-slide${
          summaryOpen && !isClearingInvestments ? ' asset-portfolio-center--summary-open' : ''
        }${summaryAnimating ? ' asset-portfolio-center--summary-animating' : ''}`}
        style={{ marginBottom: '10px', padding: '30px' }}
      >
        <h2
          className="asset-home-font-title"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}
        >
          my
          <Image src="/images/assets/crypto/bitcoin.png" alt="Bitcoin" width={17} height={17} />
          portfolio
        </h2>
        {!hasInvestmentsUI ? (
          <>
            {!showEmptyAddForm && (
              <button
                className="asset-action-button asset-action-button--bitcoin"
                onClick={() => {
                  setShowEmptyAddForm(true);
                  setShowAddForm(true);
                  setSubmitPhase('idle');
                  scrollToBottom();
                }}
        >
                (Add Investments)
        </button>
            )}
            {showEmptyAddForm && showAddForm && (
              <div className={`asset-slide-panel asset-slide-panel--form${addFormOpen ? ' is-open' : ''}`}>
                {renderAddForm('Add Investment', closeAddForm, 'asset-action-button asset-action-button--bitcoin')}
              </div>
        )}
          </>
        ) : (
          <>
            <div
              className="asset-slide-panel"
              style={{ maxHeight: summaryMaxHeight, transition: summaryTransition }}
            >
              <div ref={summaryContentRef} style={{ paddingBottom: '20px' }}>
              <div className="asset-metric-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span className="asset-metric-title--bitcoin">Purchased Value:</span>
                <span className="asset-metric-symbol--bitcoin">$</span>
                <span className="asset-metric-value">{formatCurrency(totals.acVatop || 0)}</span>
            </div>
              <div className="asset-metric-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span className="asset-metric-title--bitcoin">Current Value:</span>
                <span className="asset-metric-symbol--bitcoin">$</span>
                <span className="asset-metric-value">{formatCurrency(totals.acVact || 0)}</span>
            </div>
              <div
                className="asset-panel asset-panel--bitcoin asset-profit-block asset-slide-in asset-section-slide"
                style={{ padding: '12px 12px 30px', marginBottom: '10px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}
              >
                <div className="asset-profit-summary asset-profit-summary--bitcoin">
                  <div className="asset-metric-inline-row">
                {(() => {
                      const formatRangeLabel = (days: number | null) => {
                        if (days == null) return 'All-time';
                        if (days === 7) return '1 week';
                        if (days === 30) return '1 month';
                        if (days === 90) return '3 months';
                        if (days === 365) return '1 year';
                        if (days === 1) return '24 hours';
                        return `${days} days`;
                      };
                  if (selectedRangeDays && (rangeLoading || profitMiniLoaderVisible)) {
                        return (
                          <span
                            key={`${selectedRangeDays}-loading`}
                            className="asset-metric-inline-value asset-profit-range-anim"
                          >
                            <span
                              className={`asset-mini-loader${profitMiniLoaderFading ? ' is-fading' : ''}`}
                              aria-hidden="true"
                            />
                          </span>
                        );
                  }
                  if (selectedRangeDays && rangeHistoricalPrice != null) {
                    const pastValue = (totals.acVactTaa || 0) * rangeHistoricalPrice;
                    const profitValue = (totals.acVact || 0) - pastValue;
                        const isProfit = profitValue > 0.005;
                        const label = isProfit ? 'Profits' : 'Losses';
                        const formattedValue = formatMoneyFixed(Math.abs(profitValue));
                        return (
                          <span
                            key={`${selectedRangeDays}-${label}-${formattedValue}`}
                            className="asset-profit-range-anim"
                          >
                            <span className="asset-metric-inline-title--bitcoin">
                              {formatRangeLabel(selectedRangeDays)} {label}:
                            </span>{' '}
                            <span className="asset-metric-inline-symbol--bitcoin">{isProfit ? '+$' : '$'}</span>
                            <span className="asset-metric-inline-value">{formattedValue}</span>
                          </span>
                        );
                  }
                      const defaultProfit = (totals.acVact || 0) - (totals.acVatop || 0);
                      const isProfit = defaultProfit > 0.005;
                      const label = isProfit ? 'Profits' : 'Losses';
                      const formattedValue = formatMoneyFixed(Math.abs(defaultProfit));
                      return (
                        <span
                          key={`all-${label}-${formattedValue}`}
                          className="asset-profit-range-anim"
                        >
                          <span className="asset-metric-inline-title--bitcoin">
                            {formatRangeLabel(null)} {label}:
                          </span>{' '}
                          <span className="asset-metric-inline-symbol--bitcoin">{isProfit ? '+$' : '$'}</span>
                          <span className="asset-metric-inline-value">{formattedValue}</span>
                        </span>
                      );
                })()}
              </div>
                </div>
                <div className="asset-range-buttons">
                {portfolioRanges.map((range) => {
                  const isEnabled = range.days == null ? true : oldestInvestmentAgeDays >= range.days;
                  const isActive = selectedRangeDays === range.days;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      disabled={!isEnabled || isActive}
                      onClick={() => {
                        if (isActive) return;
                        clearProfitMiniLoaderTimers();
                        profitMiniLoaderArmedRef.current = false;
                        setProfitMiniLoaderVisible(true);
                        setProfitMiniLoaderFading(false);
                        profitMiniLoaderStartRef.current = Date.now();

                        // "All" doesn't fetch range data, so we pulse the loader for 1s then fade out 1s.
                        if (range.days == null) {
                          const t1 = setTimeout(() => {
                            setProfitMiniLoaderFading(true);
                            const t2 = setTimeout(() => {
                              setProfitMiniLoaderVisible(false);
                              setProfitMiniLoaderFading(false);
                            }, 1000);
                            profitMiniLoaderTimersRef.current.push(t2);
                          }, 1000);
                          profitMiniLoaderTimersRef.current.push(t1);
                        }
                        setSelectedRangeDays(range.days);
                      }}
                        className={`asset-range-button asset-range-button--bitcoin${isActive ? ' is-active' : ''}`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
          </div>
              <div className="asset-portfolio-actions asset-slide-in">
                <button
                  className="asset-action-button asset-action-button--bitcoin"
                  onClick={() => {
                    if (showAddMoreForm) {
                      setAddMoreOpen(false);
                      setTimeout(() => {
                        setShowAddMoreForm(false);
                      }, 2000);
                      return;
                    }
                    if (showInvestmentsList) {
                      setInvestmentsListOpen(false);
                      setTimeout(() => {
                        setShowInvestmentsList(false);
                        setVisibleInvestments(5);
                      }, 2000);
                    }
                    setSubmitPhase('idle');
                    setShowAddMoreForm(true);
                    setTimeout(() => setAddMoreOpen(true), 0);
                    scrollToBottom();
                  }}
                >
                  {showAddMoreForm ? 'Hide add more investments' : 'Add more investments'}
                </button>
              </div>
              <div className="asset-portfolio-actions asset-slide-in">
                <button
                  className="asset-action-button asset-action-button--bitcoin"
                  onClick={() => {
                    if (showInvestmentsList) {
                      setInvestmentsListOpen(false);
                      setTimeout(() => {
                        setShowInvestmentsList(false);
                        setVisibleInvestments(5);
                      }, 2000);
                      return;
                    }
                    setShowInvestmentsList(true);
                    setTimeout(() => setInvestmentsListOpen(true), 0);
                    scrollToBottom(2100);
                  }}
                >
                  {showInvestmentsList ? 'Hide Investments' : 'Show Investments'}
                </button>
              </div>
            </div>
            </div>
            {showAddMoreForm && (
              <div className={`asset-slide-panel asset-slide-panel--form${addMoreOpen ? ' is-open' : ''}`}>
                {renderAddForm('Add more investments', closeAddMoreForm, 'asset-action-button asset-action-button--bitcoin')}
              </div>
        )}
            {showInvestmentsList && (
              <div
                className={`asset-investments-wrap asset-investments-wrap--bitcoin asset-slide-panel${
                  investmentsListOpen ? ' is-open' : ''
                }`}
                style={{ maxHeight: investmentsMaxHeight, transition: 'max-height 2s ease' }}
              >
                <div className="asset-investments-list" ref={investmentsListRef}>
                {investments.slice(0, visibleInvestments).map((entry: any, idx: number) => {
              const amount = entry.cVactTaa ?? 0;
                  const investmentId = investmentIds[idx];
                  const isClosing = closingInvestments.includes(investmentId);
                  const isCollapsed = collapsedInvestments.includes(investmentId);
                  const isDeleting = deletingInvestments.includes(investmentId);
                  const isNew = slowOpenInvestments.includes(investmentId);
              return (
                <div
                      key={investmentId}
                      className={`asset-slide-panel${!isClosing && !isCollapsed ? ' is-open' : ''}`}
                      style={isNew ? { transitionDuration: '3s' } : undefined}
                >
                      <div className="asset-panel asset-panel--bitcoin" style={{ padding: '12px' }}>
                        {isDeleting ? (
                          <div className="asset-delete-loader">
                            <div
                              className="asset-delete-loader-spinner"
                              style={{ borderColor: 'rgba(248, 141, 0, 0.2)', borderTopColor: 'rgba(248, 141, 0, 0.5)' }}
                            />
                            <Image
                              className="asset-delete-loader-icon"
                              alt="Deleting"
                              width={18}
                              height={18}
                              src="/images/trash.png"
                            />
                          </div>
                        ) : (
                          <>
                            <div>Purchased Value: ${formatCurrency(entry.cVatop ?? 0)}</div>
                            <div>Current Value: ${formatCurrency(entry.cVact ?? 0)}</div>
                  <div>
                              {(() => {
                                const value = Number(entry.cdVatop ?? 0);
                                const isProfit = value > 0.005;
                                const label = isProfit ? 'Profits' : 'Losses';
                                const prefix = isProfit ? '+$' : '$';
                                return `${label}: ${prefix}${formatMoneyFixed(Math.abs(value))}`;
                              })()}
                            </div>
                            <div>
                              Token Amount:{' '}
                    {Number(amount).toLocaleString('en-US', {
                      minimumFractionDigits: 8,
                                maximumFractionDigits: 8,
                    })}
                  </div>
                            <div>Purchase Date: {formatShortDate(entry.date)}</div>
                            <button
                              type="button"
                              className="asset-delete-button"
                              onClick={() => {
                                if (closingInvestments.includes(investmentId) || deletingInvestments.includes(investmentId)) return;
                                setDeletingInvestments((prev) => [...prev, investmentId]);
                                setClosingInvestments((prev) => [...prev, investmentId]);
                                setTimeout(() => {
                                  handleDeleteInvestment(investmentId)
                                    .catch(() => {
                                      // ignore errors
                                    })
                                    .finally(() => {
                                      setClosingInvestments((prev) => prev.filter((value) => value !== investmentId));
                                      setDeletingInvestments((prev) => prev.filter((value) => value !== investmentId));
                                    });
                                }, 2000);
                              }}
                            >
                              (delete)
                            </button>
                          </>
                        )}
                      </div>
                </div>
              );
            })}
                {investments.length > visibleInvestments && (
                  <button
                    type="button"
                    className="asset-action-button asset-action-button--bitcoin"
                    onClick={() => {
                      setVisibleInvestments((prev) => prev + 5);
                      scrollToBottom(2100);
                    }}
                  >
                    Load more 5 per list
                  </button>
                )}
                </div>
        </div>
            )}
          </>
      )}
        </div>

      </div>
    </div>
  );
};

export default VavityBitcoin;
