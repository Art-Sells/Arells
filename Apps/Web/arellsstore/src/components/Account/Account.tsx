'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import { useBitcoinPrice } from '../../context/BitcoinPriceContext';
import BitcoinChartAccount from '../../components/Bitcoin/BitcoinChartAccount';
import '../../app/css/account/Account.css';
import '../../app/css/modals/account/account-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Account: React.FC = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [showLoading, setLoading] = useState<boolean>(true);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    accountLogo: false,
  });

  const handleImageLoaded = (imageName: string) => {
    console.log(`Image loaded: ${imageName}`);
    setImagesLoaded((prevState) => ({
      ...prevState,
      [imageName]: true,
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      setLoading(false);
    }
  }, [imagesLoaded]);

  const bitcoinPrice = useBitcoinPrice();

  const formattedPrice = bitcoinPrice ? Math.round(bitcoinPrice).toLocaleString('en-US') : '...';

  return (
    <>
      {showLoading && (
        <div id="accountloaderbackground">
          <Image
            loader={imageLoader}
            alt=""
            width={29}
            height={30}
            id="arells-loader-icon-account"
            src="images/Arells-Icon.png"
          />
          <div id={styles.accountloader}></div>
        </div>
      )}

      <Image
        loader={imageLoader}
        onLoad={() => handleImageLoaded('accountLogo')}
        alt=""
        width={50}
        height={16}
        id="word-logo-account"
        src="images/Arells-Logo-Ebony.png"
      />

      <p id="descriptioner-account">
        ALWAYS SELL
        <span id="descriptioner-account-crypto">BITCOIN</span>
        <span id="descriptioner-account-cryptor">FOR PROFITS</span>
      </p>

      <div id="wallet-account-wrapper">
        <div id="b-price-account">
          <span>
            <div id="b-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="bitcoin-account"
                src="images/howitworks/Bitcoin.png"
              />
            </div>
          </span>
          <span id="price-account">Price:</span>
          <span id="price-number-account">$
            <span id="price-number-account-num">
            {formattedPrice}
          </span></span>
        </div>

        <div id="transfer-buy-account">
          <span>
            <button id="buy-account">BUY</button>
          </span>
          <span>
            <button id="transfer-account">IMPORT</button>
          </span>
          {/* <span>
            <button id="sell-account">SELL</button>
          </span> */}
          <span>
            <button id="holding-account">HOLDING</button>
          </span>
        </div>

        <div id="sell-wrapper-account">
          <div id="a-price-account">
            <span>
              <div id="a-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="arells-account"
                  src="images/howitworks/ArellsBitcoin.png"
                />
              </div>
            </span>
            <span>
              <div id="b-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="bitcoin-account-wallet"
                  src="images/howitworks/Bitcoin.png"
                />
              </div>
            </span>
            <span id="holding-price-account">Price:</span>
            <span id="holding-price-number-account">$
              <span id="holding-price-number-account-num">
              {formattedPrice}
              </span>
            </span>
          </div>
          <div id="b-price-account-wallet">
            <span>
              <div id="w-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="wallet-icon-account"
                  src="images/market/wallet.png"
                />
              </div>
            </span>
            <span id="wallet-account">Wallet:</span>
            <span id="wallet-number-account">$
              <span id="wallet-number-account-num">
                0
              </span>
            </span>
          </div>

          <div id="b-profits-account">
            <span>
              <div id="w-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="profits-icon-account"
                  src="images/howitworks/up-arrow-ebony.png"
                />
              </div>
            </span>
            <span id="wallet-account-profits">Profits:</span>
            <span id="wallet-number-profits-account">$
              <span id="wallet-number-profits-account-num">
                0
              </span>
            </span>
          </div>
        </div>
        <button id="export-account">EXPORT</button>
        <div id="amount-sold-account-wrapper">
          <div id="amount-sold-num-wrap">
            <span>
              <div id="w-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="wallet-icon-account"
                  src="images/market/cash-register.png"
                />
              </div>
            </span>
            <span id="amount-sold-account-title">Sold: </span>
            <span id="amount-sold-number-account">$</span>
            <span id="amount-sold-number-account-num">0</span>
          </div>
          <button id="withdraw-account">WITHDRAW</button>
        </div>
      </div>

      <div id="bitcoin-chart-account-wrapper-footer">
        <BitcoinChartAccount />
      </div>

      <div id="footer">
        <button id="log-out-account">LOGOUT</button>
      </div>
    </>
  );
};

export default Account;