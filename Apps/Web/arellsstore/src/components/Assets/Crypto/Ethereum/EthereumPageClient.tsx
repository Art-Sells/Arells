'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Ethereum from './ethereum';
import '../../../../app/css/Home.css';

const EthereumPageClient: React.FC = () => {
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
    <div className="asset-page asset-page--ethereum">
      <header className="asset-header asset-header--ethereum" />
      {showLoading && (
        <div className={`asset-loader-overlay asset-loader-overlay--ethereum${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div className={`asset-loader-ring asset-loader-ring--ethereum${fadeOut ? ' asset-loader-fade' : ''}`}>
            <svg className="asset-loader-spinner" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="26" />
            </svg>
            <Image alt="Ethereum" width={30} height={30} src="/images/assets/crypto/Ethereum.svg" />
          </div>
        </div>
      )}

      <Ethereum />

      <footer className="asset-footer">
        <Link className="asset-footer-about" href="/about">
          ( About )
        </Link>
      </footer>
    </div>
  );
};

export default EthereumPageClient;
