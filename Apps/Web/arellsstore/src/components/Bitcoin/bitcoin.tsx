'use client';

import { v4 as uuidv4 } from 'uuid';
import React, { useCallback, useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import CryptoJS from 'crypto-js';

const Bitcoin: React.FC = () => {

  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  // const [error, setError] = useState<string | null>(null);
  // const [linkToken, setLinkToken] = useState<string | null>(null);
  // const [tokenCreated, setTokenCreated] = useState<boolean>(false);
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  // const [bankAccount, setBankAccount] = useState<string>('');
  // const [krakenResult, setKrakenResult] = useState<any>(null);
  // const [krakenLoading, setKrakenLoading] = useState<boolean>(false);
  // const [krakenError, setKrakenError] = useState<string | null>(null);
  // const [dollarAmount, setDollarAmount] = useState<string>('');

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

  // useEffect(() => {
  //   const fetchFeeRate = async () => {
  //     try {
  //       const res = await fetch('https://mempool.space/api/v1/fees/recommended');
  //       const data = await res.json();
  //       setFeeRate(data.fastestFee); // Use the fastest fee rate for the example
  //     } catch (error) {
  //       console.error('Error fetching fee rate:', error);
  //       setFeeRate(10); // Fallback to 10 satoshis per byte if the fetch fails
  //     }
  //   };
  //   fetchFeeRate();
  // }, []);

  // const sendBitcoin = async () => {
  //   if (!bitcoinAddress || !bitcoinPrivateKey) {
  //     alert('Please sign in to send Bitcoin.');
  //     return;
  //   }

  //   const minAmount = 0.0001; // Minimum amount in BTC (0.0001 BTC)

  //   if (parseFloat(amount) < minAmount) {
  //     alert(`The amount is too low. Minimum amount is ${minAmount} BTC.`);
  //     return;
  //   }

  //   try {
  //     const amountInSatoshis = Math.round(parseFloat(amount) * 100000000); // Convert amount to satoshis
  //     const transactionSize = 100; // Estimate of transaction size in bytes
  //     const fee = transactionSize * feeRate;
  //     const totalAmount = amountInSatoshis + fee;

  //     console.log('Amount:', amountInSatoshis, 'satoshis');
  //     console.log('Fee:', fee, 'satoshis');
  //     console.log('Total amount needed:', totalAmount, 'satoshis');
  //     console.log('Balance:', balance, 'satoshis');

  //     if (balance === null || totalAmount > balance) {
  //       alert('Insufficient balance to cover the amount and the fee.');
  //       return;
  //     }

  //     const res = await fetch('/api/transaction', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         senderPrivateKey: bitcoinPrivateKey,
  //         recipientAddress,
  //         amount: amountInSatoshis,
  //         fee,
  //       }),
  //     });

  //     const data = await res.json();
  //     if (res.ok) {
  //       alert(`Transaction sent successfully! TX ID: ${data.txId}`);
  //     } else {
  //       console.error('Response data on error:', data);
  //       alert(`Error: ${data.error}`);
  //     }
  //   } catch (error) {
  //     console.error('Error in sending transaction:', error);
  //     alert('An unknown error occurred');
  //   }
  // };

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  // const fetchBankAccountStatus = async () => {
  //   try {
  //     const res = await fetch(`/api/fetch-bank-account?email=${email}`);
  //     const data = await res.json();
  //     setBankAccount(data.bankAccount || '');
  //   } catch (error) {
  //     console.error('Error fetching bank account status:', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchBankAccountStatus();
  // }, [email]);

  // const createLinkToken = async () => {
  //   if (email) {
  //     try {
  //       const res = await fetch('/api/create-link-token', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ email }),
  //       });
  //       if (!res.ok) {
  //         throw new Error(`Error creating link token: ${res.statusText}`);
  //       }
  //       const data = await res.json();
  //       setLinkToken(data.link_token);
  //       console.log('Link token fetched from API:', data.link_token);
  //     } catch (error: any) {
  //       console.error('Error creating link token:', error);
  //       setError('Failed to create link token');
  //     }
  //   }
  // };

  // const connectBank = async () => {
  //   if (!bankAccount) {
  //     await createLinkToken();
  //   }
  // };

  // useEffect(() => {
  //   const initializePlaidLink = () => {
  //     if (linkToken) {
  //       const handler = (window as any).Plaid.create({
  //         token: linkToken,
  //         onSuccess: async (public_token: string, metadata: any) => {
  //           console.log('Public Token:', public_token);

  //           // Set bankAccount to public_token
  //           setBankAccount(public_token);

  //           // Update the bank account attribute with the public_token
  //           await fetch('/api/update-bank-account', {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({ email, bankAccount: public_token }),
  //           });

  //           // Fetch the updated bank account status
  //           fetchBankAccountStatus();
  //         },
  //         onExit: (err: any, metadata: any) => {
  //           // Open blank out back Modal here
  //         },
  //         onEvent: (eventName: string, metadata: any) => {
  //           // handle event
  //         }
  //       });
  //       handler.open();
  //     }
  //   };

  //   if (!bankAccount && linkToken) {
  //     initializePlaidLink();
  //   }
  // }, [linkToken, bankAccount]);



  // const [result, setResult] = useState<any>(null);
  // const [loading, setLoading] = useState<boolean>(false);

  // const calculateBitcoinAmount = (dollarAmount: string) => {
  //   if (bitcoinPrice === null || dollarAmount === '') return '';
  //   const amountInBTC = parseFloat(dollarAmount) / bitcoinPrice;
  //   return amountInBTC.toFixed(8); // 8 decimal places for Bitcoin
  // };

  // const handleKrakenAPI = async (type: 'buy' | 'sell') => {
  //   const volume = calculateBitcoinAmount(dollarAmount);
  //   if (volume === '') {
  //     setKrakenError('Invalid dollar amount');
  //     return;
  //   }
  
  //   setKrakenLoading(true);
  //   setKrakenError(null);
  
  //   try {
  //     const response = await fetch('/api/kraken-api', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ type, volume }),
  //     });
  //     const data = await response.json();
  //     setKrakenResult(data);
  //   } catch (err) {
  //     setKrakenError('Error executing Kraken API');
  //   } finally {
  //     setKrakenLoading(false);
  //   }
  // };





















  return (
    <div>
      <div>
        <p>Address</p>
        <p>{bitcoinAddress}</p>
        <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
        
        {/* <div>
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
        </div> */}
      </div>
  

      {/* <div>
        <h2>Connect Bank</h2>
        <br />
        <button onClick={connectBank}>CONNECT BANK</button>
      </div> */}

      {/* <div>
        <label>
          External Bitcoin Price: ${bitcoinPrice.toFixed(2)}
        </label>
        <input
          type="text"
          placeholder="Dollar Amount"
          value={dollarAmount}
          onChange={(e) => setDollarAmount(e.target.value)}
        />
        <button onClick={() => handleKrakenAPI('buy')} disabled={krakenLoading}>
          {krakenLoading ? 'Processing...' : 'Buy Bitcoin'}
        </button>
        <button onClick={() => handleKrakenAPI('sell')} disabled={krakenLoading}>
          {krakenLoading ? 'Processing...' : 'Sell Bitcoin'}
        </button>
      </div> */}
</div>
  );
};

export default Bitcoin;