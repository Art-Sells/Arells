'use client';

import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import CryptoJS from 'crypto-js';

const MASSTester: React.FC = () => {

  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [inputImportAmount, setInputImportAmount] = useState<string>('');

  useEffect(() => {
    const fetchAttributes = async () => {
        try {
            const attributesResponse = await fetchUserAttributes();
            const emailAttribute = attributesResponse.email;
            const bitcoinAddressAttribute = attributesResponse['custom:bitcoinAddress'];
            const bitcoinPrivateKeyAttribute = attributesResponse['custom:bitcoinPrivateKey'];

            if (emailAttribute) setEmail(emailAttribute);
            if (bitcoinAddressAttribute) setBitcoinAddress(bitcoinAddressAttribute);

            // Decrypt the private key
            if (bitcoinPrivateKeyAttribute) {
                const decryptedPrivateKey = CryptoJS.AES.decrypt(bitcoinPrivateKeyAttribute).toString(CryptoJS.enc.Utf8);
                setBitcoinPrivateKey(decryptedPrivateKey);
            }
        } catch (error) {
            console.error('Error fetching user attributes:', error);
        }
    };

    fetchAttributes();
}, [setEmail, setBitcoinAddress, setBitcoinPrivateKey]);

  useEffect(() => {
    if (bitcoinAddress) {
      const fetchBalance = async () => {
        const res = await fetch(`/api/balance?address=${bitcoinAddress}`);
        const data = await res.json();
        setBalance(data);
      };
      fetchBalance();
    }
  }, [bitcoinAddress]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00'; // Return a default value for invalid inputs
    }
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.0000000'; // Return a default value for invalid inputs
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div>
        <p>Address</p>
        <p>{bitcoinAddress}</p>
        <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
    </div>
  );
};

export default MASSTester;

//ok, this is the front end implementation that checks the imported Bitcoin, now create a "mint WBTC automatic function that mints Bitcoin into WBTC when it reads Bitcoin balance" and then, create buttons for swapWBTtoUSDC and swapUSDCtoWBTC