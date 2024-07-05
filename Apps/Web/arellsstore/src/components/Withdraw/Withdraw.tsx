'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/transactions/transactions.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/exportingloader.module.css';

const Withdraw: React.FC = () => {

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

  const [withdrawCalendar, withdrawCalendarSet] = useState<boolean>(true);
  const [sold, soldSet] = useState<boolean>(true);
  const [bought, boughtSet] = useState<boolean>(true);
  const [withdrew, withdrewSet] = useState<boolean>(true);
  const [exported, exportedSet] = useState<boolean>(true);
  const [exportingLoader, exportingLoaderSet] = useState<boolean>(true);
  const [exportComplete, exportCompleteSet] = useState<boolean>(false);

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

          {withdrawCalendar && (
            <div id="withdraw-calendar-wrapper">
              <span>
                <div id="b-wallet-wrapper">
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={12}
                    height={12}
                    id="calendar-image" 
                    src="images/market/calendar.png"/>
                </div>
              </span>
              <span id="calendar-date">06/21/24</span>
              <span id="calendar-date-format">mm/dd/yy</span>

            </div>             
          )}

          {sold && (
            <div id="transactions-amount-wrapper">

              <div id="b-wallet-transactions">
                  <span>
                      <div id="b-wallet-wrapper">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="bitcoin-transactions" 
                          src="images/howitworks/Bitcoin.png"/>
                      </div>
                  </span>
                  <span id="bitcoin-amount-transactions">Sold:</span>
                  <span id="bitcoin-amount-number-sold">0.0005454</span>
              </div>
              <div id="a-wallet-transactions">
                  <span>
                      <div id="w-account-wrapper">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="wallet-icon-transactions" 
                          src="images/market/cash-register.png"/>
                      </div>
                  </span>
                  <span id="transactions-wallet-word">For:</span>
                  <span id="transactions-wallet-number">$
                      <span id="transactions-wallet-num-sold">2,000.08</span>
                  </span>
              </div>

            </div>
          )}

          {bought && (
            <div id="transactions-amount-wrapper">

              <div id="b-wallet-transactions">
                  <span>
                      <div id="b-wallet-wrapper">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="bitcoin-transactions" 
                          src="images/howitworks/Bitcoin.png"/>
                      </div>
                  </span>
                  <span id="bitcoin-amount-transactions">Bought:</span>
                  <span id="bitcoin-amount-number-bought">0.0005454</span>
              </div>
              <div id="a-wallet-transactions">
                  <span>
                      <div id="w-account-wrapper">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="wallet-icon-transactions" 
                          src="images/market/cash-register.png"/>
                      </div>
                  </span>
                  <span id="transactions-wallet-word">For:</span>
                  <span id="transactions-wallet-number">$
                      <span id="transactions-wallet-num-bought">2,000.08</span>
                  </span>
              </div>
            </div>
          )}

          {withdrew && (
            <div id="transactions-button-wrapper">

              <div id="b-wallet-transactions">
                <span>
                  <div id="w-account-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={15}
                      height={15}
                      id="wallet-icon-vault" 
                      src="images/market/vault.png"/>
                  </div>
                </span>
                <span id="transactions-wallet-word">Withdrew:</span>
                <span id="transactions-wallet-number">$
                    <span id="transactions-wallet-num-withdrew">2,000.08</span>
                </span>
              </div>
              <div id="a-wallet-transactions">
                <span>
                  <div id="b-wallet-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={15}
                      height={15}
                      id="wallet-icon-transactions" 
                      src="images/market/bank.png"/>
                  </div>
                </span>
                <span id="bitcoin-amount-transactions">To:</span>
                <span>
                  <button id="withdrew-export">
                      CHASE BANK 
                  </button>
                </span>
              </div>

            </div>
          )}

          {exported && (
            <div id="transactions-button-wrapper">

              <div id="b-wallet-transactions">
                  {exportingLoader && (
                    <>
                    <span>
                      <div id="b-wallet-wrapper-exporting">
                        <div className={stylings.exportingloader}>
                        </div>
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="exporting-image" 
                          src="images/howitworks/Bitcoin.png"/>
                      </div>
                    </span>
                    <span id="bitcoin-amount-transactions-exported">Exporting:</span>
                    <span id="bitcoin-amount-number-exported">0.0005454</span>             
                    </>    
                  )}
                  {exportComplete && (
                    <>
                    <span>
                      <div id="b-wallet-wrapper-exported">
                          <Image
                          loader={imageLoader}
                          onLoad={() => handleImageLoaded('accountLogo')}
                          alt=""
                          width={15}
                          height={15}
                          id="bitcoin-transactions" 
                          src="images/howitworks/Bitcoin.png"/>
                      </div>
                    </span>
                    <span id="bitcoin-amount-transactions-exported">Exported:</span>
                    <span id="bitcoin-amount-number-exported">0.0005454</span>             
                    </>       
                  )}
              </div>
              <div id="a-wallet-transactions">
                <span>
                  <div id="b-wallet-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={15}
                      height={15}
                      id="wallet-icon-exported" 
                      src="images/market/export-ebony.png"/>
                  </div>
                </span>
                <span id="transactions-exported-to">To:</span>
                <span>
                  <button id="view-export">
                      VIEW EXPLORER
                  </button>
                </span>
              </div>

            </div>
          )}

        </div>

        
    </>
  );
};

export default Withdraw;