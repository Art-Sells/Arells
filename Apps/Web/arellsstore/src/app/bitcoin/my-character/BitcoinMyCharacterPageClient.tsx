'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import AlienCharacterPayModal from '../../../components/Assets/shared/AlienCharacterPayModal';
import AlienDcPromotionHost from '../../../components/Assets/shared/AlienDcPromotionHost';
import AlienDcPromotionModal from '../../../components/Assets/shared/AlienDcPromotionModal';
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
import { dismissDcPromotion } from '../../../lib/alienDcPromotion';
import { ALIEN_PHOTO_ACCEPT } from '../../../lib/client/alienPhotoCompose';
import {
  clearOpenGuideFlag,
  clearPaidCreditPending,
  handleCharacterGenerationCheckoutReturn,
  hasPaidCharacterCredit,
  markPaidCreditPending,
  peekOpenGuideFlag,
  peekPaidCreditPending,
} from '../../../lib/client/characterGenerationPay';
import { isPendingNavTarget, usePendingNavHref } from '../../../lib/client/navCircleLoader';
import { runAfterMaxHeightTransitionEnd } from '../../../lib/client/documentScroll';

/** Same stock launch metaposter as bitcoin share / OG (square), not the wide guest trailer still. */
const PREMIER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg';
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
  /** Skip entrance animation — content (e.g. Update Photo) is visible immediately. */
  instant = false,
}: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
  instant?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(0);
  const [mode, setMode] = useState<'snap' | 'animate' | 'auto'>(instant ? 'auto' : 'snap');
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
    if (instant) {
      setMode('auto');
      setPx(Math.max(measure(), 1));
      return;
    }
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
  }, [open, measure, instant]);

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
  const [payOpen, setPayOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [payOverlayStyle, setPayOverlayStyle] = useState<React.CSSProperties>({});
  const [creditChecking, setCreditChecking] = useState(false);
  /** Unused paid credit → button becomes Update Photo + Add Photo modal. */
  const [hasPaidCredit, setHasPaidCredit] = useState(() => peekPaidCreditPending('bitcoin'));
  /** Don't render CTA until credit status known — avoids Update Character → Update Photo flash. */
  const [creditReady, setCreditReady] = useState(() => peekPaidCreditPending('bitcoin'));

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
    const publicMeta = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'composed',
      cacheBust: bust,
    });
    const publicLoop = publicAlienVideoPath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'metaloop',
      cacheBust: bust,
    });
    const publicPortrait = publicAlienImagePath({
      shareId: id,
      asset: 'bitcoin',
      kind: 'portrait',
      cacheBust: bust,
    });
    const ownerMetaApi = `/api/user/alien-photo?asset=bitcoin&kind=composed&t=${bust}`;
    const ownerPortraitApi = `/api/user/alien-photo?asset=bitcoin&kind=portrait&t=${bust}`;
    const ownerLoopApi = `/api/user/alien-photo?asset=bitcoin&kind=metaloop&t=${bust}`;

    // Never flash stock LaunchPoster — keep personal URLs while verifying.
    setMetaUrl(isOwner ? null : publicMeta);
    setMetaLoopUrl(isOwner ? null : publicLoop);
    setPortraitUrl(isOwner ? null : publicPortrait);

    try {
      if (isOwner) {
        // Owner: auth API (no shareId/referral HEAD flake). Images as blobs; video as API src→S3.
        const [metaRes, portraitRes, loopHead] = await Promise.all([
          fetch(ownerMetaApi, { credentials: 'include', cache: 'no-store' }),
          fetch(ownerPortraitApi, { credentials: 'include', cache: 'no-store' }),
          fetch(ownerLoopApi, { method: 'HEAD', credentials: 'include', cache: 'no-store' }),
        ]);
        if (metaRes.ok) {
          const blob = await metaRes.blob();
          setMetaUrl((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        } else {
          setMetaUrl(null);
        }
        if (portraitRes.ok) {
          const blob = await portraitRes.blob();
          setPortraitUrl((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        } else {
          setPortraitUrl(null);
        }
        setMetaLoopUrl(metaRes.ok && loopHead.ok ? ownerLoopApi : null);
        if (!metaRes.ok && !portraitRes.ok) {
          router.replace(assetSharePath('/bitcoin', id));
        }
        return;
      }

      // Guest share viewer: keep public personal URLs. Do not demote to stock on HEAD flake.
      const [metaHead, loopHead, portraitHead] = await Promise.all([
        fetch(publicMeta, { method: 'HEAD', cache: 'no-store' }),
        fetch(publicLoop, { method: 'HEAD', cache: 'no-store' }),
        fetch(publicPortrait, { method: 'HEAD', cache: 'no-store' }),
      ]);
      if (metaHead.ok) setMetaUrl(publicMeta);
      else setMetaUrl(null);
      setMetaLoopUrl(metaHead.ok && loopHead.ok ? publicLoop : null);
      if (portraitHead.ok) setPortraitUrl(publicPortrait);
      else setPortraitUrl(null);
      if (!metaHead.ok && !portraitHead.ok) {
        router.replace(assetSharePath('/bitcoin', id));
      }
    } catch {
      setMetaUrl(null);
      setMetaLoopUrl(null);
      setPortraitUrl(null);
    }
  }, [router, isOwner]);

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

  const clickFileInput = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;
    try {
      input.value = '';
      input.type = 'text';
      input.type = 'file';
      input.accept = ALIEN_PHOTO_ACCEPT;
    } catch {
      input.value = '';
    }
    input.click();
  }, []);

  const setPaidPending = useCallback((paid: boolean) => {
    setHasPaidCredit(paid);
    if (paid) markPaidCreditPending('bitcoin');
    else clearPaidCreditPending('bitcoin');
  }, []);

  const openGuide = useCallback(() => {
    setPayOpen(false);
    setPaidPending(true);
    setGuideOpen(true);
  }, [setPaidPending]);

  /** ADD PHOTO from guide → file picker. */
  const triggerFilePicker = useCallback(() => {
    if (!isOwner || !email || busy) return;
    const style = themeStyleFrom(updateBtnRef.current);
    if (blockIfCreating(style)) return;
    clickFileInput();
  }, [isOwner, email, busy, blockIfCreating, clickFileInput]);

  const openPicker = useCallback(() => {
    if (!isOwner || !email || busy || creditChecking) return;
    const style = themeStyleFrom(updateBtnRef.current);
    if (blockIfCreating(style)) return;
    setPayOverlayStyle(style);
    setCreditChecking(true);
    void (async () => {
      try {
        /* Trust server — session “pending” alone can stick after compose consumed the credit. */
        const paid = await hasPaidCharacterCredit('bitcoin');
        setPaidPending(paid);
        if (paid) openGuide();
        else setPayOpen(true);
      } catch (err) {
        console.error('character credit check', err);
        setPayOpen(true);
      } finally {
        setCreditChecking(false);
      }
    })();
  }, [isOwner, email, busy, creditChecking, blockIfCreating, openGuide, setPaidPending]);

  /* Load credit state; after Stripe return open Add Photo guide + Update Photo button. */
  useEffect(() => {
    if (!isOwner || !email) {
      setCreditReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      let fromCheckout = false;
      try {
        fromCheckout = await handleCharacterGenerationCheckoutReturn();
      } catch (err) {
        console.error('character checkout return', err);
      }
      if (cancelled) return;

      if (fromCheckout) {
        setPaidPending(true);
        setCreditReady(true);
        setPayOverlayStyle(themeStyleFrom(updateBtnRef.current));
        openGuide();
      }

      try {
        const paid = await hasPaidCharacterCredit('bitcoin');
        if (cancelled) return;
        /* After checkout return, keep Update Photo even if credit API lags. Otherwise trust server. */
        setPaidPending(Boolean(paid || fromCheckout));
      } catch {
        if (!cancelled) {
          setPaidPending(Boolean(fromCheckout || peekPaidCreditPending('bitcoin')));
        }
      } finally {
        if (!cancelled) setCreditReady(true);
      }

      if (!fromCheckout && peekOpenGuideFlag()) {
        setPayOverlayStyle(themeStyleFrom(updateBtnRef.current));
        openGuide();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwner, email, openGuide, setPaidPending]);

  /* After character finishes generating, credit is consumed → back to Update Character. */
  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string }>).detail;
      if (detail?.assetId !== 'bitcoin') return;
      setPaidPending(false);
      clearOpenGuideFlag();
      setGuideOpen(false);
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
  }, [setPaidPending]);

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
      dismissDcPromotion();
      clearOpenGuideFlag();
      setPayOpen(false);
      setGuideOpen(false);
      /* Keep Update Photo until compose succeeds — then ALIEN_COMPOSE_DONE clears it. */
    },
    [email, resolvedShareId, startCreate]
  );

  // Must run every render (before any early return) — React #300 otherwise.
  usePendingNavHref();

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
          posterHeight={2000}
          posterAlt="Bitcoin Alien Race launch poster"
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
  /** Owner photo block waits for credit so the label is correct + visible when height-down starts (no late pop-in). */
  const photoSectionOpen = sectionsOpen && (!isOwner || creditReady);
  const updateCtaBusy = busy || creditChecking || payOpen;
  const bitcoinBadgeHref = assetSharePath('/bitcoin', resolvedShareId);
  const bitcoinBadgeLoading = isPendingNavTarget(bitcoinBadgeHref);

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
          </HeightDownSection>

          {/* Keep input mounted for owners so same-file re-picks aren't lost if media remounts. */}
          {isOwner ? (
            <input
              ref={fileInputRef}
              type="file"
              accept={ALIEN_PHOTO_ACCEPT}
              hidden
              onChange={onFile}
            />
          ) : null}

          <HeightDownSection
            open={photoSectionOpen}
            className="bitcoin-my-character-section--photo"
          >
            <div
              className={`asset-alien-photo-slot asset-alien-photo-slot--bitcoin bitcoin-my-character-photo-slot${
                busy ? ' is-busy' : ''
              }`}
            >
              {isOwner ? (
                <button
                  ref={updateBtnRef}
                  type="button"
                  className="asset-alien-photo-hit"
                  onClick={openPicker}
                  disabled={updateCtaBusy || guideOpen || !portraitUrl}
                  aria-busy={updateCtaBusy}
                  aria-label={
                    updateCtaBusy
                      ? 'Loading'
                      : hasPaidCredit
                        ? 'Update Photo'
                        : 'Update Character'
                  }
                >
                  {portraitMedia}
                  <span
                    className="asset-alien-photo-plus asset-alien-photo-plus--view bitcoin-my-character-update-photo"
                    aria-hidden="true"
                  >
                    <span
                      className={`bitcoin-my-character-update-photo-layer bitcoin-my-character-update-photo-layer--busy${
                        updateCtaBusy ? ' is-visible' : ''
                      }`}
                    >
                      <span className="asset-alien-photo-busy" />
                    </span>
                    <span
                      className={`bitcoin-my-character-update-photo-layer bitcoin-my-character-update-photo-layer--label${
                        updateCtaBusy ? '' : ' is-visible'
                      }`}
                    >
                      {hasPaidCredit ? (
                        <>
                          <svg
                            className="bitcoin-my-character-update-photo-camera-icon"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              fillRule="evenodd"
                              d="M9.2 3.5 7.6 5.5H5.25A2.25 2.25 0 0 0 3 7.75v9.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25v-9.5A2.25 2.25 0 0 0 18.75 5.5H16.4l-1.6-2H9.2zM12 15.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"
                            />
                          </svg>
                          <span>Update Photo</span>
                        </>
                      ) : (
                        <>
                          <span
                            className="bitcoin-my-character-update-photo-icon"
                            aria-hidden="true"
                          />
                          <span>Update Character</span>
                        </>
                      )}
                    </span>
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
      <AlienCharacterPayModal
        open={payOpen}
        assetId="bitcoin"
        mode="update"
        overlayStyle={payOverlayStyle}
        onPaid={openGuide}
        onDismiss={() => setPayOpen(false)}
      />
      <AlienDcPromotionModal
        open={guideOpen}
        assetName="Bitcoin"
        overlayStyle={payOverlayStyle}
        onAddPhoto={triggerFilePicker}
        onDismiss={() => {
          clearOpenGuideFlag();
          setGuideOpen(false);
        }}
      />
      <AlienDcPromotionHost
        enabled={Boolean(allowSignedIn && isOwner && sectionsOpen && !portraitUrl)}
        assetName="Bitcoin"
      />
    </>
  );
};

export default BitcoinMyCharacterPageClient;
