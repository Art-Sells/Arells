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
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    wordLogo: false,
  });
  const { getAsset } = useVavity();
  const [sortKey, setSortKey] = useState<'asset' | 'price' | 'change24h' | 'change90d' | 'changeAll' | 'marketCap'>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');


  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded(prevState => ({ 
      ...prevState, 
      [imageName]: true 
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 2250); // Delay of 2 seconds
  
      return () => clearTimeout(timeoutId); // Clear timeout if component unmounts
    }
  }, [imagesLoaded]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  };

  const getLatestMarketCap = (caps: number[]) => {
    for (let i = caps.length - 1; i >= 0; i -= 1) {
      if (caps[i] > 0) return caps[i];
    }
    return 0;
  };

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
      { id: 'bitcoin', label: 'Bitcoin', href: '/bitcoin' },
      { id: 'ethereum', label: 'Ethereum', href: '/ethereum' }
    ];

    return assets.map((asset) => {
      const snapshot = getAsset(asset.id);
      const history = snapshot?.history ?? [];
      const marketCap = snapshot?.vapaMarketCap ? getLatestMarketCap(snapshot.vapaMarketCap) : 0;
      const vapa = snapshot?.vapa ?? 0;
      return {
        ...asset,
        vapa,
        marketCap,
        change24h: getPercentChange(history, 1),
        change90d: getPercentChange(history, 90),
        changeAll: getPercentChange(history),
      };
    });
  }, [getAsset]);

  const sortedRows = useMemo(() => {
    const rows = [...assetRows];
    rows.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'asset':
          comparison = a.label.localeCompare(b.label);
          break;
        case 'price':
          comparison = a.vapa - b.vapa;
          break;
        case 'change24h':
          comparison = a.change24h - b.change24h;
          break;
        case 'change90d':
          comparison = a.change90d - b.change90d;
          break;
        case 'changeAll':
          comparison = a.changeAll - b.changeAll;
          break;
        case 'marketCap':
        default:
          comparison = a.marketCap - b.marketCap;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [assetRows, sortKey, sortDir]);

  const handleSort = (key: typeof sortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }
      setSortDir(key === 'asset' ? 'asc' : 'desc');
      return key;
    });
  };

  return (
    <>
      {showLoading && (
        <div style={{ padding: '24px 0' }}>
          <Image
            loader={imageLoader}
            alt=""
            width={29}
            height={30}
            id="arells-loader-icon-bitcoin"
            src="images/Arells-Icon.png"
          />
        </div>
      )}

      <Image
        loader={imageLoader}
        onLoad={() => handleImageLoaded('wordLogo')}
        alt=""
        width={100}
        height={32}
        id="word-logoo"
        src="images/Arells-Logo-Ebony.png"
      />

      <div id="descriptioner-wrapper">
        <p id="descriptioner" style={{ fontSize: '1.2em', letterSpacing: '0px', marginLeft: '0px' }}>
          If bear markets never existed
        </p>
      </div>

      <div className="home-divider" />
      <div className="home-rainbow">2 new assets added weekly</div>

      <div className="home-assets-list">
        <div className="home-assets-header-row">
          <div className="home-assets-cell home-assets-index">#</div>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('asset')}>
            Asset
          </button>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('price')}>
            Price
          </button>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('change24h')}>
            24hr
          </button>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('change90d')}>
            3 mnth
          </button>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('changeAll')}>
            all-time
          </button>
          <button type="button" className="home-assets-cell home-assets-button" onClick={() => handleSort('marketCap')}>
            MarketCap
          </button>
        </div>

        {sortedRows.map((row, index) => (
          <div key={row.id} className={`home-asset-card home-asset-${row.id}`}>
            <div className="home-assets-cell home-assets-index">{index + 1}</div>
            <Link href={row.href} className="home-assets-link">
              <div className="home-assets-cell">{row.label}</div>
              <div className="home-assets-cell">${formatCurrency(row.vapa)}</div>
              <div className="home-assets-cell">{formatPercent(row.change24h)}</div>
              <div className="home-assets-cell">{formatPercent(row.change90d)}</div>
              <div className="home-assets-cell">{formatPercent(row.changeAll)}</div>
              <div className="home-assets-cell">${formatCurrency(row.marketCap)}</div>
            </Link>
          </div>
        ))}
      </div>

    </>
  );
}

export default Index;