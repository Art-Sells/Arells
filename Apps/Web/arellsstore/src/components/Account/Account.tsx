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

      <div id="account-title-wrapper">
          <span id="account-title-left">WALLET</span>
          <span id="account-icons-wrapper">
            <span>
                <div>
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('arellsWalletLogo')}
                    alt=""
                    width={30}
                    height={30}
                    id="arells-account-icon" 
                    src="images/howitworks/ArellsBitcoin.png"/>
                </div>
            </span>
            <span>
                <div>
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('howlogo')}
                    alt=""
                    width={30}
                    height={30}
                    id="bitcoin-account-icon" 
                    src="images/howitworks/Bitcoin.png"/>
                </div>
            </span>
          </span>
          <span id="account-title-right">CREATED</span>
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