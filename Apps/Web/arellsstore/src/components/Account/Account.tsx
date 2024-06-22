'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/account/Account.css';
import '../../app/css/modals/account/account-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Account: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
      return `/${src}?w=${width}&q=${quality || 100}`;
    }
    const [showLoading, setLoading] = useState<boolean>(true);
    const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
      arellsWalletLogo: false,
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





  return (
    <>
      {showLoading && (
        <div id="accountloaderbackground">
          <Image 
            loader={imageLoader}
            alt="" 
            width={29}
            height={30}
            id="arells-loader-icon-how" 
            src="images/Arells-Icon.png"
          />    
          <div id={styles.accountloader}></div>    
        </div>
      )}

      <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('howlogo')}
          alt=""
          width={50}
          height={16}
          id="word-logo-account" 
          src="images/Arells-Logo.png"/>	

      <hr id="black-liner-account"/>
      <p id="descriptioner-account">
          NEVER LOSE MONEY SELLING 
          <span id="descriptioner-account-crypto"> CRYPTOCURRENCIES</span>
          </p>
      <hr id="black-liner-account"/>   


      <div id="how-it-works-guide-wrapper">

        <div id="b-price-how">
            <span>
                <div id="b-how-wrapper">
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('howlogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="bitcoin-how" 
                    src="images/howitworks/Bitcoin.png"/>
                </div>
            </span>
            <span id="price-how">Price:</span>
            <span id="price-number-how">$
                <span id="price-number-how-num">60,000</span>
            </span>
        </div>

        <div id="transfer-buy">
          <span>
            <button id="transfer-how">
                IMPORT
            </button>
          </span>
          <span>
            <button id="buy-how">
                BUY
            </button>
          </span>
          <span>
            <button id="sell-how">
                SELL
            </button>
          </span>
          {/* <span>
            <button id="holding-how">
                HOLDING
            </button>
          </span> */}
        </div>


        <div id="sell-wrapper-how">

            <div id="b-price-how">
                <span>
                    <div id="a-how-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('howlogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="arells-how" 
                        src="images/howitworks/ArellsBitcoinIvory.png"/>
                    </div>
                </span>
                <span>
                    <div id="b-how-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('howlogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="bitcoin-how-wallet" 
                        src="images/howitworks/Bitcoin.png"/>
                    </div>
                </span>
                <span id="holding-price-how">Price:</span>
                <span id="wallet-price-number-how">$
                    <span id="wallet-price-number-how-num">75,000</span>
                </span>
            </div>
            <hr id="black-liner-wallet"/>  
            <div id="b-price-how">
                <span>
                    <div id="w-how-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('howlogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="wallet-icon-how" 
                        src="images/market/wallet-ivory.png"/>
                    </div>
                </span>
                <span id="wallet-how">Wallet:</span>
                <span id="wallet-number-how">$
                    <span id="wallet-number-how-num">625</span>
                </span>
            </div>

            <hr id="black-liner-wallet-profits"/>  

            <div id="b-price-how">
                <span>
                    <div id="w-how-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('howlogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="profits-icon-how" 
                        src="images/howitworks/up-arrow.png"/>
                    </div>
                </span>
                <span id="wallet-how-profits">Profits:</span>
                <span id="wallet-number-profits-how">$
                    <span id="wallet-number-profits-how-num">125</span>
                </span>
            </div>


        </div>

      </div>
      <div id="account-wallet-wrapper">
      </div>
      <button id="account-continue">
        CONTINUE
      </button>
    </>
  );
};

export default Account;