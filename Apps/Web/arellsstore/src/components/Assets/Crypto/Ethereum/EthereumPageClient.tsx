'use client';

import { CRYPTO_ASSET_BY_ID } from '../../../../lib/assets/cryptoAssetRegistry';

const ASSET = CRYPTO_ASSET_BY_ID.ethereum;

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SiteSocialFooter from '../../../SiteSocialFooter';
import AssetFooterPortfolioButton from '../../shared/AssetFooterPortfolioButton';
import Ethereum from './ethereum';
import { useUser } from '../../../../context/UserContext';

const EthereumPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const { email, isSignedIn, authSessionLoading } = useUser();
  const isGuest = !authSessionLoading && !email && !isSignedIn;
  const pageRef = useRef<HTMLDivElement>(null);
  const loaderToggleShellRef = useRef<HTMLDivElement | null>(null);

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
    if (authSessionLoading) return;

    if (!email) {
      setLoading(false);
      setFadeOut(false);
      return;
    }

    setLoading(true);
    setFadeOut(false);
    const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [authSessionLoading, email]);

  return (
    <div className={`asset-page asset-page--${ASSET.cssModifier}`} ref={pageRef}>
      <header className={`asset-header asset-header--${ASSET.cssModifier}`} />
      {showLoading && !!email && (
        <div
          className={`asset-loader-overlay asset-loader-overlay--${ASSET.cssModifier}${fadeOut ? ' asset-loader-overlay-fade' : ''}`}
        >
          <div
            ref={loaderToggleShellRef}
            className={`asset-reality-toggle-shell asset-reality-toggle-shell--loader asset-loader-toggle-shell asset-loader-toggle-shell--${ASSET.cssModifier}`}
          >
            <div className="asset-reality-toggle-row">
              <button type="button" className="asset-reality-toggle asset-reality-toggle--loader" aria-hidden="true">
                <span className="asset-loader-toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Ethereum />

      {!authSessionLoading && !isGuest && (
        <footer className="asset-footer">
          {!!email && <AssetFooterPortfolioButton cssModifier={ASSET.cssModifier} />}
          <Link
            href="/"
            className={`asset-action-button asset-action-button--${ASSET.cssModifier} asset-action-button--invest-show asset-view-more-assets asset-view-more-assets--footer asset-footer-viewmore`}
          >
            <span className="asset-view-more-assets-text">view</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">more</span>
            <span className="asset-footer-about-divider" aria-hidden="true" />
            <span className="asset-view-more-assets-text">assets</span>
          </Link>
          <Link
            className={`asset-action-button asset-action-button--${ASSET.cssModifier} asset-action-button--invest-show asset-footer-about-button`}
            href="/about"
          >
            <span className="asset-footer-about-text">about</span>
          </Link>
        </footer>
      )}
      {!authSessionLoading && !isGuest && <SiteSocialFooter />}
    </div>
  );
};

export default EthereumPageClient;
