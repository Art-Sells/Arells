'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { useBitcoinPrice } from '../../context/BitcoinPriceContext';
import '../../app/css/buy/buy.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
import { useHPM } from '../../context/HPMarchitecture';

const Buy: React.FC = () => {
  const [showPurchaseFailed, setPurchaseFailed] = useState<boolean>(false);
  const [showBuyingSuccess, setBuyingSuccess] = useState<boolean>(false);
  const [showBuying, setBuying] = useState<boolean>(false);
  const { buyAmount, setBuyAmount, handleBuy: contextHandleBuy } = useHPM();

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

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Exclude '*' and '#'
    setBuyAmount(Number(value));
  };

  const formatCurrency = (value: number): string => {
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const [total, setTotal] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);

  useEffect(() => {
    const calculatedFees = buyAmount * 0.03;
    setFees(calculatedFees);
    setTotal(buyAmount + calculatedFees);
  }, [buyAmount]);

  const handleBuy = async (amount: number) => {
    setBuying(true);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay

    try {
      await contextHandleBuy(amount);
      setBuying(false);
      setBuyingSuccess(true);
    } catch (error) {
      setBuying(false);
      setPurchaseFailed(true);
    }
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
            <Link href="/account" passHref>
              <button id="account-created-close-two" onClick={closeBuyingSuccess}>
                VIEW ACCOUNT
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
            <p id="buying-failed-words-one">purchase failed</p>
            <p id="buying-failed-words-two">check your bank</p>
            <button id="buying-failed-close" onClick={closePurchaseFailed}>
              OK
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
              <input id="buy-input" type="tel" onChange={handleBuyAmountChange} value={buyAmount || ''} />
            </span>
            <span>
              <div id="cash-input-buy">$</div>
            </span>
          </div>
          <div id="a-wallet-buy-wrapper">
            <span id="fees-total-word">Fees:</span>
            <span id="fees-total-number">$<span id="fees-total-num">{formatCurrency(fees)}</span></span>
          </div>
          <div id="a-wallet-buy-wrapper-bottom">
            <span id="total-word">Total:</span>
            <span id="total-number">$<span id="total-num">{formatCurrency(total)}</span></span>
          </div>
          <button id="buy-button" onClick={() => handleBuy(buyAmount)}>BUY</button>
        </div>
      </div>
    </>
  );
};

export default Buy;