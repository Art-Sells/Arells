'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GUEST_TRAILER_POSTER,
  GUEST_TRAILER_QUALITY_OPTIONS,
  GUEST_TRAILER_SOURCES,
  trailerSrcForQuality,
  type GuestTrailerQuality,
  type TrailerSources,
} from '../lib/guestTrailer';
import {
  enterPlayerFullscreen,
  exitPlayerFullscreen,
  isPlayerFullscreen,
  waitForVideoMetadata,
} from '../lib/guestTrailerFullscreen';

type GuestTrailerPlayerProps = {
  theme: 'home' | 'bitcoin';
  sources?: TrailerSources;
  poster?: string | null;
};

const CHROME_HIDE_MS = 2800;
const FULLSCREEN_CHROME_HIDE_MS = 1000;
const PLAYBACK_CLOCK_EPS = 0.04;

type VideoFrameCallbackVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

export default function GuestTrailerPlayer({
  theme,
  sources = GUEST_TRAILER_SOURCES,
  poster = GUEST_TRAILER_POSTER,
}: GuestTrailerPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingPlayRef = useRef(false);
  const qualityChangeRef = useRef(false);
  const seekRef = useRef<HTMLDivElement | null>(null);
  const seekDraggingRef = useRef(false);
  const fullscreenSuppressLoaderRef = useRef(false);
  const wantPlaybackRef = useRef(false);
  const firstFrameRef = useRef(false);
  const playbackOriginRef = useRef(0);
  const frameCallbackIdRef = useRef<number | null>(null);
  const bufferPollRef = useRef<number | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);
  const [idlePlayMounted, setIdlePlayMounted] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [chromePinned, setChromePinned] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quality, setQuality] = useState<GuestTrailerQuality>('auto');
  const [isCoarse, setIsCoarse] = useState(false);
  const [freezeUrl, setFreezeUrl] = useState<string | null>(null);
  const [seekRatio, setSeekRatio] = useState(0);

  const srcForQuality = useCallback(
    (next: GuestTrailerQuality) => trailerSrcForQuality(next, sources),
    [sources]
  );

  const showChrome = settingsOpen
    ? true
    : expanded
      ? chromePinned
      : hasStarted && (isCoarse ? chromePinned : hovering || chromePinned);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleChromeHide = useCallback(() => {
    clearHideTimer();
    if (settingsOpen) return;
    if (seekDraggingRef.current) return;
    if (expanded) {
      hideTimerRef.current = window.setTimeout(() => {
        setChromePinned(false);
      }, FULLSCREEN_CHROME_HIDE_MS);
      return;
    }
    if (!isPlaying || !hasStarted) return;
    hideTimerRef.current = window.setTimeout(() => {
      setChromePinned(false);
    }, CHROME_HIDE_MS);
  }, [clearHideTimer, expanded, hasStarted, isPlaying, settingsOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => setIsCoarse(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setExpanded(isPlayerFullscreen(playerRef.current, videoRef.current));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    const video = videoRef.current;
    video?.addEventListener('webkitbeginfullscreen', syncFullscreen);
    video?.addEventListener('webkitendfullscreen', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
      video?.removeEventListener('webkitbeginfullscreen', syncFullscreen);
      video?.removeEventListener('webkitendfullscreen', syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setSettingsOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [settingsOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (settingsOpen) setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  useEffect(() => {
    if (showChrome) scheduleChromeHide();
    return clearHideTimer;
  }, [clearHideTimer, scheduleChromeHide, showChrome]);

  const revealChrome = useCallback(() => {
    setChromePinned(true);
    scheduleChromeHide();
  }, [scheduleChromeHide]);

  const stopFrameWatch = useCallback(() => {
    const video = videoRef.current as VideoFrameCallbackVideo | null;
    if (video && frameCallbackIdRef.current != null && video.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(frameCallbackIdRef.current);
    }
    frameCallbackIdRef.current = null;
  }, []);

  const stopBufferPoll = useCallback(() => {
    if (bufferPollRef.current != null) {
      window.clearInterval(bufferPollRef.current);
      bufferPollRef.current = null;
    }
  }, []);

  const syncBuffering = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (
      fullscreenSuppressLoaderRef.current ||
      isPlayerFullscreen(playerRef.current, video)
    ) {
      setIsLoading(false);
      stopBufferPoll();
      return;
    }
    if (!wantPlaybackRef.current || video.ended) {
      setIsLoading(false);
      stopBufferPoll();
      return;
    }
    if (video.paused) {
      setIsLoading(true);
      return;
    }
    const moved = video.currentTime > playbackOriginRef.current + PLAYBACK_CLOCK_EPS;
    const ready = video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    if (firstFrameRef.current || (moved && ready) || moved) {
      setIsLoading(false);
      setFreezeUrl(null);
      stopBufferPoll();
      return;
    }
    setIsLoading(true);
  }, [stopBufferPoll]);

  const watchFirstFrame = useCallback(
    (video: HTMLVideoElement) => {
      stopFrameWatch();
      const frameVideo = video as VideoFrameCallbackVideo;
      if (typeof frameVideo.requestVideoFrameCallback !== 'function') return;
      frameCallbackIdRef.current = frameVideo.requestVideoFrameCallback(() => {
        frameCallbackIdRef.current = null;
        if (!wantPlaybackRef.current) return;
        firstFrameRef.current = true;
        syncBuffering();
      });
    },
    [stopFrameWatch, syncBuffering]
  );

  const beginPlaybackWait = useCallback(
    (video: HTMLVideoElement) => {
      wantPlaybackRef.current = true;
      firstFrameRef.current = false;
      playbackOriginRef.current = video.currentTime;
      setIsLoading(true);
      watchFirstFrame(video);
      if (bufferPollRef.current == null) {
        bufferPollRef.current = window.setInterval(syncBuffering, 100);
      }
    },
    [syncBuffering, watchFirstFrame]
  );

  useEffect(() => {
    return () => {
      stopFrameWatch();
      stopBufferPoll();
    };
  }, [stopBufferPoll, stopFrameWatch]);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setHasStarted(true);
    setPosterVisible(false);
    setIdlePlayMounted(false);
    revealChrome();
    if (!video.getAttribute('src')) {
      video.src = srcForQuality(quality);
    }
    const duration = video.duration;
    if (video.ended || (Number.isFinite(duration) && duration > 0 && video.currentTime >= duration - 0.25)) {
      video.currentTime = 0;
    }
    beginPlaybackWait(video);
    try {
      await video.play();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      wantPlaybackRef.current = false;
      stopBufferPoll();
      stopFrameWatch();
      setIsLoading(false);
    }
  }, [beginPlaybackWait, quality, revealChrome, srcForQuality, stopBufferPoll, stopFrameWatch]);

  const pauseVideo = useCallback(() => {
    wantPlaybackRef.current = false;
    stopBufferPoll();
    stopFrameWatch();
    setIsLoading(false);
    videoRef.current?.pause();
    setChromePinned(true);
    clearHideTimer();
  }, [clearHideTimer, stopBufferPoll, stopFrameWatch]);

  const togglePlay = useCallback(() => {
    if (!hasStarted) {
      void playVideo();
      return;
    }
    if (isPlaying) pauseVideo();
    else void playVideo();
  }, [hasStarted, isPlaying, pauseVideo, playVideo]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    const duration = video?.duration ?? 0;
    const current = video?.currentTime ?? 0;
    if (Number.isFinite(duration) && duration > 0 && current < duration - 0.35) {
      return;
    }
    setIsPlaying(false);
    wantPlaybackRef.current = false;
    stopBufferPoll();
    stopFrameWatch();
    setIsLoading(false);
    setHasStarted(true);
    setPosterVisible(false);
    setIdlePlayMounted(false);
    setSettingsOpen(false);
    setChromePinned(true);
    setFreezeUrl(null);
    if (Number.isFinite(duration) && duration > 0) {
      setSeekRatio(1);
      seekRef.current?.style.setProperty('--seek-ratio', '1');
    }
    void exitPlayerFullscreen(video ?? null);
  }, [stopBufferPoll, stopFrameWatch]);

  const applyQuality = useCallback(
    (next: GuestTrailerQuality) => {
      const video = videoRef.current;
      if (!video) return;
      const nextSrc = srcForQuality(next);
      const currentSrc = video.getAttribute('src') || '';
      if (currentSrc.endsWith(nextSrc) || currentSrc === nextSrc) {
        setQuality(next);
        setSettingsOpen(false);
        return;
      }
      pendingSeekRef.current = video.currentTime || 0;
      pendingPlayRef.current = !video.paused || isPlaying;
      qualityChangeRef.current = true;
      setQuality(next);
      setSettingsOpen(false);
      if (!hasStarted) {
        qualityChangeRef.current = false;
        return;
      }
      const freeze = captureVideoFrame(video);
      if (freeze) setFreezeUrl(freeze);
      beginPlaybackWait(video);
      video.src = nextSrc;
      video.load();
    },
    [beginPlaybackWait, hasStarted, isPlaying, srcForQuality]
  );

  const resumeAfterQualityChange = useCallback(() => {
    const video = videoRef.current;
    if (!video || !qualityChangeRef.current) return;
    qualityChangeRef.current = false;

    const playIfNeeded = () => {
      const shouldPlay = pendingPlayRef.current;
      pendingSeekRef.current = null;
      pendingPlayRef.current = false;
      if (!shouldPlay) {
        wantPlaybackRef.current = false;
        setIsLoading(false);
        setFreezeUrl(null);
        return;
      }
      beginPlaybackWait(video);
      void video.play().catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        wantPlaybackRef.current = false;
        setIsLoading(false);
      });
    };

    const seek = pendingSeekRef.current;
    if (seek != null && Math.abs(video.currentTime - seek) > 0.08) {
      const onSeeked = () => {
        window.clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        playIfNeeded();
      };
      const timeout = window.setTimeout(onSeeked, 2000);
      video.addEventListener('seeked', onSeeked);
      video.currentTime = seek;
      return;
    }

    playIfNeeded();
  }, [beginPlaybackWait]);

  const seekRatioFromClientX = useCallback((clientX: number) => {
    const el = seekRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(el).getPropertyValue('--seek-inset')) || 15;
    const minX = rect.left + inset;
    const maxX = rect.right - inset;
    const x = Math.min(maxX, Math.max(minX, clientX));
    return (x - minX) / Math.max(1e-6, maxX - minX);
  }, []);

  const applySeekRatio = useCallback((ratio: number) => {
    const video = videoRef.current;
    const next = Math.min(1, Math.max(0, ratio));
    setSeekRatio(next);
    seekRef.current?.style.setProperty('--seek-ratio', String(next));
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = next * video.duration;
  }, []);

  const onSeekPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      setSettingsOpen(false);
      setChromePinned(true);
      seekDraggingRef.current = true;
      event.currentTarget.classList.add('is-dragging');
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      applySeekRatio(seekRatioFromClientX(event.clientX));
    },
    [applySeekRatio, seekRatioFromClientX]
  );

  const onSeekPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!seekDraggingRef.current) return;
      event.preventDefault();
      applySeekRatio(seekRatioFromClientX(event.clientX));
    },
    [applySeekRatio, seekRatioFromClientX]
  );

  const onSeekPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!seekDraggingRef.current) return;
      event.preventDefault();
      seekDraggingRef.current = false;
      event.currentTarget.classList.remove('is-dragging');
      applySeekRatio(seekRatioFromClientX(event.clientX));
      revealChrome();
    },
    [applySeekRatio, revealChrome, seekRatioFromClientX]
  );

  const onStagePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('.guest-trailer-ctrl, .guest-trailer-menu, .guest-trailer-seek')) {
        return;
      }
      if (!hasStarted) {
        void playVideo();
        return;
      }
      if (isCoarse) {
        setChromePinned((open) => !open);
        return;
      }
      togglePlay();
    },
    [hasStarted, isCoarse, playVideo, togglePlay]
  );

  const toggleFullscreen = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setSettingsOpen(false);
      setChromePinned(true);
      const player = playerRef.current;
      const video = videoRef.current;
      if (!player || !video) return;
      fullscreenSuppressLoaderRef.current = true;
      setIsLoading(false);
      if (isPlayerFullscreen(player, video)) {
        await exitPlayerFullscreen(video);
        fullscreenSuppressLoaderRef.current = false;
        return;
      }
      setHasStarted(true);
      setPosterVisible(false);
      setIdlePlayMounted(false);
      if (!video.getAttribute('src')) {
        video.src = srcForQuality(quality);
      }
      try {
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
          video.load();
          await waitForVideoMetadata(video);
        }
        if (video.paused) {
          await video.play().catch(() => undefined);
        }
        await enterPlayerFullscreen(player, video);
        if (video.paused) {
          await video.play().catch(() => undefined);
        }
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false);
        window.setTimeout(() => {
          fullscreenSuppressLoaderRef.current = false;
        }, 800);
      }
    },
    [quality, srcForQuality]
  );

  const showPausedPlay = hasStarted && !isPlaying && !isLoading && !posterVisible;
  const showDock = showChrome || (!hasStarted && hovering && !isCoarse);

  return (
    <div
      ref={rootRef}
      className={`guest-trailer-frame guest-trailer-frame--${theme}${
        poster ? '' : ' guest-trailer-frame--no-poster'
      }`}
    >
      <div className="guest-trailer-sizer" aria-hidden="true" />
      <div
        ref={playerRef}
        className={`guest-trailer guest-trailer--${theme}${expanded ? ' is-expanded' : ''}${
          showDock ? ' is-chrome' : ''
        }`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          if (!settingsOpen) setChromePinned(false);
        }}
        onMouseMove={() => {
          if (expanded || (hasStarted && !isCoarse)) revealChrome();
        }}
      >
      <div className="guest-trailer-stage" onPointerUp={onStagePointer}>
        <video
          ref={videoRef}
          className={`guest-trailer-video${hasStarted ? ' is-on' : ''}`}
          playsInline
          preload="none"
          crossOrigin="anonymous"
          onPlay={() => {
            setIsPlaying(true);
            syncBuffering();
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setPosterVisible(false);
            setIdlePlayMounted(false);
            syncBuffering();
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => {
            const video = videoRef.current;
            if (
              !video ||
              !wantPlaybackRef.current ||
              fullscreenSuppressLoaderRef.current ||
              isPlayerFullscreen(playerRef.current, video)
            ) {
              return;
            }
            beginPlaybackWait(video);
          }}
          onStalled={() => {
            const video = videoRef.current;
            if (
              !video ||
              !wantPlaybackRef.current ||
              fullscreenSuppressLoaderRef.current ||
              isPlayerFullscreen(playerRef.current, video)
            ) {
              return;
            }
            beginPlaybackWait(video);
          }}
          onEnded={handleEnded}
          onProgress={() => {
            syncBuffering();
          }}
          onTimeUpdate={() => {
            if (seekDraggingRef.current) return;
            const video = videoRef.current;
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
            const next = video.currentTime / video.duration;
            setSeekRatio(next);
            seekRef.current?.style.setProperty('--seek-ratio', String(next));
            syncBuffering();
          }}
          onLoadedMetadata={() => {
            resumeAfterQualityChange();
            syncBuffering();
          }}
          onLoadedData={() => {
            resumeAfterQualityChange();
            syncBuffering();
          }}
          onError={() => {
            qualityChangeRef.current = false;
            pendingPlayRef.current = false;
            pendingSeekRef.current = null;
            wantPlaybackRef.current = false;
            stopBufferPoll();
            stopFrameWatch();
            setIsLoading(false);
            setFreezeUrl(null);
          }}
        />
        {poster ? (
          <img
            className={`guest-trailer-poster${posterVisible ? ' is-visible' : ''}`}
            src={poster}
            alt=""
            draggable={false}
            onTransitionEnd={() => {
              if (!posterVisible) setIdlePlayMounted(false);
            }}
          />
        ) : null}
        {freezeUrl ? (
          <img className="guest-trailer-freeze" src={freezeUrl} alt="" draggable={false} />
        ) : null}
        {isLoading && !expanded ? (
          <div className="guest-trailer-loader" aria-hidden="true">
            <span className="guest-trailer-loader-ring" />
          </div>
        ) : null}
        {idlePlayMounted ? (
          <button
            type="button"
            className={`guest-trailer-ctrl guest-trailer-ctrl--center${posterVisible && !isLoading ? ' is-visible' : ''}`}
            aria-label="Play trailer"
            onClick={(event) => {
              event.stopPropagation();
              void playVideo();
            }}
          >
            <PlayIcon />
          </button>
        ) : null}
        {showPausedPlay ? (
          <button
            type="button"
            className="guest-trailer-ctrl guest-trailer-ctrl--center is-visible"
            aria-label="Play trailer"
            onClick={(event) => {
              event.stopPropagation();
              void playVideo();
            }}
          >
            <PlayIcon />
          </button>
        ) : null}
        <div className={`guest-trailer-chrome${showDock ? ' is-visible' : ''}`}>
          {hasStarted && isPlaying && !isLoading ? (
            <button
              type="button"
              className="guest-trailer-ctrl guest-trailer-ctrl--center is-visible"
              aria-label="Pause trailer"
              onClick={(event) => {
                event.stopPropagation();
                pauseVideo();
              }}
            >
              <PauseIcon />
            </button>
          ) : null}
          <div className="guest-trailer-bottom">
            <div className="guest-trailer-settings-wrap">
              <button
                type="button"
                className="guest-trailer-ctrl guest-trailer-ctrl--settings"
                aria-label="Trailer quality"
                aria-expanded={settingsOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setSettingsOpen((open) => !open);
                  setChromePinned(true);
                }}
              >
                <SettingsIcon />
              </button>
              {settingsOpen ? (
                <div className="guest-trailer-menu" role="menu">
                  {GUEST_TRAILER_QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={quality === option.id}
                      className={`guest-trailer-menu-item${quality === option.id ? ' is-selected' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        applyQuality(option.id);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {hasStarted ? (
              <div
                ref={seekRef}
                className="guest-trailer-seek"
                style={{ ['--seek-ratio' as string]: String(seekRatio) }}
                role="slider"
                aria-label="Trailer position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(seekRatio * 100)}
                onPointerDown={onSeekPointerDown}
                onPointerMove={onSeekPointerMove}
                onPointerUp={onSeekPointerUp}
                onPointerCancel={onSeekPointerUp}
              >
                <span className="guest-trailer-seek-knob" aria-hidden="true" />
              </div>
            ) : null}
            <button
              type="button"
              className="guest-trailer-ctrl guest-trailer-ctrl--expand"
              aria-label={expanded ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={(event) => {
                void toggleFullscreen(event);
              }}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  try {
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  }
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10V4h6v2H6v4H4zm14 0V6h-4V4h6v6h-2zM4 14h2v4h4v2H4v-6zm16 0v6h-6v-2h4v-4h2z" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4H7v5H2v2h7V4zm8 0h-2v7h7V9h-5V4zM2 13v2h5v5h2v-7H2zm13 0v7h2v-5h5v-2h-7z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64L4.86 10.7c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.31.64.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.24.09.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}
