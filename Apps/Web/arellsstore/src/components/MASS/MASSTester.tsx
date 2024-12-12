'use client';

import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import CryptoJS from 'crypto-js';
import  useSigner from '../../state/signer';

const MASSTester: React.FC = () => {
  const { createMASSwallet, address } = useSigner();  // Access the context
  const [balance, setBalance] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        const bitcoinAddressAttribute = attributesResponse['custom:bitcoinAddress'];
        const bitcoinPrivateKeyAttribute = attributesResponse['custom:bitcoinPrivateKey'];

        if (emailAttribute) setEmail(emailAttribute);
        if (bitcoinAddressAttribute) setBitcoinAddress(bitcoinAddressAttribute);
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

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div>
      <p>Email: {email}</p>
      <p>Address: {bitcoinAddress}</p>
      <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
      <button onClick={createMASSwallet}>Create MASSwallet</button>
      {address && <p>New MASSwallet Address: {address}</p>}
    </div>
  );
};

export default MASSTester;