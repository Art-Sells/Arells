'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/send/send.css';
import '../../app/css/modals/send/send-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const Send: React.FC = () => {

  const [showSendFailed, setSendFailed] = useState<boolean>(false);
  const [showCheckAddress, setCheckAddress] = useState<boolean>(false);
  const [showMissingFields, setMissingfields] = useState<boolean>(false);
  const [showSendMore, setSendMore] = useState<boolean>(false);
  const [showSendSuccess, setSendSuccess] = useState<boolean>(false);
  const [showSending, setSending] = useState<boolean>(false);
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


  const closeSendFailed = () => {
    setSendFailed(false);
  };

  const closeCheckAddress = () => {
    setCheckAddress(false);
  };

  const closeMissingFields = () => {
    setMissingfields(false);
  };

  const closeSendMore = () => {
    setSendMore(false);
  };

  const closeSendSuccess = () => {
    setSendSuccess(false);
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

      {showSending && (
        <div id="send-failed-wrapper">
          <div id="send-content">
            <div className={stylings.marketplaceloader}>
            </div>
            <Image 
                // loader={imageLoader}
                alt="" 
                width={22}
                height={22}
                id="sending-image" 
                src="/images/market/export.png"
                />  
            <p id="sending-words">sending</p>
          </div>
        </div>
      )}

    {showSendSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image"
                src="/images/market/checkmark-ebony.png"
            />
            <p id="account-created-words">Send Complete</p>
            <Link href="/transactions" passHref>
                <button id="account-created-close-two" onClick={closeSendSuccess}>VIEW TRANSACTIONS</button>
            </Link>
        </div>
      </div>
      )}

      {showSendFailed && (
        <div id="send-failed-wrapper">
          <div id="send-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="send-failed-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="send-failed-words">failed send</p>
            <button id="send-failed-close" onClick={closeSendFailed}>OK</button> 
          </div>
        </div>
      )}

      {showCheckAddress && (
        <div id="send-failed-wrapper">
          <div id="send-failed-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="send-failed-image" 
              src="images/market/address-ivory.png"
            />  
            <p id="send-failed-words">check address</p>
            <button id="send-failed-close" onClick={closeCheckAddress}>OK</button> 
          </div>
        </div>
      )}

      {showMissingFields && (
        <div id="send-failed-wrapper">
          <div id="missing-fields-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={11}
              id="missing-fields-image" 
              src="images/prototype/EnterNameErrorImage.png"
            />  
            <p id="missing-fields-words">enter information</p>
            <button id="send-failed-close" onClick={closeMissingFields}>OK</button> 
          </div>
        </div>
      )}

      {showSendMore && (
        <div id="send-failed-wrapper">
          <div id="send-more-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="send-failed-image" 
              src="images/market/cancelled-ivory.png"
            />  
            <p id="send-failed-words">Send more Bitcoin</p>
            <button id="send-failed-close" onClick={closeSendMore}>OK</button> 
          </div>
        </div>
      )}

        <div id="send-header-navigation">
            <Link href="/account" id="send-home-link">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={23}
                  height={23}
                  id="send-account-navigation"
                  src="images/howitworks/ArellsIcoIcon.png"
                />
            </Link>							
            <Link href="/buy" id="send-cart-link">
              <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('buyLogo')}
                  alt=""
                  width={23}
                  height={23}
                  id="send-buy-navigation"
                  src="images/howitworks/Bitcoin.png"
                />
            </Link>	
        </div>
                        
        <p id="send-title">SEND</p>

        <div id="send-wallet-wrapper">

          <div id="a-wallet-send">
              <span>
                  <div id="w-account-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={20}
                      height={20}
                      id="wallet-icon-send" 
                      src="images/market/wallet.png"/>
                  </div>
              </span>
              <span id="send-wallet-word">Wallet:</span>
              <span id="send-wallet-number">$
                  <span id="send-wallet-num">2,000.08</span>
              </span>
          </div>
          <div id="b-wallet-send">
              <span>
                  <div id="b-wallet-wrapper">
                      <Image
                      loader={imageLoader}
                      onLoad={() => handleImageLoaded('accountLogo')}
                      alt=""
                      width={20}
                      height={20}
                      id="bitcoin-send" 
                      src="images/howitworks/Bitcoin.png"/>
                  </div>
              </span>
              <span id="bitcoin-amount-send">Amount:</span>
              <span id="bitcoin-amount-number">0.0005454</span>
          </div>

          <div id="send-amount-wrapper">

            <div id="send-input-wrapper">

                <p id="send-amount-title">
                    Send Amount
                </p>
                <input 
                    id="send-input"
                    type="tel" 
                />
                <p id="send-amount-title">
                    Send Address
                </p>
                <input 
                    id="address-input"
                    type="text" 
                />  
            </div>

            <p id="sending-title">
                Sending
            </p>

            <div id="b-wallet-send-two">
                <span>
                    <div id="b-wallet-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('accountLogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="bitcoin-send" 
                        src="images/howitworks/Bitcoin.png"/>
                    </div>
                </span>
                <span id="bitcoin-amount-number-two">0.0</span>
            </div>

            <p id="sending-amount">
                Total Sending Value
            </p>

            <div id="a-wallet-send-two">
                <span>
                    <div id="w-account-wrapper">
                        <Image
                        loader={imageLoader}
                        onLoad={() => handleImageLoaded('accountLogo')}
                        alt=""
                        width={20}
                        height={20}
                        id="wallet-icon-send" 
                        src="images/market/wallet.png"/>
                    </div>
                </span>
                <span id="send-wallet-number-two">$
                    <span id="send-wallet-num-two">0.00</span>
                </span>
            </div>


            {/* <div id="fill-in">
            </div> */}

            <div id="losses-amount">You Will Lose</div>

            <div id="a-losses-send">
                <span>
                  <div id="w-losses-wrapper">
                    <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="losses-icon-send" 
                    src="images/howitworks/down-arrow-ebony.png"/>
                  </div>
                </span>
                <span id="wallet-number-losses">$
                    <span id="wallet-number-losses-num">500</span>
                </span>
            </div>

            {/* <p id="losses-title">
              Proceed?
            </p> */}

            <div id="cancel-proceed-wrapper">
              <button id="cancel-send">
                  CANCEL
              </button>

              <br/>

              <button id="proceed-send">
                  SEND
              </button>
            </div>

          </div>
        </div>

        
    </>
  );
};

export default Send;