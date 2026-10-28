'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const START_TIMEOUT_MS = 5000;
const STALL_TIMEOUT_MS = 6000;

/**
 * One-shot poster loop: play muted video once, then caller fades in the still.
 * If load/start fails or buffering stalls too long, skip straight to the still.
 */
export function usePosterLoopPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled = true
) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoDone, setVideoDone] = useState(!enabled);
  const startedRef = useRef(false);

  const skipToStill = useCallback(() => {
    setVideoDone(true);
  }, []);

  const markReady = useCallback(() => {
    startedRef.current = true;
    setVideoReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVideoDone(true);
      return;
    }

    startedRef.current = false;
    setVideoReady(false);
    setVideoDone(false);

    let cancelled = false;
    let stallTimer = 0;
    let startFail = 0;
    let raf = 0;

    const clearStall = () => {
      if (stallTimer) window.clearTimeout(stallTimer);
      stallTimer = 0;
    };

    const armStall = () => {
      clearStall();
      stallTimer = window.setTimeout(() => {
        if (!cancelled) skipToStill();
      }, STALL_TIMEOUT_MS);
    };

    const setup = (video: HTMLVideoElement) => {
      video.loop = false;

      const tryPlay = () => {
        if (cancelled) return;
        markReady();
        clearStall();
        void video.play().catch(() => {
          if (!cancelled) skipToStill();
        });
      };

      if (video.readyState >= 2) tryPlay();
      else video.addEventListener('loadeddata', tryPlay, { once: true });

      const onWaiting = () => armStall();
      const onPlaying = () => {
        markReady();
        clearStall();
      };

      video.addEventListener('waiting', onWaiting);
      video.addEventListener('stalled', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('error', skipToStill);

      startFail = window.setTimeout(() => {
        if (!cancelled && !startedRef.current) skipToStill();
      }, START_TIMEOUT_MS);

      return () => {
        video.removeEventListener('loadeddata', tryPlay);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('stalled', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('error', skipToStill);
      };
    };

    let teardown: (() => void) | undefined;

    const attach = () => {
      const video = videoRef.current;
      if (!video) return false;
      teardown = setup(video);
      return true;
    };

    if (!attach()) {
      raf = requestAnimationFrame(() => {
        if (!cancelled && !attach()) {
          // Still no element — skip to still rather than hang.
          skipToStill();
        }
      });
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (startFail) window.clearTimeout(startFail);
      clearStall();
      teardown?.();
    };
  }, [enabled, videoRef, markReady, skipToStill]);

  return {
    videoReady,
    videoDone,
    markReady,
    skipToStill,
    onVideoEnded: skipToStill,
  };
}
