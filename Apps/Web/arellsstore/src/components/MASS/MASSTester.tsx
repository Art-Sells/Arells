'use client';

import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import CryptoJS from 'crypto-js';

const MASSTester: React.FC = () => {
  const { createMASSwallet, readMASSFile } = useSigner();
  const [balance, setBalance] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [MASSAddress, setMASSAddress] = useState<string>('');
  const [MASSSupplicationAddress, setMASSSupplicationAddress] = useState<string>('');
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>('');
  const [MASSSupplicationPrivateKey, setMASSSupplicationPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchAttributesAndMASSDetails = async () => {
      try {
        // Fetch user attributes
        const attributesResponse = await fetchUserAttributes();
        setEmail(attributesResponse.email ?? '');
        setBitcoinAddress(attributesResponse['custom:bitcoinAddress'] ?? '');
        setBitcoinPrivateKey(attributesResponse['custom:bitcoinPrivateKey'] ?? '');

        // Fetch MASS details
        const massDetails = await readMASSFile();
        if (massDetails) {
          setMASSAddress(massDetails.MASSaddress);
          setMASSSupplicationAddress(massDetails.MASSsupplicationAddress);
          setMASSPrivateKey(
            CryptoJS.AES.decrypt(massDetails.MASSkey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
          setMASSSupplicationPrivateKey(
            CryptoJS.AES.decrypt(massDetails.MASSsupplicationKey, 'your-secret-key').toString(CryptoJS.enc.Utf8)
          );
        }
      } catch (error) {
        console.error('Error fetching user attributes or reading MASS file:', error);
      }
    };

    fetchAttributesAndMASSDetails();
  }, [readMASSFile]);

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
    return (balanceInSatoshis / 100000000).toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div>
      <p>Email: {email}</p>
      <p>Bitcoin Address: {bitcoinAddress}</p>
      <p>Bitcoin Private Key: {bitcoinPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <p>MASS Address: {MASSAddress}</p>
      <p>MASS Private Key: {MASSPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <p>MASS Supplication Address: {MASSSupplicationAddress}</p>
      <p>MASS Supplication Private Key: {MASSSupplicationPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
      <button onClick={createMASSwallet}>Create MASSwallet</button>
      {MASSAddress && <p>New MASSwallet Address: {MASSAddress}</p>}
      {MASSSupplicationAddress && <p>New MASS Supplication Address: {MASSSupplicationAddress}</p>}
    </div>
  );
};

export default MASSTester;