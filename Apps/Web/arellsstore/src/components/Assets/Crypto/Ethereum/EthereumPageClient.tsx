'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Ethereum from './ethereum';
import '../../../../app/css/Home.css';
import { useUser } from '../../../../context/UserContext';

const EthereumPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [sessionClearPending, setSessionClearPending] = useState(false);
  const [clearCheckInFlight, setClearCheckInFlight] = useState(false);
  const [loaderScheduleKey, setLoaderScheduleKey] = useState(0);
  const [sessionResetActive, setSessionResetActive] = useState(false);
  const [sessionResetFade, setSessionResetFade] = useState(false);
  const [sessionResetKey, setSessionResetKey] = useState(0);
  const [sessionResetVisible, setSessionResetVisible] = useState(false);
  const [portfolioClampY, setPortfolioClampY] = useState(0);
  const { email } = useUser();
  const pageRef = useRef<HTMLDivElement>(null);
  const loaderToggleShellRef = useRef<HTMLDivElement | null>(null);
  const portfolioBottomRef = useRef<number | null>(null);
  const sessionResetTimersRef = useRef<number[]>([]);
  const loaderHideAtRef = useRef<number | null>(null);
  const forceSessionResetPreview = false;
  const showSessionResetOverlay = forceSessionResetPreview || sessionResetActive;
  const showSessionResetFade = sessionResetFade && !forceSessionResetPreview;
  const sessionResetKeyValue = forceSessionResetPreview ? 'preview' : sessionResetKey;

  const updateLoaderToggleRange = useCallback((btn: HTMLButtonElement) => {
    const shell = loaderToggleShellRef.current;
    if (!shell) return;
    const cs = window.getComputedStyle(btn);
    const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 0;
    const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 0;
    const knobSize = parseFloat(cs.getPropertyValue('--toggle-knob-size')) || 0;
    const w = Math.round(btn.getBoundingClientRect().width);
    if (w <= 0) return;
    const minLeft = Math.round(leftInset - knobSize / 2);
    const maxLeft = Math.round(w - rightInset - knobSize / 2);
    shell.style.setProperty('--asset-loader-toggle-min-left', `${minLeft}px`);
    shell.style.setProperty('--asset-loader-toggle-max-left', `${maxLeft}px`);
    shell.style.setProperty('--asset-loader-toggle-width', `${w}px`);
  }, []);

  const updateLoaderToggleRangeFromLoader = useCallback(() => {
    const shell = loaderToggleShellRef.current;
    if (!shell) return;
    const btn = shell.querySelector<HTMLButtonElement>('.asset-reality-toggle--loader');
    if (!btn) return;
    const cs = window.getComputedStyle(btn);
    const leftInset = parseFloat(cs.getPropertyValue('--toggle-knob-left-inset')) || 0;
    const rightInset = parseFloat(cs.getPropertyValue('--toggle-knob-right-inset')) || 0;
    const knobSize = parseFloat(cs.getPropertyValue('--toggle-knob-size')) || 0;
    const w = Math.round(btn.getBoundingClientRect().width);
    if (w <= 0) return;
    const minLeft = Math.round(leftInset - knobSize / 2);
    const maxLeft = Math.round(w - rightInset - knobSize / 2);
    shell.style.setProperty('--asset-loader-toggle-min-left', `${minLeft}px`);
    shell.style.setProperty('--asset-loader-toggle-max-left', `${maxLeft}px`);
    shell.style.setProperty('--asset-loader-toggle-width', `${w}px`);
  }, []);

  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    let raf: number | null = null;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    const attach = (btn: HTMLButtonElement) => {
      updateLoaderToggleRange(btn);
      ro = new ResizeObserver(() => {
        if (raf != null) return;
        raf = window.requestAnimationFrame(() => {
          raf = null;
          updateLoaderToggleRange(btn);
        });
      });
      ro.observe(btn);
    };
    const findAndAttach = () => {
      const btn = root.querySelector<HTMLButtonElement>('.asset-reality-toggle:not(.asset-reality-toggle--loader)');
      if (btn) {
        attach(btn);
        return true;
      }
      return false;
    };
    updateLoaderToggleRangeFromLoader();
    if (!findAndAttach()) {
      mo = new MutationObserver(() => {
        if (findAndAttach() && mo) {
          mo.disconnect();
          mo = null;
        }
      });
      mo.observe(root, { childList: true, subtree: true });
    }
    return () => {
      if (raf != null) window.cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
    };
  }, [updateLoaderToggleRange, updateLoaderToggleRangeFromLoader]);

  // Set global background immediately for overscroll beyond the asset page.
  useEffect(() => {
    // Use an opaque tint so overscroll can never blend back to browser white.
    const bg = 'rgb(244, 246, 255)';
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
    loaderHideAtRef.current = Date.now() + 2000;
    setLoaderScheduleKey((prev) => prev + 1);
  }, []);


  useEffect(() => {
    if (!showLoading || sessionClearPending || clearCheckInFlight) return;
    const hideAt = loaderHideAtRef.current ?? Date.now() + 2000;
    const remaining = Math.max(0, hideAt - Date.now());
    const fadeDelayMs = Math.max(0, remaining - 1000);
    const fadeTimer = fadeOut ? null : setTimeout(() => setFadeOut(true), fadeDelayMs);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, remaining);

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [fadeOut, showLoading, sessionClearPending, clearCheckInFlight, loaderScheduleKey]);

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
      setFadeOut(false);
      setLoading(true);
    };
    const readyHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { holdMs?: number; pendingAt?: number } | undefined;
      const holdMs = detail?.holdMs ?? 2000;
      const remaining = Math.max(0, holdMs);
      const nextHideAt = Date.now() + remaining;
      loaderHideAtRef.current = loaderHideAtRef.current
        ? Math.max(loaderHideAtRef.current, nextHideAt)
        : nextHideAt;
      setSessionClearPending(false);
      setFadeOut(false);
      setLoading(true);
      setLoaderScheduleKey((prev) => prev + 1);
    };
    const checkStartHandler = () => {
      setClearCheckInFlight(true);
      if (!loaderHideAtRef.current) {
        loaderHideAtRef.current = Date.now() + 2000;
      }
      setFadeOut(false);
      setLoading(true);
    };
    const checkEndHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { hasInvestments?: boolean } | undefined;
      setClearCheckInFlight(false);
      if (detail?.hasInvestments === false) {
        setLoaderScheduleKey((prev) => prev + 1);
      }
    };
    window.addEventListener('vavity:session-clearing-pending', pendingHandler as EventListener);
    window.addEventListener('vavity:session-clearing-ready', readyHandler as EventListener);
    window.addEventListener('vavity:session-clear-check-start', checkStartHandler as EventListener);
    window.addEventListener('vavity:session-clear-check-end', checkEndHandler as EventListener);
    return () => {
      window.removeEventListener('vavity:session-clearing-pending', pendingHandler as EventListener);
      window.removeEventListener('vavity:session-clearing-ready', readyHandler as EventListener);
      window.removeEventListener('vavity:session-clear-check-start', checkStartHandler as EventListener);
      window.removeEventListener('vavity:session-clear-check-end', checkEndHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!showSessionResetOverlay) {
      setSessionResetVisible(false);
      return;
    }
    setSessionResetVisible(false);
    const timer = window.setTimeout(() => setSessionResetVisible(true), 30);
    return () => window.clearTimeout(timer);
  }, [showSessionResetOverlay]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resetHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { holdMs?: number } | undefined;
      const holdMs = Math.max(5000, detail?.holdMs ?? 5000);
      const fadeOutDuration = 2000;
      setSessionResetVisible(false);
      setSessionResetActive(true);
      setSessionResetFade(false);
      setSessionResetKey((prev) => prev + 1);
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
      sessionResetTimersRef.current.push(
        window.setTimeout(() => setSessionResetFade(true), holdMs)
      );
      sessionResetTimersRef.current.push(
        window.setTimeout(() => {
          setSessionResetActive(false);
          setSessionResetFade(false);
        }, holdMs + fadeOutDuration)
      );
    };
    window.addEventListener('vavity:session-expired', resetHandler as EventListener);
    return () => {
      window.removeEventListener('vavity:session-expired', resetHandler as EventListener);
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const page = pageRef.current;
      if (!page) return;
      const content = page.querySelector('.asset-page-content--ethereum') as HTMLElement | null;
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
      const clampGap = 105;
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
    <div className="asset-page asset-page--ethereum" ref={pageRef}>
      <header className="asset-header asset-header--ethereum" />
      {showLoading && !showSessionResetOverlay && (
        <div
          className={`asset-loader-overlay asset-loader-overlay--ethereum${fadeOut ? ' asset-loader-overlay-fade' : ''}`}
        >
          <div
            ref={loaderToggleShellRef}
            className="asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--ethereum"
          >
            <div className="asset-reality-toggle-row">
              <button type="button" className="asset-reality-toggle asset-reality-toggle--loader" aria-hidden="true">
                <span className="asset-loader-toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showSessionResetOverlay && (
        <div
          className={`asset-loader-overlay asset-loader-overlay--ethereum asset-session-reset-overlay${
            showSessionResetFade ? ' asset-loader-overlay-fade' : ''
          }${sessionResetVisible ? ' is-visible' : ''}`}
        >
          <div className="asset-session-reset-modal">
            <div className="asset-session-reset-text asset-session-reset-text--title asset-metric-title--ethereum">
              Resetting Investments
            </div>
            <div className="asset-session-reset-spinner-wrap asset-profit-summary asset-profit-summary--ethereum">
              <div className="asset-session-reset-spinner" aria-hidden="true">
                <div
                  className="asset-delete-loader-spinner"
                  style={{ borderColor: 'rgba(107, 114, 168, 0.2)', borderTopColor: 'rgba(107, 114, 168, 0.5)' }}
                />
              </div>
            </div>
            <div className="asset-session-reset-text asset-session-reset-text--subtitle asset-metric-title--ethereum">
              Sign In to Save
            </div>
          </div>
        </div>
      )}

      <Ethereum key={`session-reset-${sessionResetKeyValue}`} />
      {!!email && (
        <div
          className="asset-portfolio-icon-anchor"
          style={portfolioClampY ? { transform: `translateY(${portfolioClampY}px)` } : undefined}
        >
          <Link
            href="/my-investments"
            className="asset-range-button asset-range-button--ethereum asset-portfolio-icon-button"
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
            className="asset-action-button asset-action-button--ethereum asset-action-button--invest-show asset-view-more-assets asset-view-more-assets--footer asset-footer-viewmore"
          >
            <span className="asset-view-more-assets-text">view</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">more</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">assets</span>
          </Link>
        )}
        <Link
          className="asset-action-button asset-action-button--ethereum asset-action-button--invest-show asset-footer-about-button"
          href="/about"
        >
          <span className="asset-footer-about-text">about</span>
        </Link>
      </footer>
    </div>
  );
};

export default EthereumPageClient;
