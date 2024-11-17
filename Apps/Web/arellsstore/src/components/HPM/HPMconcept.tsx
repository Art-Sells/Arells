'use client';

import React, { useEffect, useState } from 'react';
import { useHPM } from '../../context/concept/HPMContextConcept';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/account/Account.css';
import '../../app/css/buy/buy.css';
import '../../app/css/sell/Sell.css';
import '../../app/css/modals/sell/sell-modal.css';
import '../../app/css/modals/export/export-modal.css';
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
  const [showImportSuccessSell, setImportSuccessSell] = useState<boolean>(false);
  const [showImporting, setImporting] = useState<boolean>(false);
  const [showSellSuccess, setSellSuccess] = useState<boolean>(false);
  const [showSelling, setSelling] = useState<boolean>(false);
  const [readyToSellConcept, setReadyToSellConcept] = useState<boolean>(false);
  const [holdingConcept, setHoldingConcept] = useState<boolean>(false);
  const [importToSell, setImportToSell] = useState<boolean>(false);
  const [showMissingFields, setMissingFields] = useState<boolean>(false);






  const increasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 5000);
  };

  const decreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(0, currentPrice - 5000));
  };

  const formatCurrency = (value: number): string => {
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };



  const [inputBuyAmount, setInputBuyAmount] = useState<string>("");
  const [inputSellAmount, setInputSellAmount] = useState<string>("");
  const formatWithCommas = (value: string) => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Format integer part with commas
    return parts.join('.');
  };
  
  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
  
    // Limit to two decimal places
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only the first two decimal places
    }
  
    setInputBuyAmount(formatWithCommas(numericValue)); // Format with commas for display
    setBuyAmount(parseFloat(numericValue) || 0); // Store as a number for calculations
  };
  
  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
  
    // Limit to two decimal places
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only the first two decimal places
    }
  
    setInputSellAmount(formatWithCommas(numericValue)); // Format with commas for display
    setSellAmount(parseFloat(numericValue) || 0); // Store as a number for calculations
  };
  
  const handleBuyClick = () => {
    // Remove commas from inputBuyAmount and convert to a float for processing
    const buyAmount = parseFloat(inputBuyAmount.replace(/,/g, '')) || 0;
  
    if (buyAmount > 0) {
      setImportSuccess(true); // Show importing loader
      // Hide import success message after 2 seconds
      setTimeout(() => {
        setImportSuccess(false);
        setInputBuyAmount(""); // Clear the input field
      }, 2000);
  
      setBuyAmount(buyAmount);
      handleBuy(buyAmount);
    } else {
      setMissingFields(true); // Show missing fields message
    }
  };

  
  const handleSellClick = () => {
    // Remove commas from inputSellAmount and convert to a float for comparison
    const sellAmount = parseFloat(inputSellAmount.replace(/,/g, '')) || 0;
  
    // Check if sellAmount is greater than acVactsAts
    if (sellAmount > vatopCombinations.acVacts) {
      setMissingFields(true); // Show missing fields message
      return; // Exit the function
    }
  
    // Proceed with sell logic if the amount is valid
    if (sellAmount > 0 && sellAmount <= vatopCombinations.acVacts) {
      setSellSuccess(true);
      // Hide success message after 2 seconds
      setTimeout(() => {
        setSellSuccess(false);
        setInputSellAmount(''); // Clear the input field
      }, 2000);
  
      handleSell(sellAmount);
    } else {
      setMissingFields(true); // Show error if sellAmount is invalid
    }
  };
  
  useEffect(() => {
  
    if (vatopCombinations.acVacts > 0.99) {
      // Ready to sell if there's sufficient balance in acVactsAts
      setImportToSell(false);
      setReadyToSellConcept(true);
      setHoldingConcept(false);
    } else if (
      vatopCombinations.acVacts === 0
    ) {
      // Import required if no balance in acVacts
      setImportToSell(true);
      setReadyToSellConcept(false);
      setHoldingConcept(false);
    }
  }, [
    vatopCombinations.acVacts,
    vatopCombinations.acdVatops
  ]);
  

  // Check if acVactsAts is greater than 0 and show ImportSuccessSell modal
  const [importSuccessSellShown, setImportSuccessSellShown] = useState(false); // Track if modal has already been shown

  // Check if acVactsAts is greater than 0 and show ImportSuccessSell modal only once
  useEffect(() => {
    if (vatopCombinations.acdVatops > 0 && !importSuccessSellShown) {
      setImportSuccessSell(true);
      setImportSuccessSellShown(true); // Mark as shown to prevent repeated triggers
    }
  }, [vatopCombinations.acdVatops, importSuccessSellShown]);
  
  // Close ImportSuccessSell and scroll to the bottom
  const closeImportSuccessSell = () => {
    setImportSuccessSell(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const closeSellSuccess = () => {
    setSellSuccess(false);
  };

  const closeImportSuccess = () => {
    setImportSuccess(false);
  };

  const closeMissingFields = () => {
    setMissingFields(false);

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
      {showMissingFields && (
        <div id="export-failed-wrapper">
          <div id="missing-fields-content">
            <Image 
              alt="" 
              width={35} 
              height={11} 
              id="missing-fields-image" 
              src="/images/prototype/EnterNameErrorImage.png" 
            />  
            <p id="missing-fields-words">invalid amount</p>
            <button id="export-failed-close" onClick={closeMissingFields}>OK</button> 
          </div>
        </div>
      )}

      {showSelling && (
        <div id="selling-failed-wrapper-concept">
          <div id="selling-content-concept">
            <Image 
                // loader={imageLoader}
                alt="" 
                width={20}
                height={20}
                id="selling-image-concept" 
                src="/images/Arells-Icon-Ivory.png"
                /> 
            <div className={stylings.marketplaceloader}> 
            </div>    
            <p id="selling-words">selling</p>
          </div>
        </div>
      )}

    {showSellSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content-concept">
            <Image
                alt=""
                width={35}
                height={35}
                id="account-created-image-concept"
                src="/images/market/usdc-arells.png"
            />
            <p id="account-created-words">Sold</p>
              {/* <button id="account-created-close-two-concept"
              onClick={closeSellSuccess}>
                OK
              </button> */}
        </div>
      </div>
      )}

    {showImporting && (
        <div id="selling-failed-wrapper-concept">
          <div id="selling-content-concept">
            <Image 
                // loader={imageLoader}
                alt="" 
                width={25}
                height={25}
                id="selling-image-concept-bit" 
                src="/images/market/bitcoin-loader.png"
                /> 
                <div className={stylings.marketplaceloader}> 
                </div>
            <p id="selling-words">importing</p>
          </div>
        </div>
      )}

    {showImportSuccess && (
      <div id="account-created-wrapper">
        <div id="account-created-content-concept">
          <div id="a-price-account-concept-loader">
            <span>
              <div id="a-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={35}
                  height={35}
                  id="arells-account-concept"
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
                  width={35}
                  height={35}
                  id="bitcoin-account-wallet-concept"
                  src="images/howitworks/Bitcoin.png"
                />
              </div>
            </span>
          </div>
            <p id="account-created-words">Imported</p>
              {/* <button id="account-created-close-two-concept"
              onClick={closeImportSuccess}>
                OK
              </button> */}
        </div>
      </div>
      )}

    {showImportSuccessSell && (
      <div id="account-created-wrapper">
        <div id="account-created-content-concepter">
          <div id="a-price-account-concept-loader">
            <span>
              <div id="a-account-wrapper">
                <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('accountLogo')}
                  alt=""
                  width={35}
                  height={35}
                  id="arells-account-concept"
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
                  width={35}
                  height={35}
                  id="bitcoin-account-wallet-concept"
                  src="images/howitworks/Bitcoin.png"
                />
              </div>
            </span>
          </div>
            <p id="account-created-words">Profits Available</p>
              <button id="account-created-close-two-concept-one"
              onClick={closeImportSuccessSell}>
                SCROLL DOWN
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
        Bitcoin investments that never lose value
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
            type="text" 
            inputMode="decimal" 
            onChange={handleBuyAmountChange}
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
                vatopCombinations.acVacts
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
            {formatCurrency(vatopCombinations.acdVatops > .01 ? vatopCombinations.acdVatops : 0.00)}
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
                    type="text" 
                    inputMode="decimal" 
                    onChange={handleSellAmountChange}
                    value={inputSellAmount || ''}
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
            <p>cpVact: {formatCurrency(group.cpVact)}</p>
            <p>cVactTa: {formatNumber(group.cVactTa)}</p>
            <p>cVactDa: {formatCurrency(group.cVactDa)}</p>
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
      <p>acVactDas: {formatCurrency(vatopCombinations.acVactDas)}</p>
      <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
    
    </div> */}




    </div>
    
    </>


    
  );
};

export default HPMConcept;