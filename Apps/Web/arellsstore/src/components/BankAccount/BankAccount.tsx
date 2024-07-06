'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/withdraw/withdraw.css';
import '../../app/css/modals/withdraw/withdraw-modal.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const BankAccount: React.FC = () => {

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


  const [showWithdrawing, setWithdrawing] = useState<boolean>(false);
  const [showWithdrawn, setWithdrawn] = useState<boolean>(false);
  const [showWithdrawFailed, setWithdrawFailed] = useState<boolean>(false);

  const closeWithdrawFailed = () => {
    setWithdrawFailed(false);
  };
  const closeWithdrawn = () => {
    setWithdrawn(false);
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

    {showWithdrawing && (
        <div id="withdrawing-wrapper">
          <div id="withdrawing-content">
            <div className={stylings.marketplaceloader}> 
            </div>
            <Image 
                // loader={imageLoader}
                alt="" 
                width={22}
                height={22}
                id="withdrawing-image" 
                src="/images/market/bank-ivory.png"
                /> 
            <p id="withdrawing-words">withdrawing</p>
          </div>
        </div>
      )}

    {showWithdrawn && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image"
                src="/images/market/checkmark-ebony.png"
            />
            <p id="account-created-words">Withdraw Complete</p>
            <Link href="/transactions" passHref>
                <button id="account-created-close-two" 
                onClick={closeWithdrawn}>VIEW TRANSACTIONS
                </button>
            </Link>
        </div>
      </div>
      )}

      {showWithdrawFailed && (
        <div id="withdrawing-wrapper">
          <div id="withdraw-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="withdrawing-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="withdrawing-failed-words">withdraw failed</p>
            <button id="withdrawing-failed-close" onClick={closeWithdrawFailed}>OK</button> 
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
                        
        <p id="withdraw-title">WITHDRAW</p>           

        <div id="withdraw-to-wrapper">

            <div id="b-wallet-withdraw">
            <span id="withdraw-wallet-word">Amount:</span>
              <span id="withdraw-wallet-number">$</span>
              <span id="withdraw-wallet-num-withdraw">60,000.08</span>
            </div>
            <div id="a-wallet-withdraw">
              <span id="withdraw-wallet-word">To:</span>
              <span>
                <button id="withdraw-export">
                    CHASE BANK 
                </button>
              </span>
            </div>

            <button id="withdraw-button">
                WITHDRAW
            </button>

        </div>
        
    </>
  );
};

export default BankAccount;