'use client';

import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from '../../../VideoPlayer';
import { usePosterLoopPlayback } from '../../../../hooks/usePosterLoopPlayback';
import { SIGNED_IN_TRAILER_POSTER, SIGNED_IN_TRAILER_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/videos';
import { EPISODE_ONE_POSTER, EPISODE_ONE_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodeone';
import { EPISODE_TWO_POSTER, EPISODE_TWO_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodetwo';

const SEASON_ONE_POSTERS_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters';

const SEASON_ONE_COPY_SRC = `${SEASON_ONE_POSTERS_BASE}/SeasonOneCopy.jpg`;
const SEASON_ONE_LOOP_SRC = `${SEASON_ONE_POSTERS_BASE}/SeasonOneLoop.mp4`;

export default function BitcoinSeasonTeaser() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    videoReady,
    showStillLayer,
    showVideo,
    isHandoff,
    markReady,
    onVideoEnded,
    skipToStill,
  } = usePosterLoopPlayback(videoRef, true, 5000);
  const [stillLoaded, setStillLoaded] = useState(false);
  const [trailerMounted, setTrailerMounted] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerSettled, setTrailerSettled] = useState(false);

  const showStill = showStillLayer && stillLoaded;
  const frameReady = videoReady || showStill || stillLoaded;

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
            {!frameReady ? (
              <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
                <div className="asset-bitcoin-season-teaser-loader-ring" />
              </div>
            ) : null}
            <video
              ref={videoRef}
              className={`asset-bitcoin-season-teaser-video${showVideo ? ' is-visible' : ''}${
                !showVideo ? ' is-done' : ''
              }`}
              src={SEASON_ONE_LOOP_SRC}
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
            <img
              src={SEASON_ONE_COPY_SRC}
              alt="Season One"
              width={2660}
              height={382}
              className={`asset-bitcoin-season-teaser-img${showStill ? ' is-visible' : ''}`}
              onLoad={() => setStillLoaded(true)}
            />
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
