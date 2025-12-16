'use client';


import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import { useEthereumPrice } from '../../context/EthereumPriceContext';
import EthereumChartAccount from '../../components/Assets/Ethereum/EthereumChartAccount';
import '../../app/css/account/Account.css';
import '../../app/css/modals/account/account-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVavity } from '../../context/VavityAggregator';

const Account: React.FC = () => {
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [price, setNewPrice] = useState<number | undefined>(undefined);
  const {vatopCombinations, vavityPrice} = useVavity();
  const [showLoading, setLoading] = useState<boolean>(true);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [readyToSell, setReadyToSell] = useState<boolean>(false);
  const [holding, setHolding] = useState<boolean>(false);
  const [awaitingApprovals, setAwaitingApprovals] = useState<boolean>(true);
  const [walletNotConnected, setWalletNotConnected] = useState<boolean>(false);
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    accountLogo: false,
  });

  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded((prevState) => ({
      ...prevState,
      [imageName]: true,
    }));
  };

  useEffect(() => {
    if (Object.values(imagesLoaded).every(Boolean)) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [imagesLoaded]);


  
  // Then in the component where readyToSell and holding are used, it should now dynamically set their values.

  const ethereumPrice = useEthereumPrice(); // Use the hook directly

  const formattedPrice = ethereumPrice ? Math.round(ethereumPrice).toLocaleString('en-US') : '...';
  

  const router = useRouter();

  const handleSignOut = async () => {
      try {
          signOut();
      } catch (error) {
          console.log('Error signing out:', error);
      }
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

      <Image
        loader={imageLoader}
        onLoad={() => handleImageLoaded('accountLogo')}
        alt=""
        width={50}
        height={16}
        id="word-logo-account"
        src="images/Arells-Logo-Ebony.png"
      />

      {/* <div id="account-slogan-wrapper">
          <p id="account-slogan">Always sell</p>
          <p id="ada-account-slogan">Ethereum</p>
          <p id="ada-account-slogan-two">for Profits</p>
      </div> */}

      {awaitingApprovals && (
        <div id="wallet-account-wrapper-null">
        <div id="b-price-account">
          <span>
            <div id="b-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="ethereum-account"
                src="images/howitworks/Ethereum.png"
              />
            </div>
          </span>
          <span id="price-account">Price:</span>
          <span id="price-number-account">$
            <span id="price-number-account-num">
            {formattedPrice}
          </span></span>
        </div>


        <div id="amount-sold-account-wrapper-null">
          <p id="amount-sold-number-account-num-approvals">
            Coming Soon
          </p>   
          <Link href="/concept">
            <button id="sell-account-concept-link">
              VIEW CONCEPT
              </button>
          </Link>	
        </div>
      </div>
        )}
      {walletNotConnected && (
        <div id="wallet-account-wrapper-null">


        <div id="b-price-account">
          <span>
            <div id="b-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="ethereum-account"
                src="images/howitworks/Ethereum.png"
              />
            </div>
          </span>
          <span id="price-account">Price:</span>
          <span id="price-number-account">$
            <span id="price-number-account-num">
            {formattedPrice}
          </span></span>
        </div>


        <div id="amount-sold-account-wrapper-null">
          <button id="withdraw-account-null">IMPORT ETHEREUM</button>
        </div>
      </div>
        )}
        {walletConnected && (
          <div id="wallet-account-wrapper">
          <div id="b-price-account">
            <span>
              <div id="b-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={20}
                  height={20}
                  id="ethereum-account"
                  src="images/howitworks/Ethereum.png"
                />
              </div>
            </span>
            <span id="price-account">Price:</span>
            <span id="price-number-account">$
              <span id="price-number-account-num">
              {formattedPrice}
            </span></span>
          </div>
            <div id="transfer-buy-account">
              <span>
                <Link href="/buy">
                  <button id="buy-account">BUY</button>
                </Link>	
              </span>
              {/* <span>
                <button id="transfer-account">IMPORT</button>
              </span> */}
              {readyToSell && (
              <span>
                <Link href="/sell">
                  <button id="sell-account">SELL</button>
                </Link>	
              </span>
              )}
              {holding && (
              <span>
                <button id="holding-account">HOLDING</button>
              </span>
              )}
            </div>


          <div id="sell-wrapper-account">
            <div id="a-price-account">
              <span>
                <div id="a-account-wrapper">
                  <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="arells-account"
                    src="images/howitworks/ArellsIcoIcon.png"
                  />
                </div>
              </span>
              <span>
                <div id="b-account-wrapper">
                  <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="ethereum-account-wallet"
                    src="images/howitworks/Ethereum.png"
                  />
                </div>
              </span>
              <span id="holding-price-account">Price:</span>
              <span id="holding-price-number-account">$
                <span id="holding-price-number-account-num">
                {formatCurrency(vavityPrice)}
                </span>
              </span>
            </div>
            <div id="b-price-account-wallet">
              <span>
                <div id="w-account-wrapper">
                  <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="wallet-icon-account"
                    src="images/market/wallet.png"
                  />
                </div>
              </span>
              <span id="wallet-account">Wallet:</span>
              <span id="wallet-number-account">$
                <span id="wallet-number-account-num">
                  {formatCurrency(
                    vatopCombinations.acVatops >= vatopCombinations.acVacts
                      ? vatopCombinations.acVatops
                      : vatopCombinations.acVacts
                  )}
                </span>
              </span>
            </div>

            <div id="b-profits-account">
              <span>
                <div id="w-account-wrapper">
                  <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="profits-icon-account"
                    src="images/howitworks/up-arrow-ebony.png"
                  />
                </div>
              </span>
              <span id="wallet-account-profits">Profits:</span>
              <span id="wallet-number-profits-account">$
                <span id="wallet-number-profits-account-num">
                {formatCurrency(
                  vatopCombinations.acdVatops
                )}
                </span>
              </span>
            </div>
          </div>
          {/* <button id="export-account">EXPORT</button> */}

          {/* <div id="amount-sold-account-wrapper">
            <div id="amount-sold-num-wrap">
              <span>
                <div id="w-account-wrapper">
                  <Image
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('accountLogo')}
                    alt=""
                    width={20}
                    height={20}
                    id="wallet-icon-account"
                    src="images/market/cash-register.png"
                  />
                </div>
              </span>
              <span id="amount-sold-account-title">Sold: </span>
              <span id="amount-sold-number-account">$</span>
              <span id="amount-sold-number-account-num">0</span>
            </div>
            <button id="withdraw-account">WITHDRAW</button>
          </div> */}
        </div>
        )}

      <div id="ethereum-chart-account-wrapper-footer">

      {walletNotConnected && (
          <p id="amount-sold-number-account-num-null">
          Renders bear markets obsolete.
        </p>    
      )}

      {awaitingApprovals && (
          <p id="amount-sold-number-account-num-null">
          Renders bear markets obsolete.
        </p>    
      )}

        <EthereumChartAccount />
      </div>

      <div id="footer">
      <Link href="/">
        <button id="log-out-account"
          onClick={handleSignOut}
          >
            LOGOUT</button>
        </Link>	
      </div>
    </>
  );
};

const formatCurrency = (value: number): string => {
  return `${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export default Account;