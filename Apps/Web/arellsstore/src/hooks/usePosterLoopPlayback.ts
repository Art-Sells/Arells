'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const START_TIMEOUT_MS = 12000;
const STALL_TIMEOUT_MS = 10000;
const DEFAULT_FADE_MS = 1400;
const ATTACH_TRIES = 12;

export type StillToVideoMode = 'crossfade' | 'through-black';

/**
 * play → outroOut (video out + black) → outroIn (still in, black clears) → still
 * → then either:
 *   crossfade: introOut (still↔video) → play
 *   through-black: introOut (still out + black) → introIn (video in) → play
 */
type LoopPhase =
  | 'play'
  | 'outroOut'
  | 'outroIn'
  | 'still'
  | 'introOut'
  | 'introIn'
  | 'awaitStill';

/**
 * Poster / Season loop playback.
 * Video→still is always fade-through-black.
 * Still→video is crossfade (launch) or through-black (Season One).
 */
export function usePosterLoopPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled = true,
  /** Remount/reset when the video src changes (blob URL, share media, etc.). */
  sourceKey?: string,
  /** Hold still this many ms, then return to video. Omit = one-shot. */
  restartAfterStillMs?: number,
  fadeMs = DEFAULT_FADE_MS,
  /** Don’t start video→still until the image can cover after black. */
  stillReady = true,
  /** Season One: through-black both ways. Launch posters: crossfade still→video. */
  stillToVideoMode: StillToVideoMode = 'crossfade'
) {
  const [videoReady, setVideoReady] = useState(false);
  const [phase, setPhase] = useState<LoopPhase>(enabled ? 'play' : 'still');
  const startedRef = useRef(false);
  const endedWhileWaitingRef = useRef(false);
  const throughBlack = stillToVideoMode === 'through-black';

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
    endedWhileWaitingRef.current = false;
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
    let tries = 0;

    const attach = () => {
      const video = videoRef.current;
      if (!video) return false;
      teardown = setup(video);
      return true;
    };

    const tryAttach = () => {
      if (cancelled) return;
      if (attach()) return;
      tries += 1;
      if (tries >= ATTACH_TRIES) {
        skipToStill();
        return;
      }
      raf = requestAnimationFrame(tryAttach);
    };

    tryAttach();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (startFail) window.clearTimeout(startFail);
      clearStall();
      teardown?.();
    };
  }, [enabled, videoRef, markReady, skipToStill, sourceKey]);

  // Video ended → fade through black to still (wait for still first).
  const onVideoEnded = useCallback(() => {
    setPhase((prev) => {
      if (prev !== 'play') return prev;
      if (!stillReady) {
        endedWhileWaitingRef.current = true;
        return 'awaitStill';
      }
      endedWhileWaitingRef.current = false;
      return 'outroOut';
    });
  }, [stillReady]);

  useEffect(() => {
    if (!enabled || !stillReady) return;
    if (phase === 'awaitStill' || endedWhileWaitingRef.current) {
      endedWhileWaitingRef.current = false;
      setPhase('outroOut');
    }
  }, [enabled, stillReady, phase]);

  useEffect(() => {
    if (!enabled || phase !== 'outroOut') return;
    const timer = window.setTimeout(() => setPhase('outroIn'), fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, phase, fadeMs]);

  useEffect(() => {
    if (!enabled || phase !== 'outroIn') return;
    const timer = window.setTimeout(() => setPhase('still'), fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, phase, fadeMs]);

  // Hold still, then return to video.
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
      if (!throughBlack && video) {
        void video.play().catch(() => setPhase('still'));
      }
    }, restartAfterStillMs);
    return () => window.clearTimeout(timer);
  }, [enabled, restartAfterStillMs, phase, videoRef, throughBlack]);

  useEffect(() => {
    if (!enabled || phase !== 'introOut') return;
    if (!throughBlack) {
      const timer = window.setTimeout(() => setPhase('play'), fadeMs);
      return () => window.clearTimeout(timer);
    }
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
  }, [enabled, phase, fadeMs, throughBlack, videoRef]);

  useEffect(() => {
    if (!enabled || !throughBlack || phase !== 'introIn') return;
    const timer = window.setTimeout(() => setPhase('play'), fadeMs);
    return () => window.clearTimeout(timer);
  }, [enabled, throughBlack, phase, fadeMs]);

  const showVideo = throughBlack
    ? videoReady &&
      (phase === 'play' ||
        phase === 'outroOut' ||
        phase === 'introIn' ||
        phase === 'awaitStill')
    : videoReady &&
      (phase === 'play' ||
        phase === 'outroOut' ||
        phase === 'introOut' ||
        phase === 'awaitStill');

  const videoFadingOut = phase === 'outroOut';
  /** Still must opacity-fade during introOut or through-black snaps image→video. */
  const stillFadingOut = phase === 'introOut';
  const onStill = phase === 'still';
  const showStillLayer =
    phase === 'still' || phase === 'outroIn' || phase === 'introOut';
  // Black on video→still out; Season One also blacks still→video out.
  const isHandoff = throughBlack
    ? phase === 'outroOut' || phase === 'introOut'
    : phase === 'outroOut';
  const videoDone = throughBlack
    ? phase !== 'play' && phase !== 'introIn' && phase !== 'awaitStill'
    : phase !== 'play' && phase !== 'introOut' && phase !== 'awaitStill';

  return {
    videoReady,
    videoDone,
    onStill,
    showStillLayer,
    showVideo,
    videoFadingOut,
    stillFadingOut,
    isHandoff,
    markReady,
    skipToStill,
    onVideoEnded,
  };
}
