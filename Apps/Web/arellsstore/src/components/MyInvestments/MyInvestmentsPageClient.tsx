'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';
import { useUser } from '../../context/UserContext';
import { useVavity } from '../../context/VavityAggregator';

const formatCurrency = (value: number) =>
  (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MyInvestmentsPageClient: React.FC = () => {
  const {
    isSignedIn,
    email,
    openSignIn,
    emailInvestments,
    emailTotals,
    emailTotalsLiquid,
    emailLoading,
    refreshEmailAggregator,
    assetsPresentInEmail,
    assetsMissingInEmail,
  } = useUser();
  const {
    investments: sessionInvestments,
    totals: sessionTotals,
    totalsLiquid: sessionTotalsLiquid,
    sessionId,
    fetchVavityAggregatorAll,
    getAsset,
  } = useVavity();
  const forceSessionPreview = true;
  const forceEmptyEmailPreview = false;
  const supportedAssets = useMemo(() => ['bitcoin', 'ethereum'], []);
  const sessionAssetsPresent = useMemo(() => {
    const present = new Set(
      (sessionInvestments || []).map((inv: any) => ((inv?.asset || 'bitcoin') as string).toLowerCase())
    );
    return supportedAssets.filter((asset) => present.has(asset));
  }, [sessionInvestments, supportedAssets]);
  const sessionAssetsMissing = useMemo(
    () => supportedAssets.filter((asset) => !sessionAssetsPresent.includes(asset)),
    [sessionAssetsPresent, supportedAssets]
  );
  const effectiveSignedIn = forceSessionPreview ? true : forceEmptyEmailPreview ? true : isSignedIn;
  const effectiveEmail = forceSessionPreview ? 'session' : forceEmptyEmailPreview ? 'preview@arells.com' : email;
  const effectiveInvestments = forceSessionPreview ? sessionInvestments : forceEmptyEmailPreview ? [] : emailInvestments;
  const effectiveAssetsPresent = forceSessionPreview ? sessionAssetsPresent : forceEmptyEmailPreview ? [] : assetsPresentInEmail;
  const effectiveAssetsMissing = forceSessionPreview
    ? sessionAssetsMissing
    : forceEmptyEmailPreview
      ? ['bitcoin', 'ethereum']
      : assetsMissingInEmail;

  const [open, setOpen] = useState(false);
  const [isLiquidMode, setIsLiquidMode] = useState(false);
  const [toggleKnobLeftPx, setToggleKnobLeftPx] = useState<number | null>(null);
  const [toggleAlpha, setToggleAlpha] = useState<number>(0);
  const toggleAlphaRef = useRef(0);
  const [toggleAnimating, setToggleAnimating] = useState(false);
  const toggleAnimRafRef = useRef<number | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [toggleTrack, setToggleTrack] = useState<{ minLeft: number; maxLeft: number; mid: number } | null>(null);
  const toggleDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startLeft: number;
    lastLeft: number;
    didDrag: boolean;
    track: { minLeft: number; maxLeft: number; mid: number } | null;
    raf: number | null;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startLeft: 0,
    lastLeft: 0,
    didDrag: false,
    track: null,
    raf: null,
  });
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [selectedRangeDays, setSelectedRangeDays] = useState<number | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangePricesSolid, setRangePricesSolid] = useState<Record<string, number | null>>({});
  const [rangePricesLiquid, setRangePricesLiquid] = useState<Record<string, number | null>>({});
  const [summaryValuesHidden, setSummaryValuesHidden] = useState(false);
  const summaryValuesDidMountRef = useRef(false);
  const [summaryQuickFade, setSummaryQuickFade] = useState(false);
  const summaryQuickFadeRef = useRef(false);
  const summaryQuickFadeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const summaryQuickFadeEndRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [summaryTotalsSnapshot, setSummaryTotalsSnapshot] = useState<{
    acVatop: number;
    acdVatop: number;
    acVact: number;
    acVactTaa: number;
  } | null>(null);
  const purchasedValueRef = useRef<HTMLDivElement>(null);
  const currentValueRef = useRef<HTMLDivElement>(null);
  const profitValueRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const purchasedValueHeightRef = useRef<number | null>(null);
  const currentValueHeightRef = useRef<number | null>(null);
  const profitValueHeightRef = useRef<number | null>(null);
  const purchasedValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const currentValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const profitValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [purchasedValueHeight, setPurchasedValueHeight] = useState<number | null>(null);
  const [currentValueHeight, setCurrentValueHeight] = useState<number | null>(null);
  const [profitValueHeight, setProfitValueHeight] = useState<number | null>(null);
  const [profitValueHidden, setProfitValueHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setSlideIn(true), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = '#ffffff';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  const displayIsLiquidMode = toggleAlpha > 0.5;
  const realityOpacity = Math.max(0, Math.min(1, Math.abs(toggleAlpha - 0.5) * 2));
  const toggleKnobLeftComputedPx = useMemo(() => {
    if (!toggleTrack) return null;
    return toggleTrack.maxLeft - toggleAlpha * (toggleTrack.maxLeft - toggleTrack.minLeft);
  }, [toggleAlpha, toggleTrack]);
  const toggleKnobLeftEffectivePx = toggleKnobLeftPx ?? toggleKnobLeftComputedPx;

  const clamp01 = useCallback((v: number) => Math.max(0, Math.min(1, v)), []);

  const measureToggleTrack = useCallback(() => {
    const btn = toggleBtnRef.current;
    if (!btn) return null;
    const cs = window.getComputedStyle(btn);
    const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 0;
    const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 0;
    const w = btn.getBoundingClientRect().width;
    const minLeft = leftInset;
    const maxLeft = Math.max(leftInset, w - rightInset);
    const mid = (minLeft + maxLeft) / 2;
    const next = { minLeft, maxLeft, mid };
    setToggleTrack(next);
    return next;
  }, []);

  useEffect(() => {
    toggleAlphaRef.current = toggleAlpha;
  }, [toggleAlpha]);

  useEffect(() => {
    if (toggleKnobLeftPx != null) return;
    setToggleAlpha(isLiquidMode ? 1 : 0);
  }, [isLiquidMode, toggleKnobLeftPx]);

  useLayoutEffect(() => {
    const btn = toggleBtnRef.current;
    if (!btn || typeof ResizeObserver === 'undefined') return;
    measureToggleTrack();
    let raf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        measureToggleTrack();
      });
    });
    ro.observe(btn);
    return () => {
      if (raf != null) window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measureToggleTrack]);

  const animateToggleToAlpha = useCallback(
    (targetAlpha: number) => {
      const track = toggleTrack ?? measureToggleTrack();
      if (!track) return;
      const fromAlpha = toggleAlphaRef.current;
      const toAlpha = clamp01(targetAlpha);
      if (toggleAnimRafRef.current != null) window.cancelAnimationFrame(toggleAnimRafRef.current);
      setToggleAnimating(true);

      const start = performance.now();
      const duration = 350;
      const step = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const alpha = fromAlpha + (toAlpha - fromAlpha) * eased;
        const left = track.maxLeft - alpha * (track.maxLeft - track.minLeft);
        setToggleKnobLeftPx(left);
        setToggleAlpha(alpha);
        if (t < 1) {
          toggleAnimRafRef.current = window.requestAnimationFrame(step);
          return;
        }
        toggleAnimRafRef.current = null;
        setToggleAnimating(false);
        setToggleKnobLeftPx(null);
        const nextMode = toAlpha > 0.5;
        setIsLiquidMode(nextMode);
        setToggleAlpha(toAlpha);
      };
      toggleAnimRafRef.current = window.requestAnimationFrame(step);
    },
    [clamp01, measureToggleTrack, toggleTrack]
  );

  useEffect(() => {
    return () => {
      if (toggleAnimRafRef.current != null) window.cancelAnimationFrame(toggleAnimRafRef.current);
    };
  }, []);

  const updateTitleShift = useCallback(() => {
    if (!headerRef.current || !titleRef.current) return;
    const headerWidth = headerRef.current.clientWidth;
    const titleWidth = titleRef.current.offsetWidth;
    const currentLeft = titleRef.current.offsetLeft;
    const targetLeft = (headerWidth - titleWidth) / 2;
    const shift = targetLeft - currentLeft;
    headerRef.current.style.setProperty('--myinv-title-shift', `${shift}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    updateTitleShift();
    const handleResize = () => updateTitleShift();
    window.addEventListener('resize', handleResize);
    const headerEl = headerRef.current;
    const titleEl = titleRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (headerEl && titleEl && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(headerEl);
      resizeObserver.observe(titleEl);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateTitleShift]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (forceSessionPreview) return;
    if (!isSignedIn) return;
    refreshEmailAggregator();
  }, [forceSessionPreview, isSignedIn, refreshEmailAggregator]);

  useEffect(() => {
    if (!forceSessionPreview) return;
    if (!sessionId) return;
    fetchVavityAggregatorAll(sessionId).catch(() => undefined);
  }, [forceSessionPreview, sessionId, fetchVavityAggregatorAll]);

  const hasAny = effectiveInvestments.length > 0;
  const displayTotals = forceSessionPreview
    ? displayIsLiquidMode
      ? sessionTotalsLiquid
      : sessionTotals
    : displayIsLiquidMode
      ? emailTotalsLiquid
      : emailTotals;

  const portfolioRanges = useMemo(
    () => [
      { label: '24 hrs', days: 1 },
      { label: '1 wk', days: 7 },
      { label: '1 mnth', days: 30 },
      { label: '3 mnths', days: 90 },
      { label: '1 yr', days: 365 },
      { label: 'All', days: null },
    ],
    []
  );

  const getNearestHistoricalPrice = useCallback((history: { date: string; price: number }[], targetDate: string) => {
    if (!history.length) return null;
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let selected: { date: string; price: number } | null = null;
    for (const entry of sorted) {
      if (entry.date <= targetDate) selected = entry;
      else break;
    }
    return selected?.price ?? null;
  }, []);

  useEffect(() => {
    if (!selectedRangeDays) {
      setRangePricesSolid({});
      setRangePricesLiquid({});
      setRangeLoading(false);
      return;
    }
    setRangeLoading(true);
    const targetDate = new Date(Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000);
    const isoDate = targetDate.toISOString().split('T')[0];
    const nextSolid: Record<string, number | null> = {};
    const nextLiquid: Record<string, number | null> = {};
    supportedAssets.forEach((asset) => {
      const snapshot = getAsset(asset);
      const solid =
        getNearestHistoricalPrice(snapshot?.solidHistory || [], isoDate) ??
        (typeof snapshot?.vapa === 'number' ? snapshot.vapa : null) ??
        (typeof snapshot?.price === 'number' ? snapshot.price : null);
      const liquid =
        getNearestHistoricalPrice(snapshot?.liquidHistory || [], isoDate) ??
        (typeof snapshot?.price === 'number' ? snapshot.price : null) ??
        (typeof snapshot?.vapa === 'number' ? snapshot.vapa : null);
      nextSolid[asset] = solid;
      nextLiquid[asset] = liquid;
    });
    setRangePricesSolid(nextSolid);
    setRangePricesLiquid(nextLiquid);
    setRangeLoading(false);
  }, [getAsset, getNearestHistoricalPrice, selectedRangeDays, supportedAssets]);

  useEffect(() => {
    if (!summaryValuesDidMountRef.current) {
      summaryValuesDidMountRef.current = true;
      return;
    }
    if (summaryQuickFadeRef.current) return;
    setSummaryValuesHidden(true);
    const t = window.setTimeout(() => setSummaryValuesHidden(false), 350);
    return () => window.clearTimeout(t);
  }, [selectedRangeDays]);

  const filteredTotals = useMemo(() => {
    if (!selectedRangeDays) return displayTotals;
    if (!effectiveInvestments.length) return displayTotals;
    const rangePrices = displayIsLiquidMode ? rangePricesLiquid : rangePricesSolid;
    const hasMissingRange = supportedAssets.some((asset) => rangePrices[asset] == null);
    if (hasMissingRange) return displayTotals;
    const rangeStart = Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000;
    return effectiveInvestments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const assetId = ((entry?.asset || 'bitcoin') as string).toLowerCase();
        const snapshot = getAsset(assetId);
        const currentSpot = displayIsLiquidMode
          ? typeof snapshot?.price === 'number'
            ? snapshot.price
            : snapshot?.vapa || 0
          : snapshot?.vapa || 0;
        const currentValue = displayIsLiquidMode
          ? Number(entry.lCVact ?? entry.rCVact) || amount * (currentSpot || 0)
          : Number(entry.cVact) || amount * (currentSpot || 0);
        const purchaseTime = entry?.date ? new Date(entry.date).getTime() : null;
        const hasValidPurchaseTime = typeof purchaseTime === 'number' && !Number.isNaN(purchaseTime);
        const rangePrice = rangePrices[assetId] ?? 0;
        const pastValue =
          hasValidPurchaseTime && purchaseTime > rangeStart
            ? displayIsLiquidMode
              ? Number(entry.lCVatop ?? entry.rCVatop) || amount * ((entry.lCpVatop ?? entry.rCpVatop) || rangePrice)
              : Number(entry.cVatop) || amount * (entry.cpVatop || rangePrice)
            : amount * rangePrice;
        acc.acVatop += pastValue;
        acc.acVact += currentValue;
        acc.acdVatop += currentValue - pastValue;
        acc.acVactTaa += amount;
        return acc;
      },
      { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
    );
  }, [
    displayTotals,
    effectiveInvestments,
    getAsset,
    displayIsLiquidMode,
    rangePricesLiquid,
    rangePricesSolid,
    selectedRangeDays,
    supportedAssets,
  ]);

  useEffect(() => {
    summaryQuickFadeRef.current = summaryQuickFade;
  }, [summaryQuickFade]);

  const pulseSummaryValues = useCallback(() => {
    if (summaryQuickFadeTimerRef.current) {
      globalThis.clearTimeout(summaryQuickFadeTimerRef.current);
      summaryQuickFadeTimerRef.current = null;
    }
    if (summaryQuickFadeEndRef.current) {
      globalThis.clearTimeout(summaryQuickFadeEndRef.current);
      summaryQuickFadeEndRef.current = null;
    }
    setSummaryQuickFade(true);
    if (!summaryTotalsSnapshot) {
      setSummaryTotalsSnapshot({ ...filteredTotals });
    }
    setSummaryValuesHidden(true);
    summaryQuickFadeTimerRef.current = globalThis.setTimeout(() => {
      setSummaryTotalsSnapshot(null);
      setSummaryValuesHidden(false);
      summaryQuickFadeTimerRef.current = null;
      summaryQuickFadeEndRef.current = globalThis.setTimeout(() => {
        setSummaryQuickFade(false);
        summaryQuickFadeEndRef.current = null;
      }, 350);
    }, 350);
  }, [filteredTotals, summaryTotalsSnapshot]);

  const oldestInvestmentDate = useMemo(() => {
    if (effectiveInvestments.length === 0) return null;
    const dates = effectiveInvestments
      .map((entry: any) => entry?.date)
      .filter((value: any) => typeof value === 'string' && value.length > 0)
      .map((value: string) => new Date(value))
      .filter((date: Date) => !Number.isNaN(date.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((date: Date) => date.getTime())));
  }, [effectiveInvestments]);

  const oldestInvestmentAgeDays = useMemo(() => {
    if (!oldestInvestmentDate) return 0;
    const diffMs = Date.now() - oldestInvestmentDate.getTime();
    return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
  }, [oldestInvestmentDate]);

  const summaryTotals = summaryTotalsSnapshot ?? filteredTotals;
  const totalProfit = (summaryTotals?.acdVatop || 0) as number;
  const profitLabel = totalProfit >= 0 ? 'Profits' : 'Losses';
  const profitPrefix = totalProfit >= 0 ? '+$' : '-$';

  const formatRangeLabel = useCallback((days: number | null) => {
    if (days == null) return 'All-time';
    if (days === 7) return '1 week';
    if (days === 30) return '1 month';
    if (days === 90) return '3 months';
    if (days === 365) return '1 year';
    if (days === 1) return '24 hrs';
    return `${days} days`;
  }, []);

  const animateNumberHeight = useCallback(
    (
      ref: React.RefObject<HTMLDivElement>,
      setHeight: React.Dispatch<React.SetStateAction<number | null>>,
      prevRef: React.MutableRefObject<number | null>,
      timerRef: React.MutableRefObject<ReturnType<typeof globalThis.setTimeout> | null>
    ) => {
      const node = ref.current;
      if (!node) return;
      const next = Math.ceil(node.getBoundingClientRect().height);
      if (next <= 0) {
        prevRef.current = next;
        return;
      }
      const prev = prevRef.current;
      prevRef.current = next;
      if (prev == null) {
        setHeight(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHeight(next);
          });
        });
      } else {
        if (prev === next) return;
        setHeight(prev);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHeight(next);
          });
        });
      }
      if (timerRef.current) {
        globalThis.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = globalThis.setTimeout(() => {
        timerRef.current = null;
        setHeight(null);
      }, 2000);
    },
    []
  );

  useEffect(() => {
    animateNumberHeight(purchasedValueRef, setPurchasedValueHeight, purchasedValueHeightRef, purchasedValueTimerRef);
  }, [animateNumberHeight, summaryTotals.acVatop]);

  useEffect(() => {
    animateNumberHeight(currentValueRef, setCurrentValueHeight, currentValueHeightRef, currentValueTimerRef);
  }, [animateNumberHeight, summaryTotals.acVact]);

  useEffect(() => {
    animateNumberHeight(profitValueRef, setProfitValueHeight, profitValueHeightRef, profitValueTimerRef);
  }, [animateNumberHeight, totalProfit, profitLabel, selectedRangeDays]);

  useEffect(() => {
    if (rangeLoading) return;
    const t = window.setTimeout(() => setProfitValueHidden(false), 350);
    return () => window.clearTimeout(t);
  }, [rangeLoading, selectedRangeDays]);

  const showLiquidityToggle = forceSessionPreview ? true : !!effectiveEmail;
  const footnoteLabel = forceSessionPreview ? '' : effectiveEmail ? `Signed in as ${effectiveEmail}` : null;

  return (
    <>
      {showLoading && (
        <div className={`asset-loader-overlay myinv-loader-overlay${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div className="asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--myinv">
            <div className="asset-reality-toggle-row">
              <button type="button" className="asset-reality-toggle asset-reality-toggle--loader" aria-hidden="true">
                <span className="asset-loader-toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`myinv-page myinv-page--accent${effectiveSignedIn ? '' : ' myinv-page--guest'}`}>
        <div
          ref={headerRef}
          className={`myinv-header-outside${slideIn ? ' page-slide-in' : ''}${displayIsLiquidMode ? ' is-liquid' : ''}`}
        >
          <div ref={titleRef} className="myinv-title">my investments</div>
          <div className={`myinv-slogan asset-header-slogan${displayIsLiquidMode ? ' is-hidden' : ''}`}>
            if investments never lost value
          </div>
        </div>
        <div className="myinv-shell shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
            style={{ maxHeight: open ? '2200px' : '0px', transition: 'max-height 2s ease' }}
          >
            <div className="myinv-wrapper">
              <div className={`myinv-topbar${slideIn ? ' page-slide-in' : ''}`}>
                <span />
              </div>

              {!effectiveSignedIn ? (
                <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-cta-row">
                    <button type="button" className="myinv-cta-button" onClick={openSignIn}>
                      <span className="myinv-cta-button-bg" aria-hidden="true" />
                      <span className="myinv-cta-button-text">Sign In</span>
                    </button>
                  </div>
                </div>
              ) : !hasAny ? (
                <div className={`myinv-panel-group${slideIn ? ' page-slide-in' : ''}`}>
                  <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Add Investments</div>
                  <div className="myinv-panel myinv-panel--shell myinv-panel--asset-buttons">
                    <span className="myinv-asset-border" aria-hidden="true" />
                    <div className={`myinv-asset-options${effectiveAssetsMissing.length === 1 ? ' is-single' : ''}`}>
                      {effectiveAssetsMissing.length
                        ? effectiveAssetsMissing.map((asset) => {
                            const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                            const icon =
                              asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                            const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                            return (
                              <Link
                                key={`missing-${asset}`}
                                href={href}
                                className={`myinv-asset-button myinv-asset-button--${asset}`}
                                aria-label={label}
                              >
                                <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                              </Link>
                            );
                          })
                        : null}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`myinv-summary-section${summaryQuickFade ? ' is-quickfade' : ''}${
                      slideIn ? ' page-slide-in' : ''
                    }`}
                  >
                    <div className="myinv-summary-shell">
                      <div className="myinv-totals">
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                          <span className="myinv-metric-title">Purchased Value</span>
                          <div
                            ref={purchasedValueRef}
                            style={{
                              height: purchasedValueHeight != null ? `${purchasedValueHeight}px` : 'auto',
                              transition: purchasedValueHeight != null ? 'height 2s ease' : undefined,
                              overflow: purchasedValueHeight != null ? 'hidden' : undefined,
                              display: 'inline-block',
                            }}
                          >
                            <span
                              className={`asset-money-wrap asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}
                              style={{
                                opacity: summaryValuesHidden ? 0 : realityOpacity,
                                transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                              }}
                            >
                              <span className="myinv-metric-symbol">$</span>
                              <span className="myinv-metric-value">{formatCurrency(summaryTotals?.acVatop || 0)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center', marginBottom: 8 }}>
                          <span className="myinv-metric-title">Current Value</span>
                          <div
                            ref={currentValueRef}
                            style={{
                              height: currentValueHeight != null ? `${currentValueHeight}px` : 'auto',
                              transition: currentValueHeight != null ? 'height 2s ease' : undefined,
                              overflow: currentValueHeight != null ? 'hidden' : undefined,
                              display: 'inline-block',
                            }}
                          >
                            <span
                              className={`asset-money-wrap asset-profit-range-anim${summaryValuesHidden ? ' is-hidden' : ''}`}
                              style={{
                                opacity: summaryValuesHidden ? 0 : realityOpacity,
                                transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                              }}
                            >
                              <span className="myinv-metric-symbol">$</span>
                              <span className="myinv-metric-value">{formatCurrency(summaryTotals?.acVact || 0)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="myinv-profit-block myinv-accent-border">
                      <div className="myinv-profit-summary myinv-profit-inner">
                        <div className="asset-metric-row asset-money-row myinv-profit-row">
                          <span className="myinv-metric-title">
                            {formatRangeLabel(selectedRangeDays)}{' '}
                            <span
                              style={{
                                opacity:
                                  (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                              }}
                            >
                              {profitLabel}
                            </span>
                          </span>
                          <div
                            ref={profitValueRef}
                            style={{
                              height: profitValueHeight != null ? `${profitValueHeight}px` : 'auto',
                              transition: profitValueHeight != null ? 'height 2s ease' : undefined,
                              overflow: profitValueHeight != null ? 'hidden' : undefined,
                              display: 'inline-block',
                            }}
                          >
                            <span
                              className={`asset-money-wrap asset-profit-range-anim${
                                (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? ' is-hidden' : ''
                              }`}
                              style={{
                                opacity:
                                  (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                              }}
                            >
                              <span className="myinv-metric-inline-symbol">{profitPrefix}</span>
                              <span className="myinv-metric-value">{formatCurrency(Math.abs(totalProfit || 0))}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="asset-range-buttons myinv-range-buttons">
                        {portfolioRanges.map((range) => {
                          const isActive = selectedRangeDays === range.days;
                          const isEnabled = range.days == null || oldestInvestmentAgeDays >= range.days;
                          return (
                            <button
                              key={range.label}
                              type="button"
                              disabled={!isEnabled || isActive}
                              onClick={() => {
                                if (isActive) return;
                                pulseSummaryValues();
                                setProfitValueHidden(true);
                                setSelectedRangeDays(range.days);
                              }}
                              className={`asset-range-button myinv-range-button${isActive ? ' is-active' : ''}`}
                            >
                              {range.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {showLiquidityToggle && (
                    <div className={`myinv-toggle-shell myinv-accent-border${slideIn ? ' page-slide-in' : ''}`}>
                      <div className="asset-reality-toggle-row myinv-toggle-row">
                        <span className={`asset-reality-toggle-label${displayIsLiquidMode ? ' is-active' : ''}`}>Liquid</span>
                        <button
                          type="button"
                          ref={toggleBtnRef}
                          className={`asset-reality-toggle${!displayIsLiquidMode ? ' is-fantasy' : ''}${
                            toggleKnobLeftPx != null ? ' is-dragging' : ''
                          }${toggleAnimating ? ' is-animating' : ''}`}
                          aria-pressed={displayIsLiquidMode}
                          aria-label="Toggle Liquid/Solid mode"
                          style={
                            toggleKnobLeftEffectivePx != null
                              ? ({ ['--toggle-knob-left' as any]: `${toggleKnobLeftEffectivePx}px` } as React.CSSProperties)
                              : undefined
                          }
                          onPointerDown={(e) => {
                            if (toggleAnimating) return;
                            const btn = e.currentTarget;
                            const cs = window.getComputedStyle(btn);
                            const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 0;
                            const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 0;
                            const w = btn.getBoundingClientRect().width;
                            const minLeft = leftInset;
                            const maxLeft = Math.max(leftInset, w - rightInset);
                            const currentLeft = toggleKnobLeftEffectivePx ?? (displayIsLiquidMode ? minLeft : maxLeft);
                            setToggleTrack({ minLeft, maxLeft, mid: (minLeft + maxLeft) / 2 });

                            toggleDragRef.current.active = true;
                            toggleDragRef.current.pointerId = e.pointerId;
                            toggleDragRef.current.startX = e.clientX;
                            toggleDragRef.current.startLeft = currentLeft;
                            toggleDragRef.current.lastLeft = currentLeft;
                            toggleDragRef.current.didDrag = false;
                            toggleDragRef.current.track = { minLeft, maxLeft, mid: (minLeft + maxLeft) / 2 };
                            btn.classList.add('is-dragging');

                            try {
                              btn.setPointerCapture(e.pointerId);
                            } catch {}
                            setToggleKnobLeftPx(currentLeft);
                            btn.style.setProperty('--toggle-knob-left', `${currentLeft}px`);
                            const alpha = (maxLeft - currentLeft) / Math.max(1e-6, maxLeft - minLeft);
                            toggleAlphaRef.current = Math.max(0, Math.min(1, alpha));
                            setToggleAlpha(toggleAlphaRef.current);
                            e.preventDefault();
                          }}
                          onPointerMove={(e) => {
                            if (!toggleDragRef.current.active) return;
                            const btn = e.currentTarget;
                            const track = toggleDragRef.current.track;
                            if (!track) return;
                            const minLeft = track.minLeft;
                            const maxLeft = track.maxLeft;
                            const dx = e.clientX - toggleDragRef.current.startX;
                            if (Math.abs(dx) > 2) toggleDragRef.current.didDrag = true;
                            const next = Math.min(maxLeft, Math.max(minLeft, toggleDragRef.current.startLeft + dx));
                            toggleDragRef.current.lastLeft = next;
                            btn.style.setProperty('--toggle-knob-left', `${next}px`);
                            const alpha = (maxLeft - next) / Math.max(1e-6, maxLeft - minLeft);
                            toggleAlphaRef.current = Math.max(0, Math.min(1, alpha));
                            if (toggleDragRef.current.raf == null) {
                              toggleDragRef.current.raf = window.requestAnimationFrame(() => {
                                toggleDragRef.current.raf = null;
                                setToggleAlpha((prev) =>
                                  Math.abs(prev - toggleAlphaRef.current) > 0.001 ? toggleAlphaRef.current : prev
                                );
                              });
                            }
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
                            const finalLeft = toggleDragRef.current.lastLeft || (displayIsLiquidMode ? minLeft : maxLeft);
                            const nextIsLiquid = finalLeft <= mid;

                            toggleDragRef.current.active = false;
                            toggleDragRef.current.pointerId = null;
                            toggleDragRef.current.track = null;
                            btn.classList.remove('is-dragging');
                            try {
                              btn.releasePointerCapture(e.pointerId);
                            } catch {}

                            if (!toggleDragRef.current.didDrag) {
                              animateToggleToAlpha(displayIsLiquidMode ? 0 : 1);
                              e.preventDefault();
                              return;
                            }

                            animateToggleToAlpha(nextIsLiquid ? 1 : 0);
                            e.preventDefault();
                          }}
                          onPointerCancel={(e) => {
                            if (!toggleDragRef.current.active) return;
                            toggleDragRef.current.active = false;
                            toggleDragRef.current.pointerId = null;
                            toggleDragRef.current.track = null;
                            if (toggleDragRef.current.raf != null) {
                              window.cancelAnimationFrame(toggleDragRef.current.raf);
                              toggleDragRef.current.raf = null;
                            }
                            setToggleKnobLeftPx(null);
                            setToggleAlpha(isLiquidMode ? 1 : 0);
                            try {
                              e.currentTarget.classList.remove('is-dragging');
                              e.currentTarget.releasePointerCapture(e.pointerId);
                            } catch {}
                          }}
                          onClick={() => {}}
                        >
                          <span className="asset-reality-toggle-knob" aria-hidden="true" />
                        </button>
                        <span className={`asset-reality-toggle-label${!displayIsLiquidMode ? ' is-active' : ''}`}>Solid</span>
                      </div>
                    </div>
                  )}

                  {effectiveAssetsMissing.length > 0 && (
                    <div className={`myinv-panel-group${slideIn ? ' page-slide-in' : ''}`}>
                      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Add Investments</div>
                      <div className="myinv-panel myinv-panel--shell myinv-panel--asset-buttons">
                        <span className="myinv-asset-border" aria-hidden="true" />
                        <div className={`myinv-asset-options${effectiveAssetsMissing.length === 1 ? ' is-single' : ''}`}>
                          {effectiveAssetsMissing.map((asset) => {
                            const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                            const icon =
                              asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                            const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                            return (
                              <Link
                                key={`missing-${asset}`}
                                href={href}
                                className={`myinv-asset-button myinv-asset-button--${asset}`}
                                aria-label={label}
                              >
                                <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {effectiveAssetsPresent.length > 0 && (
                    <div className={`myinv-panel-group${slideIn ? ' page-slide-in' : ''}`}>
                      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">View Investments</div>
                      <div className="myinv-panel myinv-panel--shell myinv-panel--asset-buttons">
                        <span className="myinv-asset-border" aria-hidden="true" />
                        <div className={`myinv-asset-options${effectiveAssetsPresent.length === 1 ? ' is-single' : ''}`}>
                          {effectiveAssetsPresent.map((asset) => {
                            const href = asset === 'bitcoin' ? '/bitcoin' : '/ethereum';
                            const icon =
                              asset === 'bitcoin' ? '/images/assets/crypto/Bitcoin.svg' : '/images/assets/crypto/Ethereum.svg';
                            const label = asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                            return (
                              <Link
                                key={`more-${asset}`}
                                href={href}
                                className={`myinv-asset-button myinv-asset-button--${asset}`}
                                aria-label={label}
                              >
                                <Image className="myinv-asset-icon" alt={label} width={22} height={22} src={icon} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`myinv-footnote${slideIn ? ' page-slide-in' : ''}`}>{footnoteLabel}</div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={`myinv-about-wrap${slideIn ? ' page-slide-in' : ''}`}>
          <Link className="myinv-about-button" href="/about">
            <span className="myinv-about-button-bg" aria-hidden="true" />
            <span className="myinv-about-button-text">about</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default MyInvestmentsPageClient;

