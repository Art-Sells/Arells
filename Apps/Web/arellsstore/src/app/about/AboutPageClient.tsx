'use client';

import type { ImageLoaderProps } from 'next/image';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AboutPageClient = () => {
  const router = useRouter();
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
    if (!showLoading) return;
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
  }, [showLoading]);

  const [aboutSlideIn, setAboutSlideIn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAboutSlideIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
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
                loader={imageLoader}
                alt=""
                width={29}
                height={30}
                id="arells-loader-icon-bitcoin"
                className="home-loader-icon-img"
                src="images/Arells-Icon.png"
                onLoad={handleImageLoaded}
              />
            </span>
          </div>
        </div>
      )}
      <div className="about-page">
        <div className={`about-card shadow-border-wrap${aboutSlideIn ? ' page-slide-in' : ''}`}>
          <span className="shadow-border" aria-hidden="true" />
          <div className="about-icon-wrap">
            <Link href="/" className="asset-action-button about-icon-button" aria-label="Arells">
              <span className="about-icon" aria-hidden="true" />
            </Link>
          </div>
          <div className={`about-content${aboutSlideIn ? ' page-slide-in' : ''}`}>
            <div className="about-section about-section--outer myinv-accent-border">
              <div className="about-section about-section--lead myinv-accent-border">
                <p className="about-text about-text--outer">
                  Arells is a belief that investments should never lose value.
                </p>
              </div>
              <div className="about-section about-section--mid myinv-accent-border">
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <p className="about-text about-text--mid">
                    This belief is powered by a ledger that shows your investments never losing value.
                  </p>
                </div>
                <div className="about-section about-section--inner myinv-accent-border">
                  <div className="about-section about-section--inner-body myinv-accent-border">
                    <p className="about-text about-text--inner">
                      This ledger is powered by a new psychological and technological invention called Vavity.
                    </p>
                  </div>
                  <div className="about-section about-section--cta myinv-accent-border">
                    <button
                      type="button"
                      onClick={() => window.open('/vavity', '_blank')}
                      className="asset-range-button myinv-range-button about-cta-button"
                    >
                      Learn more
                    </button>
                  </div>
                </div>
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <p className="about-text about-text--mid">
                    If you&apos;ve signed up, started building your portfolio, and shared this with friends/family,
                    congratulations. Your investments never losing value is now closer to becoming a reality because
                    this is how all new financial systems begin, as beliefs.
                  </p>
                </div>
                <div className="about-section about-section--mid-body myinv-accent-border">
                  <p className="about-text about-text--mid">
                    If you believe your investments should never lose value and haven&apos;t yet signed up or shared
                    this, the time is now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPageClient;
