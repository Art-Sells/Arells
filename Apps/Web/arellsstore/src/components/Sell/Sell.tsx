'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/sell/Sell.css';
import '../../app/css/modals/sell/sell-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Sell: React.FC = () => {

  const [showSellFailed, setSellFailed] = useState<boolean>(false);
  const [showSellSuccess, setSellSuccess] = useState<boolean>(false);
  const [showSelling, setSelling] = useState<boolean>(false);
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);

    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
      return `/${src}?w=${width}&q=${quality || 100}`;
    }
    const [showLoading, setLoading] = useState<boolean>(true);
    const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
      accountLogo: false,
    });
  
    const handleImageLoaded = (imageName: string) => {
      console.log(`Image loaded: ${imageName}`);
      setImagesLoaded(prevState => ({ 
        ...prevState, 
        [imageName]: true 
      }));
    };
  
    useEffect(() => {
      if (Object.values(imagesLoaded).every(Boolean)) {
          setLoading(false);
      }
    }, [imagesLoaded]);
  //Loader Function/s


  const closeSellFailed = () => {
    setSellFailed(false);
  };

  const closeSellSuccess = () => {
    setSellSuccess(false);
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

      {showSelling && (
        <div id="selling-failed-wrapper">
          <div id="selling-content">
            <div className={stylings.marketplaceloader}> 
            </div>
            <Image 
                // loader={imageLoader}
                alt="" 
                width={22}
                height={22}
                id="selling-image" 
                src="/images/market/cash-register-ivory.png"
                /> 
            <p id="selling-words">confirming sale</p>
          </div>
        </div>
      )}

    {showSellSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image"
                src="/images/market/checkmark-ebony.png"
            />
            <p id="account-created-words">Sale Complete</p>
            <Link href="/transactions" passHref>
                <button id="account-created-close-two" 
                onClick={closeSellSuccess}>VIEW TRANSACTIONS
                </button>
            </Link>
        </div>
      </div>
      )}

      {showSellFailed && (
        <div id="selling-failed-wrapper">
          <div id="selling-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="selling-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="selling-failed-words">transaction failed</p>
            <button id="selling-failed-close" onClick={closeSellFailed}>OK</button> 
          </div>
        </div>
      )}
                        
        <p id="sell-title">SELL</p>

        <div id='sell-wallet-wrapper'>

            <div id="b-amount-available">
              <span>
                  <div id="b-sell-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={20}
                      height={20}
                      id="bitcoin-sell" 
                      src="images/howitworks/Bitcoin.png"/>
                  </div>
              </span>
              <span id="amount-holding-title">Amount Available To Sell</span>
            </div>

            <div id="b-price-sell-wallet">
                <span>
                    <div id="w-sell-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('accountLogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="wallet-icon-sell" 
                        src="images/market/wallet.png"/>
                    </div>
                </span>
                <span id="sell-wallet-word">Wallet:</span>
                <span id="wallet-number-sell">$
                    <span id="wallet-number-sell-num">625</span>
                </span>
            </div>

            <div id="b-profits-sell">
              <span>
                <div id="w-sell-wrapper">
                  <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="profits-icon-sell" 
                  src="images/howitworks/up-arrow-ebony.png"/>
                </div>
              </span>
              <span id="wallet-sell-profits">Profits:</span>
              <span id="wallet-number-profits-sell">$
                  <span id="wallet-number-profits-sell-num">125</span>
              </span>
            </div>
            
          <div id="sell-wrapper-sell-sell">

            <p id="sell-amount-title">
                  Sell Amount
            </p>
            <div id="b-price-sell">
              <span>
                <input 
                    id="sell-input"
                    type="tel" 
                />
              </span>
              <span>
                <div 
                    id="cash-input">
                  $  
                  </div>
              </span>
            </div>
            <div id="a-wallet-sell-wrapper">
              <span id="fees-total-word-sell">Fees:</span>
              <span id="fees-total-number-sell">$
                  <span id="fees-total-num-sell">0.00</span>
              </span>
            </div>
            <div id="a-wallet-sell-wrapper-bottom">
              <span id="total-word-sell">Total:</span>
              <span id="total-number-sell">$
                  <span id="total-num-sell">0.00</span>
              </span>
            </div>
            <button id="sell-button">
                SELL
            </button>
          </div>
        </div>
    </>
  );
};

export default Sell;