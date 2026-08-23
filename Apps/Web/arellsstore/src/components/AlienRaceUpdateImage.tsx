'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

const FADE_MS = 900;

type AlienRaceUpdateImageProps = {
  src: string;
  theme: 'myinv' | 'bitcoin';
  href?: string;
  label: string;
};

export default function AlienRaceUpdateImage({ src, theme, href, label }: AlienRaceUpdateImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  useEffect(() => {
    if (!loaded) return;
    const timeout = window.setTimeout(() => setLoaderGone(true), FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [loaded]);

  const media = (
    <>
      {loaderGone ? null : (
        <div
          className={`alien-race-updates-thumb-loader${loaded ? ' is-fading' : ''}`}
          aria-hidden="true"
        >
          <div
            className={`alien-race-inflow-circle${
              theme === 'myinv' ? ' asset-summary-circle-loader--myinv' : ''
            }`}
          >
            <div className="asset-summary-circle-loader-ring" />
          </div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt=""
        className={`alien-race-updates-thumb-img${loaded ? ' is-visible' : ''}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );

  const className = `alien-race-updates-thumb${loaded ? ' is-loaded' : ''}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {media}
      </Link>
    );
  }

  return <div className={className}>{media}</div>;
}
