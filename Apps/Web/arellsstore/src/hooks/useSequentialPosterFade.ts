'use client';

import { useEffect, useState } from 'react';

/**
 * Sequential poster handoff: fade the loop OUT fully, then fade the still IN.
 * Never crossfades (no overlapping opacity). Black plate stays up through BOTH
 * fades so the transparent frame never flashes through.
 */
export function useSequentialPosterFade(
  videoDone: boolean,
  stillLoaded: boolean,
  fadeMs = 1500
) {
  const [videoFadedOut, setVideoFadedOut] = useState(false);
  const [stillFadeIn, setStillFadeIn] = useState(false);
  const [stillFadeDone, setStillFadeDone] = useState(false);

  const startOut = videoDone && stillLoaded;
  const showStill = stillFadeIn;
  /** Hold black for fade-out AND fade-in (matches AssetGuestLanding outroOut+outroIn). */
  const isHandoff = startOut && !stillFadeDone;

  useEffect(() => {
    if (!startOut) {
      setVideoFadedOut(false);
      setStillFadeIn(false);
      setStillFadeDone(false);
      return;
    }
    setVideoFadedOut(false);
    setStillFadeIn(false);
    setStillFadeDone(false);
    const outDone = window.setTimeout(() => setVideoFadedOut(true), fadeMs);
    return () => window.clearTimeout(outDone);
  }, [startOut, fadeMs]);

  useEffect(() => {
    if (!videoFadedOut) {
      setStillFadeIn(false);
      setStillFadeDone(false);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setStillFadeIn(true));
    });
    const inDone = window.setTimeout(() => setStillFadeDone(true), fadeMs);
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      window.clearTimeout(inDone);
    };
  }, [videoFadedOut, fadeMs]);

  return { startOut, showStill, isHandoff };
}
