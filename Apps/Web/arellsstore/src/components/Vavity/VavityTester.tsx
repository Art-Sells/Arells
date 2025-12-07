'use client';

import React, { useState, useEffect } from 'react';
import { useVavity } from '../../context/Vavityarchitecture';
import { useSigner } from '../../state/signer';

const VavityTester: React.FC = () => {
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    vavityPrice,
    soldAmounts,
  } = useVavity();

  const {
    userAddress,
    userPrivateKey,
    createWallet,
    balances,
    email,
  } = useSigner();

  useEffect(() => {
    if (balances && balances.USDC_BASE !== undefined) {
      console.log('🪙 USDC Balance (BASE):', balances.USDC_BASE);
    }
  }, [balances.USDC_BASE]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    
    const roundedValue = Math.max(0, value - 0.00);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatPrice = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    
    const roundedValue = Math.max(0, value - 0.00);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00000000';
    }
  
    let formattedValue = value.toFixed(6);
    const parts = formattedValue.split('.');
    if (parts.length === 2) {
      const integerPart = parts[0];
      let decimalPart = parts[1];
      const lastDigit = parseInt(decimalPart[5]) || 0;
      decimalPart = decimalPart.substring(0, 5) + Math.max(lastDigit - 1, 0);
      formattedValue = `${integerPart}.${decimalPart}`;
    }
  
    return formattedValue || '0.00000000';
  };

  const calculateTotalUSDC = (): string => {
    if (!bitcoinPrice || bitcoinPrice <= 0) return '0.00';

    const cbbtcBalance = parseFloat(balances.BTC_BASE || '0');
    const usdBalance = parseFloat(balances.USDC_BASE || '0');

    const usdFromCBBTC = cbbtcBalance * bitcoinPrice;
    const totalUSDC = usdBalance + usdFromCBBTC;

    return formatCurrency(totalUSDC);
  };

  return (
    <div>
      <h1>Vavity Tester</h1>
      <h2>Bitcoin Price</h2>
      <h3>${formatPrice(bitcoinPrice)}</h3>

      <div>
        <h2>Vavity Price:</h2>
        <h3 id="Vavity-Price-Tester">${formatPrice(vavityPrice)}</h3>
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
            <p>cVactTaa: {(group.cVactTaa)}</p>
            <p>cVactDa: {formatCurrency(group.cVactDa)}</p>
            <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
          </div>
        ))}
      </div>
      <div>
        <h2>Vatop Combinations:</h2>
        <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
        <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
        <p>acVactDas: {formatCurrency(vatopCombinations.acVactDas)}</p>
        <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
        <p>acVactTaa: {(vatopCombinations.acVactTaa)}</p>
      </div>
      <div>
        <h2>Sold Amount</h2>
        <p id="amount-sold-number-account-num-concept">{formatCurrency(soldAmounts)}</p>
      </div>

      <div>
        <h3>User Wallet Address</h3>
        <p>{userAddress || 'Not Available'}</p>
        <p>User Private Key:</p>
        <pre>{userPrivateKey || 'Not Available'}</pre>
        <hr/>

        <p>Balance (USDC/BASE): ${balances.USDC_BASE} USDC</p>
        <p>Balance (BTC/BASE): {balances.BTC_BASE} BTC</p>
        <p>Total USDC Value: ${calculateTotalUSDC()}</p>
      </div>
    </div>
  );
};

export default VavityTester;

