'use client';

import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Default max-height transition for the price/chart block under the title (seconds). */
export const ASSET_PRICE_CHART_MOUNT_SLIDE_SECONDS = 5;
export const ASSET_PRICE_CHART_MOUNT_SLIDE_MS = ASSET_PRICE_CHART_MOUNT_SLIDE_SECONDS * 1000;

/**
 * Investments/summary panel begins expanding this many ms before the price/chart mount slide ends
 * (so the last portion of both animations run together). With the default 5s chart slide, 3000ms = start at 2s = last 3s in sync.
 */
export const ASSET_SUMMARY_START_BEFORE_CHART_SLIDE_END_MS = 3000;

/**
 * Minimum time after mount before the summary may open, if chart timing alone would be earlier.
 * Must be ≤ (slide ms − start-before-end) so it does not override the “last 3s with chart” alignment.
 */
export const ASSET_SUMMARY_PAUSE_BEFORE_EXPAND_MS = 2000;

/**
 * Mount-only measured max-height animation for the asset page block directly under the title/slogan:
 * price / market cap / %, range controls, and the line chart. Does not affect header, toggle, or forms.
 */
export function useAssetPriceChartMountSlide(
  bufferPx: number = 24,
  transitionSeconds: number = ASSET_PRICE_CHART_MOUNT_SLIDE_SECONDS,
  enabled: boolean = true
) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      setMaxHeight(0);
      return;
    }
    let raf = 0;
    let raf2 = 0;
    raf = window.requestAnimationFrame(() => {
      const h = measureRef.current?.scrollHeight ?? 0;
      const next = Math.max(0, h + bufferPx);
      setMaxHeight(next);
      raf2 = window.requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [bufferPx, enabled]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const node = measureRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = Math.max(0, node.scrollHeight + bufferPx);
        setMaxHeight((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [bufferPx, enabled]);

  const slidePanelProps: { className: string; style: CSSProperties } = {
    className: `asset-slide-panel asset-asset-price-chart-mount-slide${open ? ' is-open' : ''}`,
    style: {
      maxHeight: open ? `${maxHeight}px` : '0px',
      transition: `max-height ${transitionSeconds}s linear`,
    },
  };

  return { measureRef, slidePanelProps };
}
