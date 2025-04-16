'use client';

import React, { useState, useEffect } from 'react';
import { useHPM } from '../../context/HPMarchitecture';
import { useMASS } from '../../context/MASSarchitecture';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const HPMMASSTester: React.FC = () => {
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    hpap,
    handleBuy,
    handleSell,
    handleImportABTC,
    readABTCFile,
    setManualBitcoinPrice,
    soldAmounts,
  } = useHPM();

  const {
    createWallets,
    MASSaddress,
    MASSPrivateKey,
    balances,
    email,
  } = useSigner();

  useEffect(() => {
    if (balances && balances.USDC_BASE !== undefined) {
      console.log('🪙 USDC Balance (BASE):', balances.USDC_BASE);
    }
  }, [balances.USDC_BASE]);

  const [inputBuyAmount, setInputBuyAmount] = useState<string>('');
  const [inputSellAmount, setInputSellAmount] = useState<string>('');
  const [inputImportAmount, setInputImportAmount] = useState<string>('');
  const [aBTC, setABTC] = useState<number>(0);
  const { releaseMASS } = useMASS();


  useEffect(() => {
    const fetchABTC = async () => {
      const fetchedABTC = await readABTCFile();
      setABTC(fetchedABTC || 0);
    };
    fetchABTC();
  }, [readABTCFile]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    
    // Subtract $0.01, ensuring the result is not negative
    const roundedValue = Math.max(0, value - 0.00);
  
    // Format to two decimal places with commas
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const formatPrice = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    
    // Subtract $0.01, ensuring the result is not negative
    const roundedValue = Math.max(0, value - 0.00);
  
    // Format to two decimal places with commas
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00000000';
    }
  
    // Convert to a fixed number of decimal places (6) without scientific notation
    let formattedValue = value.toFixed(6);
  
    // Reduce the last decimal by 1
    const parts = formattedValue.split('.');
    if (parts.length === 2) {
      const integerPart = parts[0];
      let decimalPart = parts[1];
  
      // Adjust the last digit
      const lastDigit = parseInt(decimalPart[5]) || 0;
      decimalPart = decimalPart.substring(0, 5) + Math.max(lastDigit - 1, 0);
  
      // Recombine the parts
      formattedValue = `${integerPart}.${decimalPart}`;
    }
  
    // Ensure no trailing zeros are trimmed
    return formattedValue || '0.00000000';
  };

  const handleIncreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 1000);
  };

  const handleDecreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(currentPrice - 1000, 0));
  };








// MASS blockchain implementation code below
  const [cbBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [supplicationResult, setSupplicationResult] = useState<string | null>(null);
  const [supplicationError, setSupplicationError] = useState<string | null>(null);
  const [isSupplicating, setIsSupplicating] = useState<boolean>(false);
  const [cbbtcConversion, setWbtcConversion] = useState<string>('0.00000000');
  const [usdcConversion, setUsdcConversion] = useState<string>('0.00');


// supplicateCBTCtoUSDC functions
    const handleUSDCInputChange = (value: string) => {
      setDollarAmount(value); // Update the dollar amount state
      const parsedAmount = parseFloat(value); // Parse the input

      if (!isNaN(parsedAmount) && parsedAmount > 0 && bitcoinPrice > 0) {
        const cbbtcEquivalent = getWBTCEquivalent(parsedAmount, bitcoinPrice); // Convert USDC to CBBTC
        setWbtcConversion(cbbtcEquivalent.toFixed(8)); // Format CBBTC value
      } else {
        setWbtcConversion('0.00000000'); // Reset if input is invalid
      }
    };
    const getWBTCEquivalent = (usdcAmount: number, bitcoinPrice: number): number => {
      if (bitcoinPrice <= 0) {
        throw new Error('Bitcoin price must be greater than zero.');
      }
      return usdcAmount / bitcoinPrice; // Calculate CBBTC equivalent
    };
    const handleCBBTCsupplication = async () => {
      const dollarInput = parseFloat(String(dollarAmount)); // User input in dollars

      if (isNaN(dollarInput) || dollarInput <= 0) {
        setSupplicationError('Please enter a valid dollar amount.');
        return;
      }

      if (!MASSaddress || !MASSPrivateKey) {
        setSupplicationError('Wallet information is missing.');
        return;
      }

      setSupplicationError(null);
      setIsSupplicating(true);

      try {
        // Convert dollars to CBBTC equivalent
        const cbbtcEquivalent = dollarInput / bitcoinPrice; // CBBTC equivalent of dollarInput
        const cbbtcInSatoshis = Math.floor(cbbtcEquivalent * 1e8); // Convert to satoshis

        if (cbbtcInSatoshis <= 0) {
          setSupplicationError('Calculated CBBTC amount is too small.');
          return;
        }

        const payload = {
          wrappedBitcoinAmount: cbbtcInSatoshis, // Amount in satoshis
          massAddress: MASSaddress,
          massPrivateKey: MASSPrivateKey,
        };

        console.log('🚀 Sending Payload:', payload);

        const response = await axios.post('/api/MASS_cbbtc', payload);

        const { receivedAmount, txId } = response.data;
        setSupplicationResult(
          `USDC -> CBBTC Supplication successful!`
        );
      } catch (error: any) {
        console.error('❌ API Error:', error.response?.data || error.message);
        setSupplicationError(error.response?.data?.error || 'Supplication failed. Please try again.');
      } finally {
        setIsSupplicating(false);
      }
    };




  // supplicateUSDCtoCBBTC functions
    const handleCBBTCInputChange = (value: string) => {
      setWrappedBitcoinAmount(value); // Update CBBTC input value
      const parsedAmount = parseFloat(value); // Parse the input

      if (!isNaN(parsedAmount) && parsedAmount > 0 && bitcoinPrice > 0) {
        const usdcEquivalent = getUSDCEquivalent(parsedAmount, bitcoinPrice); // Convert CBBTC to USDC
        setUsdcConversion(usdcEquivalent.toFixed(2)); // Format USDC value
      } else {
        setUsdcConversion('0.00'); // Reset if input is invalid
      }
    };
    const getUSDCEquivalent = (cbbtcAmount: number, bitcoinPrice: number): number => {
      return cbbtcAmount * bitcoinPrice; // Direct conversion without extra factors
    };
    const handleUSDCsupplication = async () => {
      console.log("cbBitcoinAmount (input):", cbBitcoinAmount);
      console.log("bitcoinPrice:", bitcoinPrice);

      const numericAmount = parseFloat(String(cbBitcoinAmount));

      if (isNaN(numericAmount) || numericAmount <= 0) {
        setSupplicationError("Invalid cbBitcoinAmount.");
        return;
      }

      const usdcEquivalent = getUSDCEquivalent(numericAmount, bitcoinPrice);
      console.log("Calculated USDC Equivalent:", usdcEquivalent);
      if (!cbBitcoinAmount || isNaN(Number(cbBitcoinAmount)) || Number(cbBitcoinAmount) <= 0) {
        setSupplicationError('Please enter a valid amount.');
        return;
      }
    
      if (!MASSPrivateKey || !MASSaddress) {
        setSupplicationError('Wallet information is missing.');
        return;
      }
    
      setSupplicationError(null);
      setIsSupplicating(true);
    
      try {
        // Calculate USDC equivalent
        const usdcEquivalent = getUSDCEquivalent(Number(cbBitcoinAmount), bitcoinPrice);
        const usdcInMicroUnits = Math.floor(usdcEquivalent * 1e6); // Convert to base units
    
        if (usdcInMicroUnits === 0) {
          setSupplicationError('Calculated USDC amount is too small.');
          return;
        }
    
        const payload = {
          usdcAmount: usdcInMicroUnits,
          massPrivateKey: MASSPrivateKey,
          massAddress: MASSaddress,
        };
    
        console.log('🚀 Sending Payload:', payload);
    
        const response = await axios.post('/api/MASS_usdc', payload);
    
        const { receivedAmount, txId } = response.data;
        setSupplicationResult(`CBBTC -> USDC Supplication successful!`);
      } catch (error: any) {
        console.error('❌ API Error:', error.response?.data || error.message);
        setSupplicationError(error.response?.data?.error || 'Supplication failed. Please try again.');
      } finally {
        setIsSupplicating(false);
      }
    };

// MASS blockchain implementation code above    



































const calculateTotalUSDC = (): string => {
  // Ensure bitcoinPrice is valid
  if (!bitcoinPrice || bitcoinPrice <= 0) return '0.00';

  // Safely parse balances to numbers
  const cbbtcBalance = parseFloat(balances.BTC_BASE || '0'); // CBBTC balance
  const usdBalance = parseFloat(balances.USDC_BASE || '0');  // USDC balance

  // Convert CBBTC to USD
  const usdFromCBBTC = cbbtcBalance * bitcoinPrice;

  // Calculate total USDC
  const totalUSDC = usdBalance + usdFromCBBTC;

  // Format the result
  return formatCurrency(totalUSDC);
};









  const handleMASSRelease = () => {
    releaseMASS();
    console.log('MASS hold has been released for al lgroups.');
  };

  return (
    <div>
      <h1>HPM and MASS Tester</h1>
      <h2>Bitcoin Price</h2>
      <h3>${formatPrice(bitcoinPrice)}</h3>
      {/* <button onClick={handleIncreasePrice}>Increase Price</button>
      <button onClick={handleDecreasePrice}>Decrease Price</button> */}

      <div>
        <h2>HPAP:</h2>
        <h3>${formatPrice(hpap)}</h3>
      </div>
      <div>
      <div>
      <h2>Total USD:</h2>
        <p>${calculateTotalUSDC()} USD</p>
      </div>
        <h2>aBTC in USD:</h2>
        <p>{formatCurrency(aBTC)}</p>
      </div>
      <div>
        <h2>Vatop Groups:</h2>
        {vatopGroups.map((group, index) => (
          <div key={index}>
            <h3>Group {index + 1}</h3>
            <p>cVatop: {formatCurrency(group.cVatop)}</p>
            <p>cpVatop: {formatPrice(group.cpVatop)}</p>
            <p>cVact: {formatCurrency(group.cVact)}</p>
            <p>cpVact: {formatPrice(group.cpVact)}</p>
            <p>cVactDat: {formatNumber(group.cVactDat)}</p>
            <p>cVactTaa: {formatNumber(group.cVactTaa)}</p>
            <p>cVactDa: {formatCurrency(group.cVactDa)}</p>
            <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
          </div>
        ))}
      </div>
      <div>
        <h2>Vatop Combinations:</h2>
        <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
        <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
        <p>acVactDat: {formatNumber(vatopCombinations.acVactDat)}</p>
        <p>acVactDas: {formatCurrency(vatopCombinations.acVactDas)}</p>
        <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
        <p>acVactTaa: {formatNumber(vatopCombinations.acVactTaa)}</p>
      </div>
      <button onClick={handleMASSRelease}>Release MASS Hold</button>
      <div>
        <h2>Sold Amount</h2>
        <p id="amount-sold-number-account-num-concept">{formatCurrency(soldAmounts)}</p>
      </div>

      <div>
        <h3>MASS Wallet Address</h3>
        <p>{MASSaddress || 'Not Available'}</p>
        <p>MASS Private Key:</p>
        <pre>{MASSPrivateKey || 'Not Available'}</pre>
        <hr/>
        <p>Balance (BTC/BASE): {balances.BTC_BASE} BTC</p>
        <div>
          <div>
            <label>USDC Amount:</label>
            <input
              type="text"
              id="usdcAmount"
              value={dollarAmount}
              onChange={(e) => handleUSDCInputChange(e.target.value)}
              placeholder="Enter amount in USDC"
            />
            <p>BTC Equivalent: {cbbtcConversion} CBBTC</p>
          </div>
          <button onClick={handleCBBTCsupplication} disabled={isSupplicating}>
            {isSupplicating ? 'Supplicating...' : 'Manually Supplicate CBBTC to USD'}
          </button>
          {supplicationError && <p style={{ color: 'red' }}>{supplicationError}</p>}
          {supplicationResult && <p style={{ color: 'green' }}>{supplicationResult}</p>}
        </div>

        <hr/>

        <p>Balance (USDC/BASE): ${balances.USDC_BASE} USDC</p>
        
        <div>
          <div>
            <label>CBBTC Amount:</label>
            <input
              type="text"
              id="cbbtcAmount"
              value={cbBitcoinAmount}
              onChange={(e) => handleCBBTCInputChange(e.target.value)}
              placeholder="Enter amount in BTC"
            />
            <p>USD Equivalent: ${usdcConversion} USDC</p>
          </div>
          <button onClick={handleUSDCsupplication} disabled={isSupplicating}>
            {isSupplicating ? 'Supplicating...' : 'Manually Supplicate USDC to CBBTC'}
          </button>
          {supplicationError && <p style={{ color: 'red' }}>{supplicationError}</p>}
          {supplicationResult && <p style={{ color: 'green' }}>{supplicationResult}</p>}
        </div>

      </div>
    </div>
  );
};

export default HPMMASSTester;

function setWbtcConversion(arg0: string) {
  throw new Error('Function not implemented.');
}