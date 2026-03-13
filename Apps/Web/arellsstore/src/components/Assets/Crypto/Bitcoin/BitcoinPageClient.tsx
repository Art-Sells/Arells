'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Bitcoin from './bitcoin';
import '../../../../app/css/Home.css';
import { useUser } from '../../../../context/UserContext';

const BitcoinPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [extraLoaderHoldMs, setExtraLoaderHoldMs] = useState(0);
  const [sessionClearPending, setSessionClearPending] = useState(false);
  const [portfolioClampY, setPortfolioClampY] = useState(0);
  const { email } = useUser();
  const pageRef = useRef<HTMLDivElement>(null);
  const portfolioBottomRef = useRef<number | null>(null);

  // Set global background immediately for overscroll beyond the asset page.
  useEffect(() => {
    // Use an opaque tint so overscroll can never blend back to browser white.
    const bg = 'rgb(255, 247, 236)';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    // Hard-force actual background color too (some browsers show viewport bg during overscroll).
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  useEffect(() => {
    if (!showLoading || sessionClearPending) return;
    const totalHoldMs = extraLoaderHoldMs > 0 ? extraLoaderHoldMs : 2000;
    const fadeDelayMs = extraLoaderHoldMs > 0 ? Math.max(0, totalHoldMs - 1000) : 1000;
    const fadeTimer = fadeOut ? null : setTimeout(() => setFadeOut(true), fadeDelayMs);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
      setExtraLoaderHoldMs(0);
    }, totalHoldMs);

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [extraLoaderHoldMs, fadeOut, showLoading, sessionClearPending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = Boolean((window as any).__vavitySessionClearingPending);
    if (pending) {
      setSessionClearPending(true);
      setFadeOut(false);
      setLoading(true);
    }
    const pendingHandler = () => {
      setSessionClearPending(true);
      setExtraLoaderHoldMs(0);
      setFadeOut(false);
      setLoading(true);
    };
    const readyHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { holdMs?: number; pendingAt?: number } | undefined;
      const holdMs = detail?.holdMs ?? 2000;
      const remaining = Math.max(0, holdMs);
      setSessionClearPending(false);
      setExtraLoaderHoldMs(remaining);
      setFadeOut(false);
      setLoading(true);
    };
    window.addEventListener('vavity:session-clearing-pending', pendingHandler as EventListener);
    window.addEventListener('vavity:session-clearing-ready', readyHandler as EventListener);
    return () => {
      window.removeEventListener('vavity:session-clearing-pending', pendingHandler as EventListener);
      window.removeEventListener('vavity:session-clearing-ready', readyHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const page = pageRef.current;
      if (!page) return;
      const content = page.querySelector('.asset-page-content--bitcoin') as HTMLElement | null;
      const anchor = page.querySelector('.asset-portfolio-icon-anchor') as HTMLElement | null;
      if (!content || !anchor) return;

      const contentBottom = content.getBoundingClientRect().bottom;
      const footer = page.querySelector('.asset-footer') as HTMLElement | null;
      const footerTop = footer ? footer.getBoundingClientRect().top : contentBottom;
      const computedBottom = parseFloat(window.getComputedStyle(anchor).bottom || '');
      if (!Number.isNaN(computedBottom) && computedBottom > 0) {
        portfolioBottomRef.current = computedBottom;
      }
      const bottomOffset = portfolioBottomRef.current ?? 0;
      const fixedBottom = window.innerHeight - bottomOffset;
      const clampGap = 65;
      const clampBottom = footerTop - clampGap;
      const overlap = Math.max(0, fixedBottom - clampBottom);
      const nextY = overlap > 0 ? -overlap : 0;
      setPortfolioClampY((prev) => (prev === nextY ? prev : nextY));
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="asset-page asset-page--bitcoin" ref={pageRef}>
      <header className="asset-header asset-header--bitcoin" />
      {showLoading && (
        <div
          className={`asset-loader-overlay asset-loader-overlay--bitcoin${fadeOut ? ' asset-loader-overlay-fade' : ''}`}
        >
          <div className="asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--bitcoin">
            <div className="asset-reality-toggle-row">
              <button type="button" className="asset-reality-toggle asset-reality-toggle--loader" aria-hidden="true">
                <span className="asset-loader-toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Bitcoin />
      {!!email && (
        <div
          className="asset-portfolio-icon-anchor"
          style={portfolioClampY ? { transform: `translateY(${portfolioClampY}px)` } : undefined}
        >
          <Link
            href="/my-investments"
            className="asset-range-button asset-range-button--bitcoin asset-portfolio-icon-button"
            aria-label="View my investments"
          >
            <span className="asset-portfolio-icon-text" aria-hidden="true">$</span>
          </Link>
        </div>
      )}

      <footer className="asset-footer">
        {!email && (
          <Link
            href="/"
            className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-show asset-view-more-assets asset-view-more-assets--footer asset-footer-viewmore"
          >
            <span className="asset-view-more-assets-text">view</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">more</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">assets</span>
          </Link>
        )}
        <Link
          className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-show asset-footer-about-button"
          href="/about"
        >
          <span className="asset-footer-about-text">about</span>
        </Link>
      </footer>
    </div>
  );
};

export default BitcoinPageClient;
