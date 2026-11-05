'use client';

import { CRYPTO_ASSET_BY_ID } from '../../../../lib/assets/cryptoAssetRegistry';

const ASSET = CRYPTO_ASSET_BY_ID.bitcoin;

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AssetFooterPortfolioButton from '../../shared/AssetFooterPortfolioButton';
import AssetQuestionsSupport from '../../shared/AssetQuestionsSupport';
import AssetFooterHold from '../../shared/AssetFooterHold';
import AlienDcPromotionHost from '../../shared/AlienDcPromotionHost';
import Bitcoin from './bitcoin';
import { useUser } from '../../../../context/UserContext';
import { guestPreviewFromLocation, useGuestPreview } from '../../../../hooks/useGuestPreview';
import { assetSharePath } from '../../../../lib/assets/assetSharePath';

/** Keep Stripe's return on the share URL so the Add Photo modal can open. */
function sharePathKeepingCheckout(shareId: string): string {
  const target = assetSharePath('/bitcoin', shareId);
  if (typeof window === 'undefined') return target;
  const current = new URLSearchParams(window.location.search);
  const keep = new URLSearchParams();
  const cg = current.get('cg_checkout');
  const sessionId = current.get('session_id');
  if (cg) keep.set('cg_checkout', cg);
  if (sessionId) keep.set('session_id', sessionId);
  const q = keep.toString();
  return q ? `${target}?${q}` : target;
}

const BitcoinPageClient: React.FC = () => {
  const { email, isSignedIn, authSessionLoading, shareId, refreshAuthSession } = useUser();
  const guestPreview = useGuestPreview();
  const isGuest = guestPreview || (!authSessionLoading && !email && !isSignedIn);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authSessionLoading) return;
    const path = (pathname || '').replace(/\/+$/, '') || '/';
    if (path !== '/bitcoin') return;
    if (guestPreview || guestPreviewFromLocation()) return;

    if (isSignedIn && shareId) {
      const target = sharePathKeepingCheckout(shareId);
      const here = `${path}${window.location.search || ''}`;
      if (target !== here && target.split('?')[0] !== path) {
        router.replace(target);
      }
      return;
    }

    if (!isSignedIn) return;

    let cancelled = false;
    void (async () => {
      await refreshAuthSession();
      if (cancelled) return;
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        const id =
          typeof data?.shareId === 'string' ? data.shareId.trim().toLowerCase() : '';
        if (!cancelled && id) {
          router.replace(sharePathKeepingCheckout(id));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    authSessionLoading,
    guestPreview,
    isSignedIn,
    pathname,
    refreshAuthSession,
    router,
    shareId,
  ]);

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

  return (
    <div className={`asset-page asset-page--${ASSET.cssModifier}`}>
      <header className={`asset-header asset-header--${ASSET.cssModifier}`} />
      <AssetFooterHold />
      <Bitcoin />

      {!isGuest && (
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
      {!isGuest && <AssetQuestionsSupport cssModifier={ASSET.cssModifier} />}
      <AlienDcPromotionHost
        enabled={!isGuest && !authSessionLoading}
        assetName={ASSET.displayName}
      />
    </div>
  );
};

export default BitcoinPageClient;
