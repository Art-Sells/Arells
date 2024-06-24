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
            id="arells-loader-icon-how" 
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
              src="images/market/key.png"
            />  
            <p id="copied-words">copied</p>
            <button id="copied-close" onClick={closeCopied}>OK</button> 
          </div>
        </div>
      )}

        <div>
          <div id="import-title-wrapper">
              <span id="import-title-left">WALLET</span>
              <span id="import-icons-wrapper">
                <span>
                    <div>
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('arellsWalletLogo')}
                        alt=""
                        width={30}
                        height={30}
                        id="arells-import-icon" 
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
                        id="bitcoin-import-icon" 
                        src="images/howitworks/Bitcoin.png"/>
                    </div>
                </span>
              </span>
              <span id="import-title-right">CREATED</span>
          </div>
          <div id="import-wrapper">
            <p id="arells-second-core-belief">we believe in empowering you as an investor 
              so we do not save your Bitcoin Private Key online
            </p>
            <hr id="second-belief-line"/>
            <p id="arells-second-core-belief-instruction">so before you continue, 
                copy & save your Bitcoin Private Key offline, 
                you will need it to export and send your Bitcoin
            </p>
            <p id="bitcoin-private-key-title">BITCOIN PRIVATE KEY</p>
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
        </div>
    </>
  );
};

export default Import;