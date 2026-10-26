'use client';

import React, { useCallback, useEffect, useState } from 'react';
import VideoPlayer from '../../../VideoPlayer';
import { useUser } from '../../../../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../../../../lib/assets/assetSharePath';
import { SIGNED_IN_TRAILER_POSTER, SIGNED_IN_TRAILER_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/videos';
import { EPISODE_ONE_POSTER, EPISODE_ONE_SOURCES } from '../../../../lib/marketing/assets/crypto/bitcoin/seasonone/episodeone';

const SEASON_ONE_TEASER_SRC =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/SeasonOneCopy.jpg';

export default function BitcoinSeasonTeaser() {
  const { isSignedIn } = useUser();
  const [teaserLoaded, setTeaserLoaded] = useState(false);
  const [teaserSrc, setTeaserSrc] = useState(SEASON_ONE_TEASER_SRC);
  const [trailerMounted, setTrailerMounted] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerSettled, setTrailerSettled] = useState(false);

  const loadPersonalizedSeasonOne = useCallback(async () => {
    if (!isSignedIn) {
      setTeaserSrc(SEASON_ONE_TEASER_SRC);
      return;
    }
    try {
      const res = await fetch('/api/user/alien-photo?asset=bitcoin&kind=seasonone', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setTeaserSrc(SEASON_ONE_TEASER_SRC);
        return;
      }
      const blob = await res.blob();
      setTeaserSrc((prev) => {
        if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setTeaserLoaded(false);
    } catch {
      setTeaserSrc(SEASON_ONE_TEASER_SRC);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void loadPersonalizedSeasonOne();
  }, [loadPersonalizedSeasonOne]);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string }>).detail;
      if (detail?.assetId && detail.assetId !== 'bitcoin') return;
      void loadPersonalizedSeasonOne();
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
          <div className={`asset-bitcoin-season-teaser-frame${teaserLoaded ? ' is-loaded' : ''}`}>
            {!teaserLoaded ? (
              <div className="asset-bitcoin-season-teaser-loader" aria-hidden="true">
                <div className="asset-bitcoin-season-teaser-loader-ring" />
              </div>
            ) : null}
            <img
              src={teaserSrc}
              alt="Season One coming soon"
              width={4561}
              height={1091}
              className={`asset-bitcoin-season-teaser-img${teaserLoaded ? ' is-visible' : ''}`}
              onLoad={() => setTeaserLoaded(true)}
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
              <span>Episode One</span>
            </p>
            <VideoPlayer
              theme="bitcoin"
              sources={EPISODE_ONE_SOURCES}
              poster={EPISODE_ONE_POSTER}
              notchPlay
            />
          </div>
          <div className="asset-bitcoin-season-teaser-episode">
            <p className="asset-bitcoin-season-teaser-cadence">
              <span>Episode Two</span>
            </p>
            <div className="asset-bitcoin-season-teaser-cadence-wrap">
              <p className="asset-bitcoin-season-teaser-cadence">
                <span>Coming October 31st 2026</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
