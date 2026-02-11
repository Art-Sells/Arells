"use client";

import type { ImageLoaderProps } from 'next/image';
import '../app/css/Home.css';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useVavity } from '../context/VavityAggregator';

const Index = () => {
  // Loader Functions
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    wordLogo: false,
  });
  const { getAsset } = useVavity();


  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded(prevState => ({ 
      ...prevState, 
      [imageName]: true 
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
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
    }
  }, [imagesLoaded]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) =>
    `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  const getPercentChange = (history: { date: string; price: number }[], days?: number) => {
    if (!history.length) return 0;
    const latest = history[history.length - 1]?.price ?? 0;
    if (latest <= 0) return 0;
    if (days == null) {
      const first = history.find((entry) => entry.price > 0)?.price ?? 0;
      return first > 0 ? ((latest - first) / first) * 100 : 0;
    }
    const lastDate = history[history.length - 1]?.date;
    if (!lastDate) return 0;
    const cutoff = new Date(`${lastDate}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    let base = history[0]?.price ?? 0;
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entryDate = new Date(`${history[i].date}T00:00:00.000Z`);
      if (entryDate <= cutoff) {
        base = history[i].price;
        break;
      }
    }
    return base > 0 ? ((latest - base) / base) * 100 : 0;
  };

  const assetRows = useMemo(() => {
    const assets = [
      { id: 'bitcoin', label: 'Bitcoin', href: '/bitcoin', icon: 'images/assets/crypto/Bitcoin.png' },
      { id: 'ethereum', label: 'Ethereum', href: '/ethereum', icon: 'images/assets/crypto/Ethereum.svg' }
    ];

    return assets.map((asset) => {
      const snapshot = getAsset(asset.id);
      const history = snapshot?.history ?? [];
      const vapa = snapshot?.vapa ?? 0;
      return {
        ...asset,
        vapa,
        change1w: getPercentChange(history, 7),
        change1y: getPercentChange(history, 365),
        changeAll: getPercentChange(history),
      };
    });
  }, [getAsset]);

  const sortedRows = assetRows;

  return (
    <>
      {showLoading && (
        <div className={`home-loader-overlay${fadeOut ? ' home-loader-overlay-fade' : ''}`}>
          <div className={`home-loader-ring${fadeOut ? ' home-loader-fade' : ''}`}>
            <Image
              loader={imageLoader}
              alt=""
              width={29}
              height={30}
              id="arells-loader-icon-bitcoin"
              src="images/Arells-Icon.png"
            />
          </div>
        </div>
      )}

      <div className="home-header-inner">
        <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
            width={70}
            height={23}
          id="word-logoo"
          src="images/Arells-Logo-Ebony.png"
        />

        <div id="descriptioner-wrapper">
          <p id="descriptioner" style={{ letterSpacing: '0px', marginLeft: '0px' }}>
            if bear markets never existed
          </p>
        </div>
      </div>

      <div className="home-section-line" />

      <div className="home-rainbow home-rainbow-left">2 new Assets added weekly</div>

      <div className="home-assets-wrapper">
        <div className="home-assets-list">
          <div className="home-assets-header-row">
            <div className="home-assets-cell home-assets-index"></div>
          <div className="home-assets-cell home-assets-button">
              Asset
          </div>
          <div className="home-assets-cell home-assets-button">
              Price
          </div>
          <div className="home-assets-cell home-assets-button home-assets-1w">
              1 wk
          </div>
          <div className="home-assets-cell home-assets-button">
              1 yr
          </div>
          <div className="home-assets-cell home-assets-button">
              all-time
          </div>
          </div>

        {sortedRows.map((row, index) => (
            <div key={row.id} className="home-asset-row">
              <div className="home-assets-cell home-assets-index">{index + 1}</div>
              <Link href={row.href} className={`home-asset-card home-asset-${row.id}`}>
                <span className="home-asset-icon-wrap">
                  <Image
                    loader={imageLoader}
                    alt={`${row.label} logo`}
                    width={18}
                    height={18}
                    className="home-asset-icon"
                    src={row.icon}
                  />
                </span>
                <div className="home-assets-cell home-assets-asset">
                  <span className={`home-asset-label home-asset-label-${row.id}`}>
                    <span className="home-asset-name">{row.label}</span>
                  </span>
                </div>
                <div className="home-assets-cell">
                  <span className="home-assets-currency home-assets-currency-dollar">$</span>
                  <span className="home-assets-number">{formatCurrency(row.vapa)}</span>
                </div>
                <div className="home-assets-cell home-assets-percent home-assets-1w">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.change1w > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.change1w).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
                <div className="home-assets-cell home-assets-percent">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.change1y > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.change1y).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
                <div className="home-assets-cell home-assets-percent">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={12}
                    height={12}
                    className="home-asset-arrow"
                    src={row.changeAll > 0 ? 'images/up-arrow-ebony.png' : 'images/down-arrow-ebony.png'}
                  />
                  <span className="home-assets-number">
                    {formatPercent(row.changeAll).replace('%', '')}
                    <span className="home-assets-currency home-assets-currency-percent">%</span>
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </>
  );
}

export default Index;