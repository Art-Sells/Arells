'use client';

import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import CryptoJS from 'crypto-js';

const MASSTester: React.FC = () => {
  const { createMASSwallet, readMASSFile, fetchBalances } = useSigner();
  const [balance, setBalance] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [MASSAddress, setMASSAddress] = useState<string>('');
  const [MASSSupplicationAddress, setMASSSupplicationAddress] = useState<string>('');
  const [MASSPrivateKey, setMASSPrivateKey] = useState<string>('');
  const [MASSSupplicationPrivateKey, setMASSSupplicationPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [balances, setBalances] = useState<{
    WBTC: string;
    USDC: string;
    POL_MASS: string;
    POL_SUPPLICATION: string;
  }>({
    WBTC: '0',
    USDC: '0',
    POL_MASS: '0',
    POL_SUPPLICATION: '0',
  });

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
    const loadBalances = async () => {
      try {
        const fetchedBalances = await fetchBalances();
        setBalances({
          WBTC: fetchedBalances.WBTC,
          USDC: fetchedBalances.USDC,
          POL_MASS: fetchedBalances.POL, // POL balance for MASSAddress
          POL_SUPPLICATION: fetchedBalances.POL_SUPPLICATION || '0', // POL balance for MASS Supplication Address
        });
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    if (MASSAddress && MASSSupplicationAddress) {
      loadBalances();
    }
  }, [fetchBalances, MASSAddress, MASSSupplicationAddress]);

  useEffect(() => {
    if (bitcoinAddress) {
      const fetchBalance = async () => {
        try {
          const res = await fetch(`/api/balance?address=${bitcoinAddress}`);
          const data = await res.json();
          setBalance(data);
        } catch (error) {
          console.error('Error fetching Bitcoin balance:', error);
        }
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
      <hr />
      <p>Bitcoin Address: {bitcoinAddress}</p>
      <p>Bitcoin Private Key: {bitcoinPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <p>Bitcoin Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
      <hr />
      <button onClick={createMASSwallet}>Create MASSwallet</button>
      <p>MASS Address: {MASSAddress}</p>
      <p>MASS Private Key: {MASSPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <br />
      <p>MASS Supplication Address: {MASSSupplicationAddress}</p>
      <p>MASS Supplication Private Key: {MASSSupplicationPrivateKey.substring(0, 5)}... (sensitive information displayed securely)</p>
      <br />
      <h2>Balances</h2>
      <p><strong>MASS Address Balances:</strong></p>
      <p>WBTC: {balances.WBTC} WBTC</p>
      <p>POL: {balances.POL_MASS} POL</p>
      <br />
      <p><strong>MASS Supplication Address Balances:</strong></p>
      <p>USDC: {balances.USDC} USDC</p>
      <p>POL: {balances.POL_SUPPLICATION} POL</p>
    </div>
  );
};

export default MASSTester;