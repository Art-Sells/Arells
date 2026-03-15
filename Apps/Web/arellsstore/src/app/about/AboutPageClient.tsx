'use client';

import type { ImageLoaderProps } from 'next/image';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../css/Home.css';

const AboutPageClient = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<{ icon: boolean }>({
    icon: false,
  });

  const handleImageLoaded = () => {
    setImagesLoaded({ icon: true });
  };

  useEffect(() => {
    if (!Object.values(imagesLoaded).every(Boolean)) return;
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [imagesLoaded]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const root = document.documentElement;
    const durationMs = 8000;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const angle = ((elapsed % durationMs) / durationMs) * 360;
      root.style.setProperty('--home-shadow-angle', `${angle}deg`);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useLayoutEffect(() => {
    const edgeColor = 'rgba(232, 220, 255, 1)';
    const gradient =
      `conic-gradient(from calc(90deg + var(--home-shadow-angle, 0deg)) at var(--about-bg-x, 50%) var(--about-bg-y, 40%), rgba(80, 200, 255, 0.46), rgba(0, 220, 190, 0.5), rgba(255, 220, 120, 0.46), rgba(170, 110, 255, 0.34), rgba(80, 200, 255, 0.46), rgba(255, 120, 200, 0.34), rgba(0, 220, 190, 0.5)),` +
      `radial-gradient(220% 160% at 50% -12%, rgba(80, 200, 255, 0.4), ${edgeColor} 64%),` +
      `radial-gradient(210% 160% at 16% 8%, rgba(0, 220, 190, 0.42), ${edgeColor} 62%),` +
      `radial-gradient(210% 160% at 84% 10%, rgba(255, 220, 120, 0.4), ${edgeColor} 62%),` +
      `radial-gradient(240% 190% at 18% 96%, rgba(255, 120, 200, 0.46), ${edgeColor} 60%),` +
      `radial-gradient(240% 190% at 82% 98%, rgba(170, 110, 255, 0.4), ${edgeColor} 62%),` +
      `radial-gradient(260% 200% at 52% 118%, rgba(255, 150, 220, 0.48), ${edgeColor} 64%)`;
    const prevShadowBg = document.documentElement.style.getPropertyValue('--about-shadow-bg');
    const prevBgX = document.documentElement.style.getPropertyValue('--about-bg-x');
    const prevBgY = document.documentElement.style.getPropertyValue('--about-bg-y');
    const prevHtmlBg = document.documentElement.style.getPropertyValue('background');
    const prevBodyBg = document.body.style.getPropertyValue('background');
    const prevHtmlBgColor = document.documentElement.style.getPropertyValue('background-color');
    const prevBodyBgColor = document.body.style.getPropertyValue('background-color');
    document.documentElement.style.setProperty('--about-shadow-bg', gradient);
    document.documentElement.style.setProperty('background', 'transparent', 'important');
    document.body.style.setProperty('background', 'transparent', 'important');
    document.documentElement.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');

    let raf = 0;
    const updateCenter = () => {
      raf = 0;
      const icon = document.querySelector('.about-icon-button') as HTMLElement | null;
      if (!icon) return;
      const rect = icon.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      document.documentElement.style.setProperty('--about-bg-x', `${x}px`);
      document.documentElement.style.setProperty('--about-bg-y', `${y}px`);
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(updateCenter);
    };
    updateCenter();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (prevShadowBg) document.documentElement.style.setProperty('--about-shadow-bg', prevShadowBg);
      else document.documentElement.style.removeProperty('--about-shadow-bg');
      if (prevBgX) document.documentElement.style.setProperty('--about-bg-x', prevBgX);
      else document.documentElement.style.removeProperty('--about-bg-x');
      if (prevBgY) document.documentElement.style.setProperty('--about-bg-y', prevBgY);
      else document.documentElement.style.removeProperty('--about-bg-y');
      if (prevHtmlBg) document.documentElement.style.setProperty('background', prevHtmlBg);
      else document.documentElement.style.removeProperty('background');
      if (prevBodyBg) document.body.style.setProperty('background', prevBodyBg);
      else document.body.style.removeProperty('background');
      if (prevHtmlBgColor) document.documentElement.style.setProperty('background-color', prevHtmlBgColor);
      else document.documentElement.style.removeProperty('background-color');
      if (prevBodyBgColor) document.body.style.setProperty('background-color', prevBodyBgColor);
      else document.body.style.removeProperty('background-color');
    };
  }, []);

  return (
    <>
      {showLoading && (
        <div
          className={`home-loader-overlay home-loader-overlay--about${fadeOut ? ' home-loader-overlay-fade' : ''}`}
        >
          <div className={`home-loader-ring${fadeOut ? ' home-loader-fade' : ''}`}>
            <svg className="home-loader-spinner" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="26" />
            </svg>
            <Image
              loader={imageLoader}
              alt=""
              width={29}
              height={30}
              id="arells-loader-icon-bitcoin"
              src="images/Arells-Icon.png"
              onLoad={handleImageLoaded}
            />
          </div>
        </div>
      )}
      <div className="about-page">
        <div className="about-card">
          <div className="about-icon-wrap">
            <Link href="/" className="asset-action-button about-icon-button" aria-label="Arells">
              <span className="about-icon" aria-hidden="true" />
            </Link>
          </div>
          <div className="about-content">
            <p className="about-text">Arells is a belief that investments should never lose value.</p>
            <div className="about-divider" />
            <p className="about-text">
              This belief is powered by a ledger that shows how your investments would look if they never lost value.
            </p>
            <div className="about-divider" />
            <p className="about-text">
              This ledger is powered by a new psychological and technological invention called Vavity.
            </p>
            <div className="about-cta-row">
              <span className="about-cta-text">Learn more &gt;</span>
              <Link href="/vavity" className="asset-action-button asset-action-button--invest-show about-cta">
                (Vavity (V))
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPageClient;
