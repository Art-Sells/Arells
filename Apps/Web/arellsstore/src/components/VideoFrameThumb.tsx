'use client';

import React, { useEffect, useState } from 'react';
import { captureVideoFrame, midVideoFrameTime } from '../lib/captureVideoFrame';

type VideoFrameThumbProps = {
  src: string;
  className?: string;
};

export default function VideoFrameThumb({ src, className }: VideoFrameThumbProps) {
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let captured = false;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';

    const grab = () => {
      if (cancelled || captured) return;
      const url = captureVideoFrame(video);
      if (!url) return;
      captured = true;
      setFrame(url);
    };

    const onLoaded = () => {
      if (cancelled) return;
      try {
        video.currentTime = midVideoFrameTime(video);
      } catch {
        grab();
      }
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('seeked', grab);
    video.src = src;
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('seeked', grab);
      video.src = '';
    };
  }, [src]);

  if (frame) {
    return <img src={frame} alt="" className={className} />;
  }

  return (
    <video
      className={className}
      src={src}
      muted
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
    />
  );
}
