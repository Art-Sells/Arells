'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Bitcoin from './bitcoin';
import '../../../../app/css/Home.css';

const BitcoinPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Set global background immediately for overscroll beyond the asset page.
  useEffect(() => {
    // Use an opaque tint so overscroll can never blend back to browser white.
    const bg = 'rgb(255, 247, 236)';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    // Hard-force actual background color too (some browsers show viewport bg during overscroll).
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
    const hideTimer = setTimeout(() => {
      setLoading(false);
      setFadeOut(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="asset-page asset-page--bitcoin">
      <header className="asset-header asset-header--bitcoin" />
      {showLoading && (
        <div className={`asset-loader-overlay asset-loader-overlay--bitcoin${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div className={`asset-loader-ring asset-loader-ring--bitcoin${fadeOut ? ' asset-loader-fade' : ''}`}>
            <svg className="asset-loader-spinner" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="26" />
            </svg>
            <Image alt="Bitcoin" width={30} height={30} src="/images/assets/crypto/Bitcoin.png" />
          </div>
        </div>
      )}

      <Bitcoin />

      <footer className="asset-footer">
        <Link className="asset-footer-about" href="/about">
          ( About )
        </Link>
      </footer>
    </div>
  );
};

export default BitcoinPageClient;
