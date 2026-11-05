'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePosterLoopPlayback } from '../../../hooks/usePosterLoopPlayback';

type AlienMetaPreviewProps = {
  /** Null = loader-only (page mount before media arrives). */
  metaUrl: string | null;
  loopUrl: string | null;
  alt?: string;
};

/** Launch metaposter: video→still fade-through-black; still→video crossfade. */
export default function AlienMetaPreview({
  metaUrl,
  loopUrl,
  alt = 'Your personalized Bitcoin Alien Race poster',
}: AlienMetaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stillImgRef = useRef<HTMLImageElement | null>(null);
  const hasStill = Boolean(metaUrl);
  const hasLoop = Boolean(hasStill && loopUrl);
  const [stillLoaded, setStillLoaded] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
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
    hasLoop,
    loopUrl || '',
    5000,
    undefined,
    stillLoaded
  );
  const showStill = !hasLoop ? stillLoaded : showStillLayer && stillLoaded;
  /** Keep loader until something visible is fading in (video or still), so the handoff is a crossfade. */
  const frameReady = hasStill && (hasLoop ? videoReady || showStill : stillLoaded);

  useEffect(() => {
    if (!metaUrl) {
      setStillLoaded(false);
      setLoaderGone(false);
      return;
    }
    const img = stillImgRef.current;
    const alreadyDecoded = Boolean(img?.complete && img.naturalWidth > 0);
    // The loop URL arrives after the poster. Do not clear a decoded still, or
    // playback waits on awaitStill and the video never restarts.
    setStillLoaded(alreadyDecoded);
    if (!alreadyDecoded) setLoaderGone(false);
  }, [metaUrl, loopUrl]);

  useEffect(() => {
    if (!frameReady) {
      setLoaderGone(false);
      return;
    }
    const t = window.setTimeout(() => setLoaderGone(true), 1600);
    return () => window.clearTimeout(t);
  }, [frameReady]);

  return (
    <div
      className={`asset-alien-meta-preview-frame${frameReady ? ' is-loaded' : ''}${
        showStill ? ' is-still' : ''
      }${hasLoop ? ' asset-alien-meta-preview-frame--loop' : ''}${
        isHandoff ? ' is-handoff' : ''
      }`}
      role={!hasStill ? 'status' : undefined}
      aria-label={!hasStill ? 'Loading launch poster' : undefined}
    >
      {!loaderGone ? (
        <div
          className={`asset-alien-meta-preview-loader${frameReady ? ' is-fading' : ''}`}
          aria-hidden="true"
        >
          <div className="asset-alien-meta-preview-loader-ring" />
        </div>
      ) : null}
      {hasLoop && loopUrl ? (
        <video
          key={loopUrl}
          ref={videoRef}
          className={`asset-alien-meta-preview-video${showVideo ? ' is-visible' : ''}${
            videoFadingOut ? ' is-done' : ''
          }`}
          src={loopUrl}
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
          aria-label={alt}
        />
      ) : null}
      {metaUrl ? (
        <img
          key={metaUrl}
          ref={stillImgRef}
          className={`asset-alien-meta-preview${showStill ? ' is-visible' : ''}${
            stillFadingOut ? ' is-done' : ''
          }${hasLoop ? ' asset-alien-meta-preview--loop-still' : ''}`}
          src={metaUrl}
          alt={alt}
          onLoad={() => setStillLoaded(true)}
        />
      ) : null}
    </div>
  );
}
