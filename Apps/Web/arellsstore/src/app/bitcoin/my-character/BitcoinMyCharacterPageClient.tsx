'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import AlienMetaPreview from '../../../components/Assets/shared/AlienMetaPreview';
import AssetGuestLanding from '../../../components/Assets/shared/AssetGuestLanding';
import AssetQuestionsSupport from '../../../components/Assets/shared/AssetQuestionsSupport';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { useUser } from '../../../context/UserContext';
import { useGuestPreview } from '../../../hooks/useGuestPreview';
import {
  ALIEN_COMPOSE_DONE_EVENT,
  assetSharePath,
  publicAlienImagePath,
  publicAlienVideoPath,
} from '../../../lib/assets/assetSharePath';
import { runAfterMaxHeightTransitionEnd } from '../../../lib/client/documentScroll';

const PREMIER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(guest).jpg';
const PREMIER_POSTER_LOOP =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/' +
  encodeURIComponent('LaunchLoop(guest).mp4');

/** Match Bitcoin news / TBAR hub height-down. */
const MY_CHARACTER_HEIGHT_MS = 2500;

const THEME_VARS = [
  '--asset-line-color',
  '--asset-hover-dot-color',
  '--asset-range-button-label-color',
  '--asset-slogan-color',
  '--myinv-accent-color',
] as const;

function themeStyleFrom(el: HTMLElement | null): React.CSSProperties {
  if (!el || typeof window === 'undefined') return {};
  const computed = window.getComputedStyle(el);
  const style: Record<string, string> = {};
  for (const name of THEME_VARS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) style[name] = value;
  }
  return style as React.CSSProperties;
}

/** Collapsed → measured max-height expand on `open` (page-load height-down). */
function HeightDownSection({
  open,
  className,
  children,
}: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(0);
  const [mode, setMode] = useState<'snap' | 'animate' | 'auto'>('snap');
  const modeRef = useRef(mode);
  const pendingRef = useRef<(() => void) | null>(null);

  modeRef.current = mode;

  const measure = useCallback(() => {
    const node = contentRef.current;
    return node ? Math.ceil(node.scrollHeight) : 0;
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPx(0);
      setMode('snap');
      return;
    }
    if (!contentRef.current) return;
    setMode('snap');
    setPx(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setMode('animate');
        setPx(Math.max(measure(), 1));
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [open, measure]);

  /** Media/loader swaps grow content mid-animation — keep max-height >= real height so the final `auto` handoff doesn't pop. */
  useEffect(() => {
    if (!open) return;
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (modeRef.current === 'auto' || modeRef.current === 'snap') return;
      const next = Math.max(measure(), 1);
      setPx((prev) => (next > prev ? next : prev));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [open, measure]);

  useEffect(() => {
    if (!open || mode !== 'animate') return;
    pendingRef.current?.();
    pendingRef.current = runAfterMaxHeightTransitionEnd(
      wrapRef.current,
      () => {
        pendingRef.current = null;
        // Final sync before unlocking so auto never reveals a taller clipped tail.
        setPx(Math.max(measure(), 1));
        setMode('auto');
      },
      { timeoutMs: MY_CHARACTER_HEIGHT_MS + 500 }
    );
    return () => {
      pendingRef.current?.();
      pendingRef.current = null;
    };
  }, [open, mode, measure]);

  const maxHeight = !open ? '0px' : mode === 'auto' ? 'none' : `${px}px`;

  return (
    <div
      ref={wrapRef}
      className={`bitcoin-my-character-height-down${className ? ` ${className}` : ''}`}
      style={{
        maxHeight,
        overflow: mode === 'auto' ? 'visible' : 'hidden',
        transition:
          mode === 'animate' ? `max-height ${MY_CHARACTER_HEIGHT_MS}ms ease` : 'none',
      }}
    >
      <div ref={contentRef} className="bitcoin-my-character-height-down-inner">
        {children}
      </div>
    </div>
  );
}

type BitcoinMyCharacterPageClientProps = {
  /** Path share id when on /bitcoin/my-character/{shareId}. */
  pathShareId?: string | null;
};

const BitcoinMyCharacterPageClient: React.FC<BitcoinMyCharacterPageClientProps> = ({
  pathShareId = null,
}) => {
  const router = useRouter();
  const { email, shareId, isSignedIn, authSessionLoading } = useUser();
  const { isCreatingAsset, blockIfCreating, startCreate } = useAlienCharacterCreate();
  const guestPreview = useGuestPreview();
  const allowSignedIn = !authSessionLoading && isSignedIn && !guestPreview;
  const showGuest = !authSessionLoading && (guestPreview || !isSignedIn);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const updateBtnRef = useRef<HTMLButtonElement | null>(null);

  const resolvedShareId = (pathShareId || shareId || '').trim().toLowerCase() || null;
  const isOwner =
    Boolean(allowSignedIn && shareId && resolvedShareId && shareId.toLowerCase() === resolvedShareId);

  const [metaUrl, setMetaUrl] = useState<string | null>(null);
  const [metaLoopUrl, setMetaLoopUrl] = useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitLoaded, setPortraitLoaded] = useState(false);
  const [portraitLoaderGone, setPortraitLoaderGone] = useState(false);
  const portraitImgRef = useRef<HTMLImageElement | null>(null);
  const busy = isCreatingAsset('bitcoin');

  useEffect(() => {
    setPortraitLoaded(false);
    setPortraitLoaderGone(false);
  }, [portraitUrl]);

  useEffect(() => {
    const img = portraitImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setPortraitLoaded(true);
  }, [portraitUrl]);

  useEffect(() => {
    if (!portraitLoaded) {
      setPortraitLoaderGone(false);
      return;
    }
    const t = window.setTimeout(() => setPortraitLoaderGone(true), 900);
    return () => window.clearTimeout(t);
  }, [portraitLoaded]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!allowSignedIn && !showGuest && !resolvedShareId) return;
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
  }, [allowSignedIn, showGuest, resolvedShareId]);

  /** Guests on /bitcoin/my-character/{shareId} → guest bitcoin share page. */
  useEffect(() => {
    if (authSessionLoading || !pathShareId || !showGuest) return;
    router.replace(assetSharePath('/bitcoin', pathShareId));
  }, [authSessionLoading, pathShareId, showGuest, router]);

  /** Bare /bitcoin/my-character → own share path when signed in. */
  useEffect(() => {
    if (authSessionLoading || pathShareId) return;
    if (allowSignedIn && shareId) {
      router.replace(`/bitcoin/my-character/${shareId}`);
    }
  }, [authSessionLoading, pathShareId, allowSignedIn, shareId, router]);

  const loadPublicMedia = useCallback(async (id: string, cacheBust?: number) => {
    const bust = cacheBust ?? Date.now();
    const nextMeta = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'composed',
      cacheBust: bust,
    });
    const nextLoop = publicAlienVideoPath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'metaloop',
      cacheBust: bust,
    });
    const nextPortrait = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'portrait',
      cacheBust: bust,
    });

    try {
      const [metaHead, loopHead, portraitHead] = await Promise.all([
        fetch(nextMeta, { method: 'HEAD', cache: 'no-store' }),
        fetch(nextLoop, { method: 'HEAD', cache: 'no-store' }),
        fetch(nextPortrait, { method: 'HEAD', cache: 'no-store' }),
      ]);
      setMetaUrl(metaHead.ok ? nextMeta : null);
      setMetaLoopUrl(metaHead.ok && loopHead.ok ? nextLoop : null);
      setPortraitUrl(portraitHead.ok ? nextPortrait : null);
      if (!metaHead.ok && !portraitHead.ok) {
        router.replace(assetSharePath('/bitcoin', id));
      }
    } catch {
      setMetaUrl(null);
      setMetaLoopUrl(null);
      setPortraitUrl(null);
    }
  }, [router]);

  useEffect(() => {
    if (authSessionLoading) return;
    if (showGuest && pathShareId) return;
    if (!resolvedShareId) return;
    setMetaUrl(null);
    setMetaLoopUrl(null);
    setPortraitUrl(null);
    void loadPublicMedia(resolvedShareId);
  }, [authSessionLoading, showGuest, pathShareId, resolvedShareId, loadPublicMedia]);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string }>).detail;
      if (detail?.assetId !== 'bitcoin' || !resolvedShareId) return;
      void loadPublicMedia(resolvedShareId, Date.now());
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
  }, [resolvedShareId, loadPublicMedia]);

  const openPicker = useCallback(() => {
    if (!isOwner || !email || busy) return;
    const style = themeStyleFrom(updateBtnRef.current);
    if (blockIfCreating(style)) return;
    const input = fileInputRef.current;
    if (!input) return;
    try {
      input.value = '';
      input.type = 'text';
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
    } catch {
      input.value = '';
    }
    input.click();
  }, [isOwner, email, busy, blockIfCreating]);

  const onFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !email || !resolvedShareId) {
        event.target.value = '';
        return;
      }
      event.target.value = '';
      startCreate({
        email,
        assetId: 'bitcoin',
        assetName: 'Bitcoin',
        file,
        shareId: resolvedShareId,
        overlayStyle: themeStyleFrom(updateBtnRef.current),
      });
    },
    [email, resolvedShareId, startCreate]
  );

  /** Guest + share id: redirecting to /bitcoin/{shareId}. */
  if (!authSessionLoading && pathShareId && showGuest) {
    return (
      <div
        className="asset-page asset-page--bitcoin bitcoin-alien-race-page bitcoin-my-character-page bitcoin-my-character-page--booting"
        role="status"
        aria-label="Loading"
      >
        <div className="bitcoin-my-character-boot-loader" aria-hidden="true">
          <div className="asset-alien-meta-preview-loader-ring" />
        </div>
      </div>
    );
  }

  if (!authSessionLoading && !pathShareId && showGuest) {
    return (
      <div className="asset-page asset-page--bitcoin">
        <header className="asset-header asset-header--bitcoin" />
        <AssetGuestLanding
          cssModifier="bitcoin"
          ticker="BTC"
          title="Bitcoin"
          posterSrc={PREMIER_POSTER}
          posterLoopSrc={PREMIER_POSTER_LOOP}
          posterWidth={2000}
          posterHeight={1166}
          posterAlt="My Character"
          smallIcon
          showTrailer
          hideWordmark
          hideSigninPrompt
        />
      </div>
    );
  }

  /** Auth / share-id redirect still resolving — show loader instead of a blank page. */
  if (!resolvedShareId) {
    if (authSessionLoading || pathShareId || (allowSignedIn && shareId)) {
      return (
        <div
          className="asset-page asset-page--bitcoin bitcoin-alien-race-page bitcoin-my-character-page bitcoin-my-character-page--booting"
          role="status"
          aria-label="Loading character"
        >
          <div className="bitcoin-my-character-boot-loader" aria-hidden="true">
            <div className="asset-alien-meta-preview-loader-ring" />
          </div>
        </div>
      );
    }
    return null;
  }

  /** Expand sections immediately; media slots keep their own loaders until HEAD/images land. */
  const sectionsOpen = true;
  const portraitPending = !portraitUrl || !portraitLoaded;

  const portraitMedia = (
    <span
      className={`asset-alien-photo-slot-placeholder-wrap bitcoin-my-character-photo-frame${
        portraitLoaded && portraitUrl ? ' is-loaded' : ''
      }`}
    >
      {!portraitLoaderGone || !portraitUrl ? (
        <div
          className={`bitcoin-my-character-photo-loader${
            portraitLoaded && portraitUrl ? ' is-fading' : ''
          }`}
          aria-hidden="true"
        >
          <div className="asset-alien-meta-preview-loader-ring" />
        </div>
      ) : null}
      {portraitUrl ? (
        <img
          ref={portraitImgRef}
          className={`asset-alien-photo-slot-placeholder bitcoin-my-character-photo-img${
            portraitLoaded ? ' is-visible' : ''
          }`}
          src={portraitUrl}
          alt="My Character"
          onLoad={() => setPortraitLoaded(true)}
        />
      ) : null}
    </span>
  );

  return (
    <>
      <div className="asset-page asset-page--bitcoin bitcoin-alien-race-page bitcoin-my-character-page">
        <div className="bitcoin-alien-race-page-inner">
          <HeightDownSection open={sectionsOpen} className="bitcoin-my-character-section--badge">
            <div className="asset-bitcoin-season-teaser-badge">
              <Link
                href={assetSharePath('/bitcoin', resolvedShareId)}
                className="myinv-asset-home-card home-asset-bitcoin bitcoin-alien-race-asset-card"
                aria-label="Bitcoin"
              >
                <div className="home-assets-cell home-assets-asset">
                  <span className="home-asset-label home-asset-label-bitcoin">
                    <span className="home-asset-name asset-action-button asset-action-button--bitcoin asset-action-button--home-asset-chip">
                      Bitcoin
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          </HeightDownSection>

          {/* Keep input mounted for owners so same-file re-picks aren't lost if media remounts. */}
          {isOwner ? (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={onFile}
            />
          ) : null}

          <HeightDownSection open={sectionsOpen} className="bitcoin-my-character-section--photo">
            <div
              className={`asset-alien-photo-slot asset-alien-photo-slot--bitcoin bitcoin-my-character-photo-slot${
                busy || portraitPending ? ' is-busy' : ''
              }`}
            >
              {isOwner ? (
                <button
                  ref={updateBtnRef}
                  type="button"
                  className="asset-alien-photo-hit"
                  onClick={openPicker}
                  disabled={busy || !portraitUrl}
                  aria-label="Update Photo"
                >
                  {portraitMedia}
                  <span
                    className="asset-alien-photo-plus asset-alien-photo-plus--view"
                    aria-hidden="true"
                  >
                    {busy ? <span className="asset-alien-photo-busy" /> : 'Update Photo'}
                  </span>
                </button>
              ) : (
                <div className="asset-alien-photo-hit">{portraitMedia}</div>
              )}
            </div>
          </HeightDownSection>

          <HeightDownSection open className="bitcoin-my-character-section--launch">
            <div className="bitcoin-my-character-launch">
              {metaUrl ? (
                <AlienMetaPreview
                  metaUrl={metaUrl}
                  loopUrl={metaLoopUrl}
                  alt="Bitcoin Alien Race launch poster"
                />
              ) : (
                <div
                  className="bitcoin-my-character-launch--loading"
                  role="status"
                  aria-label="Loading launch poster"
                >
                  <div className="asset-alien-meta-preview-loader" aria-hidden="true">
                    <div className="asset-alien-meta-preview-loader-ring" />
                  </div>
                </div>
              )}
            </div>
          </HeightDownSection>

          <HeightDownSection open={sectionsOpen} className="bitcoin-my-character-section--questions">
            <AssetQuestionsSupport cssModifier="bitcoin" />
          </HeightDownSection>

          <HeightDownSection open={sectionsOpen} className="bitcoin-my-character-section--footer">
            <footer className="asset-footer">
              <Link
                className="asset-action-button asset-action-button--bitcoin asset-action-button--invest-show asset-footer-about-button"
                href="/about"
              >
                <span className="asset-footer-about-text">about</span>
              </Link>
            </footer>
          </HeightDownSection>
        </div>
      </div>
    </>
  );
};

export default BitcoinMyCharacterPageClient;
