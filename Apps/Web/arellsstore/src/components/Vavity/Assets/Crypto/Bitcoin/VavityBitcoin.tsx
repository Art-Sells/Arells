'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useVavity } from '../../../../../context/VavityAggregator';
import { useUser } from '../../../../../context/UserContext';
import BitcoinChart from '../../../../Assets/Crypto/Bitcoin/BitcoinChart';
import CustomDatePicker from '../../../../common/CustomDatePicker';
import PortfolioSlideUpCTA from '../../PortfolioSlideUpCTA';

const VavityBitcoin: React.FC = () => {
  const { sessionId, fetchVavityAggregator, addVavityAggregator, saveVavityAggregator, getAsset } = useVavity();
  const { email, isSignedIn, sessionReady, openSignIn, addEmailInvestments, saveEmailInvestmentsForAsset } = useUser();
  const [vavityData, setVavityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [submitPanelMaxHeight, setSubmitPanelMaxHeight] = useState<number | null>(null);
  const submitTargetRef = useRef<'add' | 'addMore'>('add');
  const prevSubmitPhaseRef = useRef<'idle' | 'submitting' | 'submitted'>('idle');
  const [previewSubmit, setPreviewSubmit] = useState(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEmptyAddForm, setShowEmptyAddForm] = useState<boolean>(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [showAddMoreForm, setShowAddMoreForm] = useState<boolean>(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [suppressSummaryTransition, setSuppressSummaryTransition] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);
  const purchaseDateIsFuture = useMemo(() => !!purchaseDate && purchaseDate > todayIso, [purchaseDate, todayIso]);
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState<boolean>(false);
  const [selectedRangeDays, setSelectedRangeDays] = useState<number | null>(null);
  // Keep range prices mode-strict: Liquid uses liquid range price only; Solid uses solid range price only.
  const [rangeHistoricalPriceSolid, setRangeHistoricalPriceSolid] = useState<number | null>(null);
  const [rangeHistoricalPriceLiquid, setRangeHistoricalPriceLiquid] = useState<number | null>(null);
  const [rangeLoading, setRangeLoading] = useState<boolean>(false);
  const [profitValueHidden, setProfitValueHidden] = useState<boolean>(false);
  const [mockEntries, setMockEntries] = useState<any[]>([]);
  const [mockStep, setMockStep] = useState<number>(0);
  const [chartReady, setChartReady] = useState<boolean>(false);
  const [isLiquidMode, setIsLiquidMode] = useState<boolean>(false);
  const [toggleKnobLeftPx, setToggleKnobLeftPx] = useState<number | null>(null);
  const toggleDragRef = useRef<{ active: boolean; pointerId: number | null; startX: number; startLeft: number; didDrag: boolean }>({
    active: false,
    pointerId: null,
    startX: 0,
    startLeft: 0,
    didDrag: false,
  });
  const showActionsRef = useRef<HTMLDivElement | null>(null);
  const bottomActionsWrapRef = useRef<HTMLDivElement | null>(null);
  const rangeHistoricalPrice = isLiquidMode ? rangeHistoricalPriceLiquid : rangeHistoricalPriceSolid;
  const assetSnapshot = getAsset('bitcoin');
  const assetPrice = assetSnapshot?.price ?? 0;
  const vapa = assetSnapshot?.vapa ?? 0;
  const solidHistory = assetSnapshot?.solidHistory ?? [];
  const liquidHistory = assetSnapshot?.liquidHistory ?? [];
  const history = isLiquidMode ? liquidHistory : solidHistory;
  const solidMarketCap = assetSnapshot?.solidMarketCap ?? [];
  const liquidMarketCap = assetSnapshot?.liquidMarketCap ?? [];
  const vapaMarketCap = isLiquidMode ? liquidMarketCap : solidMarketCap;
  const [chartRangeDays, setChartRangeDays] = useState<number | null>(null);
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [chartHoverPoint, setChartHoverPoint] = useState<{ x: Date; y: number } | null>(null);
  const [showInvestmentsList, setShowInvestmentsList] = useState<boolean>(false);
  const [investmentsListOpen, setInvestmentsListOpen] = useState(false);
  const [visibleInvestments, setVisibleInvestments] = useState<number>(5);
  const [closingInvestments, setClosingInvestments] = useState<string[]>([]);
  const [deletingInvestments, setDeletingInvestments] = useState<string[]>([]);
  const [collapsedInvestments, setCollapsedInvestments] = useState<string[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryAnimating, setSummaryAnimating] = useState(false);
  const [addMorePulse, setAddMorePulse] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [summaryValuesHidden, setSummaryValuesHidden] = useState(false);
  const summaryValuesDidMountRef = useRef(false);
  const [formValuesHidden, setFormValuesHidden] = useState(false);
  const formValuesDidMountRef = useRef(false);
  const [formCalcHidden, setFormCalcHidden] = useState(false);
  const formCalcDidMountRef = useRef(false);
  const [headerNumbersVisible, setHeaderNumbersVisible] = useState(false);
  const headerNumbersDidMountRef = useRef(false);
  const [emptySigninGone, setEmptySigninGone] = useState(false);
  const emptySigninGoneTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [emptySigninHiding, setEmptySigninHiding] = useState(false);
  const [emptyAddGone, setEmptyAddGone] = useState(false);
  const emptyAddGoneTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [emptyAddHiding, setEmptyAddHiding] = useState(false);
  const emptyButtonsSequenceTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const [headerSwitchHidden, setHeaderSwitchHidden] = useState(false);
  const headerSwitchDidMountRef = useRef(false);
  const pulseTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const didMountAddMorePulseRef = useRef(false);
  const didMountShowPulseRef = useRef(false);
  const addMorePulseActiveRef = useRef(false);
  const showPulseActiveRef = useRef(false);
  const [isClearingInvestments, setIsClearingInvestments] = useState(false);
  const [slowOpenInvestments, setSlowOpenInvestments] = useState<string[]>([]);
  const isMutatingRef = useRef(false);
  const prevInvestmentIdsRef = useRef<string[]>([]);
  const prevSummaryCountRef = useRef(0);
  const pendingNewIdsRef = useRef<string[]>([]);
  const investmentIdMapRef = useRef<Map<string, string>>(new Map());
  const investmentIdCounterRef = useRef(0);
  const summaryContentRef = useRef<HTMLDivElement | null>(null);
  const investmentsWholeContentRef = useRef<HTMLDivElement | null>(null);
  const [investmentsWholeHeight, setInvestmentsWholeHeight] = useState(0);
  const addFormBoxRef = useRef<HTMLDivElement | null>(null);
  const addMoreFormBoxRef = useRef<HTMLDivElement | null>(null);
  const profitInlineAnimRef = useRef<HTMLSpanElement | null>(null);
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const headerPanelRef = useRef<HTMLDivElement | null>(null);
  const sloganRef = useRef<HTMLDivElement | null>(null);
  const [summaryHeight, setSummaryHeight] = useState<number>(0);
  const [addFormPanelHeight, setAddFormPanelHeight] = useState<number>(0);
  const [addMoreFormPanelHeight, setAddMoreFormPanelHeight] = useState<number>(0);
  const [profitInlineHeight, setProfitInlineHeight] = useState<number>(0);
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

  const suppressPortfolioCta = useCallback((ms = 2200) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('arells:portfolioCtaSuppress', { detail: { ms } }));
  }, []);

  // Keep the viewport pinned to the bottom while panels are height-animating (prevents scroll/height drift).
  const followScrollUntilRef = useRef<number>(0);
  const followScrollRafRef = useRef<number | null>(null);
  const followScrollFor = useCallback((ms: number) => {
    if (typeof window === 'undefined') return;
    followScrollUntilRef.current = Date.now() + ms;
    if (followScrollRafRef.current) {
      window.cancelAnimationFrame(followScrollRafRef.current);
      followScrollRafRef.current = null;
    }
    const tick = () => {
      if (Date.now() >= followScrollUntilRef.current) {
        followScrollRafRef.current = null;
        return;
      }
      const maxScroll =
        document.documentElement?.scrollHeight || document.body?.scrollHeight || window.innerHeight;
      window.scrollTo({ top: maxScroll, behavior: 'auto' });
      followScrollRafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Smoothly follow the bottom-actions wrapper (Sign In + Show/Hide) during submit collapse,
  // instead of snapping to the document bottom (which causes the final "pop").
  const followBottomActionsFor = useCallback((ms: number) => {
    if (typeof window === 'undefined') return;
    const until = Date.now() + ms;
    if (followScrollRafRef.current) {
      window.cancelAnimationFrame(followScrollRafRef.current);
      followScrollRafRef.current = null;
    }
    const tick = () => {
      if (Date.now() >= until) {
        followScrollRafRef.current = null;
        return;
      }
      const el = bottomActionsWrapRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const inset = 20;
        const dy = r.bottom - (window.innerHeight - inset);
        if (Math.abs(dy) > 0.5) {
          const scroller = document.scrollingElement ?? document.documentElement;
          const h = scroller?.scrollHeight ?? 0;
          const maxScroll = Math.max(0, h - window.innerHeight);
          const current = scroller?.scrollTop ?? window.scrollY;
          const next = Math.min(maxScroll, Math.max(0, current + dy * 0.45));
          window.scrollTo({ top: next, behavior: 'auto' });
        }
      }
      followScrollRafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Ease toward the bottom each frame, so the scroll "follows" the height animation instead of snapping.
  const followScrollForEased = useCallback((ms: number) => {
    if (typeof window === 'undefined') return;
    followScrollUntilRef.current = Date.now() + ms;
    if (followScrollRafRef.current) {
      window.cancelAnimationFrame(followScrollRafRef.current);
      followScrollRafRef.current = null;
    }
    const tick = () => {
      if (Date.now() >= followScrollUntilRef.current) {
        followScrollRafRef.current = null;
        return;
      }
      const maxScroll =
        document.documentElement?.scrollHeight || document.body?.scrollHeight || window.innerHeight;
      const current = window.scrollY;
      const delta = maxScroll - current;
      const next = Math.abs(delta) < 1 ? maxScroll : current + delta * 0.35;
      window.scrollTo({ top: next, behavior: 'auto' });
      followScrollRafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Follow the page height change frame-by-frame during collapse, so the bottom sections
  // (Sign In / Show Investments) move up smoothly instead of clamping/popping at the end.
  const followScrollHeightDeltaFor = useCallback((ms: number) => {
    if (typeof window === 'undefined') return;
    const until = Date.now() + ms;
    if (followScrollRafRef.current) {
      window.cancelAnimationFrame(followScrollRafRef.current);
      followScrollRafRef.current = null;
    }
    let prevH: number | null = null;
    const tick = () => {
      if (Date.now() >= until) {
        followScrollRafRef.current = null;
        return;
      }
      const scroller = document.scrollingElement ?? document.documentElement;
      const h = scroller?.scrollHeight ?? 0;
      const maxScroll = Math.max(0, h - window.innerHeight);
      const current = scroller?.scrollTop ?? window.scrollY;
      if (prevH != null) {
        const deltaH = h - prevH;
        if (deltaH !== 0) {
          const next = Math.min(maxScroll, Math.max(0, current + deltaH));
          window.scrollTo({ top: next, behavior: 'auto' });
        }
      }
      prevH = h;
      followScrollRafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Like followScrollHeightDeltaFor, but never scroll upward.
  // This prevents the "last minute scroll up" after submit when some panels collapse/unmount.
  const followScrollHeightDeltaForDownOnly = useCallback((ms: number) => {
    if (typeof window === 'undefined') return;
    const until = Date.now() + ms;
    if (followScrollRafRef.current) {
      window.cancelAnimationFrame(followScrollRafRef.current);
      followScrollRafRef.current = null;
    }
    let prevH: number | null = null;
    const tick = () => {
      if (Date.now() >= until) {
        followScrollRafRef.current = null;
        return;
      }
      const scroller = document.scrollingElement ?? document.documentElement;
      const h = scroller?.scrollHeight ?? 0;
      const maxScroll = Math.max(0, h - window.innerHeight);
      const current = scroller?.scrollTop ?? window.scrollY;
      if (prevH != null) {
        const deltaH = h - prevH;
        if (deltaH > 0) {
          const next = Math.min(maxScroll, Math.max(0, current + deltaH));
          window.scrollTo({ top: next, behavior: 'auto' });
        }
      }
      prevH = h;
      followScrollRafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  useEffect(() => {
    return () => {
      if (followScrollRafRef.current) {
        window.cancelAnimationFrame(followScrollRafRef.current);
      }
    };
  }, []);

  const clearPulseTimers = useCallback(() => {
    pulseTimersRef.current.forEach((t) => globalThis.clearTimeout(t));
    pulseTimersRef.current = [];
  }, []);

  useEffect(() => {
    addMorePulseActiveRef.current = addMorePulse;
  }, [addMorePulse]);

  useEffect(() => {
    showPulseActiveRef.current = showPulse;
  }, [showPulse]);

  const triggerAddMorePulse = useCallback(() => {
    clearPulseTimers();
    // Avoid a 1-frame "pop": if pulse isn't active, start immediately.
    // Only use the off->on retrigger trick when it's already active.
    if (addMorePulseActiveRef.current) {
      setAddMorePulse(false);
      requestAnimationFrame(() => setAddMorePulse(true));
    } else {
      setAddMorePulse(true);
    }
    pulseTimersRef.current.push(globalThis.setTimeout(() => setAddMorePulse(false), 1000));
  }, [clearPulseTimers]);

  const triggerShowPulse = useCallback(() => {
    clearPulseTimers();
    if (showPulseActiveRef.current) {
      setShowPulse(false);
      requestAnimationFrame(() => setShowPulse(true));
    } else {
      setShowPulse(true);
    }
    pulseTimersRef.current.push(globalThis.setTimeout(() => setShowPulse(false), 1000));
  }, [clearPulseTimers]);

  useEffect(() => {
    return () => clearPulseTimers();
  }, [clearPulseTimers]);

  // Empty-state buttons: collapse timing is controlled by the click sequence (not by showEmptyAddForm).
  useEffect(() => {
    if (!emptySigninHiding) {
      setEmptySigninGone(false);
      return;
    }
    if (emptySigninGoneTimerRef.current) globalThis.clearTimeout(emptySigninGoneTimerRef.current);
    emptySigninGoneTimerRef.current = globalThis.setTimeout(() => setEmptySigninGone(true), 500);
    return () => {
      if (emptySigninGoneTimerRef.current) globalThis.clearTimeout(emptySigninGoneTimerRef.current);
    };
  }, [emptySigninHiding]);

  useEffect(() => {
    if (!emptyAddHiding) {
      setEmptyAddGone(false);
      return;
    }
    if (emptyAddGoneTimerRef.current) globalThis.clearTimeout(emptyAddGoneTimerRef.current);
    emptyAddGoneTimerRef.current = globalThis.setTimeout(() => setEmptyAddGone(true), 500);
    return () => {
      if (emptyAddGoneTimerRef.current) globalThis.clearTimeout(emptyAddGoneTimerRef.current);
    };
  }, [emptyAddHiding]);

  const clearEmptyButtonsSequenceTimers = useCallback(() => {
    emptyButtonsSequenceTimersRef.current.forEach((t) => globalThis.clearTimeout(t));
    emptyButtonsSequenceTimersRef.current = [];
  }, []);

  // Header numbers: fade out/in when Liquid/Solid changes.
  useEffect(() => {
    if (!headerNumbersVisible) return;
    if (!headerSwitchDidMountRef.current) {
      headerSwitchDidMountRef.current = true;
      return;
    }
    setHeaderSwitchHidden(true);
    const t = globalThis.setTimeout(() => setHeaderSwitchHidden(false), 350);
    return () => globalThis.clearTimeout(t);
  }, [isLiquidMode, headerNumbersVisible]);

  // Fade Purchased/Current values when range buttons or Liquid/Solid toggle changes.
  useEffect(() => {
    if (!summaryValuesDidMountRef.current) {
      summaryValuesDidMountRef.current = true;
      return;
    }
    setSummaryValuesHidden(true);
    const t = window.setTimeout(() => setSummaryValuesHidden(false), 350);
    return () => window.clearTimeout(t);
  }, [selectedRangeDays, isLiquidMode]);

  // Fade form numbers when Liquid/Solid toggle changes (match viewing section behavior).
  useEffect(() => {
    if (!formValuesDidMountRef.current) {
      formValuesDidMountRef.current = true;
      return;
    }
    setFormValuesHidden(true);
    const t = window.setTimeout(() => setFormValuesHidden(false), 350);
    return () => window.clearTimeout(t);
  }, [isLiquidMode]);

  // While historical price is loading for the form, show a line-loader and fade values back in after it resolves.
  useEffect(() => {
    if (!formCalcDidMountRef.current) {
      formCalcDidMountRef.current = true;
      return;
    }
    const hasInputs = !!tokenAmount && !!purchaseDate;
    if (!hasInputs) {
      setFormCalcHidden(false);
      return;
    }
    if (historicalLoading) {
      setFormCalcHidden(true);
      return;
    }
    // Loading finished -> trigger fade-in.
    setFormCalcHidden(true);
    const t = window.setTimeout(() => setFormCalcHidden(false), 30);
    return () => window.clearTimeout(t);
  }, [historicalLoading, tokenAmount, purchaseDate]);

  // Pulse when the LABEL actually flips (open <-> hide), including the delayed "hide" after the collapse timeout.
  useEffect(() => {
    if (!didMountAddMorePulseRef.current) {
      didMountAddMorePulseRef.current = true;
      return;
    }
    triggerAddMorePulse();
  }, [showAddMoreForm, triggerAddMorePulse]);

  useEffect(() => {
    if (!didMountShowPulseRef.current) {
      didMountShowPulseRef.current = true;
      return;
    }
    triggerShowPulse();
  }, [showInvestmentsList, triggerShowPulse]);

  // (profit/loss mini loader removed)

  // Fade the profit/loss value back in after the range request completes.
  useEffect(() => {
    if (!selectedRangeDays) {
      setProfitValueHidden(false);
      return;
    }
    if (rangeLoading) return;
    const t = window.setTimeout(() => setProfitValueHidden(false), 250);
    return () => window.clearTimeout(t);
  }, [rangeLoading, selectedRangeDays]);

  useEffect(() => {
    if (isSignedIn) {
      if (!email) return;
    } else {
      if (!sessionReady || !sessionId || !fetchVavityAggregator) return;
    }

    let isMounted = true;

    const loadData = async () => {
      if (isMutatingRef.current) return;
      setLoading(true);
      try {
        const data = isSignedIn
          ? await (async () => {
              const params = new URLSearchParams({ email, asset: 'bitcoin' });
              const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
              return await res.json();
            })()
          : await fetchVavityAggregator(sessionId, 'bitcoin');
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
  }, [fetchVavityAggregator, sessionId, sessionReady, isSignedIn, email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const v = (params.get('previewSubmit') || '').toLowerCase();
      setPreviewSubmit(v === '1' || v === 'true' || v === 'yes' || v === 'on');
    } catch {
      setPreviewSubmit(false);
    }
  }, []);

  useEffect(() => {
    if (!previewSubmit) return;
    // Auto-mount a form panel so the submitting UI is visible without clicks.
    setSubmitPhase('submitting');
    setSubmitLoading(true);

    const hasInvestments = (vavityData?.investments?.length ?? 0) > 0 || isClearingInvestments;
    if (hasInvestments) {
      submitTargetRef.current = 'addMore';
      setShowAddMoreForm(true);
      setTimeout(() => setAddMoreOpen(true), 0);
      followScrollHeightDeltaFor(2000);
    } else {
      submitTargetRef.current = 'add';
      setShowEmptyAddForm(true);
      setShowAddForm(true);
      // Pre-measure panel height before opening so the max-height animation matches "Add more investments".
      requestAnimationFrame(() => {
        const h = addFormBoxRef.current?.scrollHeight ?? 0;
        const next = Math.max(0, h + 24);
        setAddFormPanelHeight((prev) => (prev === next ? prev : next));
        requestAnimationFrame(() => setAddFormOpen(true));
      });
      followScrollHeightDeltaFor(2000);
    }
  }, [previewSubmit, vavityData, isClearingInvestments, followScrollHeightDeltaFor]);

  useEffect(() => {
    if (!history.length) {
      setChartReady(false);
      return;
    }
    const timer = setTimeout(() => setChartReady(true), 150);
    return () => clearTimeout(timer);
  }, [history.length]);

  // NOTE: `addFormOpen` is intentionally orchestrated alongside `showAddForm`
  // in the click handler (mount, then open next tick) to match the Add-more form timing.

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
  const totalsLiquid =
    vavityData?.totalsLiquid ??
    vavityData?.totalsReality ??
    { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
  const displayTotals = isLiquidMode ? totalsLiquid : totals;
  const hasInvestmentsUI =
    investments.length > 0 ||
    isClearingInvestments ||
    // If we're submitting the very first investment, keep the "empty" UI mounted
    // so the submit/collapse animation can finish without swapping branches (which causes the pop).
    (submitTargetRef.current === 'add' && submitPhase !== 'idle');
  const summaryMaxHeight = summaryOpen && !isClearingInvestments ? `${summaryHeight}px` : '0px';
  const investmentsWholeMaxHeight = summaryOpen && !isClearingInvestments ? `${investmentsWholeHeight}px` : '0px';
  const investmentsWholeTransition =
    addMoreOpen || investmentsListOpen ? 'max-height 0s ease' : 'max-height 2s ease';
  // Add-more form lives inside the summary panel. If both the outer summary and the inner form
  // animate max-height, it feels slower because the outer panel clips the inner one during its own expand.
  // When Add-more is showing, snap the outer summary height and let only the inner form animate.
  const summaryTransition = addMoreOpen || suppressSummaryTransition ? 'max-height 0s ease' : 'max-height 2s ease';

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
        // Pre-measure the full wrapper height BEFORE opening so we don't "pop" at the end
        // when ResizeObserver catches up with the final scrollHeight.
        const whole = investmentsWholeContentRef.current;
        if (whole) {
          const h = whole.scrollHeight + 24;
          setInvestmentsWholeHeight((prevH) => (prevH === h ? prevH : h));
        }
        requestAnimationFrame(() => setSummaryOpen(true));
      });
      // Keep scroll synced with the ONE combined height-down of the full investments section.
      followScrollHeightDeltaFor(2000);
    }
    prevSummaryCountRef.current = next;
  }, [investments.length, isClearingInvestments, followScrollHeightDeltaFor]);

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
    if (!node || typeof ResizeObserver === 'undefined') {
      // fallback: single measurement
      setSummaryHeight(node?.scrollHeight ?? 0);
      return;
    }

    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setSummaryHeight((prev) => (prev === next ? prev : next));
      });
    };

    // Measure immediately, then keep in sync with any content growth (e.g. huge wrapped numbers).
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [summaryOpen, isClearingInvestments]);

  // Measure the full "investments view" section as ONE: summary panel + bottom actions (+ list).
  useEffect(() => {
    if (!summaryOpen || isClearingInvestments) return;
    const node = investmentsWholeContentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      const h = (node?.scrollHeight ?? 0) + 24;
      setInvestmentsWholeHeight(h);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        // Add a small buffer so late micro-layout changes don't cause a final "pop down"
        // by increasing max-height after the 2s open animation completes.
        const next = node.scrollHeight + 24;
        setInvestmentsWholeHeight((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [summaryOpen, isClearingInvestments]);

  useLayoutEffect(() => {
    if (!addFormOpen || !addFormBoxRef.current) return;
    const h = addFormBoxRef.current.scrollHeight;
    const next = Math.max(0, h + 24);
    setAddFormPanelHeight((prev) => (prev === next ? prev : next));
  }, [addFormOpen, tokenAmount, purchaseDate, historicalLoading, historicalPrice, vapa]);

  useLayoutEffect(() => {
    if (!addMoreOpen || !addMoreFormBoxRef.current) return;
    const h = addMoreFormBoxRef.current.scrollHeight;
    const next = Math.max(0, h + 24);
    setAddMoreFormPanelHeight((prev) => (prev === next ? prev : next));
  }, [addMoreOpen, tokenAmount, purchaseDate, historicalLoading, historicalPrice, vapa]);

  useLayoutEffect(() => {
    const el = profitInlineAnimRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const update = () => {
      raf = window.requestAnimationFrame(() => {
        const h = Math.max(16, Math.ceil(el.getBoundingClientRect().height));
        setProfitInlineHeight((prev) => (prev === h ? prev : h));
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [selectedRangeDays, rangeLoading]);
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
          setRangeHistoricalPriceSolid(null);
          setRangeHistoricalPriceLiquid(null);
          setRangeLoading(false);
        }
      return;
    }
      setRangeLoading(true);
      const targetDate = new Date(Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000);
      const isoDate = targetDate.toISOString().split('T')[0];
    try {
        const response = await axios.get('/api/assets/crypto/bitcoin/bitcoinVapaHistoricalPrice', {
          params: { date: isoDate, mode: isLiquidMode ? 'liquid' : 'solid' }
        });
        const priceRaw = response.data?.price;
        const priceNum = Number(priceRaw);
        if (isMounted && Number.isFinite(priceNum)) {
          if (isLiquidMode) setRangeHistoricalPriceLiquid(priceNum);
          else setRangeHistoricalPriceSolid(priceNum);
        }
      } catch (error) {
        // Keep last known value for this mode; do not flip to null.
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
  }, [selectedRangeDays, isLiquidMode]);

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

  const displayPoint = useMemo(() => {
    if (chartHoverPoint) {
      return { date: chartHoverPoint.x.toISOString(), price: chartHoverPoint.y };
    }
    return activePoint;
  }, [activePoint, chartHoverPoint]);

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
    const latest = displayPoint?.price ?? series[series.length - 1]?.price ?? 0;
    if (!start) return 0;
    return ((latest - start) / start) * 100;
  }, [chartHistory, displayPoint, history]);

  // Fade in header numbers (Price / Market Cap / %) once real data is available.
  useEffect(() => {
    const rawPrice = displayPoint?.price ?? (isLiquidMode ? assetPrice : vapa);
    const hasPrice = typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice > 0;
    const hasMarketCap = typeof activeMarketCap === 'number' && Number.isFinite(activeMarketCap) && activeMarketCap > 0;
    // Percent can be legitimately 0, so gate on having a usable series & a start price.
    const series = chartHistory.length >= 2 ? chartHistory : history.length >= 2 ? history.slice(-2) : null;
    const start = series?.[0]?.price ?? 0;
    const hasPercent = !!series && typeof start === 'number' && Number.isFinite(start) && start > 0;

    const ready = hasPrice && hasMarketCap && hasPercent;
    if (!ready) return;
    if (headerNumbersDidMountRef.current) return;
    headerNumbersDidMountRef.current = true;
    setHeaderNumbersVisible(true);
  }, [activeMarketCap, assetPrice, chartHistory, displayPoint, history, isLiquidMode, vapa]);

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
      return displayTotals;
    }
    if (rangeHistoricalPrice == null) {
      return displayTotals;
            }
    const rangeStart = Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000;
    return investments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const currentModeSpot = isLiquidMode ? assetPrice : vapa;
        const currentValue = isLiquidMode
          ? Number(entry.lCVact ?? entry.rCVact) || amount * (currentModeSpot || 0)
          : Number(entry.cVact) || amount * (currentModeSpot || 0);
        const purchaseTime = entry?.date ? new Date(entry.date).getTime() : null;
        const hasValidPurchaseTime = typeof purchaseTime === 'number' && !Number.isNaN(purchaseTime);
        const pastValue =
          hasValidPurchaseTime && purchaseTime > rangeStart
            ? isLiquidMode
              ? Number(entry.lCVatop ?? entry.rCVatop) || amount * ((entry.lCpVatop ?? entry.rCpVatop) || rangeHistoricalPrice)
              : Number(entry.cVatop) || amount * (entry.cpVatop || rangeHistoricalPrice)
            : amount * rangeHistoricalPrice;

        acc.acVatop += pastValue;
        acc.acVact += currentValue;
        acc.acdVatop += currentValue - pastValue;
        acc.acVactTaa += amount;
        return acc;
      },
      { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
    );
  }, [investments, rangeHistoricalPrice, selectedRangeDays, displayTotals, vapa, isLiquidMode, assetPrice]);

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

  const renderDecimalSafe = useCallback((raw: string) => {
    const s = String(raw ?? '');
    const idx = s.lastIndexOf('.');
    if (idx === -1) return s;
    const intPart = s.slice(0, idx);
    const decPart = s.slice(idx); // includes "."
    return (
      <>
        <span className="asset-money-int">{intPart}</span>
        <span className="asset-money-decimal">{decPart}</span>
      </>
    );
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
          params: { date: purchaseDate, mode: isLiquidMode ? 'liquid' : 'solid' }
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
  }, [purchaseDate, isLiquidMode]);

  const formCpVatop = useMemo(() => {
    const currentModePrice = isLiquidMode ? assetPrice : vapa;
    if (!purchaseDate) {
      return currentModePrice || 0;
    }
    return historicalPrice ?? currentModePrice ?? 0;
  }, [purchaseDate, historicalPrice, assetPrice, vapa, isLiquidMode]);

  const formCVatop = useMemo(() => {
    const amt = parseTokenAmount(tokenAmount || '0');
    if (Number.isNaN(amt)) return 0;
    const currentModePrice = isLiquidMode ? assetPrice : vapa;
    return amt * (currentModePrice || 0);
  }, [tokenAmount, parseTokenAmount, vapa, assetPrice, isLiquidMode]);

  const handleSubmitInvestment = async () => {
    if (!isSignedIn && !sessionId) return;
    const amt = parseTokenAmount(tokenAmount || '0');
    if (!amt || amt <= 0) return;
    if (!purchaseDate) return;
    if (purchaseDate > todayIso) return;

    const cVactTaa = parseFloat(amt.toFixed(8));
    const newInvestment = {
      cVactTaa,
      date: purchaseDate,
      asset: 'bitcoin',
      clientId: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`
    };

    isMutatingRef.current = true;
    setSubmitLoading(true);
    // Mark which panel is currently being submitted from, so we can collapse that panel for the status UI.
    submitTargetRef.current = showAddMoreForm ? 'addMore' : 'add';
    setSubmitPhase('submitting');
    try {
      let refreshed: any = null;
      if (isSignedIn) {
        await addEmailInvestments('bitcoin', [newInvestment]);
        const params = new URLSearchParams({ email, asset: 'bitcoin' });
        const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
        refreshed = await res.json();
      } else {
        await addVavityAggregator(sessionId, [newInvestment], 'bitcoin');
        refreshed = await fetchVavityAggregator(sessionId, 'bitcoin');
      }
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
    if (!isSignedIn && !sessionId) return;
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
      if (isSignedIn) {
        await saveEmailInvestmentsForAsset('bitcoin', updated);
        const params = new URLSearchParams({ email, asset: 'bitcoin' });
        const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
        const refreshed = await res.json();
        setVavityData(refreshed);
      } else {
        await saveVavityAggregator(sessionId, updated, 'bitcoin');
        const refreshed = await fetchVavityAggregator(sessionId, 'bitcoin');
        setVavityData(refreshed);
      }
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
      // Reset empty-state button sequence so they can appear again.
      clearEmptyButtonsSequenceTimers();
      setEmptyAddHiding(false);
      setEmptyAddGone(false);
      setEmptySigninHiding(false);
      setEmptySigninGone(false);
    }, 2000);
  }, [clearEmptyButtonsSequenceTimers]);

  const closeAddMoreForm = useCallback(() => {
    setAddMoreOpen(false);
    setTimeout(() => {
      setSubmitPhase('idle');
    }, 2000);
  }, []);

  // Drive the outer slide-panel max-height during submit so the status view
  // starts at the form's size and collapses down smoothly.
  useEffect(() => {
    const prevPhase = prevSubmitPhaseRef.current;
    const phase = previewSubmit ? 'submitting' : submitPhase;
    prevSubmitPhaseRef.current = phase;

    if (phase === 'idle') {
      setSubmitPanelMaxHeight(null);
      return;
    }

    if (previewSubmit) {
      // Keep the submitting UI visible indefinitely for styling.
      const start = Math.max(600, submitTargetRef.current === 'addMore' ? addMoreFormPanelHeight : addFormPanelHeight);
      setSubmitPanelMaxHeight(start);
      return;
    }

    const target = submitTargetRef.current;
    const start =
      target === 'addMore' ? Math.max(600, addMoreFormPanelHeight) : Math.max(600, addFormPanelHeight);

    if (phase === 'submitting') {
      // Show status at full form height, then collapse down to 300px.
      setSubmitPanelMaxHeight(start);
      requestAnimationFrame(() => setSubmitPanelMaxHeight(300));
    } else {
      // submitted:
      // - If we came from submitting, we're already at ~300px; collapse straight to 0.
      // - If somehow we jumped from idle -> submitted, go start -> 300 -> 0.
      if (prevPhase === 'submitting') {
        requestAnimationFrame(() => setSubmitPanelMaxHeight(0));
      } else {
        setSubmitPanelMaxHeight(start);
        requestAnimationFrame(() => {
          setSubmitPanelMaxHeight(300);
          requestAnimationFrame(() => setSubmitPanelMaxHeight(0));
        });
      }
    }

    // When submitted, auto-close AFTER the collapse-to-zero finishes.
    if (phase === 'submitted') {
      // Scroll DOWN with the expanding content, but never scroll UP at the end of the submit collapse.
      followScrollHeightDeltaForDownOnly(2800);
      const t = window.setTimeout(() => {
        if (target === 'addMore') {
          setAddMoreOpen(false);
        } else {
          setAddFormOpen(false);
          setShowAddForm(false);
          setShowEmptyAddForm(false);
        }
        setSubmitPhase('idle');
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [
    submitPhase,
    previewSubmit,
    addFormPanelHeight,
    addMoreFormPanelHeight,
    followScrollHeightDeltaForDownOnly,
    closeAddForm,
    closeAddMoreForm,
  ]);

  const renderAddForm = (label: string, onClose: () => void, buttonClass: string) => {
    const purchasedValue =
      tokenAmount && purchaseDate && historicalPrice != null
        ? formatCurrency(parseTokenAmount(tokenAmount || '0') * historicalPrice)
        : '0.00';

    const currentValue = tokenAmount ? formatCurrency(formCVatop) : '0.00';

    const profitRow = (() => {
      // Keep `$` aligned with other rows (e.g. Current Value) even while the value is still loading/empty.
      if (!tokenAmount) return { title: 'Profits/Losses', prefix: '$', value: '0.00' };
      if (purchaseDate && historicalPrice == null) return { title: 'Profits/Losses', prefix: '$', value: '0.00' };
      const currentModePrice = isLiquidMode ? assetPrice : vapa;
      const basePrice = purchaseDate ? (historicalPrice ?? 0) : (currentModePrice || 0);
      const profitValue = ((currentModePrice || 0) - basePrice) * parseTokenAmount(tokenAmount || '0');
      // Default 0.00 to "Profits" in the form.
      const isProfit = profitValue >= -0.005;
      const title = isProfit ? 'Profits' : 'Losses';
      const formattedValue =
        profitValue > 0
          ? formatCurrency(profitValue)
          : Math.abs(profitValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { title, prefix: isProfit ? '+$' : '-$', value: formattedValue };
    })();

    return (
      <div className="asset-invest-form">
        <div className={`asset-submit-form${submitPhase !== 'idle' ? ' is-hidden' : ''}`}>
          <div className="asset-metric-row asset-invest-form-heading">
            <span className="asset-metric-title--bitcoin" style={{ fontWeight: 800 }}>
              {label}
            </span>
          </div>

          <div className="asset-invest-form-body asset-invest-form-body--bitcoin">
            <div className="asset-invest-form-metrics-panel asset-invest-form-metrics-panel--bitcoin">
              <div className="asset-invest-form-metrics">
                <div className="asset-metric-row asset-invest-form-row">
                  <span className="asset-metric-title--bitcoin asset-invest-form-metric-title">Purchased Value</span>
                  <span
                    className={`asset-money-wrap asset-profit-range-anim${
                      formValuesHidden || formCalcHidden ? ' is-hidden' : ''
                    }`}
                  >
                    <span className="asset-metric-symbol--bitcoin">$</span>
                    <span className="asset-metric-value">{renderDecimalSafe(purchasedValue)}</span>
                  </span>
                  <span
                    className="asset-metric-inline-value asset-invest-form-subnote"
                    style={{ visibility: 'hidden' }}
                    aria-hidden="true"
                  >
                    {'\u00A0'}
                  </span>
                </div>

                <div className="asset-metric-row asset-invest-form-row">
                  <span className="asset-metric-title--bitcoin asset-invest-form-metric-title">Current Value</span>
                  <span className={`asset-money-wrap asset-profit-range-anim${formValuesHidden ? ' is-hidden' : ''}`}>
                    <span className="asset-metric-symbol--bitcoin">$</span>
                    <span className="asset-metric-value">{renderDecimalSafe(currentValue)}</span>
                  </span>
                  <span
                    className="asset-metric-inline-value asset-invest-form-subnote"
                    style={{ visibility: 'hidden' }}
                    aria-hidden="true"
                  >
                    {'\u00A0'}
                  </span>
                </div>

                <div className="asset-metric-row asset-invest-form-row">
                  <span className="asset-metric-title--bitcoin asset-invest-form-metric-title">{profitRow.title}</span>
                  <span
                    className={`asset-money-wrap asset-profit-range-anim${
                      formValuesHidden || formCalcHidden ? ' is-hidden' : ''
                    }`}
                  >
                    {profitRow.prefix ? (
                      <span className="asset-metric-inline-symbol--bitcoin">{profitRow.prefix}</span>
                    ) : null}
                    <span className="asset-metric-value">{renderDecimalSafe(profitRow.value)}</span>
                  </span>
                  <span
                    className="asset-metric-inline-value asset-invest-form-subnote"
                    style={{ visibility: 'hidden' }}
                    aria-hidden="true"
                  >
                    {'\u00A0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="asset-invest-form-controls asset-invest-form-controls--bitcoin">
              <div className="asset-invest-form-field">
                <div className="asset-metric-row asset-invest-form-field-label">
                  <span className="asset-metric-title--bitcoin">Bitcoin amount</span>
                </div>
                <div className="asset-invest-form-field-control">
                  <input
                    className="asset-invest-input asset-invest-input--bitcoin"
                    type="text"
                    inputMode="decimal"
                    pattern="^[0-9]*\\.?[0-9]*$"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(normalizeTokenInput(e.target.value))}
                  />
                </div>
              </div>

              <div className="asset-invest-form-field">
                <div className="asset-metric-row asset-invest-form-field-label">
                  <span className="asset-metric-title--bitcoin">Date purchased</span>
                </div>
                <div className="asset-invest-form-field-control">
                  <CustomDatePicker value={purchaseDate} onChange={setPurchaseDate} placeholder="MM/DD/YYYY" />
                </div>
              </div>

              <button
                onClick={handleSubmitInvestment}
                disabled={submitLoading || !tokenAmount || !purchaseDate || purchaseDateIsFuture}
                className={`${buttonClass} asset-action-button--invest-submit`}
              >
                {submitLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {(previewSubmit || submitPhase !== 'idle') && (
          <div className="asset-submit-status">
            <div className={`asset-submit-phase${(previewSubmit || submitPhase === 'submitting') ? ' is-active' : ''}`}>
              <div className="asset-submit-spinner" />
              <div className="asset-home-font-label--bitcoin">Submitting...</div>
            </div>
            <div className={`asset-submit-phase${submitPhase === 'submitted' ? ' is-active' : ''}`}>
              <div className="asset-home-font-label--bitcoin">Submitted.</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const visibleInvestmentCount = Math.min(visibleInvestments, investments.length);
  const investmentsMaxHeight = investmentsListOpen ? `${investmentsListHeight}px` : '0px';

  useEffect(() => {
    if (!investmentsListOpen) return;
    const node = investmentsListRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      setInvestmentsListHeight(node?.scrollHeight ?? 0);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setInvestmentsListHeight((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [investmentsListOpen]);

  return (
    <div className="asset-page-content asset-page-content--bitcoin page-slide-down">
      <div
        className="asset-panel asset-panel--bitcoin asset-header-panel asset-section-slide"
        ref={headerPanelRef}
      >
        <div className="asset-section-header">
          <div className="asset-header-title">Bitcoin</div>
          <div
            className={`asset-header-slogan${isLiquidMode ? ' is-hidden' : ''}`}
            ref={sloganRef}
          >
            if investments never lost value
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
              <span className={`asset-header-switch-fade${headerSwitchHidden ? ' is-hidden' : ''}`}>
                <span className={`asset-metric-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>
                  {headerNumbersVisible ? formatCurrency(displayPoint?.price ?? (isLiquidMode ? assetPrice : vapa) ?? 0) : '\u00A0'}
                </span>
              </span>
            </div>
            <div className="asset-metric-row">
              <span className="asset-metric-title--bitcoin">Market Cap:</span>
              <span className="asset-metric-symbol--bitcoin">$</span>
              <span className={`asset-header-switch-fade${headerSwitchHidden ? ' is-hidden' : ''}`}>
                <span className={`asset-metric-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>
                  {headerNumbersVisible ? renderDecimalSafe(formatMarketCap(activeMarketCap)) : '\u00A0'}
                </span>
              </span>
            </div>
            <div className="asset-metric-row">
              {percentageIncrease > 0 ? (
                <span className="asset-metric-trend-icon asset-metric-trend-icon--bitcoin" aria-hidden="true" />
              ) : (
                <span
                  className="asset-metric-trend-icon asset-metric-trend-icon--down asset-metric-trend-icon--bitcoin"
                  aria-hidden="true"
                />
              )}
              <span
                key={chartRangeDays ?? 'all'}
                className={`asset-metric-value asset-percentage-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}
              >
                <span className={`asset-header-switch-fade${headerSwitchHidden ? ' is-hidden' : ''}`}>
                  {headerNumbersVisible
                    ? formatPercent(Math.abs(percentageIncrease)).replace('%', '').replace('+', '')
                    : '\u00A0'}
                </span>
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
                      const marketKey = `${label}-${percentageIncrease > 0 ? 'bull' : isLiquidMode ? 'bear' : 'sloth'}`;
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
                            {percentageIncrease > 0 ? 'Bull Market' : isLiquidMode ? 'Bear Market' : 'Sloth Market'}
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
            {chartHoverPoint != null && displayPoint && (
                <div className="asset-chart-date-badge asset-chart-date-badge--bitcoin">
                <span className="asset-metric-inline-title--bitcoin">Date:</span>{' '}
                <span className="asset-metric-inline-value">{new Date(displayPoint.date).toLocaleDateString('en-US')}</span>
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
                setChartHoverPoint(point);
              }}
            />
          </div>
        </div>
              </div>
            </div>

          <div className="asset-panel asset-panel--bitcoin asset-reality-toggle-shell">
            <div className="asset-reality-toggle-row asset-reality-toggle-row--bitcoin">
              <span className={`asset-reality-toggle-label${isLiquidMode ? ' is-active' : ''}`}>Liquid</span>
              <button
                type="button"
                className={`asset-reality-toggle${!isLiquidMode ? ' is-fantasy' : ''}${toggleKnobLeftPx != null ? ' is-dragging' : ''}`}
                aria-pressed={isLiquidMode}
                aria-label="Toggle Liquid/Solid mode"
                style={
                  toggleKnobLeftPx != null
                    ? ({ ['--toggle-knob-left' as any]: `${toggleKnobLeftPx}px` } as React.CSSProperties)
                    : undefined
                }
                onPointerDown={(e) => {
                  const btn = e.currentTarget;
                  const cs = window.getComputedStyle(btn);
                  const knobSize = parseFloat(cs.getPropertyValue('--toggle-knob-size')) || 23;
                  const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 1;
                  const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 1;
                  const w = btn.getBoundingClientRect().width;
                  const minLeft = leftInset;
                  const maxLeft = Math.max(leftInset, w - rightInset - knobSize);
                  const currentLeft = isLiquidMode ? minLeft : maxLeft;

                  toggleDragRef.current.active = true;
                  toggleDragRef.current.pointerId = e.pointerId;
                  toggleDragRef.current.startX = e.clientX;
                  toggleDragRef.current.startLeft = currentLeft;
                  toggleDragRef.current.didDrag = false;

                  try {
                    btn.setPointerCapture(e.pointerId);
                  } catch {}
                  setToggleKnobLeftPx(currentLeft);
                  e.preventDefault();
                }}
                onPointerMove={(e) => {
                  if (!toggleDragRef.current.active) return;
                  const btn = e.currentTarget;
                  const cs = window.getComputedStyle(btn);
                  const knobSize = parseFloat(cs.getPropertyValue('--toggle-knob-size')) || 23;
                  const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 1;
                  const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 1;
                  const w = btn.getBoundingClientRect().width;
                  const minLeft = leftInset;
                  const maxLeft = Math.max(leftInset, w - rightInset - knobSize);
                  const dx = e.clientX - toggleDragRef.current.startX;
                  if (Math.abs(dx) > 2) toggleDragRef.current.didDrag = true;
                  const next = Math.min(maxLeft, Math.max(minLeft, toggleDragRef.current.startLeft + dx));
                  setToggleKnobLeftPx(next);
                  e.preventDefault();
                }}
                onPointerUp={(e) => {
                  if (!toggleDragRef.current.active) return;
                  const btn = e.currentTarget;
                  const cs = window.getComputedStyle(btn);
                  const knobSize = parseFloat(cs.getPropertyValue('--toggle-knob-size')) || 23;
                  const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 1;
                  const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 1;
                  const w = btn.getBoundingClientRect().width;
                  const minLeft = leftInset;
                  const maxLeft = Math.max(leftInset, w - rightInset - knobSize);
                  const mid = (minLeft + maxLeft) / 2;
                  const finalLeft = toggleKnobLeftPx ?? (isLiquidMode ? minLeft : maxLeft);
                  const nextIsLiquid = finalLeft <= mid;

                  toggleDragRef.current.active = false;
                  toggleDragRef.current.pointerId = null;
                  try {
                    btn.releasePointerCapture(e.pointerId);
                  } catch {}

                  if (nextIsLiquid !== isLiquidMode) {
                    setProfitValueHidden(true);
                    setIsLiquidMode(nextIsLiquid);
                    window.setTimeout(() => setProfitValueHidden(false), 350);
                  }
                  setToggleKnobLeftPx(null);
                  e.preventDefault();
                }}
                onPointerCancel={(e) => {
                  if (!toggleDragRef.current.active) return;
                  toggleDragRef.current.active = false;
                  toggleDragRef.current.pointerId = null;
                  setToggleKnobLeftPx(null);
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                onClick={() => {
                  if (toggleDragRef.current.didDrag) {
                    toggleDragRef.current.didDrag = false;
                    return;
                  }
                  setProfitValueHidden(true);
                  setIsLiquidMode((v) => !v);
                  window.setTimeout(() => setProfitValueHidden(false), 350);
                }}
              >
                <span className="asset-reality-toggle-knob" aria-hidden="true" />
              </button>
              <span className={`asset-reality-toggle-label${!isLiquidMode ? ' is-active' : ''}`}>Solid</span>
            </div>
          </div>

      <div
        className={`asset-panel asset-panel--bitcoin asset-portfolio-center asset-section-slide${
          summaryOpen && !isClearingInvestments ? ' asset-portfolio-center--summary-open' : ''
        }${summaryAnimating ? ' asset-portfolio-center--summary-animating' : ''}`}
        style={{ 
          marginBottom: '10px', 
          paddingTop: '30px', 
          paddingBottom: '10px',
          paddingLeft: '20px',
          paddingRight: '20px' }}
      >
        {hasInvestmentsUI && (
          <h2
            className="asset-investments-header"
          >
            <span className="asset-portfolio-title-muted">investments</span>
          </h2>
        )}
        {!hasInvestmentsUI ? (
          <>
            <div
              className={`asset-empty-addinvest${emptyAddHiding ? ' is-hidden' : ''}${emptyAddGone ? ' is-gone' : ''}`}
            >
              <button
                className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-add asset-action-button--add-investments"
                disabled={showEmptyAddForm || emptyAddHiding}
                onClick={() => {
                  suppressPortfolioCta();
                  if (showEmptyAddForm || emptyAddHiding || emptySigninHiding) return;
                  clearEmptyButtonsSequenceTimers();

                  // 1) Collapse Sign In button first
                  setEmptySigninHiding(true);
                  setEmptySigninGone(false);
                  // Keep Add Investments visible until step 2
                  setEmptyAddHiding(false);
                  setEmptyAddGone(false);

                  emptyButtonsSequenceTimersRef.current.push(
                    globalThis.setTimeout(() => {
                      // 2) Then collapse Add Investments button
                      setEmptyAddHiding(true);
                    }, 500)
                  );

                  // 3) Start opening the add form immediately (do NOT wait for Sign In to finish collapsing).
                  setShowEmptyAddForm(true);
                  setShowAddForm(true);
                  setSubmitPhase('idle');
                  // Pre-measure panel height before opening so the max-height animation matches "Add more investments".
                  requestAnimationFrame(() => {
                    const h = addFormBoxRef.current?.scrollHeight ?? 0;
                    const next = Math.max(0, h + 24);
                    setAddFormPanelHeight((prev) => (prev === next ? prev : next));
                    requestAnimationFrame(() => setAddFormOpen(true));
                  });
                  followScrollHeightDeltaFor(2000);
                }}
              >
                Add Investments
              </button>
            </div>
            {!isSignedIn && !email && (
              <div
                className={`asset-empty-signin${emptySigninHiding ? ' is-hidden' : ''}${emptySigninGone ? ' is-gone' : ''}`}
              >
                <button
                  type="button"
                  className="asset-action-button asset-action-button--save-signin"
                  onClick={openSignIn}
                >
                  <span className="asset-save-signin-text">Sign In to Save Investments</span>
                </button>
              </div>
            )}
            {showEmptyAddForm && showAddForm && (
              <div
                className={`asset-portfolio-summary-box asset-portfolio-summary-box--bitcoin${
                  submitPhase === 'submitted' && submitTargetRef.current === 'add' ? ' is-collapsing' : ''
                }`}
              >
                <div
                  className={`asset-slide-panel asset-slide-panel--form${addFormOpen ? ' is-open' : ''}`}
                  style={{
                    maxHeight:
                      submitPhase !== 'idle' && submitTargetRef.current === 'add' && submitPanelMaxHeight != null
                        ? `${submitPanelMaxHeight}px`
                        : addFormOpen
                          ? `${Math.max(600, addFormPanelHeight)}px`
                          : '0px',
                  }}
                >
                  <div ref={addFormBoxRef} className="asset-slide-panel-inner">
                    <div className="asset-invest-form-box asset-invest-form-box--bitcoin">
                      {renderAddForm(
                        'Add Investments',
                        closeAddForm,
                        'asset-action-button asset-action-button--bitcoin'
                      )}
                    </div>
                  </div>
                </div>
              </div>
        )}
          </>
        ) : (
          <>
            {/* Option B: Treat the entire investments viewing section as ONE measured height animation
                (summary + add-more + sign-in/show + list) without changing the visual section layout. */}
            <div
              className="asset-slide-panel"
              style={{
                maxHeight: investmentsWholeMaxHeight,
                transition: investmentsWholeTransition,
                overflowX: 'visible',
                overflowY: summaryOpen && !summaryAnimating ? 'visible' : 'hidden',
              }}
            >
              <div ref={investmentsWholeContentRef}>
                <div className="asset-portfolio-summary-box asset-portfolio-summary-box--bitcoin">
                  <div className="asset-slide-panel" style={{ maxHeight: 'none', transition: 'none', overflow: 'visible' }}>
                    <div ref={summaryContentRef} style={{ paddingBottom: '5px' }}>
              <div className="asset-metric-row asset-money-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span
                  className={`asset-metric-title--bitcoin asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}
                  style={{ display: 'inline-block', marginTop: 30 }}
                >
                  Purchased Value
                </span>
                <span className={`asset-money-wrap asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}>
                  <span className="asset-metric-symbol--bitcoin">$</span>
                  <span className="asset-metric-value">{renderDecimalSafe(formatCurrency(filteredTotals.acVatop || 0))}</span>
                </span>
            </div>
              <div className="asset-metric-row asset-money-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span className={`asset-metric-title--bitcoin asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}>
                  Current Value
                </span>
                <span className={`asset-money-wrap asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}>
                  <span className="asset-metric-symbol--bitcoin">$</span>
                  <span className="asset-metric-value">{renderDecimalSafe(formatCurrency(filteredTotals.acVact || 0))}</span>
                </span>
            </div>
              <div
                className="asset-panel asset-panel--bitcoin asset-profit-block asset-slide-in asset-section-slide"
                style={{ 
                  padding: '20px 20px 20px', marginBottom: '10px', width: '92%', marginLeft: 'auto', marginRight: 'auto' }}
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
                  if (selectedRangeDays && rangeHistoricalPrice != null) {
                    const pastValue = (filteredTotals.acVactTaa || 0) * rangeHistoricalPrice;
                    const profitValue = (filteredTotals.acVact || 0) - pastValue;
                        const isProfit = profitValue > 0.005;
                        const label = isProfit ? 'Profits' : 'Losses';
                        const formattedValue = formatMoneyFixed(Math.abs(profitValue));
                        return (
                          <span
                            className="asset-profit-inline-wrap"
                            style={profitInlineHeight ? { height: `${profitInlineHeight}px` } : undefined}
                          >
                            <span
                              ref={profitInlineAnimRef}
                              className={`asset-profit-range-anim${
                                (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? ' is-hidden' : ''
                              }`}
                            >
                              <span className="asset-metric-inline-title--bitcoin">
                                {formatRangeLabel(selectedRangeDays)} {label}
                              </span>
                              <span className="asset-money-wrap">
                                <span className="asset-metric-symbol--bitcoin">
                                  {isProfit ? '+$' : isLiquidMode ? '-$' : '$'}
                                </span>
                                <span className="asset-metric-inline-value">{renderDecimalSafe(formattedValue)}</span>
                              </span>
                            </span>
                          </span>
                        );
                  }
                      const defaultProfit = (filteredTotals.acVact || 0) - (filteredTotals.acVatop || 0);
                      const isProfit = defaultProfit > 0.005;
                      const label = isProfit ? 'Profits' : 'Losses';
                      const formattedValue = formatMoneyFixed(Math.abs(defaultProfit));
                      return (
                        <span
                          className="asset-profit-inline-wrap"
                          style={profitInlineHeight ? { height: `${profitInlineHeight}px` } : undefined}
                        >
                          <span
                            ref={profitInlineAnimRef}
                            className={`asset-profit-range-anim${
                              (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? ' is-hidden' : ''
                            }`}
                          >
                            <span className="asset-metric-inline-title--bitcoin">
                              {formatRangeLabel(null)} {label}
                            </span>
                            <span className="asset-money-wrap">
                              <span className="asset-metric-symbol--bitcoin">
                                {isProfit ? '+$' : isLiquidMode ? '-$' : '$'}
                              </span>
                              <span className="asset-metric-inline-value">{renderDecimalSafe(formattedValue)}</span>
                            </span>
                          </span>
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
                        setProfitValueHidden(true);
                        setSelectedRangeDays(range.days);
                        if (range.days == null) {
                          window.setTimeout(() => setProfitValueHidden(false), 350);
                        }
                      }}
                        className={`asset-range-button asset-range-button--bitcoin${isActive ? ' is-active' : ''}`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
          </div>
              <div className="asset-portfolio-actions asset-portfolio-actions--add">
                <button
                  className={`asset-action-button asset-action-button--bitcoin asset-action-button--invest-add${
                    addMorePulse ? ' asset-action-button--pulse' : ''
                  }`}
                  onClick={() => {
                    suppressPortfolioCta();
                    triggerAddMorePulse();
                    if (addMoreOpen) {
                      setAddMoreOpen(false);
                      return;
                    }
                    if (showInvestmentsList && investmentsListOpen) {
                      setInvestmentsListOpen(false);
                      setTimeout(() => {
                        setVisibleInvestments(5);
                      }, 2000);
                    }
                    setSubmitPhase('idle');
                    setShowAddMoreForm(true);
                    setTimeout(() => setAddMoreOpen(true), 0);
                    followScrollHeightDeltaFor(2000);
                  }}
                >
                  {addMoreOpen ? 'Hide add more Investments' : 'Add more Investments'}
                </button>
              </div>
              {showAddMoreForm && (
                <div
                  className={`asset-slide-panel asset-slide-panel--form${addMoreOpen ? ' is-open' : ''}`}
                  style={{
                    maxHeight:
                      submitPhase !== 'idle' && submitTargetRef.current === 'addMore' && submitPanelMaxHeight != null
                        ? `${submitPanelMaxHeight}px`
                        : addMoreOpen
                          ? `${Math.max(600, addMoreFormPanelHeight)}px`
                          : '0px',
                  }}
                >
                  <div ref={addMoreFormBoxRef} className="asset-slide-panel-inner">
                    <div className="asset-invest-form-box asset-invest-form-box--bitcoin">
                      {renderAddForm(
                        'Add more investments',
                        closeAddMoreForm,
                        'asset-action-button asset-action-button--bitcoin'
                      )}
                    </div>
                  </div>
                </div>
              )}

                    </div>
                  </div>
                </div>

                {/* Bottom actions + investments list stay outside the bordered summary box (unchanged). */}
                <div ref={bottomActionsWrapRef}>
                {investments.length > 0 && !isSignedIn && !email && (
                  <div className="asset-portfolio-actions asset-portfolio-actions--signin asset-portfolio-actions--signin-standalone">
                    <button
                      type="button"
                      className="asset-action-button asset-action-button--save-signin"
                      onClick={openSignIn}
                    >
                      <span className="asset-save-signin-text">Sign In to Save Investments</span>
                    </button>
                  </div>
                )}

                <div
                  ref={showActionsRef}
                  className={`asset-portfolio-actions asset-portfolio-actions--show${investmentsListOpen ? ' is-open' : ''}`}
                >
                  <button
                    className={`asset-action-button asset-action-button--bitcoin asset-action-button--invest-show${
                      showPulse ? ' asset-action-button--pulse' : ''
                    }`}
                    disabled={!investments.length}
                    onClick={() => {
                      suppressPortfolioCta();
                      triggerShowPulse();
                      if (investmentsListOpen) {
                        setInvestmentsListOpen(false);
                        setTimeout(() => {
                          setVisibleInvestments(5);
                        }, 2000);
                        return;
                      }
                      setShowInvestmentsList(true);
                      setTimeout(() => setInvestmentsListOpen(true), 0);
                      followScrollHeightDeltaFor(2000);
                    }}
                  >
                  {investmentsListOpen ? 'Hide Investments' : 'Show Investments'}
                  </button>
                </div>

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
                                    style={{
                                      borderColor: 'rgba(248, 141, 0, 0.2)',
                                      borderTopColor: 'rgba(248, 141, 0, 0.5)',
                                    }}
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
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--bitcoin">Purchased Value</span>
                                    <span className="asset-money-wrap">
                                      <span className="asset-metric-symbol--bitcoin">$</span>
                                      <span className="asset-metric-value">
                                        {formatCurrency((isLiquidMode ? (entry.lCVatop ?? entry.rCVatop) : entry.cVatop) ?? 0)}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--bitcoin">Current Value</span>
                                    <span className="asset-money-wrap">
                                      <span className="asset-metric-symbol--bitcoin">$</span>
                                      <span className="asset-metric-value">
                                        {formatCurrency((isLiquidMode ? (entry.lCVact ?? entry.rCVact) : entry.cVact) ?? 0)}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    {(() => {
                                      const value = Number(
                                        (isLiquidMode ? (entry.lCdVatop ?? entry.rCdVatop) : entry.cdVatop) ?? 0
                                      );
                                      const isProfit = value > 0.005;
                                      const title = isProfit ? 'Profits' : 'Losses';
                                      const prefix = isProfit ? '+$' : '-$';
                                      return (
                                        <>
                                          <span className="asset-metric-title--bitcoin">{title}</span>
                                          <span className="asset-money-wrap">
                                            <span className="asset-metric-inline-symbol--bitcoin">{prefix}</span>
                                            <span className="asset-metric-value">
                                              {renderDecimalSafe(formatMoneyFixed(Math.abs(value)))}
                                            </span>
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--bitcoin">Bitcoin amount</span>
                                    <span className="asset-metric-value">
                                      {Number(amount).toLocaleString('en-US', {
                                        minimumFractionDigits: 8,
                                        maximumFractionDigits: 8,
                                      })}
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--bitcoin">Date purchased</span>
                                    <span className="asset-metric-value">{formatShortDate(entry.date)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="asset-delete-button"
                                    onClick={() => {
                                      if (
                                        closingInvestments.includes(investmentId) ||
                                        deletingInvestments.includes(investmentId)
                                      )
                                        return;
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
                            suppressPortfolioCta();
                            setVisibleInvestments((prev) => prev + 5);
                            followScrollHeightDeltaFor(2000);
                          }}
                        >
                          Load more 5 per list
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </>
      )}
        </div>

      </div>
      <PortfolioSlideUpCTA enabled={!!email && isSignedIn} asset="bitcoin" />
    </div>
  );
};

export default VavityBitcoin;
