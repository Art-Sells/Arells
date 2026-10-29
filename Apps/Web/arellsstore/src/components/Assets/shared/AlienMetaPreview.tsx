'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePosterLoopPlayback } from '../../../hooks/usePosterLoopPlayback';

type AlienMetaPreviewProps = {
  metaUrl: string;
  loopUrl: string | null;
  alt?: string;
};

/** Launch metaposter still + optional metaloop with fade-through-black. */
export default function AlienMetaPreview({
  metaUrl,
  loopUrl,
  alt = 'Your personalized Bitcoin Alien Race poster',
}: AlienMetaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stillImgRef = useRef<HTMLImageElement | null>(null);
  const hasLoop = Boolean(loopUrl);
  const {
    videoReady,
    showStillLayer,
    showVideo,
    videoFadingOut,
    isHandoff,
    markReady,
    onVideoEnded,
    skipToStill,
  } = usePosterLoopPlayback(videoRef, hasLoop, loopUrl || '', 5000);
  const [stillLoaded, setStillLoaded] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const showStill = !hasLoop ? stillLoaded : showStillLayer && stillLoaded;
  /** Keep loader until something visible is fading in (video or still), so the handoff is a crossfade. */
  const frameReady = hasLoop ? videoReady || showStill : stillLoaded;

  useEffect(() => {
    const img = stillImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStillLoaded(true);
  }, [metaUrl]);

  useEffect(() => {
    setStillLoaded(false);
    setLoaderGone(false);
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
      <img
        ref={stillImgRef}
        className={`asset-alien-meta-preview${showStill ? ' is-visible' : ''}${
          hasLoop ? ' asset-alien-meta-preview--loop-still' : ''
        }`}
        src={metaUrl}
        alt={alt}
        onLoad={() => setStillLoaded(true)}
      />
    </div>
  );
}
