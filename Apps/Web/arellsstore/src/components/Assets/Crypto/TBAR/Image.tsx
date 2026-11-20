'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

const FADE_MS = 900;

type TBARImageProps = {
  src: string;
  theme: 'myinv' | 'bitcoin';
  href?: string;
  label: string;
};

export default function TBARImage({ src, theme, href, label }: TBARImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    setLoaded(false);
    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    const reveal = () => {
      if (cancelled) return;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) setLoaded(true);
        });
      });
    };
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) reveal();
    return () => {
      cancelled = true;
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
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
          className={`tbar-thumb-loader${loaded ? ' is-fading' : ''}`}
          aria-hidden="true"
        >
          <div
            className={`tbar-inflow-circle${
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
        className={`tbar-thumb-img${loaded ? ' is-visible' : ''}`}
        onLoad={() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setLoaded(true));
          });
        }}
      />
    </>
  );

  const className = `tbar-thumb${loaded ? ' is-loaded' : ''}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {media}
      </Link>
    );
  }

  return <div className={className}>{media}</div>;
}
