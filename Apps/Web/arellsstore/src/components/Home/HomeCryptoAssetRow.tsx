'use client';

import type { ImageLoaderProps } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { formatHomeAssetNumber } from '../../lib/formatHomeAssetNumber';

export type HomeCryptoAssetRowData = {
  id: string;
  label: string;
  ticker: string;
  href: string;
  solidPrice: number;
  liquidPrice: number;
  solidChange1w: number;
  solidChange1y: number;
  solidChangeAll: number;
  liquidChange1w: number;
  liquidChange1y: number;
  liquidChangeAll: number;
};

type HomeCryptoAssetRowProps = {
  row: HomeCryptoAssetRowData;
  displayIsLiquidMode: boolean;
  cardNumbersVisible: boolean;
  cardShimmersFading: boolean;
  cardFadeStyle: React.CSSProperties;
  imageLoader: (props: ImageLoaderProps) => string;
  className?: string;
};

const HomeCryptoAssetRow: React.FC<HomeCryptoAssetRowProps> = ({
  row,
  displayIsLiquidMode,
  cardNumbersVisible,
  cardShimmersFading,
  cardFadeStyle,
  imageLoader,
  className = 'home-asset-row home-asset-row--appended',
}) => {
  const displayPrice = displayIsLiquidMode ? row.liquidPrice : row.solidPrice;
  const change1w = displayIsLiquidMode ? row.liquidChange1w : row.solidChange1w;
  const change1y = displayIsLiquidMode ? row.liquidChange1y : row.solidChange1y;
  const changeAll = displayIsLiquidMode ? row.liquidChangeAll : row.solidChangeAll;
  const hasData = row.liquidPrice > 0 || row.solidPrice > 0;
  const numberFadeStyle = hasData ? cardFadeStyle : { opacity: 0 };

  return (
    <div className={className}>
      <Link href={row.href} className={`home-asset-card home-asset-${row.id}`}>
        <div className="home-assets-cell home-assets-asset">
          <span className={`home-asset-label home-asset-label-${row.id}`}>
            <span
              className={`home-asset-name asset-action-button asset-action-button--${row.id} asset-action-button--invest-add asset-action-button--home-asset-chip`}
            >
              {row.id === 'bch' ? (
                <>
                  <span className="home-asset-name-bch-wide">{row.label}</span>
                  <span className="home-asset-name-bch-narrow">{row.ticker}</span>
                </>
              ) : (
                row.label
              )}
            </span>
          </span>
        </div>
        <div className="home-assets-cell" style={{ position: 'relative' }}>
          {(!cardNumbersVisible || !hasData) && (
            <span
              className={`asset-number-loader asset-number-loader--card asset-number-loader--card-price${cardShimmersFading && hasData ? ' is-hidden' : ''}`}
            />
          )}
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <span className="home-assets-currency home-assets-currency-dollar">$</span>
            <span className="home-assets-number home-assets-price">{formatHomeAssetNumber(displayPrice)}</span>
          </span>
        </div>
        <div className="home-assets-cell home-assets-percent home-assets-1w" style={{ position: 'relative' }}>
          {(!cardNumbersVisible || !hasData) && (
            <span
              className={`asset-number-loader asset-number-loader--card asset-number-loader--card-percent${cardShimmersFading && hasData ? ' is-hidden' : ''}`}
            />
          )}
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <Image
              loader={imageLoader}
              alt=""
              width={12}
              height={12}
              className="home-asset-arrow"
              src={change1w > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
            />
          </span>
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <span className="home-assets-number">
              {formatHomeAssetNumber(Math.abs(change1w))}
              <span className="home-assets-currency home-assets-currency-percent">%</span>
            </span>
          </span>
        </div>
        <div className="home-assets-cell home-assets-percent home-assets-1y" style={{ position: 'relative' }}>
          {(!cardNumbersVisible || !hasData) && (
            <span
              className={`asset-number-loader asset-number-loader--card asset-number-loader--card-percent${cardShimmersFading && hasData ? ' is-hidden' : ''}`}
            />
          )}
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <Image
              loader={imageLoader}
              alt=""
              width={12}
              height={12}
              className="home-asset-arrow"
              src={change1y > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
            />
          </span>
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <span className="home-assets-number">
              {formatHomeAssetNumber(Math.abs(change1y))}
              <span className="home-assets-currency home-assets-currency-percent">%</span>
            </span>
          </span>
        </div>
        <div className="home-assets-cell home-assets-percent" style={{ position: 'relative' }}>
          {(!cardNumbersVisible || !hasData) && (
            <span
              className={`asset-number-loader asset-number-loader--card asset-number-loader--card-percent${cardShimmersFading && hasData ? ' is-hidden' : ''}`}
            />
          )}
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <Image
              loader={imageLoader}
              alt=""
              width={12}
              height={12}
              className="home-asset-arrow"
              src={changeAll > 0 ? 'images/icons/up-arrow-ebony.png' : 'images/icons/down-arrow-ebony.png'}
            />
          </span>
          <span className="asset-header-switch-fade" style={numberFadeStyle}>
            <span className="home-assets-number">
              {formatHomeAssetNumber(Math.abs(changeAll))}
              <span className="home-assets-currency home-assets-currency-percent">%</span>
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
};

export default HomeCryptoAssetRow;
