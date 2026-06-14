'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const FADE_START_MS = 1000;
const HIDE_MS = 2000;

/** Same mount loader as `/about` — accent ring + Arells icon, 1s fade then unmount. */
export default function HomeAboutMountLoader() {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!showLoading) return;
    const fadeTimer = window.setTimeout(() => setFadeOut(true), FADE_START_MS);
    const hideTimer = window.setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, HIDE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showLoading]);

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
