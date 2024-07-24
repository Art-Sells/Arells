'use client';

import React, { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';

const Bitcoin: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // amount in BTC
  const [feeRate, setFeeRate] = useState<number>(10); // Fee rate in satoshis per byte
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
    const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        const bitcoinAddressAttribute = attributesResponse['custom:bitcoinAddress'];
        const bitcoinPrivateKeyAttribute = attributesResponse['custom:bitcoinPrivateKey'];
  
        if (emailAttribute) setEmail(emailAttribute);
        if (bitcoinAddressAttribute) setBitcoinAddress(bitcoinAddressAttribute);
        if (bitcoinPrivateKeyAttribute) setBitcoinPrivateKey(bitcoinPrivateKeyAttribute);
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

  useEffect(() => {
    const fetchFeeRate = async () => {
      try {
        const res = await fetch('https://mempool.space/api/v1/fees/recommended');
        const data = await res.json();
        setFeeRate(data.fastestFee); // Use the fastest fee rate for the example
      } catch (error) {
        console.error('Error fetching fee rate:', error);
        setFeeRate(10); // Fallback to 10 satoshis per byte if the fetch fails
      }
    };
    fetchFeeRate();
  }, []);

  const sendBitcoin = async () => {
    if (!bitcoinAddress || !bitcoinPrivateKey) {
      alert('Please sign in to send Bitcoin.');
      return;
    }

    const minAmount = 0.0001; // Minimum amount in BTC (0.0001 BTC)

    if (parseFloat(amount) < minAmount) {
      alert(`The amount is too low. Minimum amount is ${minAmount} BTC.`);
      return;
    }

    try {
      const amountInSatoshis = Math.round(parseFloat(amount) * 100000000); // Convert amount to satoshis
      const transactionSize = 100; // Estimate of transaction size in bytes
      const fee = transactionSize * feeRate;
      const totalAmount = amountInSatoshis + fee;

      console.log('Amount:', amountInSatoshis, 'satoshis');
      console.log('Fee:', fee, 'satoshis');
      console.log('Total amount needed:', totalAmount, 'satoshis');
      console.log('Balance:', balance, 'satoshis');

      if (balance === null || totalAmount > balance) {
        alert('Insufficient balance to cover the amount and the fee.');
        return;
      }

      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPrivateKey: bitcoinPrivateKey,
          recipientAddress,
          amount: amountInSatoshis,
          fee,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Transaction sent successfully! TX ID: ${data.txId}`);
      } else {
        console.error('Response data on error:', data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error in sending transaction:', error);
      alert('An unknown error occurred');
    }
  };

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };
  console.log('bitcoinAddress', bitcoinAddress)
  console.log('balance: ', balance );

  return (
    <div>
        <div>
          <h2>Bitcoin Wallet</h2>
          <p>Address</p>
          <p>{bitcoinAddress}</p>
          <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
          <div>
            <h2>Send Bitcoin</h2>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <br/>
            <input
              type="text"
              placeholder="Amount in BTC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <br/>
            <button onClick={sendBitcoin}>Send Bitcoin</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </div>
    </div>
  );
};

export default Bitcoin;