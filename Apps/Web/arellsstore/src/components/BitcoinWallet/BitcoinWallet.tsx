'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/bitcoin/BitcoinWalletCreated.css';
import '../../app/css/modals/walletcreated/walletcreated-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const BitcoinWalletCreated: React.FC = () => {

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



  const createWallet = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) {
      }
      const data = await res.json();
      console.log("Wallet created:", data);
      setCreatedWallet(data);
      setLoading(false);
    } catch (error) {
      console.error("Error in createWallet:", error);
    }
  };

  useEffect(() => {
    createWallet();
  }, []); // Empty dependency array means this will only run once when the component mounts

  const copyToClipboard = () => {
    if (createdWallet) {
      navigator.clipboard.writeText(createdWallet.privateKey);
      setCopied(true);
    }
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
              alt="" 
              width={35}
              height={35}
              id="copied-image" 
              src="/images/market/key.png"
            />  
            <p id="copied-words">copied</p>
            <button id="copied-close" onClick={closeCopied}>OK</button> 
          </div>
        </div>
      )}

      {createdWallet && (
        <div>
          <div id="wallet-created-title-wrapper">
              <span id="bitcoinwalletcreated-title-left">WALLET</span>
              <span id="wallet-created-icons-wrapper">
                <span>
                    <div>
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('arellsWalletLogo')}
                        alt=""
                        width={30}
                        height={30}
                        id="arells-wallet-created-icon" 
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
                        id="bitcoin-wallet-created-icon" 
                        src="images/howitworks/Bitcoin.png"/>
                    </div>
                </span>
              </span>
              <span id="bitcoinwalletcreated-title-right">CREATED</span>
          </div>
          <div id="wallet-wrapper">
            <p>Copy/Save your private key offline, 
              you will need it to export and send your Bitcoin. 
            </p>
            <p>
            (DO NOT LOSE IT)
            </p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>Private Key:</p>
              <input 
                type="text" 
                value={createdWallet.privateKey} 
                readOnly 
                style={{ flexGrow: 1, marginRight: '8px' }}
              />
              <button onClick={copyToClipboard}>Copy</button>
            </div>
            <p>For security, we do not save your private key in our database so before you continue, ensure you have copied and saved your private key offline.</p>
          </div>
          <button id="bitcoin-wallet-created-continue">
            CONTINUE
          </button>
        </div>
      )}
    </>
  );
};

export default BitcoinWalletCreated;