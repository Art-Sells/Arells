'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import GuestLandingCopyright from '../../GuestLandingCopyright';
import VideoPlayer from '../../VideoPlayer';
import { usePosterLoopPlayback } from '../../../hooks/usePosterLoopPlayback';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

type AssetGuestLandingProps = {
  cssModifier: string;
  ticker: string;
  title: string;
  slogan?: string;
  /** When set on Bitcoin guest landing, shown above the trailer. */
  posterSrc?: string;
  /** Optional loop video; after it ends, fades into posterSrc, then replays after 5s. */
  posterLoopSrc?: string;
  posterWidth?: number;
  posterHeight?: number;
  posterAlt?: string;
  smallIcon?: boolean;
  showTrailer?: boolean;
  hideWordmark?: boolean;
  hideSigninPrompt?: boolean;
  /** When true, mission reads “My {title} investments…”. */
  possessiveMission?: boolean;
};

export default function AssetGuestLanding({
  cssModifier,
  title,
  posterSrc,
  posterLoopSrc,
  posterWidth = 3000,
  posterHeight = 2688,
  posterAlt = '',
  smallIcon = false,
  showTrailer = false,
  hideWordmark = false,
  hideSigninPrompt = false,
  possessiveMission: _possessiveMission = false,
}: AssetGuestLandingProps) {
  const showPoster = Boolean(posterSrc);
  const hasLoop = Boolean(posterSrc && posterLoopSrc);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const posterImgRef = useRef<HTMLImageElement>(null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const {
    showStillLayer,
    showVideo,
    videoFadingOut,
    stillFadingOut,
    isHandoff,
    markReady,
    onVideoEnded,
    skipToStill,
  } = usePosterLoopPlayback(videoRef, hasLoop, posterLoopSrc, 5000, undefined, posterLoaded);

  const showStill = !hasLoop ? posterLoaded : showStillLayer && posterLoaded;
  /** With a loop, keep the loader until playback actually starts (not still decode). */
  const frameReady = hasLoop ? videoPlaying || showStill : posterLoaded;
  const showLoader = Boolean(posterSrc) && !frameReady;

  useEffect(() => {
    setPosterLoaded(false);
    setVideoPlaying(false);
  }, [posterSrc, posterLoopSrc]);

  useEffect(() => {
    const img = posterImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setPosterLoaded(true);
  }, [posterSrc]);

  const onVideoPlaying = () => {
    markReady();
    setVideoPlaying(true);
  };

  return (
    <div
      className={`asset-page-content asset-page-content--${cssModifier} asset-guest-landing${
        smallIcon ? ' asset-guest-landing--small-icon' : ''
      }`}
    >
      <div className="asset-guest-landing-stack">
        <span
          className="home-guest-icon-wrap asset-guest-icon-wrap asset-guest-mount-slide asset-guest-mount-slide--badge"
          aria-hidden="true"
        >
          <span className="home-guest-icon-tint asset-guest-icon-tint" aria-hidden="true" />
          <Image
            loader={imageLoader}
            alt=""
            width={60}
            height={60}
            className="home-guest-icon-img"
            src="images/Arells-Icon.png"
            priority
          />
        </span>
        {hideWordmark ? null : (
          <span
            className="asset-guest-wordmark asset-guest-mount-slide asset-guest-mount-slide--title"
            role="img"
            aria-label="Arells"
          />
        )}
        <p
          className={`home-guest-slogan asset-guest-landing-mission asset-guest-landing-mission--${cssModifier} asset-guest-mount-slide asset-guest-mount-slide--slogan`}
        >
          <span className="asset-guest-landing-mission-tail">
            On a mission to ensure
            <br />
            {title} never loses value.
          </span>
        </p>
        <div
          className={`asset-guest-action-shell shadow-border-wrap asset-guest-action-shell--${cssModifier}${
            showTrailer || showPoster ? ' asset-guest-trailer-shell' : ''
          } asset-guest-mount-slide asset-guest-mount-slide--signin`}
        >
          <span className="shadow-border" aria-hidden="true" />
          {showPoster && posterSrc ? (
            <div
              className={`asset-guest-poster-frame asset-guest-poster-frame--loop${
                frameReady ? ' is-loaded' : ''
              }${showStill ? ' is-still' : ''}${isHandoff ? ' is-handoff' : ''}`}
              style={{ aspectRatio: `${posterWidth} / ${posterHeight}` }}
            >
              <div className="asset-guest-poster-media">
                {showLoader ? (
                  <div className="asset-guest-poster-loader" aria-hidden="true">
                    <div className="asset-guest-poster-loader-ring" />
                  </div>
                ) : null}
                {hasLoop && posterLoopSrc ? (
                  <video
                    ref={videoRef}
                    className={`asset-guest-poster-video${showVideo ? ' is-visible' : ''}${
                      videoFadingOut || !showVideo ? ' is-done' : ''
                    }`}
                    src={posterLoopSrc}
                    muted
                    playsInline
                    preload="auto"
                    autoPlay
                    controls={false}
                    disablePictureInPicture
                    onLoadedData={markReady}
                    onCanPlay={markReady}
                    onPlaying={onVideoPlaying}
                    onEnded={onVideoEnded}
                    onError={() => {
                      setVideoPlaying(false);
                      skipToStill();
                    }}
                    aria-label={posterAlt || 'Launch poster'}
                  />
                ) : null}
                <img
                  ref={posterImgRef}
                  src={posterSrc}
                  alt={posterAlt}
                  width={posterWidth}
                  height={posterHeight}
                  className={`asset-guest-poster-img${showStill ? ' is-visible' : ''}${
                    stillFadingOut ? ' is-done' : ''
                  }`}
                  onLoad={() => setPosterLoaded(true)}
                />
              </div>
            </div>
          ) : null}
          {showTrailer ? <VideoPlayer theme="bitcoin" /> : null}
          <div className={`asset-guest-signin-nested asset-panel asset-panel--${cssModifier}`}>
            <div className="asset-guest-signin-inner">
              {hideSigninPrompt ? null : <p className="asset-signin-believe-prompt">Sign in to learn more</p>}
              <Link
                href="/signin"
                className={`asset-action-button asset-action-button--save-signin asset-action-button--save-signin-empty asset-action-button--${cssModifier}`}
              >
                <span className="asset-save-signin-text">Sign In</span>
              </Link>
            </div>
          </div>
        </div>
        <GuestLandingCopyright
          variant="asset"
          cssModifier={cssModifier}
          className="asset-guest-mount-slide asset-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
}
