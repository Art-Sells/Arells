'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { useBitcoinPrice } from '../../context/BitcoinPriceContext';
import '../../app/css/buy/buy.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Buy: React.FC = () => {
  const [showPurchaseFailed, setPurchaseFailed] = useState<boolean>(false);
  const [showBuyingSuccess, setBuyingSuccess] = useState<boolean>(false);
  const [showBuying, setBuying] = useState<boolean>(false);
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);

  //Loader Function/s
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

  // Fetch Bitcoin price
  const bitcoinPrice = useBitcoinPrice();
  const formattedPrice = bitcoinPrice ? Math.round(bitcoinPrice).toLocaleString('en-US') : '...';

  const closePurchaseFailed = () => {
    setPurchaseFailed(false);
  };

  const closeBuyingSuccess = () => {
    setBuyingSuccess(false);
  };

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

      {showBuying && (
        <div id="buying-wrapper">
          <div id="buying-content">
            <div className={stylings.marketplaceloader}></div>
            <Image
              // loader={imageLoader}
              alt=""
              width={22}
              height={22}
              id="buying-image"
              src="/images/market/cash-register-ivory.png"
            />
            <p id="buying-words">confirming purchase</p>
          </div>
        </div>
      )}

      {showBuyingSuccess && (
        <div id="account-created-wrapper">
          <div id="account-created-content">
            <Image
              alt=""
              width={35}
              height={35}
              id="account-created-image"
              src="/images/market/checkmark-ebony.png"
            />
            <p id="account-created-words">Purchase Complete</p>
            <Link href="/transactions" passHref>
              <button id="account-created-close-two" onClick={closeBuyingSuccess}>
                VIEW TRANSACTIONS
              </button>
            </Link>
          </div>
        </div>
      )}

      {showPurchaseFailed && (
        <div id="buying-wrapper">
          <div id="buying-failed-content">
            <Image
              loader={imageLoader}
              alt=""
              width={35}
              height={35}
              id="buying-image"
              src="images/market/cancelled-ivory.png"
            />
            <p id="buying-failed-words-one">Purchase Failed</p>
            <p id="buying-failed-words-two">Check Bank Account</p>
            <Link href="/bank_account" passHref></Link>
            <button id="buying-failed-close" onClick={closePurchaseFailed}>
              VIEW CONNECTED BANK
            </button>
          </div>
        </div>
      )}

      <p id="buy-title">BUY</p>

      <div id="buy-info-wrapper">
        <div id="a-wallet-buy">
          <span>
            <div id="b-buy-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="bitcoin-buy"
                src="images/howitworks/Bitcoin.png"
              />
            </div>
          </span>
          <span id="buy-wallet-word">Price:</span>
          <span id="buy-wallet-number">$<span id="buy-wallet-num">{formattedPrice}</span></span>
        </div>

        <div id="buy-input-wrapper">
          <p id="amount-input-word">Buy Amount</p>
          <div id="b-price-buy">
            <span>
              <input id="buy-input" type="tel" />
            </span>
            <span>
              <div id="cash-input-buy">$</div>
            </span>
          </div>
          <div id="a-wallet-buy-wrapper">
            <span id="fees-total-word">Fees:</span>
            <span id="fees-total-number">$<span id="fees-total-num">0.00</span></span>
          </div>
          <div id="a-wallet-buy-wrapper-bottom">
            <span id="total-word">Total:</span>
            <span id="total-number">$<span id="total-num">2,000.00</span></span>
          </div>
          <button id="buy-button">BUY</button>
        </div>
      </div>
    </>
  );
};

export default Buy;