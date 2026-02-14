'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Bitcoin from './bitcoin';
import '../../../../app/css/Home.css';

const BitcoinPageClient: React.FC = () => {
  const [showLoading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

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
      <header className="asset-header asset-header--bitcoin">
        <Link className="asset-home-button" href="/">
          <Image alt="Arells" width={18} height={18} src="/images/Arells-Icon.png" />
        </Link>
        <div className="asset-header-title">Bitcoin</div>
        <div className="asset-header-slogan">if bear markets never existed</div>
      </header>
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
