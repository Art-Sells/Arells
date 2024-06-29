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
      buyLogo: false,
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
                <Image 
                // loader={imageLoader}
                alt="" 
                width={35}
                height={35}
                id="selling-image" 
                src="images/market/cash-register-ivory.png"
                />  
            </div>
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
                <button id="account-created-close" 
                onClick={closeSellSuccess}>VIEW TRANSACTIONS
                </button>
            </Link>
        </div>
      </div>
      )}

      {showSellFailed && (
        <div id="selling-failed-wrapper">
          <div id="selloing-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="selling-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="selling-words">failed export</p>
            <button id="selling-failed-close" onClick={closeSellFailed}>OK</button> 
          </div>
        </div>
      )}
                        
        <p id="sell-title">SELL</p>

        <div id='sell-wallet-wrapper'>

          <div id="sell-wrapper-sell">
              <div id="a-price-sell">
                  <span>
                    <div id="a-sell-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('accountLogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="arells-sell" 
                        src="images/howitworks/ArellsBitcoin.png"/>
                    </div>
                  </span>
                  <span>
                      <div id="b-sell-wrapper">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={20}
                          height={20}
                          id="bitcoin-sell-wallet" 
                          src="images/howitworks/Bitcoin.png"/>
                      </div>
                  </span>
                  <span id="amount-holding-title">TOTAL AMOUNT</span>
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
                  <span id="wallet-number-sell">$
                      <span id="wallet-number-sell-num">625</span>
                  </span>
              </div>

            </div>
            
            <div id="export-amount-wrapper">
                <div id="a-wallet-export">
                    <span>
                        <div id="a-export-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('accountLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="arells-export" 
                            src="images/howitworks/ArellsBitcoin.png"/>
                        </div>
                    </span>
                    <span>
                        <div id="b-export-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('accountLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-export-wallet" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="export-wallet-word">Wallet:</span>
                    <span id="export-wallet-number">$
                        <span id="export-wallet-num">2,000</span>
                    </span>
                </div>
                <div id="b-wallet-export">
                    <span>
                        <div id="b-wallet-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('accountLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-export" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="bitcoin-amount-export">Amount:</span>
                    <span id="bitcoin-amount-number">0.0005454</span>
                </div>
                <p id="export-amount-title">
                    Export Amount
                </p>
                <input 
                    id="export-input"
                    type="num" 
                />
                <p id="export-amount-title">
                    Address
                </p>
                <input 
                    id="address-input"
                    type="text" 
                />
            </div>

            <p id="exporting-title">
                Exporting
            </p>

            <p id="exporting-amount">
                0.08786
            </p>
            {/* <div id="fill-in">
            </div> */}

            <div id="losses-wrapper">
                <p id="losses-title">
                    You will lose
                </p>
                <p id="loss-amount">
                    $500.23
                </p>
            </div>

            <div id="cancel-proceed-wrapper">
                <span>
                    <button id="cancel-export">
                        CANCEL
                    </button>
                </span>
                <span>
                    <button id="proceed-export">
                        EXPORT
                    </button>
                </span>
            </div>
        </div>
    </>
  );
};

export default Sell;