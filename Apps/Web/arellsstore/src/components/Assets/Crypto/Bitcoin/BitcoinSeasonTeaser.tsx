'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import VideoPlayer from '../../../VideoPlayer';
import { useUser } from '../../../../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../../../../lib/assets/assetSharePath';
import { usePosterLoopPlayback } from '../../../../hooks/usePosterLoopPlayback';
import { SIGNED_IN_TRAILER_POSTER, SIGNED_IN_TRAILER_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/videos';
import { EPISODE_ONE_POSTER, EPISODE_ONE_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodeone';
import { EPISODE_TWO_POSTER, EPISODE_TWO_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodetwo';

const SEASON_ONE_POSTERS_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters';

const SEASON_ONE_COPY_SRC = `${SEASON_ONE_POSTERS_BASE}/SeasonOneCopy.jpg`;
const SEASON_ONE_LOOP_SRC = `${SEASON_ONE_POSTERS_BASE}/SeasonOneLoop.mp4`;
/** Character Season One frame (taller than stock banner). */
const CHARACTER_SEASON_ASPECT = 1091 / 4561;
/** Match Bitcoin page height-downs (empty teaser / investments). */
const CHARACTER_FRAME_HEIGHT_MS = 2000;

type BitcoinSeasonTeaserProps = {
  /** Home CTA: Season One poster/loop only (no trailer / episodes). */
  seasonOnly?: boolean;
};

export default function BitcoinSeasonTeaser({ seasonOnly = false }: BitcoinSeasonTeaserProps) {
  const { isSignedIn, authSessionLoading, sessionReady } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const seasonLoadGenRef = useRef(0);
  const characterHeightAnimRef = useRef(false);
  // Empty until auth settles — never seed stock loop (flashes before personal media).
  const [stillSrc, setStillSrc] = useState('');
  const [loopSrc, setLoopSrc] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [stillLoaded, setStillLoaded] = useState(false);
  /** Stock aspect until character media loads, then height-down to character ratio. */
  const [characterAspectSettled, setCharacterAspectSettled] = useState(false);
  const [trailerMounted, setTrailerMounted] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerSettled, setTrailerSettled] = useState(false);
  const playbackEnabled = mediaReady && loopEnabled && Boolean(loopSrc);
  const {
    videoReady,
    showStillLayer,
    showVideo,
    videoFadingOut,
    stillFadingOut,
    isHandoff,
    markReady,
    onVideoEnded,
    skipToStill,
  } = usePosterLoopPlayback(
    videoRef,
    playbackEnabled,
    loopSrc,
    5000,
    1500,
    stillLoaded,
    'through-black'
  );
  const showStill = showStillLayer && stillLoaded;
  const frameReady =
    mediaReady && ((playbackEnabled ? videoReady : stillLoaded) || showStill || stillLoaded);
  const isCharacterSrc = stillSrc.startsWith('blob:');
  /** Keep stock (short) aspect until character height-down finishes — avoids pop. */
  const stockSeasonFrame = !characterAspectSettled;

  const applyStockSeasonOne = useCallback(() => {
    setStillSrc((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return SEASON_ONE_COPY_SRC;
    });
    setLoopSrc((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return SEASON_ONE_LOOP_SRC;
    });
    setLoopEnabled(true);
    setStillLoaded(false);
    setMediaReady(true);
  }, []);

  const loadPersonalizedSeasonOne = useCallback(async (cacheBust?: number) => {
    const loadGen = ++seasonLoadGenRef.current;
    // Hold loader until we know signed-in vs guest — avoids stock loop flash.
    if (authSessionLoading || !sessionReady) {
      setMediaReady(false);
      return;
    }

    if (!isSignedIn) {
      applyStockSeasonOne();
      return;
    }

    // Signed-in: clear any stock media before fetch completes.
    setMediaReady(false);
    setStillLoaded(false);
    setStillSrc((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return '';
    });
    setLoopSrc((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return '';
    });
    setLoopEnabled(false);

    const bust = cacheBust ? `&t=${cacheBust}` : `&t=${Date.now()}`;
    const loopApiSrc = `/api/user/alien-photo?asset=bitcoin&kind=seasononeloop${bust}`;
    let hasPersonalStill = false;
    try {
      // Still: GET + blob (image, small). Loop: HEAD only — GET 302s to S3 and
      // fetch() then fails CORS, which used to wipe personal media → stock loop.
      const [stillRes, loopHead] = await Promise.all([
        fetch(`/api/user/alien-photo?asset=bitcoin&kind=seasonone${bust}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(loopApiSrc, {
          method: 'HEAD',
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);
      if (loadGen !== seasonLoadGenRef.current) return;

      hasPersonalStill = stillRes.ok;
      const hasPersonalLoop = loopHead.ok;

      if (hasPersonalStill) {
        const blob = await stillRes.blob();
        if (loadGen !== seasonLoadGenRef.current) return;
        setStillSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setStillLoaded(false);
      } else {
        setStillSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return SEASON_ONE_COPY_SRC;
        });
      }

      if (hasPersonalLoop) {
        // <video src> hits API → 302 S3 (player follows; fetch must not).
        setLoopSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return loopApiSrc;
        });
        setLoopEnabled(true);
      } else if (hasPersonalStill) {
        // Never play the stock SeasonOneLoop over a personalized still.
        setLoopSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return '';
        });
        setLoopEnabled(false);
      } else {
        setLoopSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return SEASON_ONE_LOOP_SRC;
        });
        setLoopEnabled(true);
      }
    } catch {
      if (loadGen !== seasonLoadGenRef.current) return;
      // Keep personal still if we already got it; never demote to stock loop over it.
      if (hasPersonalStill) {
        setLoopSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return '';
        });
        setLoopEnabled(false);
      } else {
        applyStockSeasonOne();
        return;
      }
    } finally {
      if (loadGen === seasonLoadGenRef.current) setMediaReady(true);
    }
  }, [authSessionLoading, sessionReady, isSignedIn, applyStockSeasonOne]);

  useEffect(() => {
    void loadPersonalizedSeasonOne();
  }, [loadPersonalizedSeasonOne]);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string; at?: number }>).detail;
      if (detail?.assetId && detail.assetId !== 'bitcoin') return;
      void loadPersonalizedSeasonOne(detail?.at || Date.now());
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
  }, [loadPersonalizedSeasonOne]);

  useEffect(() => {
    if (!trailerMounted || trailerOpen) return;
    setTrailerSettled(false);
    const timer = window.setTimeout(() => setTrailerOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [trailerMounted, trailerOpen]);

  useEffect(() => {
    if (!trailerOpen || trailerSettled) return;
    const timer = window.setTimeout(() => setTrailerSettled(true), 3100);
    return () => window.clearTimeout(timer);
  }, [trailerOpen, trailerSettled]);

  // Back to stock (sign-out / no personal media): drop character aspect latch.
  useEffect(() => {
    if (isCharacterSrc) return;
    characterHeightAnimRef.current = false;
    setCharacterAspectSettled(false);
    const el = frameRef.current;
    if (!el) return;
    el.style.height = '';
    el.style.aspectRatio = '';
    el.style.transition = '';
    el.style.overflow = '';
  }, [isCharacterSrc]);

  // Character still ready: height-down from stock banner → character frame (no pop).
  useEffect(() => {
    if (!isCharacterSrc || !stillLoaded || !frameReady || characterAspectSettled) return;
    if (characterHeightAnimRef.current) return;
    const el = frameRef.current;
    if (!el) return;

    const width = el.getBoundingClientRect().width;
    const fromH = el.getBoundingClientRect().height;
    const toH = width * CHARACTER_SEASON_ASPECT;
    if (!width || Math.abs(toH - fromH) < 1) {
      setCharacterAspectSettled(true);
      return;
    }

    characterHeightAnimRef.current = true;
    el.style.height = `${fromH}px`;
    el.style.aspectRatio = 'auto';
    el.style.overflow = 'hidden';
    void el.offsetHeight;
    el.style.transition = `height ${CHARACTER_FRAME_HEIGHT_MS}ms ease`;
    el.style.height = `${toH}px`;

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== el || event.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
      // Flip class to character aspect FIRST; clearing height while is-stock
      // still applied snapped short→tall (the jitter).
      el.style.transition = 'none';
      el.style.aspectRatio = '4561 / 1091';
      el.style.height = '';
      el.style.overflow = '';
      setCharacterAspectSettled(true);
    };
    el.addEventListener('transitionend', onEnd);
    return () => {
      el.removeEventListener('transitionend', onEnd);
    };
  }, [isCharacterSrc, stillLoaded, frameReady, characterAspectSettled]);

  // After React drops is-stock, drop inline aspect lock (same ratio — no layout change).
  useLayoutEffect(() => {
    if (!characterAspectSettled) return;
    const el = frameRef.current;
    if (!el) return;
    el.style.transition = '';
    el.style.height = '';
    el.style.aspectRatio = '';
    el.style.overflow = '';
    characterHeightAnimRef.current = false;
  }, [characterAspectSettled]);

  return (
    <div className="asset-bitcoin-season-teaser">
      <div className="asset-bitcoin-season-teaser-show">
        <div className="asset-bitcoin-season-teaser-season">
          <div
            ref={frameRef}
            className={`asset-bitcoin-season-teaser-frame${stockSeasonFrame ? ' is-stock' : ''}${
              frameReady ? ' is-loaded' : ''
            }${showStill ? ' is-still' : ''}${isHandoff ? ' is-handoff' : ''}`}
          >
            {/* Same media + black-plate structure as launch / AssetGuestLanding */}
            <div className="asset-bitcoin-season-teaser-media">
              {!frameReady ? (
                <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
                  <div className="asset-bitcoin-season-teaser-loader-ring" />
                </div>
              ) : null}
              {playbackEnabled ? (
                <video
                  key={loopSrc}
                  ref={videoRef}
                  className={`asset-bitcoin-season-teaser-video${showVideo ? ' is-visible' : ''}${
                    videoFadingOut || !showVideo ? ' is-done' : ''
                  }`}
                  src={loopSrc}
                  muted
                  playsInline
                  preload="auto"
                  autoPlay
                  controls={false}
                  disablePictureInPicture
                  onLoadedData={markReady}
                  onCanPlay={markReady}
                  onPlaying={markReady}
                  onEnded={onVideoEnded}
                  onError={skipToStill}
                  aria-label="Season One"
                />
              ) : null}
              {stillSrc ? (
                <img
                  key={stillSrc}
                  src={stillSrc}
                  alt="Season One"
                  width={stockSeasonFrame ? 2660 : 4561}
                  height={stockSeasonFrame ? 382 : 1091}
                  className={`asset-bitcoin-season-teaser-img${showStill ? ' is-visible' : ''}${
                    stillFadingOut ? ' is-done' : ''
                  }`}
                  onLoad={() => setStillLoaded(true)}
                />
              ) : null}
            </div>
          </div>
{seasonOnly ? null : (
            <>
          <div className="asset-bitcoin-season-teaser-trailer-section">
            {!trailerMounted ? (
              <div className="home-assets-show-more-wrap tbar-more tbar-more--hub-link asset-bitcoin-season-teaser-trailer-cta">
                <button
                  type="button"
                  className="asset-action-button asset-action-button--save-signin asset-action-button--bitcoin"
                  onClick={() => setTrailerMounted(true)}
                >
                  <span className="asset-save-signin-text">VIEW TRAILER</span>
                </button>
              </div>
            ) : (
              <div
                className={`asset-bitcoin-season-teaser-trailer-panel${trailerOpen ? ' is-open' : ''}${
                  trailerSettled ? ' is-settled' : ''
                }`}
                onTransitionEnd={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.propertyName !== 'grid-template-rows') return;
                  if (trailerOpen) setTrailerSettled(true);
                }}
              >
                <div className="asset-bitcoin-season-teaser-trailer-panel-height">
                  <div className="asset-bitcoin-season-teaser-trailer">
                    <VideoPlayer
                      theme="bitcoin"
                      sources={SIGNED_IN_TRAILER_SOURCES}
                      poster={SIGNED_IN_TRAILER_POSTER}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode Two</span>
            </p>
            <VideoPlayer
              theme="bitcoin"
              sources={EPISODE_TWO_SOURCES}
              poster={EPISODE_TWO_POSTER}
              notchPlay
            />
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode Three</span>
            </p>
            <div className="asset-bitcoin-season-teaser-cadence-wrap">
              <p className="asset-bitcoin-season-teaser-cadence">
                <span>Coming November 28th 2026</span>
              </p>
            </div>
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode One</span>
            </p>
            <VideoPlayer
              theme="bitcoin"
              sources={EPISODE_ONE_SOURCES}
              poster={EPISODE_ONE_POSTER}
              notchPlay
            />
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
