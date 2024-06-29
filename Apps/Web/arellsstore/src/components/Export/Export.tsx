'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/export/export.css';
import '../../app/css/modals/export/export-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Export: React.FC = () => {

  const [showExportFailed, setExportFailed] = useState<boolean>(false);
  const [showExportMore, setExportMore] = useState<boolean>(false);
  const [showExportSuccess, setExportSuccess] = useState<boolean>(false);
  const [showExporting, setExporting] = useState<boolean>(false);
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


  const closeExportFailed = () => {
    setExportFailed(false);
  };

  const closeExportMore = () => {
    setExportMore(false);
  };

  const closeExportSuccess = () => {
    setExportSuccess(false);
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

      {showExporting && (
        <div id="export-failed-wrapper">
          <div id="export-content">
            <div className={stylings.marketplaceloader}>
                <Image 
                // loader={imageLoader}
                alt="" 
                width={35}
                height={35}
                id="export-failed-image" 
                src="images/market/export.png"
                />  
            </div>
            <p id="export-failed-words">exporting</p>
          </div>
        </div>
      )}

    {showExportSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image"
                src="/images/market/checkmark-ebony.png"
            />
            <p id="account-created-words">Export Complete</p>
            <Link href="/transactions" passHref>
                <button id="account-created-close" onClick={closeExportSuccess}>VIEW TRANSACTIONS</button>
            </Link>
        </div>
      </div>
      )}

      {showExportFailed && (
        <div id="export-failed-wrapper">
          <div id="export-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="export-failed-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="export-failed-words">failed export</p>
            <button id="export-failed-close" onClick={closeExportFailed}>OK</button> 
          </div>
        </div>
      )}

      {showExportMore && (
        <div id="export-failed-wrapper">
          <div id="export-more-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="export-failed-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="export-failed-words">export more Bitcoin</p>
            <button id="export-failed-close" onClick={closeExportMore}>OK</button> 
          </div>
        </div>
      )}

        <div id="header-navigation">
            <Link href="/" id="home-link">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={23}
                height={23}
                id="account-navigation"
                src="images/howitworks/ArellsBitcoin.png"
              />
            </Link>							
            <Link href="/buy" id="cart-link">
              <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('buyLogo')}
                  alt=""
                  width={23}
                  height={23}
                  id="buy-navigation"
                  src="images/howitworks/Bitcoin.png"
                />
            </Link>	
        </div>
                        
        <p id="export-title">EXPORT</p>

        <div id="export-wallet-wrapper">

          <div id="a-wallet-export">
              <span>
                  <div id="w-account-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={20}
                      height={20}
                      id="wallet-icon-export" 
                      src="images/market/wallet.png"/>
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

          <div id="export-amount-wrapper">

            <div id="export-input-wrapper">

              <p id="export-amount-title">
                    Export Amount
                </p>
                <input 
                    id="export-input"
                    type="tel" 
                />
                <p id="export-amount-title">
                    Export Address
                </p>
                <input 
                    id="address-input"
                    type="text" 
                />  
            </div>

            <p id="exporting-title">
                Exporting
            </p>

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

            <p id="exporting-amount">
                Total Exporting Value
            </p>

            <div id="a-wallet-export">
                <span>
                    <div id="w-account-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('accountLogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="wallet-icon-export" 
                        src="images/market/wallet.png"/>
                    </div>
                </span>
                <span id="export-wallet-word">Wallet:</span>
                <span id="export-wallet-number">$
                    <span id="export-wallet-num">2,000</span>
                </span>
            </div>


            {/* <div id="fill-in">
            </div> */}

            <div id="a-losses-export">
                <span>
                  <div id="w-losses-wrapper">
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="losses-icon-export" 
                    src="images/howitworks/down-arrow-ebony.png"/>
                  </div>
                </span>
                <span id="wallet-account-losses">You will lose:</span>
                <span id="#wallet-number-losses">$
                    <span id="#wallet-number-losses-num">2,000</span>
                </span>
            </div>

            <p id="losses-title">
              Are You Sure?
            </p>

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
        </div>

        
    </>
  );
};

export default Export;