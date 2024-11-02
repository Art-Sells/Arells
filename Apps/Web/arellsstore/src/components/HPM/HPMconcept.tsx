'use client';

import React, { useState } from 'react';
import { useHPM } from '../../context/concept/HPMContextConcept';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/account/Account.css';
import '../../app/css/buy/buy.css';
import '../../app/css/sell/Sell.css';

const HPMConcept: React.FC = () => {

  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };
  const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
    accountLogo: false,
  });
  const handleImageLoaded = (imageName: string) => {
    setImagesLoaded((prevState) => ({
      ...prevState,
      [imageName]: true,
    }));
  };
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
    setBuyAmount(inputBuyAmount);
    handleBuy(inputBuyAmount);
  };

  const [readyToSellConcept, setReadyToSellConcept] = useState<boolean>(true);
  const [holdingConcept, setHoldingConcept] = useState<boolean>(false);

  // setReadyToSellConcept(vatopCombinations.acVacts === 0 || vatopCombinations.acVactsAts > 0);
  // setHoldingConcept(vatopCombinations.acVactsAts <= 0);

  return (
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
            <span id="price-account">Price:</span>
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
          <p id="amount-input-word">Import Bitcoin Amount</p>
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
          <span id="holding-price-account">Price:</span>
          <span id="holding-price-number-account">$
            <span id="holding-price-number-account-num">
            {formatCurrency(hpap)}
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
          <span id="wallet-account-profits">Available to Sell:</span>
          <span id="wallet-number-profits-account">$
            <span id="wallet-number-profits-account-num">
            {formatCurrency(
              vatopCombinations.acVactsAts
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


        <div id="b-profits-account">
          {readyToSellConcept && (
            <>
              <p id="sell-amount-title">
                Sell Amount
              </p>
              <div id="b-price-sell">
                <span>
                  <input 
                      id="sell-input"
                      type="tel" 
                      value={sellAmount  || ''} 
                      onChange={(e) => setSellAmount(Number(e.target.value))} 
                  />
                </span>
                <span>
                  <div 
                      id="cash-input">
                    $  
                    </div>
                </span>
              </div>
              <button onClick={() => handleSell(sellAmount)}>SELL</button>
            </>
          )}
          {holdingConcept && (
            <span>
              <button id="holding-account">HOLDING</button>
            </span>
          )}

        </div>


      </div>
      







      </div>












      
      {/* Amount Sold Section */}
      <div id="amount-sold-account-wrapper">
        <div id="amount-sold-num-wrap">
          <span id="amount-sold-account-title">Sold</span>
          <span id="amount-sold-number-account">
            <Image
              loader={imageLoader}
              onLoad={() => handleImageLoaded('accountLogo')}
              alt=""
              width={20}
              height={20}
              id="wallet-icon-account"
              src="images/market/usdc-arells.png"
            />
          </span>
          <span id="amount-sold-number-account-num">
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

    
  );
};

export default HPMConcept;