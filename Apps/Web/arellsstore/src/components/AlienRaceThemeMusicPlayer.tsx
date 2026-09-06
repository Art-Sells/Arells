'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ALIEN_RACE_THEME_SONGS,
  type AlienRaceThemeSong,
} from '../lib/bitcoinAlienRaceThemeSongs';
import { claimMediaPlayback, MEDIA_PLAYBACK_CLAIM_EVENT } from '../lib/mediaPlaybackClaim';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  );
}

function audioSrcMatches(audio: HTMLAudioElement, src: string): boolean {
  const attr = audio.getAttribute('src') || '';
  if (attr === src || attr.endsWith(src)) return true;
  try {
    return audio.src === new URL(src, window.location.href).href;
  } catch {
    return audio.src.endsWith(src);
  }
}

export default function AlienRaceThemeMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playbackTokenRef = useRef({});
  const readyHandlerRef = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [trackId, setTrackId] = useState(ALIEN_RACE_THEME_SONGS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layout, setLayout] = useState<{ left: number; width: number } | null>(null);

  const track = useMemo(
    () => ALIEN_RACE_THEME_SONGS.find((song) => song.id === trackId) || ALIEN_RACE_THEME_SONGS[0],
    [trackId]
  );

  const clearReadyHandler = useCallback(() => {
    const audio = audioRef.current;
    const handler = readyHandlerRef.current;
    if (audio && handler) {
      audio.removeEventListener('canplay', handler);
      audio.removeEventListener('loadeddata', handler);
    }
    readyHandlerRef.current = null;
  }, []);

  const pauseAudio = useCallback(() => {
    clearReadyHandler();
    const audio = audioRef.current;
    if (!audio) return;
    setIsPlaying(false);
    audio.pause();
  }, [clearReadyHandler]);

  const playAudioElement = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    claimMediaPlayback(playbackTokenRef.current);
    setIsPlaying(true);
    void audio.play().catch(() => setIsPlaying(false));
  }, []);

  /** Load `song` if needed, then play. Always starts playback (no toggle). */
  const playSong = useCallback(
    (song: AlienRaceThemeSong) => {
      const audio = audioRef.current;
      if (!audio) return;

      clearReadyHandler();
      claimMediaPlayback(playbackTokenRef.current);
      setTrackId(song.id);
      setIsPlaying(true);

      if (!audioSrcMatches(audio, song.src)) {
        audio.src = song.src;
        audio.load();
      }

      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        playAudioElement();
        return;
      }

      const onReady = () => {
        clearReadyHandler();
        playAudioElement();
      };
      readyHandlerRef.current = onReady;
      audio.addEventListener('canplay', onReady);
      audio.addEventListener('loadeddata', onReady);
    },
    [clearReadyHandler, playAudioElement]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const measure = () => {
      const inner = document.querySelector<HTMLElement>('.bitcoin-alien-race-page-inner');
      if (!inner) {
        setLayout(null);
        return;
      }
      const r = inner.getBoundingClientRect();
      setLayout({
        left: r.left + r.width / 2,
        width: r.width,
      });
    };

    measure();
    let lastWidth = window.innerWidth;
    let lastScrollX = window.scrollX;
    const onResize = () => {
      const w = window.innerWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      measure();
    };
    const onScroll = () => {
      const x = window.scrollX;
      if (x === lastScrollX) return;
      lastScrollX = x;
      measure();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mounted]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cls = 'has-alien-race-theme-player';
    if (visible) {
      document.body.classList.add(cls);
      return () => {
        document.body.classList.remove(cls);
      };
    }
    document.body.classList.remove(cls);
  }, [visible]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!visible) {
      document.documentElement.style.removeProperty('--alien-race-theme-player-offset');
      return;
    }
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const height = node.offsetHeight || 0;
      document.documentElement.style.setProperty(
        '--alien-race-theme-player-offset',
        `${height + 12}px`
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--alien-race-theme-player-offset');
    };
  }, [visible, layout]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      claimMediaPlayback(playbackTokenRef.current);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      clearReadyHandler();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [clearReadyHandler]);

  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      if ((event as CustomEvent).detail === playbackTokenRef.current) return;
      pauseAudio();
    };
    window.addEventListener(MEDIA_PLAYBACK_CLAIM_EVENT, onOtherPlay);
    return () => window.removeEventListener(MEDIA_PLAYBACK_CLAIM_EVENT, onOtherPlay);
  }, [pauseAudio]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playSong(track);
    else pauseAudio();
  };

  if (!mounted || typeof document === 'undefined') return null;

  return (
    <div
      ref={rootRef}
      className={`alien-race-theme-player${visible ? ' is-visible' : ''}`}
      style={
        layout
          ? {
              left: layout.left,
              width: layout.width,
            }
          : undefined
      }
    >
      <audio ref={audioRef} preload="metadata" src={track.src} />
      <div className="alien-race-theme-player-shell">
        <div className="alien-race-theme-player-row">
          <button
            type="button"
            className="alien-race-theme-player-play"
            aria-label={isPlaying ? 'Pause theme song' : 'Play theme song'}
            onClick={togglePlay}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="alien-race-theme-player-tracks" role="listbox" aria-label="Theme songs">
            {ALIEN_RACE_THEME_SONGS.map((song) => {
              const selected = song.id === track.id;
              return (
                <button
                  key={song.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`alien-race-theme-player-track${selected ? ' is-selected' : ''}`}
                  onClick={() => playSong(song)}
                >
                  {song.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
