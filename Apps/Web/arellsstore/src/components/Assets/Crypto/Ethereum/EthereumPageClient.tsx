'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SiteSocialFooter from '../../../SiteSocialFooter';
import Ethereum from './ethereum';
import { useUser } from '../../../../context/UserContext';

/** Session reset overlay timeline from fade-in start: fade in, hold, fade out. */
const SESSION_RESET_MODAL_FADE_IN_MS = 2000;
const SESSION_RESET_MODAL_HOLD_MS = 5000;
const SESSION_RESET_MODAL_FADE_OUT_MS = 2000;

const EthereumPageClient: React.FC = () => {
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
  /** Survives `<Ethereum key={sessionResetKey} />` remounts so session-clear-on-mount runs once per page visit. */
  const sessionMountClearGuardRef = useRef(false);
  const sessionResetTimersRef = useRef<number[]>([]);
  /** True from `vavity:session-expired` until reset overlay fully dismissed (gates collapse-started listener). */
  const sessionResetCycleActiveRef = useRef(false);
  const sessionResetGenerationRef = useRef(0);
  const sessionResetFallbackTimerRef = useRef<number | null>(null);
  /** Prevents double clear of the fallback timer if collapse-started fires twice for the same reset generation. */
  const sessionResetCollapseScheduledGenRef = useRef(0);
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

  const clearSessionResetFallbackTimer = useCallback(() => {
    if (sessionResetFallbackTimerRef.current != null) {
      window.clearTimeout(sessionResetFallbackTimerRef.current);
      sessionResetFallbackTimerRef.current = null;
    }
  }, []);

  const completeSessionResetDismiss = useCallback(() => {
    clearSessionResetFallbackTimer();
    setSessionResetActive(false);
    setSessionResetFooterHidden(false);
    setSessionResetFade(false);
    sessionResetCycleActiveRef.current = false;
  }, [clearSessionResetFallbackTimer]);

  useEffect(() => {
    if (!sessionResetVisible || !sessionResetCycleActiveRef.current || forceSessionResetPreview) return;
    const generation = sessionResetGenerationRef.current;
    const fadeOutStartDelay =
      SESSION_RESET_MODAL_FADE_IN_MS + SESSION_RESET_MODAL_HOLD_MS;
    const dismissDelay = fadeOutStartDelay + SESSION_RESET_MODAL_FADE_OUT_MS;
    const fadeOutTimer = window.setTimeout(() => {
      if (generation !== sessionResetGenerationRef.current) return;
      setSessionResetFade(true);
    }, fadeOutStartDelay);
    const dismissTimer = window.setTimeout(() => {
      if (generation !== sessionResetGenerationRef.current) return;
      completeSessionResetDismiss();
    }, dismissDelay);
    return () => {
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [sessionResetVisible, forceSessionResetPreview, completeSessionResetDismiss]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const footerFadeDuration = 500;
    const SESSION_RESET_FALLBACK_MS = 30_000;

    const resetHandler = (_event: Event) => {
      sessionResetGenerationRef.current += 1;
      const generation = sessionResetGenerationRef.current;
      sessionResetCycleActiveRef.current = true;
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
      clearSessionResetFallbackTimer();
      setSessionResetFooterHidden(true);
      setSessionResetVisible(false);
      setSessionResetFade(false);
      sessionResetTimersRef.current.push(
        window.setTimeout(() => {
          if (generation !== sessionResetGenerationRef.current) return;
          setSessionResetActive(true);
          setSessionResetKey((prev) => prev + 1);
        }, footerFadeDuration)
      );
      sessionResetFallbackTimerRef.current = window.setTimeout(() => {
        sessionResetFallbackTimerRef.current = null;
        if (generation !== sessionResetGenerationRef.current) return;
        if (!sessionResetCycleActiveRef.current) return;
        setSessionResetFade(true);
        const dismissTimer = window.setTimeout(() => {
          if (generation !== sessionResetGenerationRef.current) return;
          completeSessionResetDismiss();
        }, SESSION_RESET_MODAL_FADE_OUT_MS);
        sessionResetTimersRef.current.push(dismissTimer);
      }, SESSION_RESET_FALLBACK_MS);
    };

    const emptyActionsCollapseHandler = () => {
      if (!sessionResetCycleActiveRef.current) return;
      const generation = sessionResetGenerationRef.current;
      if (sessionResetCollapseScheduledGenRef.current === generation) return;
      sessionResetCollapseScheduledGenRef.current = generation;
      clearSessionResetFallbackTimer();
    };

    window.addEventListener('vavity:session-expired', resetHandler as EventListener);
    window.addEventListener(
      'vavity:session-reset-empty-actions-collapse-started',
      emptyActionsCollapseHandler as EventListener
    );
    return () => {
      window.removeEventListener('vavity:session-expired', resetHandler as EventListener);
      window.removeEventListener(
        'vavity:session-reset-empty-actions-collapse-started',
        emptyActionsCollapseHandler as EventListener
      );
      sessionResetTimersRef.current.forEach((timer) => clearTimeout(timer));
      sessionResetTimersRef.current = [];
      clearSessionResetFallbackTimer();
    };
  }, [clearSessionResetFallbackTimer, completeSessionResetDismiss]);

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

      <Ethereum key={`session-reset-${sessionResetKeyValue}`} sessionMountClearGuardRef={sessionMountClearGuardRef} />

      <footer
        className={`asset-footer${sessionResetFooterHidden ? ' asset-footer--session-reset-hidden' : ''}`}
        aria-hidden={sessionResetFooterHidden ? true : undefined}
      >
        {!!email && (
          <Link
            href="/my-investments"
            className="asset-action-button asset-action-button--ethereum asset-action-button--invest-show asset-footer-about-button"
          >
            <span className="asset-footer-about-text">view my portfolio</span>
          </Link>
        )}
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
        <Link
          className="asset-action-button asset-action-button--ethereum asset-action-button--invest-show asset-footer-about-button"
          href="/about"
        >
          <span className="asset-footer-about-text">about</span>
        </Link>
      </footer>
      <SiteSocialFooter />
    </div>
  );
};

export default EthereumPageClient;
