'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import TBARLoadReveal from '../../../components/Assets/Crypto/TBAR/LoadReveal';
import TBARGrid from '../../../components/Assets/Crypto/TBAR/Grid';
import AlienDcPromotionHost from '../../../components/Assets/shared/AlienDcPromotionHost';
import AssetGuestLanding from '../../../components/Assets/shared/AssetGuestLanding';
import AssetSummaryCircleLoader from '../../../components/Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../../../components/Assets/shared/useAssetSummaryCircleLoader';
import { useUser } from '../../../context/UserContext';
import { useTBAR } from '../../../components/Assets/Crypto/TBAR/useTBAR';
import { useGuestPreview } from '../../../hooks/useGuestPreview';
import {
  assetSharePath,
  publicAlienImagePath,
  publicAlienVideoPath,
} from '../../../lib/assets/assetSharePath';
import { splitTBARDaysAt, tbarThumbCount } from '../../../lib/assets/crypto/TBAR/media';
import { isPendingNavTarget, usePendingNavHref } from '../../../lib/client/navCircleLoader';
import { runAfterMaxHeightTransitionEnd } from '../../../lib/client/documentScroll';

/** Same stock launch metaposter as bitcoin share / my-character (square). */
const PREMIER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg';
const PREMIER_POSTER_LOOP =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/' +
  encodeURIComponent('LaunchLoop(guest).mp4');

/**
 * Inclusive Weekly News floor — do not bump this when a new week ships.
 * Weekly News: 10.16.26 and newer (always).
 * Other Updates: 10.09.26 and older only.
 */
const TBAR_NEWS_CUTOFF_FOLDER = '10.16.26';
const TBAR_HUB_PAGE_SIZE = 6;
/** Match Hide investments / Grid collapse. */
const TBAR_HUB_HEIGHT_MS = 2500;

function measureTBARSectionHeight(
  wrap: HTMLElement | null,
  content: HTMLElement | null
): number {
  if (!content) return 0;
  const style = wrap ? getComputedStyle(wrap) : null;
  const padY = style
    ? (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
    : 0;
  return Math.ceil(content.scrollHeight + padY);
}

type BitcoinNewsPageClientProps = {
  /** Path share id when on /bitcoin/news/{shareId}. */
  pathShareId?: string | null;
};

const BitcoinNewsPageClient: React.FC<BitcoinNewsPageClientProps> = ({
  pathShareId = null,
}) => {
  const router = useRouter();
  const { isSignedIn, authSessionLoading, shareId } = useUser();
  const { days, ready } = useTBAR();
  const hasContent = tbarThumbCount(days) > 0;
  /** Mounted in DOM (like showInvestmentsList). */
  const [otherMounted, setOtherMounted] = useState(false);
  /** max-height open (like investmentsListOpen). */
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherHeight, setOtherHeight] = useState(0);
  const { news: newsDays, other: otherDays } = useMemo(
    () => splitTBARDaysAt(days, TBAR_NEWS_CUTOFF_FOLDER),
    [days]
  );
  const newsHasContent = tbarThumbCount(newsDays) > 0;
  const otherHasContent = tbarThumbCount(otherDays) > 0;
  const guestPreview = useGuestPreview();
  const showGuest = !authSessionLoading && (guestPreview || !isSignedIn);
  const allowSignedIn = !authSessionLoading && isSignedIn && !guestPreview;
  /** Signed-in chrome during auth too — never blank the page while session resolves. */
  const showSignedInShell = !guestPreview && (authSessionLoading || isSignedIn);
  const pageLoader = useAssetSummaryCircleLoader();
  usePendingNavHref();
  const bitcoinBadgeHref = assetSharePath('/bitcoin', shareId);
  const bitcoinBadgeLoading = isPendingNavTarget(bitcoinBadgeHref);
  // Optimistic personal metaposter on shared news URLs (same as /bitcoin/{shareId}).
  const [sharePosterReady, setSharePosterReady] = useState(() => Boolean(pathShareId));
  const [shareLoopReady, setShareLoopReady] = useState(() => Boolean(pathShareId));
  const [shareMediaBust, setShareMediaBust] = useState(() => Date.now());
  const sectionWrapRef = useRef<HTMLDivElement>(null);
  const sectionContentRef = useRef<HTMLDivElement>(null);
  const otherContentRef = useRef<HTMLDivElement>(null);
  const otherHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shellPx, setShellPx] = useState(0);
  const [shellMode, setShellMode] = useState<'auto' | 'snap' | 'animate'>('auto');
  /** Expand as soon as the signed-in shell mounts; grid reveals when TBAR is ready. */
  const sectionShouldExpand = showSignedInShell && (!ready || hasContent);
  const pendingExpandDismissRef = useRef<(() => void) | null>(null);

  const measure = useCallback(
    () => measureTBARSectionHeight(sectionWrapRef.current, sectionContentRef.current),
    []
  );

  /** Bare /bitcoin/news → /bitcoin/news/{shareId} when signed in. */
  useEffect(() => {
    if (authSessionLoading || pathShareId) return;
    if (allowSignedIn && shareId) {
      router.replace(assetSharePath('/bitcoin/news', shareId));
    }
  }, [authSessionLoading, pathShareId, allowSignedIn, shareId, router]);

  useEffect(() => {
    if (!showGuest || !pathShareId) {
      setSharePosterReady(false);
      setShareLoopReady(false);
      return;
    }
    let cancelled = false;
    const bust = Date.now();
    setShareMediaBust(bust);
    // Always prefer character composed/metaloop for share URLs — never fall back to
    // stock LaunchPoster just because Amplify HEAD flaked.
    setSharePosterReady(true);
    setShareLoopReady(true);
    const loopUrl = publicAlienVideoPath({
      shareId: pathShareId,
      asset: 'bitcoin',
      kind: 'metaloop',
      cacheBust: bust,
    });
    void (async () => {
      try {
        const loopHead = await fetch(loopUrl, { method: 'HEAD', cache: 'no-store' });
        if (cancelled) return;
        setShareLoopReady(loopHead.ok);
      } catch {
        if (!cancelled) setShareLoopReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showGuest, pathShareId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!showSignedInShell && !showGuest) return;
    const bg = 'rgb(255, 247, 236)';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
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
  }, [showSignedInShell, showGuest]);

  useEffect(() => {
    if (!showSignedInShell) {
      pageLoader.dismissImmediately();
      return;
    }
    if (!ready) pageLoader.show();
  }, [showSignedInShell, ready, pageLoader.show, pageLoader.dismissImmediately]);

  /** Mount/reload only: outer section height-down. Show/hide more use their own panels. */
  useLayoutEffect(() => {
    if (!sectionShouldExpand) {
      setShellPx(0);
      setShellMode('snap');
      return;
    }
    if (!sectionContentRef.current) return;
    setShellMode('snap');
    setShellPx(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setShellMode('animate');
        setShellPx(measure());
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [sectionShouldExpand, measure]);

  /** Remeasure when Weekly News content arrives mid height-down. */
  useLayoutEffect(() => {
    if (!sectionShouldExpand || !ready || !hasContent) return;
    if (shellMode === 'auto') return;
    setShellPx(Math.max(measure(), 1));
  }, [sectionShouldExpand, ready, hasContent, newsHasContent, measure, shellMode]);

  useEffect(() => {
    if (!sectionShouldExpand || shellMode !== 'animate' || shellPx <= 0) return;
    pendingExpandDismissRef.current?.();
    pendingExpandDismissRef.current = runAfterMaxHeightTransitionEnd(
      sectionWrapRef.current,
      () => {
        pendingExpandDismissRef.current = null;
        setShellMode('auto');
        pageLoader.dismissOnSummaryExpandComplete();
      },
      { timeoutMs: TBAR_HUB_HEIGHT_MS + 500 }
    );
    return () => {
      pendingExpandDismissRef.current?.();
      pendingExpandDismissRef.current = null;
    };
  }, [sectionShouldExpand, shellMode, shellPx, pageLoader.dismissOnSummaryExpandComplete]);

  /** Other Updates panel — same measure pattern as investments list. */
  useEffect(() => {
    if (!otherMounted) {
      setOtherHeight(0);
      return;
    }
    const node = otherContentRef.current;
    if (!node) return;
    if (typeof ResizeObserver === 'undefined') {
      setOtherHeight(node.scrollHeight);
      return;
    }
    let raf = 0;
    const sync = () => {
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setOtherHeight((prev) => (prev === next ? prev : next));
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [otherMounted, otherOpen, otherDays]);

  useEffect(() => {
    return () => {
      if (otherHideTimerRef.current) clearTimeout(otherHideTimerRef.current);
    };
  }, []);

  const toggleOtherUpdates = () => {
    if (otherOpen) {
      // Hide investments: close to 0px first; unmount after transition.
      setOtherOpen(false);
      if (otherHideTimerRef.current) clearTimeout(otherHideTimerRef.current);
      otherHideTimerRef.current = setTimeout(() => {
        setOtherMounted(false);
        otherHideTimerRef.current = null;
      }, TBAR_HUB_HEIGHT_MS);
      return;
    }
    if (otherHideTimerRef.current) {
      clearTimeout(otherHideTimerRef.current);
      otherHideTimerRef.current = null;
    }
    setOtherMounted(true);
    window.setTimeout(() => setOtherOpen(true), 0);
  };

  if (showGuest) {
    const useShareLoop = Boolean(pathShareId && shareLoopReady);
    const guestPosterSrc = pathShareId
      ? publicAlienImagePath({
          shareId: pathShareId,
          asset: 'bitcoin',
          kind: 'composed',
          cacheBust: shareMediaBust,
        })
      : PREMIER_POSTER;
    const guestLoopSrc = pathShareId
      ? useShareLoop
        ? publicAlienVideoPath({
            shareId: pathShareId,
            asset: 'bitcoin',
            kind: 'metaloop',
            cacheBust: shareMediaBust,
          })
        : undefined
      : PREMIER_POSTER_LOOP;
    return (
      <div className="asset-page asset-page--bitcoin">
        <header className="asset-header asset-header--bitcoin" />
        <AssetGuestLanding
          cssModifier="bitcoin"
          ticker="BTC"
          title="Bitcoin"
          posterSrc={guestPosterSrc}
          posterLoopSrc={guestLoopSrc}
          posterWidth={2000}
          posterHeight={2000}
          posterAlt="Bitcoin Alien Race launch poster"
          smallIcon
          showTrailer={!pathShareId}
          hideWordmark
          hideSigninPrompt
          possessiveMission={Boolean(pathShareId)}
        />
      </div>
    );
  }

  if (!showSignedInShell) return null;

  const sectionMaxHeightStyle = !sectionShouldExpand
    ? '0px'
    : shellMode === 'auto'
      ? 'none'
      : `${shellPx}px`;

  const otherMaxHeight = otherOpen ? `${otherHeight}px` : '0px';

  return (
    <>
      <div className="asset-page asset-page--bitcoin bitcoin-alien-race-page">
        <div className="bitcoin-alien-race-page-inner">
          <div className="bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--title asset-guest-mount-slide">
            <div className="asset-bitcoin-season-teaser-badge">
              <Link
                href={bitcoinBadgeHref}
                className={`myinv-asset-home-card home-asset-bitcoin bitcoin-alien-race-asset-card${
                  bitcoinBadgeLoading ? ' is-nav-loading' : ''
                }`}
                aria-label="Bitcoin"
                aria-busy={bitcoinBadgeLoading || undefined}
              >
                <div className="home-assets-cell home-assets-asset">
                  <span className="home-asset-label home-asset-label-bitcoin">
                    <span
                      className={`home-asset-name asset-action-button asset-action-button--bitcoin asset-action-button--home-asset-chip${
                        bitcoinBadgeLoading ? ' is-nav-loading-chip' : ''
                      }`}
                    >
                      Bitcoin
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          </div>
          <div className="bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--updates asset-guest-mount-slide">
            <div
              ref={sectionWrapRef}
              className="bitcoin-tbar-wrap"
              style={{
                maxHeight: sectionMaxHeightStyle,
                overflow: shellMode === 'auto' ? 'visible' : 'hidden',
                transition:
                  shellMode === 'animate'
                    ? `max-height ${TBAR_HUB_HEIGHT_MS}ms ease`
                    : 'none',
              }}
            >
              <div ref={sectionContentRef} className="bitcoin-tbar-height">
                <div className="tbar-weekly-news-inner">
                  <TBARLoadReveal ready={ready} hasContent={newsHasContent} theme="bitcoin">
                    <TBARGrid days={newsDays} theme="bitcoin" pageSize={TBAR_HUB_PAGE_SIZE} />
                  </TBARLoadReveal>
                </div>
                {ready && otherHasContent ? (
                  <div className="tbar-other-updates">
                    <div className="tbar-other-updates-inner">
                      <h2 className="asset-bitcoin-season-teaser-season-title">Other Updates</h2>
                      <div className="home-assets-show-more-wrap tbar-more">
                        <button
                          type="button"
                          className="auth-submit asset-range-button asset-range-button--bitcoin home-assets-show-more-button"
                          onClick={toggleOtherUpdates}
                        >
                          {otherOpen ? 'Hide Updates' : 'Show Updates'}
                        </button>
                      </div>
                      {otherMounted ? (
                        <div
                          className="tbar-other-updates-shell"
                          style={{
                            maxHeight: otherMaxHeight,
                            overflow: 'hidden',
                            transition: `max-height ${TBAR_HUB_HEIGHT_MS}ms ease`,
                          }}
                        >
                          <div ref={otherContentRef}>
                            <TBARGrid
                              days={otherDays}
                              theme="bitcoin"
                              pageSize={TBAR_HUB_PAGE_SIZE}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <footer className="asset-footer">
            <Link
              className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-show asset-footer-about-button"
              href="/about"
            >
              <span className="asset-footer-about-text">about</span>
            </Link>
          </footer>
        </div>
      </div>
      <AssetSummaryCircleLoader
        cssModifier="bitcoin"
        mounted={pageLoader.mounted}
        visible={pageLoader.visible}
        fadingOut={pageLoader.fadingOut}
      />
      <AlienDcPromotionHost
        enabled={!guestPreview && isSignedIn && !authSessionLoading}
        assetName="Bitcoin"
      />
    </>
  );
};

export default BitcoinNewsPageClient;
