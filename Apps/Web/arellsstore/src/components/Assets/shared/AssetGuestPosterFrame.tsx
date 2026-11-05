'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePosterLoopPlayback } from '../../../hooks/usePosterLoopPlayback';

type AssetGuestPosterFrameProps = {
  /** Null while the still is still being chosen — loader only. */
  src: string | null;
  loopSrc?: string;
  width: number;
  height: number;
  alt?: string;
};

/** Bitcoin guest/share metaposter: bordered frame, loader, video then still, through black. */
export default function AssetGuestPosterFrame({
  src,
  loopSrc,
  width,
  height,
  alt = 'Launch poster',
}: AssetGuestPosterFrameProps) {
  const hasLoop = Boolean(src && loopSrc);
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
  } = usePosterLoopPlayback(
    videoRef,
    hasLoop,
    loopSrc,
    5000,
    undefined,
    posterLoaded,
    'through-black'
  );

  const showStill = !hasLoop ? posterLoaded : showStillLayer && posterLoaded;
  const frameReady = hasLoop ? videoPlaying || showStill : posterLoaded;
  const showLoader = !src || !frameReady;

  useEffect(() => {
    setPosterLoaded(false);
    setVideoPlaying(false);
  }, [src, loopSrc]);

  useEffect(() => {
    const img = posterImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setPosterLoaded(true);
  }, [src]);

  return (
    <div
      className={`asset-guest-poster-frame asset-guest-poster-frame--loop${
        frameReady ? ' is-loaded' : ''
      }${showStill ? ' is-still' : ''}${isHandoff ? ' is-handoff' : ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className="asset-guest-poster-media">
        {showLoader ? (
          <div className="asset-guest-poster-loader" aria-hidden="true">
            <div className="asset-guest-poster-loader-ring" />
          </div>
        ) : null}
        {hasLoop && loopSrc ? (
          <video
            ref={videoRef}
            className={`asset-guest-poster-video${showVideo ? ' is-visible' : ''}${
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
            onPlaying={() => {
              markReady();
              setVideoPlaying(true);
            }}
            onEnded={onVideoEnded}
            onError={() => {
              setVideoPlaying(false);
              skipToStill();
            }}
            aria-label={alt}
          />
        ) : null}
        {src ? (
          <img
            ref={posterImgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`asset-guest-poster-img${showStill ? ' is-visible' : ''}${
              stillFadingOut ? ' is-done' : ''
            }`}
            onLoad={() => setPosterLoaded(true)}
          />
        ) : null}
      </div>
    </div>
  );
}
