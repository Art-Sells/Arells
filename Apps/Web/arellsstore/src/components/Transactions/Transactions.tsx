'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/transactions/transactions.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Transactions: React.FC = () => {

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
                        
        <p id="transactions-title">TRANSACTIONS</p>

        <div id="transactions-wallet-wrapper">

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
                  <span id="export-wallet-num">2,000.08</span>
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

            <div id="b-wallet-export-two">
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
                <span id="bitcoin-amount-number-two">0.0</span>
            </div>

            <p id="exporting-amount">
                Total Exporting Value
            </p>

            <div id="a-wallet-export-two">
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
                <span id="export-wallet-number-two">$
                    <span id="export-wallet-num-two">0.00</span>
                </span>
            </div>


            {/* <div id="fill-in">
            </div> */}

            <div id="losses-amount">You will lose</div>

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
                <span id="wallet-number-losses">$
                    <span id="wallet-number-losses-num">0.00</span>
                </span>
            </div>

            {/* <p id="losses-title">
              Proceed?
            </p> */}

            <div id="cancel-proceed-wrapper">
              <button id="cancel-export">
                  CANCEL
              </button>

              <br/>

              <button id="proceed-export">
                  EXPORT
              </button>
            </div>

          </div>
        </div>

        
    </>
  );
};

export default Transactions;