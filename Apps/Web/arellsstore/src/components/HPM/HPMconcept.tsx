'use client';

import React, { useEffect, useState } from 'react';
import { useHPM } from '../../context/concept/HPMContextConcept';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/account/Account.css';
import '../../app/css/buy/buy.css';
import '../../app/css/sell/Sell.css';
import '../../app/css/modals/sell/sell-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';

const HPMConcept: React.FC = () => {

  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };
  const [showLoading, setLoading] = useState<boolean>(true);
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
      setLoading(false);
    }
  }, [imagesLoaded]);





  
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    hpap,
    buyAmount,
    setBuyAmount,
    sellAmount,
    setSellAmount,
    handleBuy,
    handleSell,
    setManualBitcoinPrice,
    email,
    soldAmount,
  } = useHPM();
  const [showImportSuccess, setImportSuccess] = useState<boolean>(false);
  const [showImporting, setImporting] = useState<boolean>(false);
  const [showSellSuccess, setSellSuccess] = useState<boolean>(false);
  const [showSelling, setSelling] = useState<boolean>(false);
  const [readyToSellConcept, setReadyToSellConcept] = useState<boolean>(false);
  const [holdingConcept, setHoldingConcept] = useState<boolean>(false);
  const [importToSell, setImportToSell] = useState<boolean>(false);






  const increasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 5000);
  };

  const decreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(0, currentPrice - 5000));
  };

  const formatCurrency = (value: number): string => {
    return `${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  const [inputBuyAmount, setInputBuyAmount] = useState<number>(0);

  const handleBuyClick = () => {
    if (inputBuyAmount > 0) { // Check if inputBuyAmount is not empty
      setImporting(true); // Show importing loader
      setTimeout(() => {
        setImporting(false); // Hide importing loader
        setImportSuccess(true); // Show import success message
      }, 2000); // Delay for 2 seconds
  
      setBuyAmount(inputBuyAmount);
      handleBuy(inputBuyAmount); // Perform the buy action
      setInputBuyAmount(0); // Clear the buy input field after buying
    }
  };
  
  const handleSellClick = () => {
    if (sellAmount > 0) { // Check if sellAmount is not empty
      setSelling(true); // Show selling loader
      setTimeout(() => {
        setSelling(false); // Hide selling loader
        setSellSuccess(true); // Show sell success message
      }, 2000); // Delay for 3 seconds
  
      handleSell(sellAmount); // Perform the sell action
      setSellAmount(0); // Clear the sell input field after selling
    }
  };


  
  // Function to conditionally set state based on vatopCombinations
  const updateSellAndHoldStates = () => {
    const newImportToSell = vatopCombinations.acVacts === 0;
    const newReadyToSellConcept = vatopCombinations.acVactsAts > 0;
    const newHoldingConcept = vatopCombinations.acVactsAts <= 0 && vatopCombinations.acVacts !== 0;
  
    // Update only if the new values differ from the current state
    if (importToSell !== newImportToSell) {
      setImportToSell(newImportToSell);
    }
    if (readyToSellConcept !== newReadyToSellConcept) {
      setReadyToSellConcept(newReadyToSellConcept);
    }
    if (holdingConcept !== newHoldingConcept) {
      setHoldingConcept(newHoldingConcept);
    }
  };
  
  // Call the function to update the states conditionally
  updateSellAndHoldStates();

  const closeSellSuccess = () => {
    setSellSuccess(false);
  };

  const closeImportSuccess = () => {
    setImportSuccess(false);
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

      {showSelling && (
        <div id="selling-failed-wrapper-concept">
          <div id="selling-content-concept">
            <div className={stylings.marketplaceloader}> 
            </div>
            <Image 
                // loader={imageLoader}
                alt="" 
                width={22}
                height={22}
                id="selling-image-concept" 
                src="/images/Arells-Icon-Ivory.png"
                /> 
            <p id="selling-words">selling</p>
          </div>
        </div>
      )}

    {showSellSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image-concept"
                src="/images/market/usdc-arells.png"
            />
            <p id="account-created-words">Sold</p>
              <button id="account-created-close-two-concept"
              onClick={closeSellSuccess}>
                OK
              </button>
        </div>
      </div>
      )}

    {showImporting && (
        <div id="selling-failed-wrapper-concept">
          <div id="selling-content-concept">
            <div className={stylings.marketplaceloader}> 
            </div>
            <Image 
                // loader={imageLoader}
                alt="" 
                width={22}
                height={22}
                id="selling-image-concept" 
                src="/images/Arells-Icon-Ivory.png"
                /> 
            <p id="selling-words">importing</p>
          </div>
        </div>
      )}

    {showImportSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image-concept"
                src="/images/howitworks/Bitcoin.png"
            />
            <p id="account-created-words">Imported</p>
              <button id="account-created-close-two-concept"
              onClick={closeImportSuccess}>
                OK
              </button>
        </div>
      </div>
      )}

    <div>

    <div id="concept-title-header">
      <span id="concept-title">
        <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('accountLogo')}
          alt=""
          width={34}
          height={11}
          id="word-logo-account-concept"
          src="images/Arells-Logo-Ebony.png"
        />
      </span>
      <span id="concept-title-description-line">
        |
      </span>
      <span id="concept-title-description">
        Always sell Bitcoin for Profits
      </span>
    </div>

    <p id="concept-title-announcement">
      CONCEPT
    </p>






    <div id="b-concept-price-account-wrapper">

      <div id="b-price-account-wrapper">
        <div id="b-price-account">
          <span>
            <div id="b-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="bitcoin-account"
                src="images/howitworks/Bitcoin.png"
              />
            </div>
          </span>
          <span id="price-account-concept">Price:</span>
          <span id="price-number-account">$
            <span id="price-number-account-num">
            {formatCurrency(bitcoinPrice)}
            </span>
          </span>
        </div>
        <div id="concept-buttons-wrapper">
          <button id="increase-price"
            onClick={increasePrice}>
              Increase Price
          </button>
          <button id="decrease-price"
            onClick={decreasePrice}>
              Decrease Price
          </button>
          <p id="testing-purposes">
            for testing purposes
          </p>
        </div>
      </div>

      
      <div id="buy-input-wrapper-concept">
        <p id="amount-input-word-concept">Import Bitcoin Amount</p>
        <div id="b-price-buy-concept">
          <span>
            <input 
            id="buy-input-concept" 
            type="tel" 
            onChange={(e) => setInputBuyAmount(Number(e.target.value))}
            value={inputBuyAmount || ''} 
            />
          </span>
          <span>
            <div id="cash-input-buy-concept">$</div>
          </span>
        </div>
        <button 
          id="sell-account-concept"
          onClick={handleBuyClick}>
          IMPORT
          </button>
      </div>



      <hr id="concept-line-top"/>






      <div id="sell-wrapper-account-concept">

        <div id="a-price-account-concept">
          <span>
            <div id="a-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={20}
                height={20}
                id="arells-account"
                src="images/howitworks/ArellsBitcoin.png"
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
                id="bitcoin-account-wallet"
                src="images/howitworks/Bitcoin.png"
              />
            </div>
          </span>
          <span id="holding-price-account-concept">Price:</span>
          <span id="holding-price-number-account">$
            <span id="holding-price-number-account-num">
            {formatCurrency(hpap)}
            </span>
          </span>
        </div>

        <hr id="concept-line"/>

        <div id="b-price-account-wallet-concept">
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
          <span id="wallet-account-concept">Wallet:</span>
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

        <hr id="concept-line"/>

        <div id="b-profits-account-concept">
          <span>
            <div id="w-account-wrapper">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={18}
                height={18}
                id="profits-icon-account"
                src="images/market/coin-stacks.png"
              />
            </div>
          </span>
          <span id="wallet-account-profits-concept-available">Available to Sell:</span>
          <span id="wallet-number-profits-account">$
            <span id="wallet-number-profits-account-num">
            {formatCurrency(
              vatopCombinations.acVactsAts
            )}
            </span>
          </span>
        </div>

        <hr id="concept-line"/>

        <div id="b-profitss-account-concept">
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
          <span id="wallet-account-profits-concept">Profits:</span>
          <span id="wallet-number-profits-account">$
            <span id="wallet-number-profits-account-num">
            {formatCurrency(
              vatopCombinations.acdVatops
            )}
            </span>
          </span>
        </div>

        <hr id="concept-line-bottom"/>


        <div id="sell-input-wrapper-concept">
          {readyToSellConcept && (
            <>
              <p id="amount-input-word-concept">Sell Bitcoin Amount</p>
              <div id="b-price-buy-concept">
                <span>
                  <input 
                  id="buy-input-concept" 
                  type="tel" 
                  value={sellAmount  || ''} 
                  onChange={(e) => setSellAmount(Number(e.target.value))} 
                  />
                </span>
                <span>
                  <div id="cash-input-buy-concept">$</div>
                </span>
              </div>
              <button 
                id="sell-account-conceptt"
                onClick={handleSellClick}>
                SELL
              </button>
            </>
          )}
          {holdingConcept && (
            <button id="holding-account-concept">HOLDING</button>
          )}  
          {importToSell && (
            <div id="holding-account-concept-two">
              <p id="import-bitcoin-to-sell-one">Import</p>
              <p id="import-bitcoin-to-sell-two">Bitcoin</p>
              <p id="import-bitcoin-to-sell-three">To Sell</p>
            </div>
          )}  
        </div>


      </div>




    </div>













    {/* Amount Sold Section */}
    <div id="amount-sold-account-wrapper-concept">
      <div id="amount-sold-num-wrap-concept">
        <span id="amount-sold-account-title-concept">Sold</span>
        <span id="amount-sold-number-account">
          <Image
            loader={imageLoader}
            onLoad={() => handleImageLoaded('accountLogo')}
            alt=""
            width={30}
            height={30}
            id="wallet-icon-account-concept-usdc"
            src="images/market/usdc-arells.png"
          />
        </span>
        <span id="amount-sold-number-account-num-concept">
          {formatCurrency(soldAmount)}
        </span>
      </div>
    </div>










    {/* Display Section */}
    {/* <div>
      <h2>HPAP: {formatCurrency(hpap)}</h2>
      <h2>Vatop Groups:</h2>
      {vatopGroups.length > 0 ? (
        vatopGroups.map((group, index) => (
          <div key={index}>
            <h3>Vatop Group {index + 1}</h3>
            <p>cVatop: {formatCurrency(group.cVatop)}</p>
            <p>cpVatop: {formatCurrency(group.cpVatop)}</p>
            <p>cVact: {formatCurrency(group.cVact)}</p>
            <p>cVactTa: {formatNumber(group.cVactTa)}</p>
            <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
          </div>
        ))
      ) : (
        <p>No Vatop Groups available</p>
      )}
    </div>
    <div>
      <h2>Vatop Group Combinations:</h2>
      <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
      <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
      <p>acVactTas: {formatNumber(vatopCombinations.acVactTas)}</p>
      <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
      <p>acVactsAts: {formatCurrency(vatopCombinations.acVactsAts)}</p>
      <p>acVactTaAts: {formatNumber(vatopCombinations.acVactTaAts)}</p>
    </div> */}




    </div>
    
    </>


    
  );
};

export default HPMConcept;