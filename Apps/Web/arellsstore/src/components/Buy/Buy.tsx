'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/buy/buy.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Buy: React.FC = () => {

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

                        
        <p id="export-title">BUY</p>

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
            <span id="export-wallet-word">Price:</span>
            <span id="export-wallet-number">$
                <span id="export-wallet-num">2,000</span>
            </span>
        </div>
        <p id="amount-input-word">Amount</p>
        <div id="bitcoin-address-wrapper">
            <div id="copy-bitcoin-input-wrapper">
            <input 
                id="copy-bitcoin-input"
                type="tel" 
            />
            </div>
        </div>
        <div id="a-wallet-export">
            <span id="export-wallet-word">Fees:</span>
            <span id="export-wallet-number">$
                <span id="export-wallet-num">0.00</span>
            </span>
        </div>
        <div id="a-wallet-export">
            <span id="export-wallet-word">Total:</span>
            <span id="export-wallet-number">$
                <span id="export-wallet-num">2,000</span>
            </span>
        </div>
        <button id="cancel-export">
            BUY
        </button>
    </>
  );
};

export default Buy;