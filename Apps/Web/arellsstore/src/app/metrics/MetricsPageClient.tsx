'use client';

import Link from 'next/link';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import GrowthMetricsPanel from '../../components/Metrics/GrowthMetricsPanel';
import MetricsPageActivityPanel from '../../components/Metrics/MetricsPageActivityPanel';

export default function MetricsPageClient() {
  const [slideIn, setSlideIn] = useState(false);
  const growthMetricsCardInnerRef = useRef<HTMLDivElement | null>(null);
  const [growthCardPanelOpen, setGrowthCardPanelOpen] = useState(false);
  const [growthCardPanelMaxHeight, setGrowthCardPanelMaxHeight] = useState(0);

  useLayoutEffect(() => {
    setSlideIn(true);
  }, []);

  /* Same pattern as My Investments: measure inner scrollHeight, then open max-height (chart/async panels update via ResizeObserver). */
  useEffect(() => {
    let raf = 0;
    let raf2 = 0;
    raf = window.requestAnimationFrame(() => {
      const h = growthMetricsCardInnerRef.current?.scrollHeight ?? 0;
      const next = Math.max(0, h + 24);
      setGrowthCardPanelMaxHeight(next);
      raf2 = window.requestAnimationFrame(() => setGrowthCardPanelOpen(true));
    });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, []);

  useLayoutEffect(() => {
    const node = growthMetricsCardInnerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = Math.max(0, node.scrollHeight + 24);
        setGrowthCardPanelMaxHeight((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  return (
    <div className="growth-metrics-page">
      <div className="growth-metrics-under-construction-float" aria-hidden="true">
        <p className="growth-metrics-under-construction-inner">
          <span className="growth-metrics-under-construction-word">under</span>{' '}
          <span className="growth-metrics-under-construction-word">construction</span>
        </p>
      </div>
      <div className={`growth-metrics-page__stack${slideIn ? ' growth-metrics-page__stack--in' : ''}`}>
        <div className="growth-metrics-title-bar">
          <div className="growth-metrics-title-cluster">
            <img
              src="/images/Arells-Logo-Ebony.png"
              alt=""
              width={50}
              height={16}
              className="growth-metrics-title-wordmark"
            />
            <div className="growth-metrics-title-row">
              <span className="growth-metrics-title-word growth-metrics-title-word--growth">Growth</span>
              <Link href="/" className="growth-metrics-home-button" aria-label="Home">
                <span className="growth-metrics-home-button-icon" aria-hidden="true" />
              </Link>
              <span className="growth-metrics-title-word growth-metrics-title-word--metrics">Metrics</span>
            </div>
          </div>
        </div>
        <div className="growth-metrics-card-wrap">
          <span className="growth-metrics-card-outline" aria-hidden="true" />
          <div
            className={`asset-slide-panel growth-metrics-card-slide${growthCardPanelOpen ? ' is-open' : ''}`}
            style={{
              maxHeight: growthCardPanelOpen ? `${growthCardPanelMaxHeight}px` : '0px',
              transition: 'max-height 8s ease',
            }}
          >
            <div ref={growthMetricsCardInnerRef} className="growth-metrics-card-inner">
              <div className="growth-metrics-card-content">
                <div className="growth-metrics-panels">
                  <GrowthMetricsPanel />
                  <MetricsPageActivityPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="growth-metrics-below">
          <div
            className={`growth-metrics-about-row${slideIn ? ' growth-metrics-about-row--in' : ''}`}
          >
            <Link className="growth-metrics-about-button" href="/about">
              <span className="growth-metrics-about-button-bg" aria-hidden="true" />
              <span className="growth-metrics-about-button-text">about</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
