'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Bitcoin from './bitcoin';
import '../../../../app/css/Home.css';

const BitcoinPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [extraLoaderHoldMs, setExtraLoaderHoldMs] = useState(0);

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
    if (!showLoading) return;
    const fadeTimer = fadeOut ? null : setTimeout(() => setFadeOut(true), 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
      setExtraLoaderHoldMs(0);
    }, 2000 + extraLoaderHoldMs);

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [extraLoaderHoldMs, fadeOut, showLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const holdUntil = (window as any).__vavitySessionClearingHoldUntil;
    if (typeof holdUntil === 'number') {
      const remaining = Math.max(0, holdUntil - Date.now());
      if (remaining > 0) {
        setExtraLoaderHoldMs(remaining);
        setFadeOut(false);
        setLoading(true);
      }
    }
    const handler = () => {
      const until = (window as any).__vavitySessionClearingHoldUntil;
      const remaining = typeof until === 'number' ? Math.max(0, until - Date.now()) : 2000;
      setExtraLoaderHoldMs(remaining || 2000);
      setFadeOut(false);
      setLoading(true);
    };
    window.addEventListener('vavity:session-clearing', handler as EventListener);
    return () => window.removeEventListener('vavity:session-clearing', handler as EventListener);
  }, []);

  return (
    <div className="asset-page asset-page--bitcoin">
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

      <footer className="asset-footer">
        <Link className="asset-footer-about" href="/about">
          ( About )
        </Link>
      </footer>
    </div>
  );
};

export default BitcoinPageClient;
