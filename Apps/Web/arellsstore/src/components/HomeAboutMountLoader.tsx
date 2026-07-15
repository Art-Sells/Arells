'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const DEFAULT_FADE_START_MS = 1000;
const DEFAULT_HIDE_MS = 2000;

type HomeAboutMountLoaderProps = {
  /** When data is already SSR’d, shorten the cosmetic splash. */
  fadeStartMs?: number;
  hideMs?: number;
};

/** Same mount loader as `/about` — accent ring + Arells icon. */
export default function HomeAboutMountLoader({
  fadeStartMs = DEFAULT_FADE_START_MS,
  hideMs = DEFAULT_HIDE_MS,
}: HomeAboutMountLoaderProps = {}) {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!showLoading) return;
    const fadeTimer = window.setTimeout(() => setFadeOut(true), fadeStartMs);
    const hideTimer = window.setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, hideMs);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showLoading, fadeStartMs, hideMs]);

  if (!showLoading) return null;

  return (
    <div
      className={`home-loader-overlay home-loader-overlay--about${fadeOut ? ' home-loader-overlay-fade' : ''}`}
      aria-hidden="true"
    >
      <div className={`home-loader-ring${fadeOut ? ' home-loader-fade' : ''}`}>
        <svg className="home-loader-spinner" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <filter id="homeLoaderBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <circle cx="30" cy="30" r="26" filter="url(#homeLoaderBlur)" />
        </svg>
        <span className="home-loader-icon-wrap" aria-hidden="true">
          <span className="home-loader-icon-tint" aria-hidden="true" />
          <Image
            src="/images/Arells-Icon.png"
            alt=""
            width={29}
            height={30}
            className="home-loader-icon-img"
            priority
          />
        </span>
      </div>
    </div>
  );
}
