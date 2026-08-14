'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GUEST_TRAILER_POSTER,
  GUEST_TRAILER_QUALITY_OPTIONS,
  guestTrailerSrcForQuality,
  type GuestTrailerQuality,
} from '../lib/guestTrailer';
import {
  enterPlayerFullscreen,
  exitPlayerFullscreen,
  isPlayerFullscreen,
  waitForVideoMetadata,
} from '../lib/guestTrailerFullscreen';

type GuestTrailerPlayerProps = {
  theme: 'home' | 'bitcoin';
};

const CHROME_HIDE_MS = 2800;
const FULLSCREEN_CHROME_HIDE_MS = 1000;

export default function GuestTrailerPlayer({ theme }: GuestTrailerPlayerProps) {
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

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setHasStarted(true);
    setIsLoading(true);
    setPosterVisible(false);
    revealChrome();
    if (!video.getAttribute('src')) {
      video.src = guestTrailerSrcForQuality(quality);
    }
    try {
      await video.play();
    } catch {
      setIsLoading(false);
    }
  }, [quality, revealChrome]);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    setChromePinned(true);
    clearHideTimer();
  }, [clearHideTimer]);

  const togglePlay = useCallback(() => {
    if (!hasStarted) {
      void playVideo();
      return;
    }
    if (isPlaying) pauseVideo();
    else void playVideo();
  }, [hasStarted, isPlaying, pauseVideo, playVideo]);

  const stopToIdle = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setHasStarted(false);
    setIsPlaying(false);
    setIsLoading(false);
    setPosterVisible(true);
    setIdlePlayMounted(true);
    setExpanded(false);
    setSettingsOpen(false);
    setChromePinned(false);
    pendingSeekRef.current = null;
    pendingPlayRef.current = false;
    qualityChangeRef.current = false;
    seekDraggingRef.current = false;
    setSeekRatio(0);
    setFreezeUrl(null);
    void exitPlayerFullscreen(video);
  }, []);

  const applyQuality = useCallback(
    (next: GuestTrailerQuality) => {
      const video = videoRef.current;
      if (!video) return;
      const nextSrc = guestTrailerSrcForQuality(next);
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
      setIsLoading(true);
      video.src = nextSrc;
      video.load();
    },
    [hasStarted, isPlaying]
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
        setIsLoading(false);
        setFreezeUrl(null);
        return;
      }
      void video.play().catch(() => {
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
  }, []);

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
      if (!video.getAttribute('src')) {
        video.src = guestTrailerSrcForQuality(quality);
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
    [quality]
  );

  const showPausedPlay = hasStarted && !isPlaying && !isLoading && !posterVisible;
  const showDock = showChrome || (!hasStarted && hovering && !isCoarse);

  return (
    <div
      ref={rootRef}
      className={`guest-trailer-frame guest-trailer-frame--${theme}`}
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
            setIsLoading(false);
            setFreezeUrl(null);
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setIsLoading(false);
            setPosterVisible(false);
            setFreezeUrl(null);
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => {
            if (
              hasStarted &&
              !fullscreenSuppressLoaderRef.current &&
              !isPlayerFullscreen(playerRef.current, videoRef.current)
            ) {
              setIsLoading(true);
            }
          }}
          onEnded={stopToIdle}
          onTimeUpdate={() => {
            if (seekDraggingRef.current) return;
            const video = videoRef.current;
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
            const next = video.currentTime / video.duration;
            setSeekRatio(next);
            seekRef.current?.style.setProperty('--seek-ratio', String(next));
          }}
          onLoadedMetadata={() => {
            resumeAfterQualityChange();
          }}
          onLoadedData={resumeAfterQualityChange}
          onCanPlay={() => {
            if (!videoRef.current?.paused) {
              setIsLoading(false);
              return;
            }
            if (!pendingPlayRef.current && !qualityChangeRef.current) {
              setIsLoading(false);
            }
          }}
          onError={() => {
            qualityChangeRef.current = false;
            pendingPlayRef.current = false;
            pendingSeekRef.current = null;
            setIsLoading(false);
            setFreezeUrl(null);
          }}
        />
        <img
          className={`guest-trailer-poster${posterVisible ? ' is-visible' : ''}`}
          src={GUEST_TRAILER_POSTER}
          alt=""
          draggable={false}
          onTransitionEnd={() => {
            if (!posterVisible) setIdlePlayMounted(false);
          }}
        />
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
