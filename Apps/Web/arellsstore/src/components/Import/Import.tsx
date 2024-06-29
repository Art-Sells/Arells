'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/import/import.css';
import '../../app/css/modals/import/import-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Import: React.FC = () => {

  const [showCopied, setCopied] = useState<boolean>(false);
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


  const copyToClipboard = () => {
    setCopied(true);
  };

  const closeCopied = () => {
    setCopied(false);
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

      {showCopied && (
        <div id="copied-wrapper">
          <div id="copied-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="copied-image" 
              src="images/market/address-ivory.png"
            />  
            <p id="copied-words">copied</p>
            <button id="copied-close" onClick={closeCopied}>OK</button> 
          </div>
        </div>
      )}

        <div id="header-navigation">
            <Link href="/account" id="home-link">
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
                        
        <p id="import-title">IMPORT</p>
        <div id="import-instructions-wrapper">
          <p id="import-instructions">Copy address. Paste it 
          into the "send Bitcoin to" address box in another exchange to import Bitcoin
          into Arells.
          </p>
        </div>
        <div id="bitcoin-address-wrapper">
            <div id="copy-bitcoin-input-wrapper">
            <input 
                id="copy-bitcoin-input"
                type="text" 
                value="bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6" 
                readOnly 
            />
            <button 
            id="copy-bitcoin-button"
            onClick={copyToClipboard}>COPY</button>
            </div>
        </div>
    </>
  );
};

export default Import;