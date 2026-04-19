'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { flushSync } from 'react-dom';
import { useVavity } from '../../../../context/VavityAggregator';
import { useUser } from '../../../../context/UserContext';
import SolanaChart from './SolanaChart';
import CustomDatePicker from '../../../common/CustomDatePicker';
import {
  ASSET_PRICE_CHART_MOUNT_SLIDE_MS,
  ASSET_PRICE_CHART_MOUNT_SLIDE_SECONDS,
  ASSET_SUMMARY_PAUSE_BEFORE_EXPAND_MS,
  ASSET_SUMMARY_START_BEFORE_CHART_SLIDE_END_MS,
  useAssetPriceChartMountSlide,
} from '../../useAssetPriceChartMountSlide';
import {
  ASSET_PAGE_SCROLL_BOTTOM_MS,
  cancelDocumentBottomScrollAnimation,
  runAfterDocumentHeightStable,
  runAfterMaxHeightTransitionEnd,
  scrollDocumentToBottomOverMs,
} from '../../../../lib/client/documentScroll';

const PREVIEW_SKIP_SESSION_DELETES = false;

type VavitySolanaProps = {
  sessionMountClearGuardRef: React.MutableRefObject<boolean>;
};

const VavitySolana: React.FC<VavitySolanaProps> = ({ sessionMountClearGuardRef }) => {
  const { sessionId, fetchVavityAggregator, addVavityAggregator, saveVavityAggregator, getAsset } = useVavity();
  const { email, isSignedIn, sessionReady, addEmailInvestments, saveEmailInvestmentsForAsset } = useUser();
  const [vavityData, setVavityData] = useState<any>(null);
  const prevVavityDataRef = useRef<any | null>(null);
  const clearingSnapshotRef = useRef<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const submitTargetRef = useRef<'add' | 'addMore'>('add');
  
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [submitPanelMaxHeight, setSubmitPanelMaxHeight] = useState<number | null>(null);
  const [previewSubmit, setPreviewSubmit] = useState(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEmptyAddForm, setShowEmptyAddForm] = useState<boolean>(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addFormSubmitAnimating, setAddFormSubmitAnimating] = useState(false);
  const [showAddMoreForm, setShowAddMoreForm] = useState<boolean>(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [showMoreDisabled, setShowMoreDisabled] = useState(false);
  const showMoreDisableTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [suppressSummaryTransition, setSuppressSummaryTransition] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const tokenCaretRef = useRef<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);
  const purchaseDateIsFuture = useMemo(() => !!purchaseDate && purchaseDate > todayIso, [purchaseDate, todayIso]);
  const [historicalPriceSolid, setHistoricalPriceSolid] = useState<number | null>(null);
  const [historicalPriceLiquid, setHistoricalPriceLiquid] = useState<number | null>(null);
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
  // Manual toggle progress (0 = Solid edge, 1 = Liquid edge). Drives manual chart morph + continuous fades.
  const [toggleAlpha, setToggleAlpha] = useState<number>(0);
  const toggleAlphaRef = useRef(0);
  const [toggleAnimating, setToggleAnimating] = useState(false);
  const toggleAnimRafRef = useRef<number | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [toggleTrack, setToggleTrack] = useState<{ minLeft: number; maxLeft: number; mid: number } | null>(null);
  const [toggleDisabled, setToggleDisabled] = useState(false);
  const [toggleKnobHidden, setToggleKnobHidden] = useState(false);
  const toggleReenableOnSummaryExpandRef = useRef(false);
  const toggleReenableTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  // Global background (used for overscroll beyond the page)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bg = 'rgba(1, 248, 164, 0.06)';
    const prev = document.documentElement.style.getPropertyValue('--app-bg');
    document.documentElement.style.setProperty('--app-bg', bg);
    return () => {
      if (prev) document.documentElement.style.setProperty('--app-bg', prev);
      else document.documentElement.style.removeProperty('--app-bg');
    };
  }, []);
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
  const showActionsRef = useRef<HTMLDivElement | null>(null);
  const bottomActionsWrapRef = useRef<HTMLDivElement | null>(null);
  const displayIsLiquidMode = toggleAlpha > 0.5;
  const realityOpacity = Math.max(0, Math.min(1, Math.abs(toggleAlpha - 0.5) * 2));
  const realityFadeStyle = useMemo(() => {
    return {
      opacity: realityOpacity,
      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
    } as React.CSSProperties;
  }, [realityOpacity, toggleAnimating, toggleKnobLeftPx]);
  const [marketWordHidden, setMarketWordHidden] = useState(false);
  const [marketWordText, setMarketWordText] = useState<string>('');
  const marketWordTimerRef = useRef<number | null>(null);
  const debugDelete = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debugDelete') === '1';
  }, []);
  const rangeClickFadeRef = useRef(false);
  const toggleKnobLeftComputedPx = useMemo(() => {
    if (!toggleTrack) return null;
    return toggleTrack.maxLeft - toggleAlpha * (toggleTrack.maxLeft - toggleTrack.minLeft);
  }, [toggleAlpha, toggleTrack]);
  const toggleKnobLeftEffectivePx = toggleKnobLeftPx ?? toggleKnobLeftComputedPx;
  const rangeHistoricalPrice = displayIsLiquidMode ? rangeHistoricalPriceLiquid : rangeHistoricalPriceSolid;
  const historicalPrice = displayIsLiquidMode ? historicalPriceLiquid : historicalPriceSolid;
  const assetSnapshot = getAsset('solana');
  const assetPrice = assetSnapshot?.price ?? 0;
  const vapa = assetSnapshot?.vapa ?? 0;
  const solidHistory = assetSnapshot?.solidHistory ?? [];
  const liquidHistory = assetSnapshot?.liquidHistory ?? [];
  const history = displayIsLiquidMode ? liquidHistory : solidHistory;
  const solidMarketCap = assetSnapshot?.solidMarketCap ?? [];
  const liquidMarketCap = assetSnapshot?.liquidMarketCap ?? [];
  const vapaMarketCap = displayIsLiquidMode ? liquidMarketCap : solidMarketCap;
  const [chartRangeDays, setChartRangeDays] = useState<number | null>(null);
  const [chartRangeAnchorMs, setChartRangeAnchorMs] = useState<number>(() => Date.now());
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [chartHoverPoint, setChartHoverPoint] = useState<{ x: Date; y: number } | null>(null);
  const [showInvestmentsList, setShowInvestmentsList] = useState<boolean>(false);
  const [investmentsListOpen, setInvestmentsListOpen] = useState(false);
  const [visibleInvestments, setVisibleInvestments] = useState<number>(3);
  const [closingInvestments, setClosingInvestments] = useState<string[]>([]);
  const [deletingInvestments, setDeletingInvestments] = useState<string[]>([]);
  const [pendingDeleteInvestments, setPendingDeleteInvestments] = useState<string[]>([]);
  const [deleteHeights, setDeleteHeights] = useState<Record<string, number>>({});
  const deleteInFlight =
    pendingDeleteInvestments.length > 0 || deletingInvestments.length > 0 || closingInvestments.length > 0;
  const [collapsedInvestments, setCollapsedInvestments] = useState<string[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryAnimating, setSummaryAnimating] = useState(false);
  const summaryAnimatingRef = useRef(false);
  const [summaryAnimatingCooldown, setSummaryAnimatingCooldown] = useState(false);
  const clearAfterDeleteRef = useRef(false);
  const [addMorePulse, setAddMorePulse] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [isSubmitCollapsing, setIsSubmitCollapsing] = useState(false);
  const [summaryValuesHidden, setSummaryValuesHidden] = useState(false);
  const summaryValuesDidMountRef = useRef(false);
  const [summaryTotalsSnapshot, setSummaryTotalsSnapshot] = useState<{
    acVatop: number;
    acdVatop: number;
    acVact: number;
    acVactTaa: number;
  } | null>(null);
  const [summaryPulseAfterDelete, setSummaryPulseAfterDelete] = useState(false);
  const [summaryRangePriceSnapshot, setSummaryRangePriceSnapshot] = useState<number | null>(null);
  const lastNonEmptyTotalsRef = useRef<{
    acVatop: number;
    acdVatop: number;
    acVact: number;
    acVactTaa: number;
  } | null>(null);
  const lastNonEmptyRangePriceRef = useRef<number | null>(null);
  const [summaryQuickFade, setSummaryQuickFade] = useState(false);
  const summaryQuickFadeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const summaryQuickFadeEndRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const pendingOpenAfterSubmitRef = useRef(false);
  const [hideEmptyActionsOnSubmit, setHideEmptyActionsOnSubmit] = useState(false);
  const emptyActionsHoldRef = useRef(false);
  const [formValuesHidden, setFormValuesHidden] = useState(false);
  const formValuesDidMountRef = useRef(false);
  const [formCalcHidden, setFormCalcHidden] = useState(false);
  const formCalcDidMountRef = useRef(false);
  const [headerNumbersVisible, setHeaderNumbersVisible] = useState(false);
  const [shimmersFading, setShimmersFading] = useState(false);
  const headerNumbersDidMountRef = useRef(false);
  const [emptySigninGone, setEmptySigninGone] = useState(false);
  const emptySigninGoneTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [emptySigninHiding, setEmptySigninHiding] = useState(false);
  const [emptyAddGone, setEmptyAddGone] = useState(false);
  const emptyAddGoneTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [emptyAddHiding, setEmptyAddHiding] = useState(false);
  const [emptyAddFadeIn, setEmptyAddFadeIn] = useState(true);
  const [emptyActionsExpanding, setEmptyActionsExpanding] = useState(false);
  const [emptyActionsMountPhase, setEmptyActionsMountPhase] = useState<'hidden' | 'revealing' | 'done'>('hidden');
  const emptyActionsExpandTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const emptyButtonsSequenceTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const submitCollapseTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const submitResetPendingRef = useRef(false);
  const pulseTimersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const didMountAddMorePulseRef = useRef(false);
  const didMountShowPulseRef = useRef(false);
  const addMorePulseActiveRef = useRef(false);
  const showPulseActiveRef = useRef(false);
  const [isClearingInvestments, setIsClearingInvestments] = useState(false);
  const clearInvestmentsAnimTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [slowOpenInvestments, setSlowOpenInvestments] = useState<string[]>([]);
  const isMutatingRef = useRef(false);
  const loadDataSeqRef = useRef(0);
  const prevInvestmentIdsRef = useRef<string[]>([]);
  const prevSummaryCountRef = useRef(0);
  const pendingNewIdsRef = useRef<string[]>([]);
  const investmentCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const deleteFadeTimersRef = useRef<Record<string, number>>({});
  const deleteActionTimersRef = useRef<Record<string, number>>({});
  const deleteCleanupTimersRef = useRef<Record<string, number>>({});
  const deleteLockRef = useRef(false);
  const toggleDisabledByDeleteRef = useRef(false);
  const [deleteLocked, setDeleteLocked] = useState(false);
  const investmentIdCounterRef = useRef(0);
  const investmentOrderRef = useRef<Map<string, number>>(new Map());
  const investmentOrderCounterRef = useRef(0);
  const [deleteGhosts, setDeleteGhosts] = useState<{ id: string; entry: any; index: number }[]>([]);
  const [deleteExpandIds, setDeleteExpandIds] = useState<string[]>([]);
  const lastDeletedSignatureRef = useRef<string | null>(null);
  const lastDeletedAtRef = useRef<number | null>(null);
  const summaryContentRef = useRef<HTMLDivElement | null>(null);
  const investmentsWholeContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      Object.values(deleteFadeTimersRef.current).forEach((timer) => {
        if (timer) globalThis.clearTimeout(timer);
      });
      Object.values(deleteActionTimersRef.current).forEach((timer) => {
        if (timer) globalThis.clearTimeout(timer);
      });
      Object.values(deleteCleanupTimersRef.current).forEach((timer) => {
        if (timer) globalThis.clearTimeout(timer);
      });
    };
  }, []);
  const investmentsWholePanelRef = useRef<HTMLDivElement | null>(null);
  const [investmentsWholeHeight, setInvestmentsWholeHeight] = useState(0);
  const lastInvestmentsWholeHeightRef = useRef(0);
  const addFormBoxRef = useRef<HTMLDivElement | null>(null);
  const addFormPanelRef = useRef<HTMLDivElement | null>(null);
  const addFormSlidePanelRef = useRef<HTMLDivElement | null>(null);
  const addFormCollapseAnimRef = useRef<Animation | null>(null);
  const addMoreFormBoxRef = useRef<HTMLDivElement | null>(null);
  const addMoreFormPanelRef = useRef<HTMLDivElement | null>(null);
  const profitInlineAnimRef = useRef<HTMLSpanElement | null>(null);
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const assetPriceChartMountSlide = useAssetPriceChartMountSlide(24, ASSET_PRICE_CHART_MOUNT_SLIDE_SECONDS);
  const assetPageMountAtRef = useRef(Date.now());
  const openInvestmentsDeferTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const headerPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionHeaderRef = useRef<HTMLDivElement | null>(null);
  const assetTitleRef = useRef<HTMLDivElement | null>(null);
  const [summaryHeight, setSummaryHeight] = useState<number>(0);
  const prevSummaryHeightRef = useRef<number>(0);
  const [purchasedValueHeight, setPurchasedValueHeight] = useState<number | null>(null);
  const [currentValueHeight, setCurrentValueHeight] = useState<number | null>(null);
  const [profitValueHeight, setProfitValueHeight] = useState<number | null>(null);
  const purchasedValueRef = useRef<HTMLDivElement | null>(null);
  const currentValueRef = useRef<HTMLDivElement | null>(null);
  const profitValueRef = useRef<HTMLDivElement | null>(null);
  const purchasedValuePrevRef = useRef<number | null>(null);
  const currentValuePrevRef = useRef<number | null>(null);
  const profitValuePrevRef = useRef<number | null>(null);
  const purchasedValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const currentValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const profitValueTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const lastFormattedVatopRef = useRef<string | null>(null);
  const lastFormattedVactRef = useRef<string | null>(null);
  const lastFormattedProfitRef = useRef<string | null>(null);
  const purchasedHeightPendingRef = useRef(false);
  const currentHeightPendingRef = useRef(false);
  const profitHeightPendingRef = useRef(false);
  const summaryAnimatedOnceRef = useRef(false);
  const profitOpenAnimOnceRef = useRef(false);
  const allowNumberHeightAnimationsRef = useRef(true);
  const numberHeightDisableTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const prevInvestmentCountRef = useRef(0);
  const [addFormPanelHeight, setAddFormPanelHeight] = useState<number>(0);
  const [addFormSubmitMaxHeight, setAddFormSubmitMaxHeight] = useState<number | null>(null);
  const [addFormOuterSubmitMaxHeight, setAddFormOuterSubmitMaxHeight] = useState<number | null>(null);
  const [addFormSubmitCollapsing, setAddFormSubmitCollapsing] = useState(false);
  const [submitTargetSnapshot, setSubmitTargetSnapshot] = useState<'add' | 'addMore' | null>(null);
  const [addMoreFormPanelHeight, setAddMoreFormPanelHeight] = useState<number>(0);
  const [profitInlineHeight, setProfitInlineHeight] = useState<number>(0);
  const investmentsListRef = useRef<HTMLDivElement | null>(null);
  const investmentsListHeaderRef = useRef<HTMLHeadingElement | null>(null);
  const [investmentsListHeight, setInvestmentsListHeight] = useState<number>(0);
  const [investmentsListHeaderHeight, setInvestmentsListHeaderHeight] = useState<number>(0);
  const investmentsListWrapRef = useRef<HTMLDivElement | null>(null);
  const investmentsListOuterRef = useRef<HTMLDivElement | null>(null);
  const [investmentsListBorderHeight, setInvestmentsListBorderHeight] = useState<number>(0);
  const emptyActionsRef = useRef<HTMLDivElement | null>(null);
  const emptyActionsMeasureRef = useRef<HTMLDivElement | null>(null);
  const [emptyActionsHeight, setEmptyActionsHeight] = useState<number>(0);
  const lastEmptyActionsHeightRef = useRef<number>(0);
  const [clearingHeight, setClearingHeight] = useState<number | null>(null);
  const clearingHeightRafRef = useRef<number | null>(null);
  const prevLiveCountRef = useRef(0);
  const [chartHeight, setChartHeight] = useState<number>(200);
  const [mobileChartHeight, setMobileChartHeight] = useState<number | null>(null);
  const chartTopPadding = 0;
  const chartBottomPadding = 0;
  const chartProtrusion = 0;
  const chartExtraPanelHeight = 0;
  const effectiveChartHeight = mobileChartHeight != null && typeof window !== 'undefined' && window.innerWidth < 750
    ? mobileChartHeight
    : chartHeight;
  const chartHeightAdjusted = Math.max(120, effectiveChartHeight - 0);
  const chartPanelHeight = chartHeightAdjusted + chartProtrusion + chartExtraPanelHeight + chartTopPadding + chartBottomPadding;
  const chartCanvasHeight = chartHeightAdjusted;
  const forceChartLoader = false;

  const pendingScrollLayoutCancelRef = useRef<(() => void) | null>(null);
  const cancelPendingScrollToBottom = useCallback(() => {
    pendingScrollLayoutCancelRef.current?.();
    pendingScrollLayoutCancelRef.current = null;
    cancelDocumentBottomScrollAnimation();
  }, []);

  const scrollToBottomAfterDocumentStable = useCallback(() => {
    cancelPendingScrollToBottom();
    pendingScrollLayoutCancelRef.current = runAfterDocumentHeightStable(
      () => {
        pendingScrollLayoutCancelRef.current = null;
        scrollDocumentToBottomOverMs(ASSET_PAGE_SCROLL_BOTTOM_MS);
      },
      { stableMs: 100, timeoutMs: 5500 }
    );
  }, [cancelPendingScrollToBottom]);

  const scrollToBottomAfterMaxHeightOn = useCallback(
    (el: Element | null | undefined, timeoutMs = 4000) => {
      cancelPendingScrollToBottom();
      pendingScrollLayoutCancelRef.current = runAfterMaxHeightTransitionEnd(
        el,
        () => {
          pendingScrollLayoutCancelRef.current = null;
          scrollDocumentToBottomOverMs(ASSET_PAGE_SCROLL_BOTTOM_MS);
        },
        { timeoutMs }
      );
    },
    [cancelPendingScrollToBottom]
  );

  useEffect(() => {
    return () => {
      cancelPendingScrollToBottom();
      if (showMoreDisableTimerRef.current) {
        globalThis.clearTimeout(showMoreDisableTimerRef.current);
        showMoreDisableTimerRef.current = null;
      }
      if (toggleReenableTimerRef.current) {
        globalThis.clearTimeout(toggleReenableTimerRef.current);
        toggleReenableTimerRef.current = null;
      }
      if (purchasedValueTimerRef.current) {
        globalThis.clearTimeout(purchasedValueTimerRef.current);
        purchasedValueTimerRef.current = null;
      }
      if (currentValueTimerRef.current) {
        globalThis.clearTimeout(currentValueTimerRef.current);
        currentValueTimerRef.current = null;
      }
      if (profitValueTimerRef.current) {
        globalThis.clearTimeout(profitValueTimerRef.current);
        profitValueTimerRef.current = null;
      }
      if (openInvestmentsDeferTimerRef.current) {
        globalThis.clearTimeout(openInvestmentsDeferTimerRef.current);
        openInvestmentsDeferTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!summaryAnimating) return;
    requestAnimationFrame(() => {
      scrollToBottomAfterMaxHeightOn(investmentsWholePanelRef.current, 4000);
    });
  }, [scrollToBottomAfterMaxHeightOn, summaryAnimating]);

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

  useEffect(() => {
    return () => {
      if (clearInvestmentsAnimTimerRef.current) {
        globalThis.clearTimeout(clearInvestmentsAnimTimerRef.current);
        clearInvestmentsAnimTimerRef.current = null;
      }
      if (emptyActionsExpandTimerRef.current) {
        globalThis.clearTimeout(emptyActionsExpandTimerRef.current);
        emptyActionsExpandTimerRef.current = null;
      }
      if (clearingHeightRafRef.current != null) {
        window.cancelAnimationFrame(clearingHeightRafRef.current);
        clearingHeightRafRef.current = null;
      }
    };
  }, []);

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

  // Keep refs in sync for pointer handlers.
  useEffect(() => {
    toggleAlphaRef.current = toggleAlpha;
  }, [toggleAlpha]);

  // Keep toggleAlpha in sync with committed mode when idle.
  useEffect(() => {
    if (toggleKnobLeftPx != null) return; // dragging/animating in progress
    setToggleAlpha(isLiquidMode ? 1 : 0);
  }, [isLiquidMode, toggleKnobLeftPx]);

  // Measure track on mount + resize so click animations can compute knob pixel positions.
  useLayoutEffect(() => {
    const btn = toggleBtnRef.current;
    if (!btn) return;
    measureToggleTrack();
    let raf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        measureToggleTrack();
      });
    });
    ro.observe(btn);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measureToggleTrack]);

  const animateToggleToAlpha = useCallback(
    (targetAlpha: number) => {
      const track = toggleTrack ?? measureToggleTrack();
      if (!track) return;
      const fromAlpha = toggleAlphaRef.current;
      const toAlpha = clamp01(targetAlpha);
      if (toggleAnimRafRef.current != null) cancelAnimationFrame(toggleAnimRafRef.current);
      setToggleAnimating(true);

      const start = performance.now();
      const duration = 350;
      const step = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        // Ease in/out for a more natural slide.
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const alpha = fromAlpha + (toAlpha - fromAlpha) * eased;
        const left = track.maxLeft - alpha * (track.maxLeft - track.minLeft);
        setToggleKnobLeftPx(left);
        setToggleAlpha(alpha);
        if (t < 1) {
          toggleAnimRafRef.current = requestAnimationFrame(step);
          return;
        }
        toggleAnimRafRef.current = null;
        setToggleAnimating(false);
        setToggleKnobLeftPx(null);
        const nextMode = toAlpha > 0.5;
        setIsLiquidMode(nextMode);
        setToggleAlpha(toAlpha);
      };
      toggleAnimRafRef.current = requestAnimationFrame(step);
    },
    [clamp01, measureToggleTrack, toggleTrack]
  );

  useEffect(() => {
    return () => {
      if (toggleAnimRafRef.current != null) cancelAnimationFrame(toggleAnimRafRef.current);
    };
  }, []);

  // Fade Purchased/Current values when range buttons or Liquid/Solid toggle changes.
  useEffect(() => {
    if (!summaryValuesDidMountRef.current) {
      summaryValuesDidMountRef.current = true;
      return;
    }
    setSummaryValuesHidden(true);
    const t = window.setTimeout(() => setSummaryValuesHidden(false), 350);
    return () => window.clearTimeout(t);
  }, [selectedRangeDays]);

  // Fade form numbers when Liquid/Solid toggle changes (match viewing section behavior).
  useEffect(() => {
    if (!formValuesDidMountRef.current) {
      formValuesDidMountRef.current = true;
      return;
    }
    setFormValuesHidden(true);
    const t = window.setTimeout(() => setFormValuesHidden(false), 350);
    return () => window.clearTimeout(t);
  }, []);

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
      if (isMutatingRef.current || deleteInFlight || isClearingInvestments) return;
      const seq = ++loadDataSeqRef.current;
      setLoading(true);
      try {
        const data = isSignedIn
          ? await (async () => {
              const params = new URLSearchParams({ email, asset: 'solana' });
              const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
              return await res.json();
            })()
          : await fetchVavityAggregator(sessionId, 'solana');
        if (debugDelete && lastDeletedSignatureRef.current && Array.isArray(data?.investments)) {
          const signature = lastDeletedSignatureRef.current;
          const returned = data.investments.some((entry: any) => {
            const sig =
              entry?.clientId || entry?.id || entry?._id || `${entry?.date ?? ''}|${entry?.cVactTaa ?? ''}`;
            return sig === signature;
          });
          if (returned) {
            const ageMs = lastDeletedAtRef.current ? Date.now() - lastDeletedAtRef.current : null;
            console.warn('[delete-debug] poll returned deleted investment', { signature, ageMs });
          }
        }
        if (isMounted && seq === loadDataSeqRef.current) {
          setVavityData(data);
        }
      } catch (error) {
        // Intentionally quiet to avoid UI noise
      } finally {
        if (isMounted && seq === loadDataSeqRef.current) {
          setLoading(false);
          setInitialFetchDone((prev) => prev || true);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchVavityAggregator, sessionId, sessionReady, isSignedIn, email, deleteInFlight, isClearingInvestments]);

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
    if (PREVIEW_SKIP_SESSION_DELETES) return;
    if (!sessionReady || !sessionId) return;
    if (isSignedIn || email) return;
    if (sessionMountClearGuardRef.current) return;
    sessionMountClearGuardRef.current = true;
    (async () => {
      try {
        const pendingAt = Date.now();
        if (typeof window !== 'undefined') {
          (window as any).__vavitySessionClearCheckPending = true;
          (window as any).__vavitySessionClearCheckPendingAt = pendingAt;
          window.dispatchEvent(
            new CustomEvent('vavity:session-clear-check-start', {
              detail: { pendingAt },
            }),
          );
        }
        let hasInvestments = Array.isArray(vavityData?.investments) && vavityData!.investments.length > 0;
        if (!hasInvestments) {
          const current = await fetchVavityAggregator(sessionId, 'solana');
          hasInvestments = Array.isArray(current?.investments) && current.investments.length > 0;
        }
        if (typeof window !== 'undefined') {
          (window as any).__vavitySessionClearCheckPending = false;
          (window as any).__vavitySessionClearCheckPendingAt = pendingAt;
          window.dispatchEvent(
            new CustomEvent('vavity:session-clear-check-end', {
              detail: { pendingAt, hasInvestments },
            }),
          );
        }
        if (!hasInvestments) return;
        if (typeof window !== 'undefined') {
          const holdMs = 4000;
          window.dispatchEvent(
            new CustomEvent('vavity:session-expired', {
              detail: { holdMs },
            }),
          );
          await new Promise((r) => globalThis.setTimeout(r, 600));
        }
        await saveVavityAggregator(sessionId, [], 'solana');
        const cleared = await fetchVavityAggregator(sessionId, 'solana');
        if (cleared) setVavityData(cleared);
      } catch {
        // ignore
      }
    })();
  }, [sessionReady, sessionId, isSignedIn, email, saveVavityAggregator, fetchVavityAggregator, sessionMountClearGuardRef]);

  useEffect(() => {
    prevVavityDataRef.current = vavityData;
  }, [vavityData]);

  useEffect(() => {
    if (isClearingInvestments) {
      if (!clearingSnapshotRef.current) {
        clearingSnapshotRef.current = vavityData;
      }
      return;
    }
    clearingSnapshotRef.current = null;
  }, [isClearingInvestments, vavityData]);

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
      requestAnimationFrame(() => scrollToBottomAfterDocumentStable());
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
      requestAnimationFrame(() => scrollToBottomAfterDocumentStable());
    }
  }, [previewSubmit, vavityData, isClearingInvestments, scrollToBottomAfterDocumentStable]);

  // Chart should not "reload" when Liquid/Solid display swaps; only gate initial readiness on having any data.
  useEffect(() => {
    if (chartReady) return;
    const hasAny = solidHistory.length > 0 || liquidHistory.length > 0;
    if (!hasAny) return;
    const timer = window.setTimeout(() => setChartReady(true), 150);
    return () => window.clearTimeout(timer);
  }, [chartReady, solidHistory.length, liquidHistory.length]);

  // NOTE: `addFormOpen` is intentionally orchestrated alongside `showAddForm`
  // in the click handler (mount, then open next tick) to match the Add-more form timing.

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      if (window.innerWidth < 750) return;
      const height = el.getBoundingClientRect().height;
      const next = Math.max(120, Math.round(height));
      setChartHeight((prev) => (prev === next ? prev : next));
    };
    const updateMobile = () => {
      setMobileChartHeight(window.innerWidth < 750 ? 150 : null); /* edit mobile chart height */
    };
    update();
    updateMobile();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('resize', updateMobile);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('resize', updateMobile);
    };
  }, []);

  const liveInvestments = vavityData?.investments || [];
  const displayData = isClearingInvestments && clearingSnapshotRef.current ? clearingSnapshotRef.current : vavityData;
  const investments = displayData?.investments || [];
  const getInvestmentId = useCallback((entry: any) => {
    if (entry?.clientId) return entry.clientId;
    if (entry?.id) return entry.id;
    if (entry?._id) return entry._id;
    if (entry?.__localId) return entry.__localId;
    const nextId = `inv-${investmentIdCounterRef.current++}`;
    if (entry && typeof entry === 'object') {
      entry.__localId = nextId;
    }
    return nextId;
  }, []);
  const investmentIds = useMemo(() => investments.map(getInvestmentId), [getInvestmentId, investments]);
  const displayInvestments = useMemo(() => {
    const base = investments.map((entry: any, idx: number) => {
      const id = investmentIds[idx];
      if (!investmentOrderRef.current.has(id)) {
        investmentOrderRef.current.set(id, investmentOrderCounterRef.current++);
      }
      return { id, entry, index: idx };
    });
    const existing = new Set(base.map((item: { id: string }) => item.id));
    const ghosts = deleteGhosts.filter((ghost) => !existing.has(ghost.id));
    return [...base, ...ghosts].sort((a, b) => {
      const orderA = investmentOrderRef.current.get(a.id) ?? a.index;
      const orderB = investmentOrderRef.current.get(b.id) ?? b.index;
      return orderA - orderB;
    });
  }, [deleteGhosts, investmentIds, investments]);
  const totals = displayData?.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
  const totalsLiquid =
    displayData?.totalsLiquid ??
    displayData?.totalsReality ??
    { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
  const displayTotals = displayIsLiquidMode ? totalsLiquid : totals;
  const suppressInvestmentsUI = isSubmitCollapsing && submitTargetRef.current === 'add';
  const hasInvestmentsUI = (investments.length > 0 || isClearingInvestments) && !suppressInvestmentsUI;
  const showInvestmentsHeader = investments.length > 0;
  const shouldFetchInitialData = isSignedIn ? Boolean(email) : Boolean(sessionReady && sessionId && fetchVavityAggregator);
  const showInitialFetchLoader = shouldFetchInitialData && !initialFetchDone;

  const finalizeDeleteCollapse = useCallback((investmentId: string) => {
    setClosingInvestments((prev) => prev.filter((value) => value !== investmentId));
    setDeletingInvestments((prev) => prev.filter((value) => value !== investmentId));
    setDeleteExpandIds((prev) => prev.filter((value) => value !== investmentId));
    setPendingDeleteInvestments((prev) => prev.filter((value) => value !== investmentId));
    setDeleteGhosts((prev) => prev.filter((ghost) => ghost.id !== investmentId));
    setSummaryPulseAfterDelete(true);
    window.setTimeout(() => {
      setDeleteHeights((prev) => {
        const next = { ...prev };
        delete next[investmentId];
        return next;
      });
    }, 200);
    const cleanupTimer = deleteCleanupTimersRef.current[investmentId];
    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      delete deleteCleanupTimersRef.current[investmentId];
    }
    const expandTimer = deleteCleanupTimersRef.current[`${investmentId}-expand`];
    if (expandTimer) {
      window.clearTimeout(expandTimer);
      delete deleteCleanupTimersRef.current[`${investmentId}-expand`];
    }
    deleteLockRef.current = false;
    setDeleteLocked(false);
  }, []);
  const prevHasInvestmentsUIRef = useRef<boolean>(hasInvestmentsUI);
  const openInvestmentsSection = useCallback(() => {
    const run = () => {
      openInvestmentsDeferTimerRef.current = null;
      setInvestmentsWholeHeight(0);
      setSummaryAnimating(true);
      summaryAnimatingRef.current = true;
      setSummaryOpen(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const whole = investmentsWholeContentRef.current;
          if (whole) {
            const h = whole.scrollHeight + 24;
            setInvestmentsWholeHeight(h);
          }
          scrollToBottomAfterMaxHeightOn(investmentsWholePanelRef.current, 4000);
        });
      });
    };
    const elapsed = Date.now() - assetPageMountAtRef.current;
    const chartAlignedDelayMs =
      ASSET_PRICE_CHART_MOUNT_SLIDE_MS - ASSET_SUMMARY_START_BEFORE_CHART_SLIDE_END_MS;
    const requiredDelayFromMountMs = Math.max(chartAlignedDelayMs, ASSET_SUMMARY_PAUSE_BEFORE_EXPAND_MS);
    const waitMs = Math.max(0, requiredDelayFromMountMs - elapsed);
    if (openInvestmentsDeferTimerRef.current) {
      globalThis.clearTimeout(openInvestmentsDeferTimerRef.current);
      openInvestmentsDeferTimerRef.current = null;
    }
    if (waitMs <= 0) {
      run();
    } else {
      openInvestmentsDeferTimerRef.current = globalThis.setTimeout(run, waitMs);
    }
  }, [scrollToBottomAfterMaxHeightOn]);
  const triggerEmptyButtonsExpand = useCallback(() => {
    setEmptyActionsMountPhase('done');
    setEmptySigninGone(false);
    setEmptyAddGone(false);
    setEmptySigninHiding(true);
    setEmptyAddHiding(true);
    if (emptyActionsExpandTimerRef.current) {
      globalThis.clearTimeout(emptyActionsExpandTimerRef.current);
      emptyActionsExpandTimerRef.current = null;
    }
    setEmptyActionsExpanding(true);
    setEmptyAddFadeIn(false);
    emptyActionsExpandTimerRef.current = globalThis.setTimeout(() => {
      setEmptyActionsExpanding(false);
      emptyActionsExpandTimerRef.current = null;
    }, 1000);
    requestAnimationFrame(() => {
      scrollToBottomAfterMaxHeightOn(emptyActionsRef.current, 4000);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEmptyAddFadeIn(true);
        setEmptySigninHiding(false);
        setEmptyAddHiding(false);
      });
    });
  }, [scrollToBottomAfterMaxHeightOn]);
  useEffect(() => {
    if (!emptyActionsHoldRef.current) return;
    if (investments.length > 0 && !isSubmitCollapsing) {
      emptyActionsHoldRef.current = false;
      setHideEmptyActionsOnSubmit(false);
    }
  }, [investments.length, isSubmitCollapsing]);
  const summaryMaxHeight = summaryOpen && !isClearingInvestments
    ? (summaryAnimating ? 'none' : `${summaryHeight}px`)
    : '0px';
  const emptyActionsTargetHeight = emptyActionsHeight || lastEmptyActionsHeightRef.current;
  const investmentsWholeMaxHeight =
    summaryOpen && !isClearingInvestments
      ? `${investmentsWholeHeight}px`
      : isClearingInvestments && emptyActionsTargetHeight
        ? `${emptyActionsTargetHeight}px`
        : '0px';
  const investmentsWholeTransition = isClearingInvestments
    ? 'max-height 3s ease'
    : summaryAnimating || summaryAnimatingCooldown || addFormSubmitCollapsing
      ? 'max-height 3s ease'
      : 'max-height 0s ease';
  const clearingHeightPx = isClearingInvestments && clearingHeight != null ? `${clearingHeight}px` : undefined;
  // Add-more form lives inside the summary panel. If both the outer summary and the inner form
  // animate max-height, it feels slower because the outer panel clips the inner one during its own expand.
  // When Add-more is showing, snap the outer summary height and let only the inner form animate.
  const summaryTransition =
    summaryAnimating ? 'max-height 0s ease' : addMoreOpen || suppressSummaryTransition ? 'max-height 0s ease' : 'max-height 3s ease';
  const shouldRenderAddForm =
    (showEmptyAddForm && showAddForm) || addFormSubmitAnimating || addFormSubmitCollapsing;

  const beginClearing = useCallback(
    (heightOverride?: number) => {
      if (isClearingInvestments) return;
      const startHeight =
        heightOverride ??
        investmentsWholePanelRef.current?.getBoundingClientRect().height ??
        lastInvestmentsWholeHeightRef.current ??
        investmentsWholeHeight ??
        investmentsWholeContentRef.current?.getBoundingClientRect().height ??
        0;
      setClearingHeight(startHeight);
      setSummaryOpen(true);
      setIsClearingInvestments(true);
      if (clearingHeightRafRef.current != null) {
        window.cancelAnimationFrame(clearingHeightRafRef.current);
        clearingHeightRafRef.current = null;
      }
      clearingHeightRafRef.current = window.requestAnimationFrame(() => {
        clearingHeightRafRef.current = window.requestAnimationFrame(() => {
          if (investmentsWholePanelRef.current) {
            void investmentsWholePanelRef.current.offsetHeight;
          }
          setClearingHeight(0);
          clearingHeightRafRef.current = null;
        });
      });
    },
    [investmentsWholeHeight, isClearingInvestments]
  );

  useLayoutEffect(() => {
    const prev = prevLiveCountRef.current;
    const next = liveInvestments.length;
    if (prev > 0 && next === 0 && !isClearingInvestments) {
      if (deleteInFlight) {
        clearAfterDeleteRef.current = true;
      } else {
        if (!clearingSnapshotRef.current && prevVavityDataRef.current) {
          clearingSnapshotRef.current = prevVavityDataRef.current;
        }
        beginClearing();
      }
    }
    prevLiveCountRef.current = next;
  }, [beginClearing, deleteInFlight, isClearingInvestments, liveInvestments.length]);

  useEffect(() => {
    const prev = prevSummaryCountRef.current;
    const next = liveInvestments.length;
    if (next === 0) {
      // Auto-expiry/delete-to-zero should play the same collapse dynamic as manual delete.
      if (prev > 0) {
        if (!clearingSnapshotRef.current && prevVavityDataRef.current) {
          clearingSnapshotRef.current = prevVavityDataRef.current;
        }
        if (!summaryTotalsSnapshot) {
          const totals = lastNonEmptyTotalsRef.current;
          if (totals) {
            setSummaryTotalsSnapshot({ ...totals });
            setSummaryRangePriceSnapshot(lastNonEmptyRangePriceRef.current ?? null);
          }
        }
        // Keep the wrapper open during the clearing animation.
        beginClearing();
        if (clearInvestmentsAnimTimerRef.current) {
          globalThis.clearTimeout(clearInvestmentsAnimTimerRef.current);
          clearInvestmentsAnimTimerRef.current = null;
        }
        clearInvestmentsAnimTimerRef.current = globalThis.setTimeout(() => {
          if (showEmptyAddForm || showAddForm || addFormOpen) {
            clearInvestmentsAnimTimerRef.current = null;
            return;
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vavity:session-reset-empty-actions-collapse-started'));
          }
          // Ensure empty buttons animate in (height down 1s) after clearing.
          setEmptySigninHiding(true);
          setEmptySigninGone(false);
          setEmptyAddHiding(true);
          setEmptyAddGone(false);
          if (emptyActionsExpandTimerRef.current) {
            globalThis.clearTimeout(emptyActionsExpandTimerRef.current);
            emptyActionsExpandTimerRef.current = null;
          }
          setEmptyActionsExpanding(true);
          emptyActionsExpandTimerRef.current = globalThis.setTimeout(() => {
            setEmptyActionsExpanding(false);
            emptyActionsExpandTimerRef.current = null;
          }, 1000);
          prevLiveCountRef.current = 0;
          prevSummaryCountRef.current = 0;
          setIsClearingInvestments(false);
          setSummaryTotalsSnapshot(null);
          setSummaryRangePriceSnapshot(null);
          setShowEmptyAddForm(false);
          setShowAddForm(false);
          setAddFormOpen(false);
          setShowAddMoreForm(false);
          setAddMoreOpen(false);
          setShowInvestmentsList(false);
          setInvestmentsListOpen(false);
          setSubmitPhase('idle');
          submitTargetRef.current = 'add';
          setHideEmptyActionsOnSubmit(false);
          emptyActionsHoldRef.current = false;
        setSummaryOpen(false);
          clearInvestmentsAnimTimerRef.current = null;
        }, 3000);
      } else if (!isClearingInvestments) {
        if (showEmptyAddForm || showAddForm || addFormOpen) {
          prevSummaryCountRef.current = next;
          return;
        }
        setSummaryOpen(false);
        // Initial empty mount or already-finished clear.
        setShowEmptyAddForm(false);
        setShowAddForm(false);
        setAddFormOpen(false);
        setEmptySigninHiding(false);
        setEmptySigninGone(false);
        setEmptyAddHiding(false);
        setEmptyAddGone(false);
        setShowAddMoreForm(false);
        setAddMoreOpen(false);
        setShowInvestmentsList(false);
        setInvestmentsListOpen(false);
        setSubmitPhase('idle');
        submitTargetRef.current = 'add';
      }
      prevSummaryCountRef.current = next;
      return;
    }
    if (next > prev && !isClearingInvestments) {
      if (isSubmitCollapsing && submitTargetRef.current === 'addMore') {
        prevSummaryCountRef.current = next;
        return;
      }
      if (suppressInvestmentsUI) {
        pendingOpenAfterSubmitRef.current = true;
        prevSummaryCountRef.current = next;
        return;
      }
      openInvestmentsSection();
    }
    prevSummaryCountRef.current = next;
  }, [
    investments.length,
    isClearingInvestments,
    openInvestmentsSection,
    summaryTotalsSnapshot,
    suppressInvestmentsUI,
    isSubmitCollapsing,
    triggerEmptyButtonsExpand,
  ]);

  useEffect(() => {
    const prev = prevHasInvestmentsUIRef.current;
    if (prev && !hasInvestmentsUI && !showEmptyAddForm) {
      triggerEmptyButtonsExpand();
    }
    prevHasInvestmentsUIRef.current = hasInvestmentsUI;
  }, [hasInvestmentsUI, showEmptyAddForm, triggerEmptyButtonsExpand]);

  useLayoutEffect(() => {
    if (!summaryOpen || isClearingInvestments) {
      setSummaryAnimating(false);
      summaryAnimatingRef.current = false;
      setPurchasedValueHeight(null);
      setCurrentValueHeight(null);
      setProfitValueHeight(null);
      purchasedValuePrevRef.current = null;
      currentValuePrevRef.current = null;
      profitValuePrevRef.current = null;
      lastFormattedVatopRef.current = null;
      lastFormattedVactRef.current = null;
      lastFormattedProfitRef.current = null;
      purchasedHeightPendingRef.current = true;
      currentHeightPendingRef.current = true;
      profitHeightPendingRef.current = true;
      return;
    }
    setSummaryAnimating(true);
    summaryAnimatingRef.current = true;
    const timer = window.setTimeout(() => {
      setSummaryAnimating(false);
      summaryAnimatingRef.current = false;
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [summaryOpen, isClearingInvestments]);

  useEffect(() => {
    if (summaryAnimating) {
      setSummaryAnimatingCooldown(true);
      return;
    }
    const timer = window.setTimeout(() => setSummaryAnimatingCooldown(false), 500);
    return () => window.clearTimeout(timer);
  }, [summaryAnimating]);

  useEffect(() => {
    if (!summaryOpen) {
      summaryAnimatedOnceRef.current = false;
      return;
    }
    if (summaryAnimating) {
      summaryAnimatedOnceRef.current = true;
    }
  }, [summaryOpen, summaryAnimating]);

  useEffect(() => {
    if (summaryAnimating) return;
    if (!toggleReenableOnSummaryExpandRef.current) return;
    toggleReenableOnSummaryExpandRef.current = false;
    toggleDisabledByDeleteRef.current = false;
    setToggleDisabled(false);
    setToggleKnobHidden(false);
  }, [summaryAnimating]);

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

  useEffect(() => {
    if (!clearAfterDeleteRef.current) return;
    if (deleteInFlight || isClearingInvestments) return;
    if (liveInvestments.length !== 0) return;
    clearAfterDeleteRef.current = false;
    const startHeight =
      investmentsWholePanelRef.current?.getBoundingClientRect().height ||
      lastInvestmentsWholeHeightRef.current ||
      investmentsWholeHeight ||
      investmentsWholeContentRef.current?.getBoundingClientRect().height ||
      0;
    clearingSnapshotRef.current = vavityData;
    beginClearing(startHeight);
  }, [
    beginClearing,
    deleteInFlight,
    investmentsWholeHeight,
    isClearingInvestments,
    liveInvestments.length,
    vavityData,
  ]);

  useEffect(() => {
    const prev = prevSummaryHeightRef.current;
    if (summaryHeight !== prev && toggleReenableOnSummaryExpandRef.current) {
      if (toggleReenableTimerRef.current) {
        globalThis.clearTimeout(toggleReenableTimerRef.current);
        toggleReenableTimerRef.current = null;
      }
      toggleReenableTimerRef.current = globalThis.setTimeout(() => {
        toggleReenableTimerRef.current = null;
        toggleReenableOnSummaryExpandRef.current = false;
        toggleDisabledByDeleteRef.current = false;
        setToggleDisabled(false);
        setToggleKnobHidden(false);
      }, 2000);
    }
    prevSummaryHeightRef.current = summaryHeight;
  }, [summaryHeight]);

  useEffect(() => {
    if (deleteInFlight) return;
    if (!toggleDisabledByDeleteRef.current) return;
    if (submitLoading) return;
    if (toggleReenableOnSummaryExpandRef.current) return;
    toggleDisabledByDeleteRef.current = false;
    setToggleDisabled(false);
    setToggleKnobHidden(false);
  }, [deleteInFlight, submitLoading, summaryAnimating]);

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
        const next = node.scrollHeight + 24;
        setInvestmentsWholeHeight((prev) => {
          if (next === prev) return prev;
          /* Opening animation used to skip all updates here for ~3s; inner growth (Add more, big numbers)
           * then never raised max-height and the outer panel clipped. Allow increases; avoid shrinking mid-open. */
          if (summaryAnimatingRef.current && next < prev) return prev;
          return next;
        });
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

  useEffect(() => {
    if (summaryAnimating || !summaryOpen || isClearingInvestments) return;
    const node = investmentsWholeContentRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      const next = node.scrollHeight + 24;
      setInvestmentsWholeHeight((prev) => (prev === next ? prev : next));
    });
  }, [summaryAnimating, summaryOpen, isClearingInvestments]);

  useEffect(() => {
    if (investmentsWholeHeight > 0) {
      lastInvestmentsWholeHeightRef.current = investmentsWholeHeight;
    }
  }, [investmentsWholeHeight]);

  useEffect(() => {
    if (!isClearingInvestments) {
      if (clearingHeightRafRef.current != null) {
        window.cancelAnimationFrame(clearingHeightRafRef.current);
        clearingHeightRafRef.current = null;
      }
      setClearingHeight(null);
    }
  }, [isClearingInvestments]);

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
    if (!summaryOpen || isClearingInvestments || !hasInvestmentsUI) {
      setProfitInlineHeight(0);
      return;
    }
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
  }, [summaryOpen, isClearingInvestments, hasInvestmentsUI, selectedRangeDays, rangeLoading]);
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
      { label: '24 hrs', days: 1 },
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
        const [solidResp, liquidResp] = await Promise.all([
          axios.get('/api/assets/crypto/solana/solanaVapaHistoricalPrice', { params: { date: isoDate, mode: 'solid' } }),
          axios.get('/api/assets/crypto/solana/solanaVapaHistoricalPrice', { params: { date: isoDate, mode: 'liquid' } }),
        ]);
        const solidNum = Number(solidResp.data?.price);
        const liquidNum = Number(liquidResp.data?.price);
        if (isMounted) {
          if (Number.isFinite(solidNum)) setRangeHistoricalPriceSolid(solidNum);
          if (Number.isFinite(liquidNum)) setRangeHistoricalPriceLiquid(liquidNum);
        }
      } catch {
        // Keep last known values; do not flip to null.
      } finally {
        if (isMounted) setRangeLoading(false);
      }
    };
    loadRangePrice();
    return () => {
      isMounted = false;
    };
  }, [selectedRangeDays]);

  const sliceSeriesWithAnchor = useCallback(
    (src: { date: string; price: number }[]) => {
      if (!chartRangeDays || !src.length) return src;
      const cutoff = chartRangeAnchorMs - chartRangeDays * 24 * 60 * 60 * 1000;
      const parsed = src
        .map((item) => ({ item, t: new Date(item.date).getTime() }))
        .filter((entry) => Number.isFinite(entry.t));
      if (!parsed.length) return src.length >= 2 ? src.slice(-2) : src;
      const firstInRangeIdx = parsed.findIndex((entry) => entry.t >= cutoff);
      if (firstInRangeIdx === -1) return parsed.length >= 2 ? parsed.slice(-2).map((e) => e.item) : parsed.map((e) => e.item);
      const startIdx = Math.max(0, firstInRangeIdx - 1); // include one point just before cutoff for continuous morph
      const anchored = parsed.slice(startIdx).map((entry) => entry.item);
      if (anchored.length >= 2) return anchored;
      return parsed.length >= 2 ? parsed.slice(-2).map((e) => e.item) : anchored;
    },
    [chartRangeAnchorMs, chartRangeDays]
  );

  const chartHistory = useMemo(() => sliceSeriesWithAnchor(history), [history, sliceSeriesWithAnchor]);

  const filterSeriesForRange = useCallback(
    (src: { date: string; price: number }[]) => sliceSeriesWithAnchor(src),
    [sliceSeriesWithAnchor]
  );

  const chartHistorySolid = useMemo(() => filterSeriesForRange(solidHistory), [filterSeriesForRange, solidHistory]);
  const chartHistoryLiquid = useMemo(
    () => filterSeriesForRange(liquidHistory),
    [filterSeriesForRange, liquidHistory]
  );

  // Prepare union timeline + interpolated series once per range/data change.
  const chartMorphPrepared = useMemo(() => {
    const toPoints = (src: { date: string; price: number }[]) =>
      (src || [])
        .map((p) => {
          const t = new Date(p.date).getTime();
          const y = Number(p.price);
          return Number.isFinite(t) && Number.isFinite(y) ? ([t, y] as const) : null;
        })
        .filter(Boolean) as Array<readonly [number, number]>;

    const solidSrc = chartHistorySolid;
    const liquidSrc = chartHistoryLiquid;
    const solidPts = toPoints(solidSrc).sort((a, b) => a[0] - b[0]);
    const liquidPts = toPoints(liquidSrc).sort((a, b) => a[0] - b[0]);
    if (!solidPts.length && !liquidPts.length) return null;

    const targetCount = chartRangeDays == null ? 320 : chartRangeDays >= 365 ? 280 : 240;

    const buildArcSampler = (pts: Array<readonly [number, number]>) => {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      let minX = xs[0];
      let maxX = xs[0];
      let minY = ys[0];
      let maxY = ys[0];
      for (let i = 1; i < xs.length; i += 1) {
        const x = xs[i];
        const y = ys[i];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const xSpan = maxX - minX || 1;
      const ySpan = Math.max(maxY - minY, Math.max(Math.abs(maxY), 1) * 0.05);
      const cum: number[] = new Array(xs.length).fill(0);
      let total = 0;
      for (let i = 1; i < xs.length; i += 1) {
        const dx = (xs[i] - xs[i - 1]) / xSpan;
        const dy = (ys[i] - ys[i - 1]) / ySpan;
        total += Math.hypot(dx, dy);
        cum[i] = total;
      }
      return { xs, ys, cum, total };
    };

    const sampleAtArc = (
      sampler: { xs: number[]; ys: number[]; cum: number[]; total: number },
      dist: number
    ) => {
      const { xs, ys, cum, total } = sampler;
      if (!xs.length) return { t: 0, y: 0 };
      if (xs.length === 1 || total === 0) return { t: xs[0], y: ys[0] };
      const target = Math.min(Math.max(dist, 0), total);
      let lo = 0;
      let hi = cum.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (cum[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const i1 = Math.min(Math.max(lo, 1), cum.length - 1);
      const i0 = i1 - 1;
      const d0 = cum[i0];
      const d1 = cum[i1];
      const frac = d1 !== d0 ? (target - d0) / (d1 - d0) : 0;
      const t = xs[i0] + (xs[i1] - xs[i0]) * frac;
      const y = ys[i0] + (ys[i1] - ys[i0]) * frac;
      return { t, y };
    };

    const sampleSeriesByArc = (pts: Array<readonly [number, number]>, count: number) => {
      if (!pts.length || count <= 0) return null;
      const sampler = buildArcSampler(pts);
      const total = sampler.total;
      const steps = Math.max(2, count);
      const ts: number[] = new Array(steps);
      const ys: number[] = new Array(steps);
      for (let i = 0; i < steps; i += 1) {
        const d = total * (steps === 1 ? 0 : i / (steps - 1));
        const point = sampleAtArc(sampler, d);
        ts[i] = point.t;
        ys[i] = point.y;
      }
      return { ts, ys };
    };

    const solidBase = solidPts.length ? solidPts : liquidPts;
    const liquidBase = liquidPts.length ? liquidPts : solidPts;
    if (!solidBase.length || !liquidBase.length) return null;
    const solidSample = sampleSeriesByArc(solidBase, targetCount);
    const liquidSample = sampleSeriesByArc(liquidBase, targetCount);
    if (!solidSample || !liquidSample) return null;
    return {
      solidTs: solidSample.ts,
      solidYs: solidSample.ys,
      liquidTs: liquidSample.ts,
      liquidYs: liquidSample.ys,
    };
  }, [chartHistoryLiquid, chartHistorySolid, chartRangeDays]);

  const decimateSeriesForRange = useCallback(
    (src: { date: string; price: number }[]) => {
      const maxPoints = chartRangeDays == null ? 320 : chartRangeDays >= 365 ? 280 : 9999;
      if (!src || src.length <= maxPoints) return src || [];
      const out: { date: string; price: number }[] = [];
      const target = Math.max(2, maxPoints);
      let lastIdx = -1;
      for (let i = 0; i < target; i += 1) {
        const idx = Math.round((i * (src.length - 1)) / (target - 1));
        if (idx === lastIdx) continue;
        lastIdx = idx;
        out.push(src[idx]);
      }
      return out;
    },
    [chartRangeDays]
  );

  const chartHistorySolidArc = useMemo(() => {
    if (!chartMorphPrepared) return decimateSeriesForRange(chartHistorySolid || []);
    const { solidTs, solidYs } = chartMorphPrepared;
    const out: { date: string; price: number }[] = [];
    for (let i = 0; i < solidTs.length; i += 1) {
      out.push({ date: new Date(solidTs[i]).toISOString(), price: solidYs[i] });
    }
    if (out.length >= 2) return out;
    return decimateSeriesForRange(chartHistorySolid || []);
  }, [chartHistorySolid, chartMorphPrepared, decimateSeriesForRange]);

  const chartHistoryLiquidArc = useMemo(() => {
    if (!chartMorphPrepared) return decimateSeriesForRange(chartHistoryLiquid || []);
    const { liquidTs, liquidYs } = chartMorphPrepared;
    const out: { date: string; price: number }[] = [];
    for (let i = 0; i < liquidTs.length; i += 1) {
      out.push({ date: new Date(liquidTs[i]).toISOString(), price: liquidYs[i] });
    }
    if (out.length >= 2) return out;
    return decimateSeriesForRange(chartHistoryLiquid || []);
  }, [chartHistoryLiquid, chartMorphPrepared, decimateSeriesForRange]);

  const chartHistoryMorph = useMemo(() => {
    const morphActive = toggleKnobLeftPx != null || toggleAnimating;
    if (!morphActive || !chartMorphPrepared) return null;
    const a = Math.max(0, Math.min(1, toggleAlpha));
    if (a <= 0.001) return chartHistorySolidArc;
    if (a >= 0.999) return chartHistoryLiquidArc;
    const { solidTs, solidYs, liquidTs, liquidYs } = chartMorphPrepared;
    const blendA = a;
    let solidMin = Number.POSITIVE_INFINITY;
    let solidMax = Number.NEGATIVE_INFINITY;
    let liquidMin = Number.POSITIVE_INFINITY;
    let liquidMax = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < solidYs.length; i += 1) {
      const s = solidYs[i];
      const l = liquidYs[i];
      if (s < solidMin) solidMin = s;
      if (s > solidMax) solidMax = s;
      if (l < liquidMin) liquidMin = l;
      if (l > liquidMax) liquidMax = l;
    }
    const solidSpan = Math.max(0, solidMax - solidMin);
    const liquidSpan = Math.max(0, liquidMax - liquidMin);
    const percentileFromSorted = (sorted: number[], p: number) => {
      if (!sorted.length) return 0;
      const idx = (sorted.length - 1) * p;
      const i0 = Math.floor(idx);
      const i1 = Math.min(sorted.length - 1, i0 + 1);
      const frac = idx - i0;
      const v0 = sorted[i0];
      const v1 = sorted[i1];
      return v0 + (v1 - v0) * frac;
    };
    const solidSorted = [...solidYs].sort((a, b) => a - b);
    const liquidSorted = [...liquidYs].sort((a, b) => a - b);
    const solidNormMin = percentileFromSorted(solidSorted, 0.1);
    const solidNormMax = percentileFromSorted(solidSorted, 0.9);
    const liquidNormMin = percentileFromSorted(liquidSorted, 0.1);
    const liquidNormMax = percentileFromSorted(liquidSorted, 0.9);
    const solidNormSpan = Math.max(solidNormMax - solidNormMin, Math.max(Math.abs(solidNormMax), 1) * 0.05);
    const liquidNormSpan = Math.max(liquidNormMax - liquidNormMin, Math.max(Math.abs(liquidNormMax), 1) * 0.05);
    const norm = (v: number, min: number, max: number, span: number) => {
      const clamped = Math.min(Math.max(v, min), max);
      return span > 0 ? (clamped - min) / span : 0.5;
    };
    const normRaw = (v: number, min: number, span: number) => (span > 0 ? (v - min) / span : 0.5);
    const minMix = solidMin * (1 - blendA) + liquidMin * blendA;
    const spanMix = solidSpan * (1 - blendA) + liquidSpan * blendA;
    const shapePower = 3.5;
    const shapeAlpha = 1 - Math.pow(1 - blendA, shapePower);
    const normMix = 4 * blendA * (1 - blendA);
    // Performance mode during manual drag:
    // cap rendered points (especially "All") so the chart can track pointer movement without lag.
    const maxMorphPoints = chartRangeDays == null ? 320 : chartRangeDays >= 365 ? 280 : 9999;
    const total = solidTs.length;
    const blended: { date: string; price: number }[] = [];
    if (total <= maxMorphPoints) {
      for (let idx = 0; idx < total; idx += 1) {
        const pointBlendA = blendA;
        const t = solidTs[idx] * (1 - pointBlendA) + liquidTs[idx] * pointBlendA;
        const sNRaw = normRaw(solidYs[idx], solidMin, solidSpan);
        const lNRaw = normRaw(liquidYs[idx], liquidMin, liquidSpan);
        const sNPerc = norm(solidYs[idx], solidNormMin, solidNormMax, solidNormSpan);
        const lNPerc = norm(liquidYs[idx], liquidNormMin, liquidNormMax, liquidNormSpan);
        const sN = sNRaw * (1 - normMix) + sNPerc * normMix;
        const lN = lNRaw * (1 - normMix) + lNPerc * normMix;
        const yN = sN * (1 - shapeAlpha) + lN * shapeAlpha;
        blended.push({
          date: new Date(t).toISOString(),
          price: minMix + spanMix * yN,
        });
      }
    } else {
      const target = Math.max(2, maxMorphPoints);
      let lastIdx = -1;
      for (let i = 0; i < target; i += 1) {
        const idx = Math.round((i * (total - 1)) / (target - 1));
        if (idx === lastIdx) continue;
        lastIdx = idx;
        const pointBlendA = blendA;
        const t = solidTs[idx] * (1 - pointBlendA) + liquidTs[idx] * pointBlendA;
        const sNRaw = normRaw(solidYs[idx], solidMin, solidSpan);
        const lNRaw = normRaw(liquidYs[idx], liquidMin, liquidSpan);
        const sNPerc = norm(solidYs[idx], solidNormMin, solidNormMax, solidNormSpan);
        const lNPerc = norm(liquidYs[idx], liquidNormMin, liquidNormMax, liquidNormSpan);
        const sN = sNRaw * (1 - normMix) + sNPerc * normMix;
        const lN = lNRaw * (1 - normMix) + lNPerc * normMix;
        const yN = sN * (1 - shapeAlpha) + lN * shapeAlpha;
        blended.push({
          date: new Date(t).toISOString(),
          price: minMix + spanMix * yN,
        });
      }
    }
    if (blended.length >= 2) return blended;
    if (blended.length === 1) return blended;
    return chartHistorySolidArc;
  }, [
    chartHistoryLiquidArc,
    chartHistorySolidArc,
    chartMorphPrepared,
    chartRangeDays,
    toggleAlpha,
    toggleAnimating,
    toggleKnobLeftPx,
  ]);

  const chartHistoryDisplay = useMemo(() => {
    return displayIsLiquidMode ? chartHistoryLiquidArc : chartHistorySolidArc;
  }, [chartHistoryLiquidArc, chartHistorySolidArc, displayIsLiquidMode]);

  const chartHistoryForLine = chartHistoryMorph ?? chartHistoryDisplay;

  const marketCapByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < history.length; i++) {
      const cap = vapaMarketCap[i];
      if (typeof cap === 'number' && Number.isFinite(cap)) {
        map.set(history[i].date, cap);
      }
    }
    return map;
  }, [history, vapaMarketCap]);

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
    if (displayPoint?.date) {
      const dateKey = displayPoint.date.slice(0, 10);
      const val = marketCapByDate.get(dateKey);
      if (typeof val === 'number' && !Number.isNaN(val)) return val;
    }
    const fallback = vapaMarketCap.length ? vapaMarketCap[vapaMarketCap.length - 1] : null;
    return typeof fallback === 'number' && !Number.isNaN(fallback) ? fallback : null;
  }, [displayPoint, marketCapByDate, vapaMarketCap]);

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

  // Fade Bull/Bear/Sloth when chart range buttons change (independent of Liquid/Solid toggle).
  useEffect(() => {
    const nextWord =
      percentageIncrease > 0 ? 'Bull Market' : displayIsLiquidMode ? 'Bear Market' : 'Sloth Market';

    // Initialize once we have the first computed word.
    if (!marketWordText) {
      setMarketWordText(nextWord);
      return;
    }

    // Range-click fade: hide first (triggered in the onClick), then swap text, then fade back in.
    if (rangeClickFadeRef.current) {
      rangeClickFadeRef.current = false;
      if (marketWordTimerRef.current != null) {
        window.clearTimeout(marketWordTimerRef.current);
        marketWordTimerRef.current = null;
      }
      marketWordTimerRef.current = window.setTimeout(() => {
        setMarketWordText(nextWord);
        window.requestAnimationFrame(() => setMarketWordHidden(false));
        marketWordTimerRef.current = null;
      }, 180);
      return;
    }

    // Non-range changes (e.g. toggle crossing midpoint): update immediately; toggleAlpha fade handles the transition.
    if (nextWord !== marketWordText) {
      setMarketWordText(nextWord);
    }
  }, [chartRangeDays, displayIsLiquidMode, marketWordText, percentageIncrease]);

  useEffect(() => {
    return () => {
      if (marketWordTimerRef.current != null) {
        window.clearTimeout(marketWordTimerRef.current);
        marketWordTimerRef.current = null;
      }
    };
  }, []);

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
    setShimmersFading(true);
    setTimeout(() => {
      requestAnimationFrame(() => setHeaderNumbersVisible(true));
    }, 600);
  }, [activeMarketCap, assetPrice, chartHistory, displayPoint, history, isLiquidMode, vapa]);

  const chartRanges = useMemo(
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

  const formatMarketCap = useCallback((value: number | null) => {
    if (value == null || Number.isNaN(value)) return '0';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const formatPercent = useCallback((value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }, []);
  const allTimeTotals = useMemo(() => {
    return investments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const currentModeSpot = displayIsLiquidMode ? assetPrice : vapa;
        const purchasePrice = displayIsLiquidMode
          ? Number(entry.lCpVatop ?? entry.rCpVatop ?? entry.cpVatop) || currentModeSpot || 0
          : Number(entry.cpVatop) || currentModeSpot || 0;
        const currentValue = displayIsLiquidMode
          ? Number(entry.lCVact ?? entry.rCVact) || amount * (currentModeSpot || 0)
          : Number(entry.cVact) || amount * (currentModeSpot || 0);
        const purchaseValue = displayIsLiquidMode
          ? Number(entry.lCVatop ?? entry.rCVatop) || amount * (purchasePrice || 0)
          : Number(entry.cVatop) || amount * (purchasePrice || 0);
        acc.acVatop += purchaseValue;
        acc.acVact += currentValue;
        acc.acdVatop += currentValue - purchaseValue;
        acc.acVactTaa += amount;
        return acc;
      },
      { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
    );
  }, [investments, displayIsLiquidMode, assetPrice, vapa]);

  const filteredTotals = useMemo(() => {
    if (!selectedRangeDays) {
      return allTimeTotals;
    }
    if (rangeHistoricalPrice == null) {
      return displayTotals;
            }
    const rangeStart = Date.now() - selectedRangeDays * 24 * 60 * 60 * 1000;
    return investments.reduce(
      (acc: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }, entry: any) => {
        const amount = Number(entry.cVactTaa) || 0;
        const currentModeSpot = displayIsLiquidMode ? assetPrice : vapa;
        const currentValue = displayIsLiquidMode
          ? Number(entry.lCVact ?? entry.rCVact) || amount * (currentModeSpot || 0)
          : Number(entry.cVact) || amount * (currentModeSpot || 0);
        const purchaseTime = entry?.date ? new Date(entry.date).getTime() : null;
        const hasValidPurchaseTime = typeof purchaseTime === 'number' && !Number.isNaN(purchaseTime);
        const pastValue =
          hasValidPurchaseTime && purchaseTime > rangeStart
            ? displayIsLiquidMode
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
  }, [investments, rangeHistoricalPrice, selectedRangeDays, displayTotals, vapa, isLiquidMode, assetPrice, allTimeTotals]);
  const summaryTotals = summaryTotalsSnapshot ?? filteredTotals;
  const summaryRangePrice = summaryRangePriceSnapshot ?? rangeHistoricalPrice;

  const animateNumberHeight = useCallback(
    (
      ref: React.RefObject<HTMLDivElement>,
      setHeight: React.Dispatch<React.SetStateAction<number | null>>,
      prevRef: React.MutableRefObject<number | null>,
      timerRef: React.MutableRefObject<ReturnType<typeof globalThis.setTimeout> | null>
    ) => {
      const node = ref.current;
      if (!node) return;
      const rectHeight = node.getBoundingClientRect().height;
      const scrollHeight = node.scrollHeight;
      const next = Math.ceil(rectHeight > 0 ? rectHeight : scrollHeight);
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

  const enableNumberHeightAnimationsFor = useCallback((ms: number = 2200) => {
    allowNumberHeightAnimationsRef.current = true;
    if (numberHeightDisableTimerRef.current) {
      globalThis.clearTimeout(numberHeightDisableTimerRef.current);
      numberHeightDisableTimerRef.current = null;
    }
    numberHeightDisableTimerRef.current = globalThis.setTimeout(() => {
      numberHeightDisableTimerRef.current = null;
      allowNumberHeightAnimationsRef.current = false;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (numberHeightDisableTimerRef.current) {
        globalThis.clearTimeout(numberHeightDisableTimerRef.current);
        numberHeightDisableTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!summaryOpen || isClearingInvestments || !hasInvestmentsUI) {
      profitOpenAnimOnceRef.current = false;
      return;
    }
    if (!summaryAnimating && !summaryAnimatedOnceRef.current) return;
    if (profitOpenAnimOnceRef.current) return;
    const node = profitValueRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      profitOpenAnimOnceRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!summaryOpen || isClearingInvestments) return;
          animateNumberHeight(profitValueRef, setProfitValueHeight, profitValuePrevRef, profitValueTimerRef);
        });
      });
      return;
    }
    let didRun = false;
    const run = () => {
      if (didRun) return;
      const rectHeight = node.getBoundingClientRect().height;
      const scrollHeight = node.scrollHeight;
      const next = Math.ceil(rectHeight > 0 ? rectHeight : scrollHeight);
      if (next <= 0) return;
      didRun = true;
      profitOpenAnimOnceRef.current = true;
      animateNumberHeight(profitValueRef, setProfitValueHeight, profitValuePrevRef, profitValueTimerRef);
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(node);
    return () => {
      ro.disconnect();
    };
  }, [animateNumberHeight, hasInvestmentsUI, summaryAnimating, summaryOpen, isClearingInvestments]);

  useLayoutEffect(() => {
    if (!summaryOpen || isClearingInvestments) {
      allowNumberHeightAnimationsRef.current = false;
      if (numberHeightDisableTimerRef.current) {
        globalThis.clearTimeout(numberHeightDisableTimerRef.current);
        numberHeightDisableTimerRef.current = null;
      }
      return;
    }
    enableNumberHeightAnimationsFor();
  }, [summaryOpen, isClearingInvestments, enableNumberHeightAnimationsFor]);

  useLayoutEffect(() => {
    const prev = prevInvestmentCountRef.current;
    const next = investments.length;
    if (prev !== next) {
      prevInvestmentCountRef.current = next;
      if (summaryOpen && !isClearingInvestments) {
        enableNumberHeightAnimationsFor();
      }
    }
  }, [investments.length, summaryOpen, isClearingInvestments, enableNumberHeightAnimationsFor]);

  useLayoutEffect(() => {
    if (!summaryOpen || isClearingInvestments) return;
    enableNumberHeightAnimationsFor();
  }, [selectedRangeDays, summaryOpen, isClearingInvestments, enableNumberHeightAnimationsFor]);

  useEffect(() => {
    if (!summaryOpen || isClearingInvestments) return;
    if (!summaryAnimating && !summaryAnimatedOnceRef.current) return;
    if (
      !purchasedHeightPendingRef.current &&
      !currentHeightPendingRef.current &&
      !profitHeightPendingRef.current
    ) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!summaryOpen || isClearingInvestments) return;
        if (purchasedHeightPendingRef.current) {
          purchasedHeightPendingRef.current = false;
          animateNumberHeight(purchasedValueRef, setPurchasedValueHeight, purchasedValuePrevRef, purchasedValueTimerRef);
        }
        if (currentHeightPendingRef.current) {
          currentHeightPendingRef.current = false;
          animateNumberHeight(currentValueRef, setCurrentValueHeight, currentValuePrevRef, currentValueTimerRef);
        }
        if (profitHeightPendingRef.current) {
          profitHeightPendingRef.current = false;
          animateNumberHeight(profitValueRef, setProfitValueHeight, profitValuePrevRef, profitValueTimerRef);
        }
      });
    });
  }, [animateNumberHeight, summaryAnimating, summaryOpen, isClearingInvestments]);

  useEffect(() => {
    if (liveInvestments.length > 0) {
      lastNonEmptyTotalsRef.current = filteredTotals;
      lastNonEmptyRangePriceRef.current = rangeHistoricalPrice ?? null;
    }
  }, [liveInvestments.length, filteredTotals, rangeHistoricalPrice]);

  useLayoutEffect(() => {
    const value = summaryTotals.acVatop || 0;
    const abs = Math.abs(value);
    const decimals = abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    if (lastFormattedVatopRef.current === formatted) return;
    if (!summaryOpen || isClearingInvestments || (!summaryAnimating && !summaryAnimatedOnceRef.current)) {
      purchasedHeightPendingRef.current = true;
      return;
    }
    if (!allowNumberHeightAnimationsRef.current) {
      lastFormattedVatopRef.current = formatted;
      return;
    }
    lastFormattedVatopRef.current = formatted;
    animateNumberHeight(purchasedValueRef, setPurchasedValueHeight, purchasedValuePrevRef, purchasedValueTimerRef);
  }, [animateNumberHeight, summaryTotals.acVatop, summaryOpen, isClearingInvestments, summaryAnimating]);

  useLayoutEffect(() => {
    const value = summaryTotals.acVact || 0;
    const abs = Math.abs(value);
    const decimals = abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    if (lastFormattedVactRef.current === formatted) return;
    if (!summaryOpen || isClearingInvestments || (!summaryAnimating && !summaryAnimatedOnceRef.current)) {
      currentHeightPendingRef.current = true;
      return;
    }
    if (!allowNumberHeightAnimationsRef.current) {
      lastFormattedVactRef.current = formatted;
      return;
    }
    lastFormattedVactRef.current = formatted;
    animateNumberHeight(currentValueRef, setCurrentValueHeight, currentValuePrevRef, currentValueTimerRef);
  }, [animateNumberHeight, summaryTotals.acVact, summaryOpen, isClearingInvestments, summaryAnimating]);

  useLayoutEffect(() => {
    const profitValue =
      selectedRangeDays && rangeHistoricalPrice != null
        ? (summaryTotals.acVact || 0) - (summaryTotals.acVactTaa || 0) * (summaryRangePrice ?? 0)
        : (summaryTotals.acVact || 0) - (summaryTotals.acVatop || 0);
    const formatted = Math.abs(profitValue).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const profitKey = `${formatted}|${summaryTotals.acVactTaa ?? 0}`;
    if (lastFormattedProfitRef.current === profitKey) return;
    if (!summaryOpen || isClearingInvestments || (!summaryAnimating && !summaryAnimatedOnceRef.current)) {
      profitHeightPendingRef.current = true;
      return;
    }
    if (!allowNumberHeightAnimationsRef.current) {
      lastFormattedProfitRef.current = profitKey;
      return;
    }
    lastFormattedProfitRef.current = profitKey;
    animateNumberHeight(profitValueRef, setProfitValueHeight, profitValuePrevRef, profitValueTimerRef);
  }, [
    animateNumberHeight,
    summaryTotals.acVatop,
    summaryTotals.acVact,
    summaryTotals.acVactTaa,
    summaryRangePrice,
    selectedRangeDays,
    rangeHistoricalPrice,
    summaryOpen,
    isClearingInvestments,
    summaryAnimating
  ]);

  const formatCurrency = useCallback((value: number) => {
    const abs = Math.abs(value);
    const decimals = abs === 0 ? 2 : abs > 1 ? 2 : abs > 0.01 ? 4 : 6;
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

  const formatIntWithCaret = useCallback((rawInt: string, cursorInInt: number) => {
    let formatted = '';
    let caretPos = 0;
    for (let i = 0; i < rawInt.length; i += 1) {
      const remaining = rawInt.length - i;
      if (i > 0 && remaining % 3 === 0) {
        formatted += ',';
        if (i < cursorInInt) caretPos += 1;
      }
      formatted += rawInt[i];
      if (i < cursorInInt) caretPos += 1;
    }
    return { formattedInt: formatted, caretPos };
  }, []);

  const normalizeTokenInputWithCaret = useCallback(
    (value: string, cursor: number | null) => {
      if (cursor == null) {
        return { nextValue: normalizeTokenInput(value), nextCaret: null };
      }
      let cleaned = '';
      let cleanedCursor = 0;
      let hasDot = false;
      for (let i = 0; i < value.length; i += 1) {
        const ch = value[i];
        let keep = false;
        if (ch >= '0' && ch <= '9') keep = true;
        if (ch === '.' && !hasDot) {
          keep = true;
          hasDot = true;
        }
        if (keep) {
          if (i < cursor) cleanedCursor += 1;
          cleaned += ch;
        }
      }
      let [rawInt = '', rawDec = ''] = cleaned.split('.');
      const stripped = rawInt.length - rawInt.replace(/^0+(?=\d)/, '').length;
      rawInt = rawInt.replace(/^0+(?=\d)/, '');
      if (stripped > 0 && cleanedCursor <= rawInt.length + stripped) {
        cleanedCursor = Math.max(0, cleanedCursor - Math.min(stripped, cleanedCursor));
      }
      const decPart = rawDec.slice(0, 8);
      if (hasDot && cleanedCursor > rawInt.length + 1 + decPart.length) {
        cleanedCursor = rawInt.length + 1 + decPart.length;
      }
      const cursorInInt = Math.min(cleanedCursor, rawInt.length);
      const { formattedInt, caretPos } = formatIntWithCaret(rawInt, cursorInInt);
      const prefix = formattedInt || (hasDot ? '0' : '');
      const nextValue = hasDot ? `${prefix}.${decPart}` : prefix;
      let nextCaret = caretPos;
      if (hasDot && cleanedCursor > rawInt.length) {
        const cursorInDec = Math.min(Math.max(cleanedCursor - rawInt.length - 1, 0), decPart.length);
        nextCaret = prefix.length + 1 + cursorInDec;
      }
      return { nextValue, nextCaret };
    },
    [formatIntWithCaret, normalizeTokenInput]
  );

  const parseTokenAmount = useCallback((value: string) => {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  useLayoutEffect(() => {
    if (tokenCaretRef.current == null || !tokenInputRef.current) return;
    const pos = tokenCaretRef.current;
    tokenCaretRef.current = null;
    tokenInputRef.current.setSelectionRange(pos, pos);
  }, [tokenAmount]);

  useEffect(() => {
    let isMounted = true;
    const loadMock = async () => {
      try {
        const resp = await axios.get('/api/assets/crypto/solana/solanaMockPortfolio');
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
    const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
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
    const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
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
          setHistoricalPriceSolid(null);
          setHistoricalPriceLiquid(null);
          setHistoricalLoading(false);
        }
        return;
      }

      setHistoricalLoading(true);
      try {
        const [solidResp, liquidResp] = await Promise.all([
          axios.get('/api/assets/crypto/solana/solanaVapaHistoricalPrice', {
            params: { date: purchaseDate, mode: 'solid' },
          }),
          axios.get('/api/assets/crypto/solana/solanaVapaHistoricalPrice', {
            params: { date: purchaseDate, mode: 'liquid' },
          }),
        ]);
        const solidNum = Number(solidResp.data?.price);
        const liquidNum = Number(liquidResp.data?.price);
        if (isMounted) {
          setHistoricalPriceSolid(Number.isFinite(solidNum) ? solidNum : null);
          setHistoricalPriceLiquid(Number.isFinite(liquidNum) ? liquidNum : null);
        }
      } catch (error) {
        if (isMounted) {
          setHistoricalPriceSolid(null);
          setHistoricalPriceLiquid(null);
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
    const currentModePrice = displayIsLiquidMode ? assetPrice : vapa;
    if (!purchaseDate) {
      return currentModePrice || 0;
    }
    return historicalPrice ?? currentModePrice ?? 0;
  }, [purchaseDate, historicalPrice, assetPrice, vapa, displayIsLiquidMode]);

  const formCVatop = useMemo(() => {
    const amt = parseTokenAmount(tokenAmount || '0');
    if (Number.isNaN(amt)) return 0;
    const currentModePrice = displayIsLiquidMode ? assetPrice : vapa;
    return amt * (currentModePrice || 0);
  }, [tokenAmount, parseTokenAmount, vapa, assetPrice, displayIsLiquidMode]);

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
      setSummaryRangePriceSnapshot(rangeHistoricalPrice ?? null);
    }
    setSummaryValuesHidden(true);
    summaryQuickFadeTimerRef.current = globalThis.setTimeout(() => {
      setSummaryTotalsSnapshot(null);
      setSummaryRangePriceSnapshot(null);
      setSummaryValuesHidden(false);
      summaryQuickFadeTimerRef.current = null;
      summaryQuickFadeEndRef.current = globalThis.setTimeout(() => {
        setSummaryQuickFade(false);
        summaryQuickFadeEndRef.current = null;
      }, 350);
    }, 350);
  }, [filteredTotals, rangeHistoricalPrice, summaryTotalsSnapshot]);

  useEffect(() => {
    if (!summaryPulseAfterDelete) return;
    setSummaryPulseAfterDelete(false);
    pulseSummaryValues();
  }, [summaryPulseAfterDelete, pulseSummaryValues]);

  const triggerSubmitFormCollapse = useCallback(() => {
    const target = submitTargetRef.current;
    const isAddMore = target === 'addMore';
    const panelRef = isAddMore ? addMoreFormPanelRef.current : null;
    const addPanelRef = isAddMore ? null : addFormSlidePanelRef.current;
    const contentHeight = isAddMore ? addMoreFormBoxRef.current?.scrollHeight : undefined;
    const measuredPanelHeight = panelRef?.getBoundingClientRect().height ?? 0;
    const measuredAddHeight = addPanelRef?.getBoundingClientRect().height ?? 0;
    const measuredOuterHeight = !isAddMore
      ? addFormPanelRef.current?.getBoundingClientRect().height ?? 0
      : 0;
    const start =
      measuredPanelHeight > 1
        ? measuredPanelHeight
        : contentHeight != null
          ? Math.max(0, contentHeight + 24)
          : Math.max(600, addMoreFormPanelHeight);
    const prevBodyOverflowAnchor = typeof document !== 'undefined' ? document.body.style.overflowAnchor : '';
    flushSync(() => {
      setIsSubmitCollapsing(true);
      setSubmitTargetSnapshot(target);
      if (isAddMore) {
        setSubmitPanelMaxHeight(start);
      } else {
        setHideEmptyActionsOnSubmit(true);
        emptyActionsHoldRef.current = true;
        setAddFormSubmitAnimating(true);
        setAddFormSubmitCollapsing(true);
        const nextAddStart =
          measuredAddHeight > 1
            ? measuredAddHeight
            : addFormBoxRef.current?.scrollHeight != null
              ? Math.max(0, addFormBoxRef.current.scrollHeight + 24)
              : Math.max(600, addFormPanelHeight);
        setAddFormSubmitMaxHeight(null);
        const nextOuterStart =
          measuredOuterHeight > 1 ? measuredOuterHeight : Math.max(0, nextAddStart + 24);
        setAddFormOuterSubmitMaxHeight(nextOuterStart);
      }
    });
    requestAnimationFrame(() => {
      if (isAddMore) {
        scrollToBottomAfterMaxHeightOn(panelRef, 2500);
      } else {
        scrollToBottomAfterMaxHeightOn(addFormPanelRef.current, 2500);
      }
    });
    if (isAddMore) {
      if (panelRef) {
        void panelRef.offsetHeight;
      }
      requestAnimationFrame(() => {
        if (panelRef) void panelRef.offsetHeight;
        requestAnimationFrame(() => setSubmitPanelMaxHeight(0));
      });
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAddFormOuterSubmitMaxHeight(0);
        });
      });
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflowAnchor = 'none';
    }

    if (submitCollapseTimerRef.current) {
      globalThis.clearTimeout(submitCollapseTimerRef.current);
      submitCollapseTimerRef.current = null;
    }
    submitCollapseTimerRef.current = globalThis.setTimeout(() => {
      if (target === 'addMore') {
        setAddMoreOpen(false);
        setShowAddMoreForm(false);
        toggleDisabledByDeleteRef.current = false;
        setToggleDisabled(false);
        setToggleKnobHidden(false);
        if (showMoreDisableTimerRef.current) {
          globalThis.clearTimeout(showMoreDisableTimerRef.current);
          showMoreDisableTimerRef.current = null;
        }
        showMoreDisableTimerRef.current = globalThis.setTimeout(() => {
          showMoreDisableTimerRef.current = null;
          setShowMoreDisabled(false);
        }, 1500);
      } else {
        if (addFormPanelRef.current) {
          if (addFormCollapseAnimRef.current) {
            addFormCollapseAnimRef.current.cancel();
            addFormCollapseAnimRef.current = null;
          }
          addFormPanelRef.current.style.height = '';
          addFormPanelRef.current.style.overflow = '';
          addFormPanelRef.current.style.willChange = '';
        }
        setAddFormOpen(false);
        setShowAddForm(false);
        setShowEmptyAddForm(false);
        setAddFormSubmitAnimating(false);
        setAddFormSubmitMaxHeight(null);
        setAddFormOuterSubmitMaxHeight(null);
        setAddFormSubmitCollapsing(false);
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflowAnchor = prevBodyOverflowAnchor;
      }
      setSubmitTargetSnapshot(null);
      if (target === 'add') {
        if (investments.length > 0) {
          emptyActionsHoldRef.current = false;
          setHideEmptyActionsOnSubmit(false);
        }
      } else {
        setHideEmptyActionsOnSubmit(false);
      }
      if (submitResetPendingRef.current) {
        submitResetPendingRef.current = false;
        setTokenAmount('');
        setPurchaseDate('');
      }
      if (target === 'addMore') {
        pulseSummaryValues();
      }
      requestAnimationFrame(() => setSubmitPanelMaxHeight(null));
      setSubmitPhase('idle');
      setIsSubmitCollapsing(false);
      if (target === 'add' && pendingOpenAfterSubmitRef.current) {
        pendingOpenAfterSubmitRef.current = false;
        openInvestmentsSection();
      }
      submitCollapseTimerRef.current = null;
    }, 2000);
  }, [
    addFormPanelHeight,
    addMoreFormPanelHeight,
    addFormBoxRef,
    addMoreFormBoxRef,
    openInvestmentsSection,
    pulseSummaryValues,
    scrollToBottomAfterMaxHeightOn,
    setIsSubmitCollapsing,
    setHideEmptyActionsOnSubmit,
    setAddFormSubmitAnimating,
    setAddFormOpen,
    setAddMoreOpen,
    setShowAddForm,
    setShowAddMoreForm,
    setShowEmptyAddForm,
    setSubmitPanelMaxHeight,
    setSubmitPhase,
    setTokenAmount,
    setPurchaseDate,
  ]);

  const handleSubmitInvestment = async () => {
    if (!isSignedIn && !sessionId) return;
    if (deleteInFlight || deleteLocked) return;
    const amt = parseTokenAmount(tokenAmount || '0');
    if (!amt || amt <= 0) return;
    if (!purchaseDate) return;
    if (purchaseDate > todayIso) return;

    const cVactTaa = parseFloat(amt.toFixed(8));
    const newInvestment = {
      cVactTaa,
      date: purchaseDate,
      asset: 'solana',
      clientId: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`
    };

    isMutatingRef.current = true;
    setSubmitLoading(true);
    lastFormattedProfitRef.current = null;
    profitValuePrevRef.current = null;
    // Mark which panel is currently being submitted from, so we can collapse that panel smoothly.
    submitTargetRef.current = showAddMoreForm ? 'addMore' : 'add';
    const isAddMoreSubmit = submitTargetRef.current === 'addMore';
    if (toggleReenableTimerRef.current) {
      globalThis.clearTimeout(toggleReenableTimerRef.current);
      toggleReenableTimerRef.current = null;
    }
    toggleReenableOnSummaryExpandRef.current = !isAddMoreSubmit;
    setToggleDisabled(true);
    setToggleKnobHidden(true);
    if (isAddMoreSubmit) {
      setShowMoreDisabled(true);
      if (showMoreDisableTimerRef.current) {
        globalThis.clearTimeout(showMoreDisableTimerRef.current);
        showMoreDisableTimerRef.current = null;
      }
    }
    if (submitTargetRef.current === 'addMore') {
      setSummaryTotalsSnapshot({ ...filteredTotals });
      setSummaryRangePriceSnapshot(rangeHistoricalPrice ?? null);
    }
    setSubmitPhase('submitting');
    submitResetPendingRef.current = true;
    triggerSubmitFormCollapse();
    try {
      let refreshed: any = null;
      if (isSignedIn) {
        await addEmailInvestments('solana', [newInvestment]);
        const params = new URLSearchParams({ email, asset: 'solana' });
        const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
        refreshed = await res.json();
      } else {
        await addVavityAggregator(sessionId, [newInvestment], 'solana');
        refreshed = await fetchVavityAggregator(sessionId, 'solana');
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
    const entryToRemove = liveInvestments[indexToRemove];
    const deleteSignature =
      entryToRemove?.clientId ||
      entryToRemove?.id ||
      entryToRemove?._id ||
      `${entryToRemove?.date ?? ''}|${entryToRemove?.cVactTaa ?? ''}`;
    lastDeletedSignatureRef.current = deleteSignature;
    lastDeletedAtRef.current = Date.now();
    if (debugDelete) {
      console.warn('[delete-debug] delete start', { investmentId, signature: deleteSignature });
    }
    const updated = liveInvestments.filter((_: any, idx: number) => idx !== indexToRemove);
    const isLastInvestment = updated.length === 0;
    if (!summaryTotalsSnapshot) {
      const totals = lastNonEmptyTotalsRef.current;
      if (totals) {
        setSummaryTotalsSnapshot({ ...totals });
        setSummaryRangePriceSnapshot(lastNonEmptyRangePriceRef.current ?? null);
      }
    }
    if (isLastInvestment && !isClearingInvestments) {
      if (deleteInFlight) {
        clearAfterDeleteRef.current = true;
      } else {
        const startHeight =
          investmentsWholePanelRef.current?.getBoundingClientRect().height ||
          lastInvestmentsWholeHeightRef.current ||
          investmentsWholeHeight ||
          investmentsWholeContentRef.current?.getBoundingClientRect().height ||
          0;
        clearingSnapshotRef.current = vavityData;
        beginClearing(startHeight);
      }
    }
    isMutatingRef.current = true;
    try {
      setVavityData((prev: any) => (prev ? { ...prev, investments: updated } : prev));
      if (isSignedIn) {
        await saveEmailInvestmentsForAsset('solana', updated);
        const params = new URLSearchParams({ email, asset: 'solana' });
        const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
        const refreshed = await res.json();
        if (debugDelete && lastDeletedSignatureRef.current && Array.isArray(refreshed?.investments)) {
          const signature = lastDeletedSignatureRef.current;
          const returned = refreshed.investments.some((entry: any) => {
            const sig =
              entry?.clientId || entry?.id || entry?._id || `${entry?.date ?? ''}|${entry?.cVactTaa ?? ''}`;
            return sig === signature;
          });
          if (returned) {
            console.warn('[delete-debug] server refresh returned deleted investment (signed-in)', { signature });
          }
        }
        setVavityData(refreshed);
      } else {
        await saveVavityAggregator(sessionId, updated, 'solana');
        const refreshed = await fetchVavityAggregator(sessionId, 'solana');
        if (debugDelete && lastDeletedSignatureRef.current && Array.isArray(refreshed?.investments)) {
          const signature = lastDeletedSignatureRef.current;
          const returned = refreshed.investments.some((entry: any) => {
            const sig =
              entry?.clientId || entry?.id || entry?._id || `${entry?.date ?? ''}|${entry?.cVactTaa ?? ''}`;
            return sig === signature;
          });
          if (returned) {
            console.warn('[delete-debug] server refresh returned deleted investment (guest)', { signature });
          }
        }
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
      setAddFormSubmitAnimating(false);
      emptyActionsHoldRef.current = false;
      setHideEmptyActionsOnSubmit(false);
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
      const currentModePrice = displayIsLiquidMode ? assetPrice : vapa;
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
        <div className="asset-submit-form">
          <div className="asset-metric-row asset-invest-form-heading">
            <span className="asset-metric-title--solana" style={{ fontWeight: 800 }}>
              {label}
            </span>
          </div>

          <div className="asset-invest-form-body asset-invest-form-body--solana">
            <div className="asset-invest-form-metrics-panel asset-invest-form-metrics-panel--solana">
              <div className="asset-invest-form-metrics">
                <div className="asset-metric-row asset-invest-form-row">
                  <span className="asset-metric-title--solana asset-invest-form-metric-title">Purchased Value</span>
                  <span
                    className={`asset-money-wrap asset-profit-range-anim${
                      formValuesHidden || formCalcHidden ? ' is-hidden' : ''
                    }`}
                    style={{
                      opacity: formValuesHidden || formCalcHidden ? 0 : realityOpacity,
                      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
                    }}
                  >
                    <span className="asset-metric-symbol--solana">$</span>
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
                  <span className="asset-metric-title--solana asset-invest-form-metric-title">Current Value</span>
                  <span
                    className={`asset-money-wrap asset-profit-range-anim${formValuesHidden ? ' is-hidden' : ''}`}
                    style={{
                      opacity: formValuesHidden ? 0 : realityOpacity,
                      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
                    }}
                  >
                    <span className="asset-metric-symbol--solana">$</span>
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
                  <span className="asset-metric-title--solana asset-invest-form-metric-title">{profitRow.title}</span>
                  <span
                    className={`asset-money-wrap asset-profit-range-anim${
                      formValuesHidden || formCalcHidden ? ' is-hidden' : ''
                    }`}
                    style={{
                      opacity: formValuesHidden || formCalcHidden ? 0 : realityOpacity,
                      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
                    }}
                  >
                    {profitRow.prefix ? (
                      <span className="asset-metric-inline-symbol--solana">{profitRow.prefix}</span>
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

            <div className="asset-invest-form-controls asset-invest-form-controls--solana">
              <div className="asset-invest-form-field">
                <div className="asset-metric-row asset-invest-form-field-label">
                  <span className="asset-metric-title--solana">Solana amount</span>
                </div>
                <div className="asset-invest-form-field-control">
                  <input
                    className="asset-invest-input asset-invest-input--solana"
                    type="text"
                    inputMode="decimal"
                    pattern="^[0-9]*\\.?[0-9]*$"
                    value={tokenAmount}
                    ref={tokenInputRef}
                    onChange={(e) => {
                      const { nextValue, nextCaret } = normalizeTokenInputWithCaret(
                        e.target.value,
                        e.target.selectionStart
                      );
                      setTokenAmount(nextValue);
                      if (nextCaret != null) tokenCaretRef.current = nextCaret;
                    }}
                  />
                </div>
              </div>

              <div className="asset-invest-form-field">
                <div className="asset-metric-row asset-invest-form-field-label">
                  <span className="asset-metric-title--solana">Date purchased</span>
                </div>
                <div className="asset-invest-form-field-control">
                  <CustomDatePicker value={purchaseDate} onChange={setPurchaseDate} placeholder="MM/DD/YYYY" />
                </div>
              </div>

              <button
                onClick={handleSubmitInvestment}
                disabled={submitLoading || deleteInFlight || deleteLocked || !tokenAmount || !purchaseDate || purchaseDateIsFuture}
                className={`${buttonClass} asset-action-button--invest-submit`}
              >
                {submitLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const hasActiveDelete =
    pendingDeleteInvestments.length > 0 ||
    deletingInvestments.length > 0 ||
    closingInvestments.length > 0;
  const visibleInvestmentCount = Math.min(visibleInvestments, investments.length);
  const investmentsMaxHeight = investmentsListOpen
    ? `${investmentsListHeight + investmentsListBorderHeight + (hasActiveDelete ? 8 : 2)}px`
    : '0px';
  const investmentsSectionMaxHeight = investmentsListOpen
    ? `${investmentsListHeight + investmentsListHeaderHeight + investmentsListBorderHeight + (hasActiveDelete ? 11 : 5)}px`
    : '0px';

  useEffect(() => {
    if (!showInvestmentsList) return;
    const node = investmentsListRef.current;
    const header = investmentsListHeaderRef.current;
    const wrap = investmentsListWrapRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      setInvestmentsListHeight(node?.scrollHeight ?? 0);
      if (header) {
        const styles = window.getComputedStyle(header);
        const marginTop = parseFloat(styles.marginTop || '0');
        const marginBottom = parseFloat(styles.marginBottom || '0');
        const nextHeaderHeight = header.getBoundingClientRect().height + marginTop + marginBottom;
        setInvestmentsListHeaderHeight((prev) => (prev === nextHeaderHeight ? prev : nextHeaderHeight));
      }
      if (wrap) {
        const styles = window.getComputedStyle(wrap);
        const borderTop = parseFloat(styles.borderTopWidth || '0');
        const borderBottom = parseFloat(styles.borderBottomWidth || '0');
        const nextBorderHeight = borderTop + borderBottom;
        setInvestmentsListBorderHeight((prev) => (prev === nextBorderHeight ? prev : nextBorderHeight));
      }
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setInvestmentsListHeight((prev) => (prev === next ? prev : next));
        if (header) {
          const styles = window.getComputedStyle(header);
          const marginTop = parseFloat(styles.marginTop || '0');
          const marginBottom = parseFloat(styles.marginBottom || '0');
          const nextHeaderHeight = header.getBoundingClientRect().height + marginTop + marginBottom;
          setInvestmentsListHeaderHeight((prev) => (prev === nextHeaderHeight ? prev : nextHeaderHeight));
        }
        if (wrap) {
          const styles = window.getComputedStyle(wrap);
          const borderTop = parseFloat(styles.borderTopWidth || '0');
          const borderBottom = parseFloat(styles.borderBottomWidth || '0');
          const nextBorderHeight = borderTop + borderBottom;
          setInvestmentsListBorderHeight((prev) => (prev === nextBorderHeight ? prev : nextBorderHeight));
        }
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [investmentsListOpen, showInvestmentsList]);

  useEffect(() => {
    const node = emptyActionsMeasureRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      const next = node?.scrollHeight ?? 0;
      setEmptyActionsHeight(next);
      if (next > 0) lastEmptyActionsHeightRef.current = next;
      return;
    }
    let raf = 0;
    const measure = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setEmptyActionsHeight((prev) => (prev === next ? prev : next));
        if (next > 0) lastEmptyActionsHeightRef.current = next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isSignedIn, email]);

  useEffect(() => {
    if (hasInvestmentsUI) return;
    if (showInitialFetchLoader) return;
    if (emptyActionsMountPhase !== 'hidden') return;
    const revealTimer = globalThis.setTimeout(() => {
      setEmptyActionsMountPhase('revealing');
    }, 1000);
    const doneTimer = globalThis.setTimeout(() => {
      setEmptyActionsMountPhase('done');
    }, 4200);
    return () => {
      globalThis.clearTimeout(revealTimer);
      globalThis.clearTimeout(doneTimer);
    };
  }, [hasInvestmentsUI, showInitialFetchLoader, emptyActionsMountPhase]);

  return (
    <>
      <div className="asset-page-content asset-page-content--solana page-slide-down">
      <div
        className="asset-panel asset-panel--solana asset-header-panel asset-section-slide"
        ref={headerPanelRef}
      >
        <a
          className="asset-title-badge asset-title-badge--solana asset-title-badge--section"
          href="https://solana.org/en/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="asset-title-badge-label">SOL</span>
        </a>
        <div ref={sectionHeaderRef} className={`asset-section-header${displayIsLiquidMode ? ' is-liquid' : ''}`}>
          <div ref={assetTitleRef} className="asset-header-title">Solana</div>
          <div
            className={`asset-header-slogan${displayIsLiquidMode ? ' is-hidden' : ''}`}
          >
            if investments never lost value
          </div>
        </div>
        <div {...assetPriceChartMountSlide.slidePanelProps}>
          <div ref={assetPriceChartMountSlide.measureRef} className="asset-asset-price-chart-mount-slide-inner">
        <div
          className="asset-panel asset-panel--solana asset-price-chart-row asset-price-chart-row--combined"
          style={{ overflow: 'visible' }}
      >
          <div
            className="asset-price-panel asset-price-panel--solana asset-section-slide"
            style={{
              padding: '30px',
              background: 'transparent',
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
        }}
      >
            <div className="asset-metric-row">
              <span className="asset-metric-title--solana">Price:</span>
              <span className="asset-metric-value-wrap">
                {!headerNumbersVisible && (
                  <span className={`asset-number-loader asset-number-loader--solana asset-number-loader--overlay${shimmersFading ? ' is-hidden' : ''}`} />
                )}
                <span className={`asset-metric-symbol--solana asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>$</span>
                <span className="asset-header-switch-fade" style={realityFadeStyle}>
                  <span className={`asset-metric-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>
                    {formatCurrency(displayPoint?.price ?? (displayIsLiquidMode ? assetPrice : vapa) ?? 0)}
                  </span>
                </span>
              </span>
            </div>
            <div className="asset-metric-row">
              <span className="asset-metric-title--solana">Market Cap:</span>
              <span className="asset-metric-value-wrap">
                {!headerNumbersVisible && (
                  <span className={`asset-number-loader asset-number-loader--solana asset-number-loader--wide asset-number-loader--overlay${shimmersFading ? ' is-hidden' : ''}`} />
                )}
                <span className={`asset-metric-symbol--solana asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>$</span>
                <span className="asset-header-switch-fade" style={realityFadeStyle}>
                  <span className={`asset-metric-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}>
                    {renderDecimalSafe(formatMarketCap(activeMarketCap))}
                  </span>
                </span>
              </span>
            </div>
            <div className="asset-metric-row">
              <span className="asset-metric-value-wrap">
                {!headerNumbersVisible && (
                  <span className={`asset-number-loader asset-number-loader--solana asset-number-loader--narrow asset-number-loader--overlay${shimmersFading ? ' is-hidden' : ''}`} />
                )}
              {percentageIncrease > 0 ? (
                <span className={`asset-metric-trend-icon asset-metric-trend-icon--solana asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`} aria-hidden="true" />
              ) : (
                <span
                  className={`asset-metric-trend-icon asset-metric-trend-icon--down asset-metric-trend-icon--solana asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}
                  aria-hidden="true"
                />
              )}
              <span
                key={chartRangeDays ?? 'all'}
                className={`asset-metric-value asset-percentage-value asset-mount-fade-2s${headerNumbersVisible ? ' is-visible' : ''}`}
              >
                <span className="asset-header-switch-fade" style={realityFadeStyle}>
                  {headerNumbersVisible
                    ? formatPercent(Math.abs(percentageIncrease)).replace('%', '').replace('+', '')
                    : '\u00A0'}
                </span>
              </span>
              <span
                className={`asset-metric-symbol--solana asset-metric-percent-symbol--solana asset-mount-fade-2s${
                  headerNumbersVisible ? ' is-visible' : ''
                }`}
              >
                %
              </span>
              </span>
            </div>
            <div
              className="asset-panel asset-panel--solana asset-section-slide asset-market-controls"
            >
              <div className="asset-market-controls-header">
                <div className="asset-profit-summary asset-profit-summary--solana" style={{ marginBottom: 0 }}>
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
                      return (
                        <>
                          <span className="asset-metric-inline-title--solana asset-market-status-title">
                            {label}:
                          </span>{' '}
                          <span
                            className="asset-metric-inline-value asset-market-status-value"
                            style={{
                              opacity: (marketWordHidden ? 0 : 1) * realityOpacity,
                              transition:
                                toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 0.25s ease',
                            }}
                          >
                            {marketWordText || (percentageIncrease > 0
                              ? 'Bull Market'
                              : displayIsLiquidMode
                                ? 'Bear Market'
                                : 'Sloth Market')}
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
                      className={`asset-range-button asset-range-button--solana${isActive ? ' is-active' : ''}`}
                      disabled={isActive}
                      onClick={() => {
                        if (isActive) return;
                        // Trigger Bull/Bear/Sloth fade on range change.
                        rangeClickFadeRef.current = true;
                        setMarketWordHidden(true);
                        setChartRangeAnchorMs(Date.now());
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
              className="asset-panel asset-panel--solana asset-section-slide asset-chart-panel asset-chart-panel--solana"
            style={{
              padding: '0px',
                position: 'relative',
                height: `${chartPanelHeight}px`
            }}
          >
            {chartHoverPoint != null && displayPoint && (
                <div className="asset-chart-date-badge asset-chart-date-badge--solana">
                <span className="asset-metric-inline-title--solana">Date:</span>{' '}
                <span className="asset-metric-inline-value">{new Date(displayPoint.date.includes('T') ? displayPoint.date : `${displayPoint.date}T00:00:00`).toLocaleDateString('en-US')}</span>
              </div>
            )}
              <div className={`asset-chart-loader${chartReady && !forceChartLoader ? ' is-hidden' : ''}`}>
                <div className="asset-chart-grid-shimmer asset-chart-grid-shimmer--solana">
                  <div className="asset-chart-grid-shimmer-thin" />
                  <div className="asset-chart-grid-shimmer-thick" />
                </div>
              </div>
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 1,
                  borderRadius: 14,
                  pointerEvents: 'none',
                  zIndex: 0,
                  backgroundImage:
                    'repeating-linear-gradient(to right, rgba(1, 248, 164, 0.1) 0px, rgba(1, 248, 164, 0.1) 1px, transparent 1px, transparent 30px), repeating-linear-gradient(to bottom, rgba(1, 248, 164, 0.1) 0px, rgba(1, 248, 164, 0.1) 1px, transparent 1px, transparent 30px)',
                }}
              />
              <div
                className={`asset-chart-fade asset-chart-interactive${
                  chartReady && !forceChartLoader ? ' is-visible' : ''
                }${chartReady && !forceChartLoader ? '' : ' is-disabled'}`}
              >
            <SolanaChart
              history={chartHistoryForLine || []}
                  color="rgba(1, 248, 164, 0.5)"
                  activeColor="rgba(1, 248, 164, 0.6)"
                  markerColor="rgba(1, 248, 164, 1)"
                  gridColor="transparent"
                  gridSpacing={30}
                  height={chartCanvasHeight}
                  interactiveHeight={chartPanelHeight}
                  canvasOffsetTop={chartTopPadding}
                  backgroundColor="rgba(1, 248, 164, 0.14)"
                  markerShadow="-5px 0 14px rgba(1, 248, 164, 0.26), 0 7px 10px rgba(219, 32, 254, 0.12)"
                  animateOn={false}
                  animateDelayMs={0}
                  animationDurationMs={toggleKnobLeftPx != null || toggleAnimating ? 0 : 1000}
              onPointHover={(point, idx) => {
                setChartHoverIndex(idx ?? null);
                setChartHoverPoint(point);
              }}
            />
          </div>
        </div>
              </div>
            </div>
          </div>
        </div>

          <div className="asset-panel asset-panel--solana asset-reality-toggle-shell">
            <div className="asset-reality-toggle-row asset-reality-toggle-row--solana">
              <span className={`asset-reality-toggle-label${displayIsLiquidMode ? ' is-active' : ''}`}>Liquid</span>
              <button
                type="button"
                ref={toggleBtnRef}
                className={`asset-reality-toggle${!displayIsLiquidMode ? ' is-fantasy' : ''}${toggleKnobLeftPx != null ? ' is-dragging' : ''}${toggleAnimating ? ' is-animating' : ''}`}
                aria-pressed={displayIsLiquidMode}
                aria-label="Toggle Liquid/Solid mode"
                disabled={toggleDisabled}
                style={
                  toggleKnobLeftEffectivePx != null
                    ? ({ ['--toggle-knob-left' as any]: `${toggleKnobLeftEffectivePx}px` } as React.CSSProperties)
                    : undefined
                }
                onPointerDown={(e) => {
                  if (toggleDisabled) return;
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
                  // Ensure we disable easing immediately on the first frame of a drag.
                  btn.classList.add('is-dragging');

                  try {
                    btn.setPointerCapture(e.pointerId);
                  } catch {}
                  // Keep state "in drag mode" but drive the knob position imperatively for zero-lag pointer tracking.
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

                  // If this was a tap (no drag), toggle immediately on pointer-up to avoid click lag.
                  if (!toggleDragRef.current.didDrag) {
                    animateToggleToAlpha(displayIsLiquidMode ? 0 : 1);
                    e.preventDefault();
                    return;
                  }

                  // Drag: snap to the nearest edge.
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
                <span
                  className="asset-reality-toggle-knob"
                  aria-hidden="true"
                  style={{ opacity: toggleKnobHidden ? 0 : 1, transition: 'opacity 0.8s ease' }}
                />
              </button>
              <span className={`asset-reality-toggle-label${!displayIsLiquidMode ? ' is-active' : ''}`}>Solid</span>
            </div>
          </div>

      <div
        className={`asset-panel asset-panel--solana asset-portfolio-center asset-section-slide${
          summaryOpen && !isClearingInvestments ? ' asset-portfolio-center--summary-open' : ''
        }${summaryAnimating ? ' asset-portfolio-center--summary-animating' : ''}`}
        style={{ 
          marginBottom: '10px', 
          paddingTop: '25px', 
          paddingBottom: '16px',
          paddingLeft: '20px',
          paddingRight: '20px',
          ...(!hasInvestmentsUI && emptyActionsMountPhase !== 'done' ? { overflow: 'hidden' } : {}),
        }}
      >
        {!hasInvestmentsUI && !showInitialFetchLoader ? (
          <>
            <div
              ref={emptyActionsRef}
              className={`asset-empty-actions${emptyActionsExpanding ? ' is-expanding' : ''}`}
              style={
                hideEmptyActionsOnSubmit
                  ? { display: 'none' }
                  : emptyActionsMountPhase === 'hidden'
                    ? { maxHeight: '0px', overflow: 'hidden', transition: 'max-height 3s ease' }
                    : emptyActionsMountPhase === 'revealing'
                      ? { maxHeight: `${emptyActionsHeight || 200}px`, overflow: 'hidden', transition: 'max-height 3s ease' }
                      : undefined
              }
            >
              <div
                className={`asset-empty-addinvest${emptyAddHiding ? ' is-hidden' : ''}${emptyAddGone ? ' is-gone' : ''}`}
              >
                <button
                  className="asset-action-button asset-action-button--solana asset-action-button--invest-add asset-action-button--add-investments"
                  disabled={showEmptyAddForm || emptyAddHiding}
                  style={{
                    ['--empty-add-opacity' as any]: emptyAddFadeIn ? 1 : 0,
                  }}
                  onClick={() => {
                    if (showEmptyAddForm || emptyAddHiding || emptySigninHiding) return;
                    clearEmptyButtonsSequenceTimers();
                    if (clearInvestmentsAnimTimerRef.current) {
                      globalThis.clearTimeout(clearInvestmentsAnimTimerRef.current);
                      clearInvestmentsAnimTimerRef.current = null;
                    }

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
                    requestAnimationFrame(() => scrollToBottomAfterDocumentStable());
                  }}
                >
                  Add Investments
                </button>
              </div>
              {!isSignedIn && !email && (
                <div
                  className={`asset-empty-signin${emptySigninHiding ? ' is-hidden' : ''}${emptySigninGone ? ' is-gone' : ''}`}
                >
                  <Link
                    href="/signin"
                    className="asset-action-button asset-action-button--save-signin asset-action-button--save-signin-empty"
                    style={{
                      opacity: emptySigninHiding ? 0 : 1,
                      transition: 'opacity 3s ease, transform 0.2s ease',
                    }}
                  >
                    <span className="asset-save-signin-text">Sign In to Save Investments</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Option B: Treat the entire investments viewing section as ONE measured height animation
                (summary + add-more + sign-in/show + list) without changing the visual section layout. */}
            <div
              ref={investmentsWholePanelRef}
              className={`asset-slide-panel${isClearingInvestments ? ' asset-slide-panel--clearing asset-slide-panel--clearing-solana' : ''}`}
              style={{
                maxHeight: isClearingInvestments ? clearingHeightPx : investmentsWholeMaxHeight,
                transition: isClearingInvestments ? 'max-height 3s ease' : investmentsWholeTransition,
                overflowX: 'visible',
                overflowY: 'hidden',
              }}
            >
              <div ref={investmentsWholeContentRef}>
                {showInvestmentsHeader && (
                  <h2 className="asset-investments-header">
                    <span className="asset-portfolio-title-muted">my solana</span>
                  </h2>
                )}
                <div
                  className={`asset-portfolio-summary-box asset-portfolio-summary-box--solana${
                    summaryQuickFade ? ' is-quickfade' : ''
                  }`}
                >
                  <div
                    className="asset-slide-panel"
                    style={{ maxHeight: summaryMaxHeight, transition: summaryTransition, overflow: 'hidden' }}
                  >
                    <div ref={summaryContentRef} style={{ paddingBottom: '5px' }}>
              <div className="asset-metric-row asset-money-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span className="asset-metric-title--solana" style={{ display: 'inline-block', marginTop: 30 }}>
                  Purchased Value
                </span>
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
                      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
                    }}
                  >
                    <span className="asset-metric-symbol--solana">$</span>
                    <span className="asset-metric-value">{renderDecimalSafe(formatCurrency(summaryTotals.acVatop || 0))}</span>
                  </span>
                </div>
            </div>
              <div className="asset-metric-row asset-money-row" style={{ marginBottom: '8px', justifyContent: 'center' }}>
                <span className="asset-metric-title--solana">
                  Current Value
                </span>
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
                      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
                    }}
                  >
                    <span className="asset-metric-symbol--solana">$</span>
                    <span className="asset-metric-value">{renderDecimalSafe(formatCurrency(summaryTotals.acVact || 0))}</span>
                  </span>
                </div>
            </div>
              <div
                className="asset-panel asset-panel--solana asset-profit-block asset-slide-in"
                style={{ 
                  padding: '20px 20px 20px', marginBottom: '10px', width: '92%', marginLeft: 'auto', marginRight: 'auto' }}
              >
                <div className="asset-profit-summary asset-profit-summary--solana">
                  <div className="asset-metric-inline-row">
                {(() => {
                      const formatRangeLabel = (days: number | null) => {
                        if (days == null) return 'All-time';
                        if (days === 7) return '1 week';
                        if (days === 30) return '1 month';
                        if (days === 90) return '3 months';
                        if (days === 365) return '1 year';
                        if (days === 1) return '24 hrs';
                        return `${days} days`;
                      };
                  if (selectedRangeDays && rangeHistoricalPrice != null) {
                    const pastValue = (summaryTotals.acVactTaa || 0) * (summaryRangePrice ?? 0);
                    const profitValue = (summaryTotals.acVact || 0) - pastValue;
                        const isProfit = profitValue >= -0.005;
                        const label = isProfit ? 'Profits' : 'Losses';
                        const formattedValue = formatMoneyFixed(Math.abs(profitValue));
                        return (
                          <span
                            className="asset-profit-inline-wrap"
                            style={profitInlineHeight ? { height: `${profitInlineHeight}px` } : undefined}
                          >
                            <span ref={profitInlineAnimRef} className="asset-profit-range-anim">
                              <span className="asset-metric-inline-title--solana">
                                {formatRangeLabel(selectedRangeDays)}{' '}
                                <span
                                  style={{
                                    opacity:
                                      (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                    transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                                  }}
                                >
                                  {label}
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
                                  className="asset-money-wrap"
                                  style={{
                                    opacity:
                                      (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                    transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                                  }}
                                >
                                  <span className="asset-metric-symbol--solana">
                                    {isProfit ? '+$' : '-$'}
                                  </span>
                                  <span className="asset-metric-inline-value">{renderDecimalSafe(formattedValue)}</span>
                                </span>
                              </div>
                          </span>
                        </span>
                        );
                  }
                      const defaultProfit = (summaryTotals.acVact || 0) - (summaryTotals.acVatop || 0);
                      const isProfit = defaultProfit >= -0.005;
                      const label = isProfit ? 'Profits' : 'Losses';
                      const formattedValue = formatMoneyFixed(Math.abs(defaultProfit));
                      return (
                        <span
                          className="asset-profit-inline-wrap"
                          style={profitInlineHeight ? { height: `${profitInlineHeight}px` } : undefined}
                        >
                          <span ref={profitInlineAnimRef} className="asset-profit-range-anim">
                            <span className="asset-metric-inline-title--solana">
                              {formatRangeLabel(null)}{' '}
                              <span
                                style={{
                                  opacity:
                                    (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                  transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                                }}
                              >
                                {label}
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
                                className="asset-money-wrap"
                                style={{
                                  opacity:
                                    (selectedRangeDays && rangeLoading) || profitValueHidden || summaryValuesHidden ? 0 : realityOpacity,
                                  transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : 'opacity 1s ease',
                                }}
                              >
                                <span className="asset-metric-symbol--solana">
                                  {isProfit ? '+$' : '-$'}
                                </span>
                                <span className="asset-metric-inline-value">{renderDecimalSafe(formattedValue)}</span>
                              </span>
                            </div>
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
                        className={`asset-range-button asset-range-button--solana${isActive ? ' is-active' : ''}`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
          </div>
              <div className="asset-portfolio-actions asset-portfolio-actions--add">
                <button
                  className={`asset-action-button asset-action-button--solana asset-action-button--invest-add${
                    addMorePulse ? ' asset-action-button--pulse' : ''
                  }`}
                  onClick={() => {
                    triggerAddMorePulse();
                    if (addMoreOpen) {
                      setAddMoreOpen(false);
                      return;
                    }
                    if (investmentsListOpen) {
                      triggerShowPulse();
                      setInvestmentsListOpen(false);
                      setTimeout(() => {
                        setVisibleInvestments(3);
                      }, 2000);
                    }
                    setSubmitPhase('idle');
                    setShowAddMoreForm(true);
                    setTimeout(() => setAddMoreOpen(true), 0);
                    requestAnimationFrame(() => scrollToBottomAfterDocumentStable());
                  }}
                >
                  {addMoreOpen ? 'Hide add more investments' : 'Add more investments'}
                </button>
              </div>
              {showAddMoreForm && (
                <div
                  ref={addMoreFormPanelRef}
                  className={`asset-slide-panel asset-slide-panel--form${addMoreOpen ? ' is-open' : ''}`}
                  style={{
                    maxHeight:
                      (submitTargetSnapshot ?? submitTargetRef.current) === 'addMore' && submitPanelMaxHeight != null
                        ? `${submitPanelMaxHeight}px`
                        : addMoreOpen
                          ? `${Math.max(600, addMoreFormPanelHeight)}px`
                          : '0px',
                    transition:
                      (submitTargetSnapshot ?? submitTargetRef.current) === 'addMore' && submitPanelMaxHeight != null
                        ? 'max-height 2s ease'
                        : undefined,
                    overflowX:
                      (submitTargetSnapshot ?? submitTargetRef.current) === 'addMore' && submitPanelMaxHeight != null
                        ? 'hidden'
                        : undefined,
                  }}
                >
                  <div ref={addMoreFormBoxRef} className="asset-slide-panel-inner">
                    <div className="asset-invest-form-box asset-invest-form-box--solana">
                      {renderAddForm(
                        'Add more investments',
                        closeAddMoreForm,
                        'asset-action-button asset-action-button--solana'
                      )}
        <div ref={emptyActionsMeasureRef} className="asset-empty-actions asset-empty-actions--measure" aria-hidden="true">
          <div className="asset-empty-addinvest">
            <button
              className="asset-action-button asset-action-button--solana asset-action-button--invest-add asset-action-button--add-investments"
              type="button"
              disabled
              tabIndex={-1}
            >
              Add Investments
            </button>
          </div>
          {!isSignedIn && !email && (
            <div className="asset-empty-signin">
              <button
                type="button"
                className="asset-action-button asset-action-button--save-signin"
                disabled
                tabIndex={-1}
              >
                    <span className="asset-save-signin-text">Sign In to Save Investments</span>
              </button>
            </div>
          )}
        </div>
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
                    <Link href="/signin" className="asset-action-button asset-action-button--save-signin">
                      <span className="asset-save-signin-text">Sign In to Save Investments</span>
                    </Link>
                  </div>
                )}

                <div
                  ref={showActionsRef}
                  className={`asset-portfolio-actions asset-portfolio-actions--show${investmentsListOpen ? ' is-open' : ''}`}
                >
                  <button
                    className={`asset-action-button asset-action-button--solana asset-action-button--invest-show${
                      showPulse ? ' asset-action-button--pulse' : ''
                    }`}
                    disabled={!investments.length || showMoreDisabled}
                    onClick={() => {
                      triggerShowPulse();
                      if (investmentsListOpen) {
                        setInvestmentsListOpen(false);
                        setTimeout(() => {
                          setVisibleInvestments(3);
                        }, 2000);
                        return;
                      }
                      setShowInvestmentsList(true);
                      setTimeout(() => setInvestmentsListOpen(true), 0);
                      requestAnimationFrame(() =>
                        scrollToBottomAfterMaxHeightOn(investmentsListOuterRef.current, 2500)
                      );
                    }}
                  >
                  {investmentsListOpen ? 'Hide investments' : 'Show investments'}
                  </button>
                </div>

                {showInvestmentsList && (
                  <div
                    ref={investmentsListOuterRef}
                    style={{
                      maxHeight: investmentsSectionMaxHeight,
                      transition: 'max-height 2s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <h2 className="asset-investments-header asset-investments-header--more" ref={investmentsListHeaderRef}>
                      <span className="asset-portfolio-title-muted">investments</span>
                    </h2>
                    <div
                      className={`asset-investments-wrap asset-investments-wrap--solana asset-slide-panel${
                        investmentsListOpen ? ' is-open' : ''
                      }`}
                      ref={investmentsListWrapRef}
                      style={{
                        maxHeight: investmentsMaxHeight,
                        transition: investmentsListOpen
                          ? `${
                              hasActiveDelete ? 'max-height 0s linear' : 'max-height 2s ease'
                            }, border-color 0.2s ease, padding 0.2s ease, margin 0.2s ease, box-shadow 0.2s ease, background 0.2s ease`
                          : 'max-height 2s ease, border-color 0.2s ease 2s, padding 0.2s ease 2s, margin 0.2s ease 2s, box-shadow 0.2s ease 2s, background 0.2s ease 2s',
                      }}
                    >
                      <div
                        className="asset-investments-list"
                        ref={investmentsListRef}
                        style={{
                          padding: investmentsListOpen ? '12px' : '0px',
                          transition: investmentsListOpen ? 'padding 0.2s ease' : 'padding 0.2s ease 2s',
                        }}
                      >
                      {displayInvestments
                        .slice(0, visibleInvestments)
                        .map((item, visibleIndex) => {
                          const { entry, id: investmentId, index: idx } = item;
                        const amount = entry.cVactTaa ?? 0;
                        const isClosing = closingInvestments.includes(investmentId);
                        const isCollapsed = collapsedInvestments.includes(investmentId);
                        const isDeleting = deletingInvestments.includes(investmentId);
                        const isPendingDelete = pendingDeleteInvestments.includes(investmentId);
                        const isNew = slowOpenInvestments.includes(investmentId);
                        const deleteRowHeight = deleteHeights[investmentId];
                        const showTopGap = true;
                        const gapSize = showTopGap ? '10px' : '0px';
                        const deleteTargetHeight = 150 + (showTopGap ? 10 : 0);
                        return (
                          <React.Fragment key={investmentId}>
                            <div
                              ref={(node) => {
                                investmentCardRefs.current[investmentId] = node;
                              }}
                              className={`asset-slide-panel${!isCollapsed || deleteRowHeight != null ? ' is-open' : ''}`}
                              style={{
                                ['--investment-gap' as any]: gapSize,
                                ...(isNew ? { transitionDuration: '3s' } : {}),
                                ...(deleteRowHeight != null
                                  ? {
                                      height: `${deleteRowHeight}px`,
                                      maxHeight: `${deleteRowHeight}px`,
                                      transition: 'height 3s ease, max-height 3s ease',
                                      overflow: 'hidden',
                                    }
                                  : {}),
                              }}
                              onTransitionEnd={(event) => {
                                if (event.target !== event.currentTarget) return;
                                if (event.propertyName !== 'max-height' && event.propertyName !== 'height') return;
                                if (!closingInvestments.includes(investmentId)) return;
                                finalizeDeleteCollapse(investmentId);
                              }}
                            >
                              {showTopGap && (
                                <div className="asset-investment-gap" />
                              )}
                              <div
                                className={`asset-panel asset-panel--solana${isPendingDelete ? ' is-pending-delete' : ''}${
                                  isDeleting || isPendingDelete ? ' is-deleting' : ''
                                }${isClosing ? ' is-closing-delete' : ''}${deleteRowHeight != null ? ' is-delete-transition' : ''}`}
                                style={{
                                  padding: '12px',
                                  boxSizing: 'border-box',
                                  height: deleteRowHeight != null ? 'calc(100% - var(--investment-gap, 0px))' : undefined,
                                }}
                              >
                              <div
                                className={`asset-delete-loader${
                                  isPendingDelete || isDeleting || isClosing || deleteRowHeight != null ? ' is-active' : ''
                                }`}
                              >
                                <div
                                  className="asset-delete-loader-spinner"
                                  style={{
                                    borderColor: 'rgba(1, 248, 164, 0.2)',
                                    borderTopColor: 'rgba(1, 248, 164, 0.5)',
                                  }}
                                />
                              </div>
                              <div className="asset-investment-metrics">
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--solana" style={{ marginTop: 20 }}>
                                      Purchased Value
                                    </span>
                                    <span className="asset-money-wrap">
                                      <span className="asset-metric-symbol--solana">$</span>
                                      <span className="asset-metric-value">
                                        {renderDecimalSafe(formatCurrency((isLiquidMode ? (entry.lCVatop ?? entry.rCVatop) : entry.cVatop) ?? 0))}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--solana">Current Value</span>
                                    <span className="asset-money-wrap">
                                      <span className="asset-metric-symbol--solana">$</span>
                                      <span className="asset-metric-value">
                                        {renderDecimalSafe(formatCurrency((isLiquidMode ? (entry.lCVact ?? entry.rCVact) : entry.cVact) ?? 0))}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    {(() => {
                                      const value = Number(
                                        (isLiquidMode ? (entry.lCdVatop ?? entry.rCdVatop) : entry.cdVatop) ?? 0
                                      );
                                      const isProfit = value >= -0.005;
                                      const title = isProfit ? 'Profits' : 'Losses';
                                      const prefix = isProfit ? '+$' : '-$';
                                      return (
                                        <>
                                          <span className="asset-metric-title--solana">{title}</span>
                                          <span className="asset-money-wrap">
                                            <span className="asset-metric-inline-symbol--solana">{prefix}</span>
                                            <span className="asset-metric-value">
                                              {renderDecimalSafe(formatMoneyFixed(Math.abs(value)))}
                                            </span>
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--solana">Solana amount</span>
                                    <span className="asset-metric-value">
                                      {Number(amount).toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 8,
                                      })}
                                    </span>
                                  </div>
                                  <div className="asset-metric-row asset-money-row" style={{ justifyContent: 'center' }}>
                                    <span className="asset-metric-title--solana">Date purchased</span>
                                    <span className="asset-metric-value">{formatShortDate(entry.date)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="asset-range-button asset-range-button--solana asset-delete-button asset-investment-delete-button"
                                    disabled={deleteLocked}
                                    onClick={() => {
                                      if (
                                        deleteLockRef.current ||
                                        closingInvestments.includes(investmentId) ||
                                        deletingInvestments.includes(investmentId) ||
                                        pendingDeleteInvestments.includes(investmentId)
                                      )
                                        return;
                                      if (toggleReenableTimerRef.current) {
                                        globalThis.clearTimeout(toggleReenableTimerRef.current);
                                        toggleReenableTimerRef.current = null;
                                      }
                                      toggleDisabledByDeleteRef.current = true;
                                      setToggleDisabled(true);
                                      setToggleKnobHidden(true);
                                      deleteLockRef.current = true;
                                      setDeleteLocked(true);
                                      setDeleteGhosts((prev) => {
                                        if (prev.some((ghost) => ghost.id === investmentId)) return prev;
                                        return [...prev, { id: investmentId, entry, index: idx }];
                                      });
                                      const card = investmentCardRefs.current[investmentId];
                                      if (card) {
                                        const height = card.getBoundingClientRect().height;
                                        setDeleteHeights((prev) => ({ ...prev, [investmentId]: height }));
                                        window.requestAnimationFrame(() => {
                                          setDeleteHeights((prev) => ({ ...prev, [investmentId]: deleteTargetHeight }));
                                        });
                                      }
                                      setPendingDeleteInvestments((prev) => [...prev, investmentId]);
                                      const fadeTimer = window.setTimeout(() => {
                                        setPendingDeleteInvestments((prev) => prev.filter((value) => value !== investmentId));
                                        setDeletingInvestments((prev) => [...prev, investmentId]);
                                        const actionTimer = window.setTimeout(() => {
                                          handleDeleteInvestment(investmentId)
                                            .catch(() => {
                                              // ignore errors
                                            })
                                            .finally(() => {
                                              const expandTimer = window.setTimeout(() => {
                                                setDeleteHeights((prev) => ({ ...prev, [investmentId]: 0 }));
                                                setClosingInvestments((prev) =>
                                                  prev.includes(investmentId) ? prev : [...prev, investmentId]
                                                );
                                              }, 350);
                                              const cleanupTimer = window.setTimeout(() => {
                                                finalizeDeleteCollapse(investmentId);
                                                pulseSummaryValues();
                                              }, 4000);
                                              deleteCleanupTimersRef.current[investmentId] = cleanupTimer;
                                              deleteCleanupTimersRef.current[`${investmentId}-expand`] = expandTimer;
                                            });
                                        }, 2000);
                                        deleteActionTimersRef.current[investmentId] = actionTimer;
                                      }, 1000);
                                      deleteFadeTimersRef.current[investmentId] = fadeTimer;
                                    }}
                                  >
                                    Delete
                                  </button>
                              </div>
                            </div>
                          </div>
                          </React.Fragment>
                        );
                      })}
                      {displayInvestments.length > visibleInvestments && (
                        <button
                          type="button"
                          className="asset-action-button asset-action-button--solana asset-action-button--invest-show"
                          onClick={() => {
                            setVisibleInvestments((prev) => prev + 3);
                            requestAnimationFrame(() => scrollToBottomAfterDocumentStable());
                          }}
                        >
                          Show 3 More
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </>
      )}
        {shouldRenderAddForm && (
          <div
            ref={addFormPanelRef}
            className="asset-submit-collapse"
            style={{
              maxHeight:
                (submitTargetSnapshot ?? submitTargetRef.current) === 'add' && addFormOuterSubmitMaxHeight != null
                  ? `${addFormOuterSubmitMaxHeight}px`
                  : undefined,
              transition:
                (submitTargetSnapshot ?? submitTargetRef.current) === 'add' && addFormOuterSubmitMaxHeight != null
                  ? 'max-height 2s ease'
                  : undefined,
              overflow:
                (submitTargetSnapshot ?? submitTargetRef.current) === 'add' && addFormOuterSubmitMaxHeight != null
                  ? 'hidden'
                  : undefined,
            }}
          >
            <div className="asset-portfolio-summary-box asset-portfolio-summary-box--solana">
              <div
                className={`asset-slide-panel asset-slide-panel--form${
                  addFormOpen || addFormSubmitCollapsing ? ' is-open' : ''
                }${addFormSubmitCollapsing ? ' is-submit-collapse' : ''}`}
                style={{
                  maxHeight: addFormOpen ? `${Math.max(600, addFormPanelHeight)}px` : '0px',
                }}
                ref={addFormSlidePanelRef}
              >
                <div ref={addFormBoxRef} className="asset-slide-panel-inner">
                  <div className="asset-invest-form-box asset-invest-form-box--solana">
                    {renderAddForm(
                      'Add Investments',
                      closeAddForm,
                      'asset-action-button asset-action-button--solana'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
};

export default VavitySolana;
