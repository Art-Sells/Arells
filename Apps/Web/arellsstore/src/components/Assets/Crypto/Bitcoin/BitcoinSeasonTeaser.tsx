'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export default function BitcoinSeasonTeaser() {
  const { isSignedIn, authSessionLoading, sessionReady } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Empty until auth settles — never seed stock loop (flashes before personal media).
  const [stillSrc, setStillSrc] = useState('');
  const [loopSrc, setLoopSrc] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [stillLoaded, setStillLoaded] = useState(false);
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
    try {
      const [stillRes, loopRes] = await Promise.all([
        fetch(`/api/user/alien-photo?asset=bitcoin&kind=seasonone${bust}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/user/alien-photo?asset=bitcoin&kind=seasononeloop${bust}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      const hasPersonalStill = stillRes.ok;
      const hasPersonalLoop = loopRes.ok;

      if (hasPersonalStill) {
        const blob = await stillRes.blob();
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
        const blob = await loopRes.blob();
        setLoopSrc((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
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
      applyStockSeasonOne();
      return;
    } finally {
      setMediaReady(true);
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

  return (
    <div className="asset-bitcoin-season-teaser">
      <div className="asset-bitcoin-season-teaser-show">
        <div className="asset-bitcoin-season-teaser-season">
          <div
            className={`asset-bitcoin-season-teaser-frame${frameReady ? ' is-loaded' : ''}${
              showStill ? ' is-still' : ''
            }${isHandoff ? ' is-handoff' : ''}`}
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
                  width={4561}
                  height={1091}
                  className={`asset-bitcoin-season-teaser-img${showStill ? ' is-visible' : ''}${
                    stillFadingOut ? ' is-done' : ''
                  }`}
                  onLoad={() => setStillLoaded(true)}
                />
              ) : null}
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
