'use client';

import React, { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { usePlaidLink } from 'react-plaid-link';

const Bitcoin: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // amount in BTC
  const [feeRate, setFeeRate] = useState<number>(10); // Fee rate in satoshis per byte
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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

  useEffect(() => {
    const createLinkToken = async () => {
      if (email) {
        const res = await fetch('/api/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setLinkToken(data.link_token);
      }
    };
    createLinkToken();
  }, [email]);

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

  const onSuccess = async (public_token: string) => {
    const res = await fetch('/api/exchange-public-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token }),
    });
    const data = await res.json();
    setAccessToken(data.access_token);
  };

  const config = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  const buyBitcoin = async () => {
    if (!accessToken) {
      open();
      return;
    }

    try {
      const res = await fetch('/api/kraken/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Buy order placed successfully! TX ID: ${data.result.txid}`);
      } else {
        console.error('Response data on error:', data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error in placing buy order:', error);
      alert('An unknown error occurred');
    }
  };

  const sellBitcoin = async () => {
    if (!accessToken) {
      open();
      return;
    }

    try {
      const res = await fetch('/api/kraken/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Sell order placed successfully! TX ID: ${data.result.txid}`);
      } else {
        console.error('Response data on error:', data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error in placing sell order:', error);
      alert('An unknown error occurred');
    }
  };

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
          <br />
          <input
            type="text"
            placeholder="Amount in BTC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <br />
          <button onClick={sendBitcoin}>Send Bitcoin</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
      <div>
        <button onClick={() => open()} disabled={!ready}>
          Connect Bank Account
        </button>
      </div>
      <div>
        <h2>Buy/Sell Bitcoin</h2>
        <input
          type="text"
          placeholder="Amount in BTC"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br />
        <button onClick={buyBitcoin}>Buy Bitcoin</button>
        <button onClick={sellBitcoin}>Sell Bitcoin</button>
      </div>
    </div>
  );
 
};

export default Bitcoin;