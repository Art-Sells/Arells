"use client";

import type { ImageLoaderProps } from 'next/image';
import '../app/css/Home.css';
import { useMemo, useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useVavity } from '../context/VavityAggregator';
import { useUser } from '../context/UserContext';
import HomeInvestmentsSlideUpCTA from './Home/HomeInvestmentsSlideUpCTA';

const Index = () => {
  // Loader Functions
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    wordLogo: false,
  });
  const { getAsset } = useVavity();
  const { email } = useUser();
  const forceHomeInvestmentsPreview = false;
  const [isLiquidMode, setIsLiquidMode] = useState(false);
  const [toggleKnobLeftPx, setToggleKnobLeftPx] = useState<number | null>(null);
  const [toggleAlpha, setToggleAlpha] = useState<number>(0);
  const toggleAlphaRef = useRef(0);
  const [toggleAnimating, setToggleAnimating] = useState(false);
  const toggleAnimRafRef = useRef<number | null>(null);
  const toggleResizeTimerRef = useRef<number | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const homeHeaderRef = useRef<HTMLDivElement | null>(null);
  const homeLogoRef = useRef<HTMLImageElement | null>(null);
  const [homeAssetsLayout, setHomeAssetsLayout] = useState<{ left: number; width: number } | null>(null);
  const homeAssetsWrapRef = useRef<HTMLDivElement | null>(null);
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

  // Home should always own/reset the global background so asset-page tint never bleeds into `/`.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    const href = '/ArellsIcoIcon.png';
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    links.forEach((link) => {
      link.href = href;
    });
  }, []);



  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded(prevState => ({ 
      ...prevState, 
      [imageName]: true 
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 1000);

      const hideTimer = setTimeout(() => {
        setLoading(false);
        setFadeOut(false);
      }, 2000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [imagesLoaded]);

  const displayIsLiquidMode = toggleAlpha > 0.5;
  const realityOpacity = Math.max(0, Math.min(1, Math.abs(toggleAlpha - 0.5) * 2));
  const toggleKnobLeftComputedPx = useMemo(() => {
    if (!toggleTrack) return null;
    return toggleTrack.maxLeft - toggleAlpha * (toggleTrack.maxLeft - toggleTrack.minLeft);
  }, [toggleAlpha, toggleTrack]);
  const toggleKnobLeftEffectivePx = useMemo(() => {
    const base = toggleKnobLeftPx ?? toggleKnobLeftComputedPx;
    if (base == null || !toggleTrack) return base;
    return Math.min(toggleTrack.maxLeft, Math.max(toggleTrack.minLeft, base));
  }, [toggleKnobLeftPx, toggleKnobLeftComputedPx, toggleTrack]);
  const realityFadeStyle = useMemo(() => {
    return {
      opacity: realityOpacity,
      transition: toggleKnobLeftPx != null || toggleAnimating ? 'none' : undefined,
    } as React.CSSProperties;
  }, [realityOpacity, toggleAnimating, toggleKnobLeftPx]);

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
    const initialTrack = measureToggleTrack();
    if (initialTrack && !toggleDragRef.current.active && !toggleAnimating) {
      const alpha = toggleAlphaRef.current;
      const left = initialTrack.maxLeft - alpha * (initialTrack.maxLeft - initialTrack.minLeft);
      btn.style.setProperty('--toggle-knob-left', `${left}px`);
    }
    let raf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        const track = measureToggleTrack();
        if (!track || toggleDragRef.current.active || toggleAnimating) return;
        const alpha = toggleAlphaRef.current;
        const left = track.maxLeft - alpha * (track.maxLeft - track.minLeft);
        btn.style.setProperty('--toggle-knob-left', `${left}px`);
        setToggleKnobLeftPx(left);
        btn.classList.add('is-resizing');
        if (toggleResizeTimerRef.current != null) {
          window.clearTimeout(toggleResizeTimerRef.current);
        }
        toggleResizeTimerRef.current = window.setTimeout(() => {
          btn.classList.remove('is-resizing');
          toggleResizeTimerRef.current = null;
        }, 150);
      });
    });
    ro.observe(btn);
    return () => {
      if (raf != null) window.cancelAnimationFrame(raf);
      if (toggleResizeTimerRef.current != null) {
        window.clearTimeout(toggleResizeTimerRef.current);
        toggleResizeTimerRef.current = null;
      }
      ro.disconnect();
    };
  }, [measureToggleTrack, toggleAnimating]);

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

  const updateHomeLogoShift = useCallback(() => {
    const header = homeHeaderRef.current;
    const logo = homeLogoRef.current;
    if (!header || !logo) return;
    const headerWidth = header.clientWidth;
    const logoWidth = logo.offsetWidth;
    const currentLeft = logo.offsetLeft;
    const targetLeft = (headerWidth - logoWidth) / 2;
    const shift = targetLeft - currentLeft;
    header.style.setProperty('--home-logo-shift', `${shift}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    updateHomeLogoShift();
    const handleResize = () => updateHomeLogoShift();
    window.addEventListener('resize', handleResize);
    const headerEl = homeHeaderRef.current;
    const logoEl = homeLogoRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (headerEl && logoEl && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateHomeLogoShift);
      resizeObserver.observe(headerEl);
      resizeObserver.observe(logoEl);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateHomeLogoShift]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const wrapper = homeAssetsWrapRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const r = wrapper.getBoundingClientRect();
      setHomeAssetsLayout({
        left: r.left + r.width / 2,
        width: r.width,
      });
    };
    let raf: number | null = null;
    const schedule = () => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        measure();
      });
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrapper);
    const onResize = () => {
      schedule();
      window.requestAnimationFrame(schedule);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', schedule);
    return () => {
      if (raf != null) window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', schedule);
    };
  }, []);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) =>
    `${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  const getPercentChange = (history: { date: string; price: number }[], days?: number) => {
    if (!history.length) return 0;
    const latest = history[history.length - 1]?.price ?? 0;
    if (latest <= 0) return 0;
    if (days == null) {
      const first = history.find((entry) => entry.price > 0)?.price ?? 0;
      return first > 0 ? ((latest - first) / first) * 100 : 0;
    }
    const lastDate = history[history.length - 1]?.date;
    if (!lastDate) return 0;
    const cutoff = new Date(`${lastDate}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    let base = history[0]?.price ?? 0;
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entryDate = new Date(`${history[i].date}T00:00:00.000Z`);
      if (entryDate <= cutoff) {
        base = history[i].price;
        break;
      }
    }
    return base > 0 ? ((latest - base) / base) * 100 : 0;
  };

  const assetRows = useMemo(() => {
    const assets = [
      { id: 'bitcoin', label: 'Bitcoin', href: '/bitcoin', icon: 'images/assets/crypto/Bitcoin.svg' },
      { id: 'ethereum', label: 'Ethereum', href: '/ethereum', icon: 'images/assets/crypto/Ethereum.svg' }
    ];

    return assets.map((asset) => {
      const snapshot = getAsset(asset.id);
      const solidHistory =
        (Array.isArray(snapshot?.solidHistory) && snapshot.solidHistory.length > 0
          ? snapshot.solidHistory
          : Array.isArray(snapshot?.liquidHistory)
            ? snapshot.liquidHistory
            : []) ?? [];
      const liquidHistory =
        (Array.isArray(snapshot?.liquidHistory) && snapshot.liquidHistory.length > 0
          ? snapshot.liquidHistory
          : Array.isArray(snapshot?.solidHistory)
            ? snapshot.solidHistory
            : []) ?? [];
      const solidPrice = snapshot?.vapa ?? 0;
      const liquidPrice =
        typeof snapshot?.price === 'number' ? snapshot.price : typeof snapshot?.vapa === 'number' ? snapshot.vapa : 0;
      return {
        ...asset,
        solidPrice,
        liquidPrice,
        solidChange1w: getPercentChange(solidHistory, 7),
        solidChange1y: getPercentChange(solidHistory, 365),
        solidChangeAll: getPercentChange(solidHistory),
        liquidChange1w: getPercentChange(liquidHistory, 7),
        liquidChange1y: getPercentChange(liquidHistory, 365),
        liquidChangeAll: getPercentChange(liquidHistory),
      };
    });
  }, [getAsset]);

  const sortedRows = assetRows;

  return (
    <>
      {showLoading && (
        <div className={`asset-loader-overlay myinv-loader-overlay${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div
            className="loader-toggle-clone loader-toggle-clone--home"
            style={
              homeAssetsLayout
                ? {
                    left: homeAssetsLayout.left - homeAssetsLayout.width / 2,
                    width: homeAssetsLayout.width,
                    transform: 'none',
                  }
                : { visibility: 'hidden' as const }
            }
          >
            <div className="home-toggle-shell-wrap">
              <div className="home-toggle-shell home-toggle-shell--bordered myinv-accent-border">
                <div className="asset-reality-toggle-row home-toggle-row">
                  <span className="asset-reality-toggle-label">Liquid</span>
                  <button type="button" className="asset-reality-toggle" aria-hidden="true" tabIndex={-1}>
                    <span className="asset-reality-toggle-knob" aria-hidden="true" />
                  </button>
                  <span className="asset-reality-toggle-label">Solid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={homeHeaderRef}
        className={`home-header-inner page-slide-down${displayIsLiquidMode ? ' is-liquid' : ''}`}
      >
        <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
            width={70}
            height={23}
          id="word-logoo"
          src="images/Arells-Logo-Ebony.png"
          ref={homeLogoRef}
        />
      </div>
      <div className="home-slogan-layer page-slide-down">
        <div id="descriptioner-wrapper">
          <p
            id="descriptioner"
            className={`home-slogan-text${displayIsLiquidMode ? ' is-hidden' : ''}`}
            style={{ letterSpacing: '0px', marginLeft: '0px' }}
          >
            if investments never lost value
          </p>
        </div>
      </div>

      <div ref={homeAssetsWrapRef} className="home-assets-wrapper shadow-border-wrap page-slide-down">
        <span className="shadow-border" aria-hidden="true" />
        <div className="home-assets-list">
          <div className="home-assets-table-shell myinv-accent-border">
          <div className="home-assets-rows-shell">
            {sortedRows.map((row) => {
              const displayPrice = displayIsLiquidMode ? row.liquidPrice : row.solidPrice;
              const change1w = displayIsLiquidMode ? row.liquidChange1w : row.solidChange1w;
              const change1y = displayIsLiquidMode ? row.liquidChange1y : row.solidChange1y;
              const changeAll = displayIsLiquidMode ? row.liquidChangeAll : row.solidChangeAll;
              return (
                <div key={row.id} className="home-asset-row">
                  <Link href={row.href} className={`home-asset-card home-asset-${row.id}`}>
                    <span className="home-asset-icon-wrap">
                      <Image
                        loader={imageLoader}
                        alt={`${row.label} logo`}
                        width={18}
                        height={18}
                        className="home-asset-icon"
                        src={row.icon}
                      />
                    </span>
                    <div className="home-assets-cell home-assets-asset">
                      <span className={`home-asset-label home-asset-label-${row.id}`}>
                        <span className="home-asset-name">{row.label}</span>
                      </span>
                    </div>
                    <div className="home-assets-cell">
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <span className="home-assets-currency home-assets-currency-dollar">$</span>
                        <span className="home-assets-number home-assets-price">{formatCurrency(displayPrice)}</span>
                      </span>
                    </div>
                    <div className="home-assets-cell home-assets-percent home-assets-1w">
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={12}
                          height={12}
                          className="home-asset-arrow"
                          src={change1w > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
                        />
                      </span>
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <span className="home-assets-number">
                          {formatPercent(change1w).replace('%', '')}
                          <span className="home-assets-currency home-assets-currency-percent">%</span>
                        </span>
                      </span>
                    </div>
                    <div className="home-assets-cell home-assets-percent home-assets-1y">
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={12}
                          height={12}
                          className="home-asset-arrow"
                          src={change1y > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
                        />
                      </span>
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <span className="home-assets-number">
                          {formatPercent(change1y).replace('%', '')}
                          <span className="home-assets-currency home-assets-currency-percent">%</span>
                        </span>
                      </span>
                    </div>
                    <div className="home-assets-cell home-assets-percent">
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={12}
                          height={12}
                          className="home-asset-arrow"
                          src={changeAll > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
                        />
                      </span>
                      <span className="asset-header-switch-fade" style={realityFadeStyle}>
                        <span className="home-assets-number">
                          {formatPercent(changeAll).replace('%', '')}
                          <span className="home-assets-currency home-assets-currency-percent">%</span>
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
      <div className="home-assets-footer home-assets-footer--outside home-assets-footer-slide">
        <div className="home-assets-footer-text">A new asset added weekly</div>
      </div>
      <div
        className="home-toggle-footer"
        style={
          homeAssetsLayout
            ? {
                left: homeAssetsLayout.left - homeAssetsLayout.width / 2,
                width: homeAssetsLayout.width,
                transform: 'none',
              }
            : undefined
        }
      >
        <div className="home-toggle-shell-wrap shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div className="home-toggle-shell-bg">
            <div className="home-toggle-shell home-toggle-shell--bordered myinv-accent-border">
              <div className="asset-reality-toggle-row home-toggle-row">
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
                    const currentLeft = toggleKnobLeftPx ?? (displayIsLiquidMode ? minLeft : maxLeft);
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
                        setToggleAlpha((prev) => (Math.abs(prev - toggleAlphaRef.current) > 0.001 ? toggleAlphaRef.current : prev));
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
          </div>
        </div>
      </div>
      <div className="home-assets-about-wrap page-slide-in">
        <Link className="myinv-about-button home-assets-about-button" href="/about">
          <span className="myinv-about-button-bg" aria-hidden="true" />
          <span className="myinv-about-button-text">about</span>
        </Link>
      </div>

      {!showLoading && (!!email || forceHomeInvestmentsPreview) && <HomeInvestmentsSlideUpCTA />}

    </>
  );
}

export default Index;