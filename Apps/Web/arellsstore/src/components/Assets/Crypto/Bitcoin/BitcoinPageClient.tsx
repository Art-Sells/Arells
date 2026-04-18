'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Bitcoin from './bitcoin';
import { useUser } from '../../../../context/UserContext';

const BitcoinPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [sessionResetActive, setSessionResetActive] = useState(false);
  const [sessionResetFooterHidden, setSessionResetFooterHidden] = useState(false);
  const [sessionResetFade, setSessionResetFade] = useState(false);
  const [sessionResetKey, setSessionResetKey] = useState(0);
  const [sessionResetVisible, setSessionResetVisible] = useState(false);
  const { email } = useUser();
  const pageRef = useRef<HTMLDivElement>(null);
  const loaderToggleShellRef = useRef<HTMLDivElement | null>(null);
  /** Survives `<Bitcoin key={sessionResetKey} />` remounts so session-clear-on-mount runs once per page visit. */
  const sessionMountClearGuardRef = useRef(false);
  const sessionResetTimersRef = useRef<number[]>([]);
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
    const footerFadeDuration = 500;
    const resetHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { holdMs?: number } | undefined;
      const holdMs = Math.max(5000, detail?.holdMs ?? 5000);
      const fadeOutDuration = 2000;
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
      setSessionResetFooterHidden(true);
      setSessionResetVisible(false);
      setSessionResetFade(false);
      sessionResetTimersRef.current.push(
        window.setTimeout(() => {
          setSessionResetActive(true);
          setSessionResetKey((prev) => prev + 1);
        }, footerFadeDuration)
      );
      sessionResetTimersRef.current.push(
        window.setTimeout(() => setSessionResetFade(true), footerFadeDuration + holdMs)
      );
      sessionResetTimersRef.current.push(
        window.setTimeout(() => {
          setSessionResetActive(false);
          setSessionResetFooterHidden(false);
          setSessionResetFade(false);
        }, footerFadeDuration + holdMs + fadeOutDuration)
      );
    };
    window.addEventListener('vavity:session-expired', resetHandler as EventListener);
    return () => {
      window.removeEventListener('vavity:session-expired', resetHandler as EventListener);
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
    };
  }, []);

  return (
    <div className="asset-page asset-page--bitcoin" ref={pageRef}>
      <header className="asset-header asset-header--bitcoin" />
      {showLoading && !showSessionResetOverlay && (
        <div
          className={`asset-loader-overlay asset-loader-overlay--bitcoin${fadeOut ? ' asset-loader-overlay-fade' : ''}`}
        >
          <div
            ref={loaderToggleShellRef}
            className="asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--bitcoin"
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
          className={`asset-loader-overlay asset-loader-overlay--bitcoin asset-session-reset-overlay${
            showSessionResetFade ? ' asset-loader-overlay-fade' : ''
          }${sessionResetVisible ? ' is-visible' : ''}`}
        >
          <div className="asset-session-reset-modal">
            <div className="asset-session-reset-text asset-session-reset-text--title asset-metric-title--bitcoin">
              Resetting Investments
            </div>
            <div className="asset-session-reset-spinner-wrap asset-profit-summary asset-profit-summary--bitcoin">
              <div className="asset-session-reset-spinner" aria-hidden="true">
                <div
                  className="asset-delete-loader-spinner"
                  style={{ borderColor: 'rgba(248, 141, 0, 0.2)', borderTopColor: 'rgba(248, 141, 0, 0.5)' }}
                />
              </div>
            </div>
            <div className="asset-session-reset-text asset-session-reset-text--subtitle asset-metric-title--bitcoin">
              Sign In to Save
            </div>
          </div>
        </div>
      )}

      <Bitcoin key={`session-reset-${sessionResetKeyValue}`} sessionMountClearGuardRef={sessionMountClearGuardRef} />

      <footer
        className={`asset-footer${sessionResetFooterHidden ? ' asset-footer--session-reset-hidden' : ''}`}
        aria-hidden={sessionResetFooterHidden ? true : undefined}
      >
        {!!email && (
          <Link
            href="/my-investments"
            className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-show asset-footer-about-button"
          >
            <span className="asset-footer-about-text">view my portfolio</span>
          </Link>
        )}
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
