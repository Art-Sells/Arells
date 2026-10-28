'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const START_TIMEOUT_MS = 5000;
const STALL_TIMEOUT_MS = 6000;
const DEFAULT_FADE_MS = 1400;

/**
 * play → (video ends) → outroIn (still fades in from black) → still
 * → introOut (still fades out to black) → introIn (video fades in from black) → play …
 *
 * No separate video fade-out after ended — the clip is already done, so a full
 * outroOut just left a long black sit that photo→video never had.
 */
type LoopPhase = 'play' | 'outroIn' | 'still' | 'introOut' | 'introIn';

/**
 * Poster loop with fade-through-black both ways, matched timing:
 * one fade beat out, one fade beat in (fadeMs each). Video end skips straight
 * to still fade-in (no extra black hold on a finished clip).
 */
export function usePosterLoopPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled = true,
  /** Hold still this many ms, then fade through black and replay. Omit = one-shot. */
  restartAfterStillMs?: number,
  fadeMs = DEFAULT_FADE_MS
) {
  const [videoReady, setVideoReady] = useState(false);
  const [phase, setPhase] = useState<LoopPhase>(enabled ? 'play' : 'still');
  const startedRef = useRef(false);

  const skipToStill = useCallback(() => {
    setPhase('still');
  }, []);

  const markReady = useCallback(() => {
    startedRef.current = true;
    setVideoReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPhase('still');
      return;
    }

    startedRef.current = false;
    setVideoReady(false);
    setPhase('play');

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

  // Video already finished — go straight to still fade-in (no extra black hold).
  const onVideoEnded = useCallback(() => {
    setPhase((prev) => (prev === 'play' || prev === 'introIn' ? 'outroIn' : prev));
  }, []);

  useEffect(() => {
    if (!enabled || phase !== 'outroIn') return;
    const timer = window.setTimeout(() => setPhase('still'), fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, phase, fadeMs]);

  // Hold still, then fade still out through black (same fadeMs as still fade-in).
  useEffect(() => {
    if (!enabled || !restartAfterStillMs || phase !== 'still') return;
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
          video.currentTime = 0;
        } catch {
          /* ignore seek before metadata */
        }
      }
      setPhase('introOut');
    }, restartAfterStillMs);
    return () => window.clearTimeout(timer);
  }, [enabled, restartAfterStillMs, phase, videoRef]);

  useEffect(() => {
    if (!enabled || phase !== 'introOut') return;
    const timer = window.setTimeout(() => {
      setPhase('introIn');
      const video = videoRef.current;
      if (!video) return;
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
      void video.play().catch(() => setPhase('still'));
    }, fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, phase, fadeMs, videoRef]);

  useEffect(() => {
    if (!enabled || phase !== 'introIn') return;
    const timer = window.setTimeout(() => setPhase('play'), fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, phase, fadeMs]);

  // Sequential: never show still + video fading at the same time.
  const showVideo = videoReady && (phase === 'play' || phase === 'introIn');
  const onStill = phase === 'still';
  const showStillLayer = phase === 'still' || phase === 'outroIn';
  // Black under the OUT: still→black (introOut) and black→still (outroIn start).
  // Cleared when the IN layer is settled / while video fades in.
  const isHandoff = phase === 'introOut' || phase === 'outroIn';
  const videoDone = phase !== 'play' && phase !== 'introIn';

  return {
    videoReady,
    videoDone,
    onStill,
    showStillLayer,
    showVideo,
    /** Video is hidden as soon as it ends — no lingering fade-out beat. */
    videoFadingOut: false,
    isHandoff,
    markReady,
    skipToStill,
    onVideoEnded,
  };
}
