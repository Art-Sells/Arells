'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/export/export.css';
import '../../app/css/modals/export/export-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Export: React.FC = () => {

  const [showExportFailed, setExportFailed] = useState<boolean>(false);
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

        <div id="bitcoin-address-wrapper">
            <div id="copy-bitcoin-input-wrapper">
            <input 
                id="copy-bitcoin-input"
                type="text" 
                value="bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6" 
                readOnly 
            />
            </div>
        </div>

        <p id="exporting-title">
            Exporting Amount
        </p>

        <p id="exporting-amount">
            $1,200.50
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
    </>
  );
};

export default Export;