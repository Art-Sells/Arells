'use client';

import { useEffect, useState } from 'react';

const Bitcoin: React.FC = () => {
  const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [loadedWallet, setLoadedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // amount in BTC
  const [feeRate, setFeeRate] = useState<number>(10); // Fee rate in satoshis per byte
  const [address, setAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletAddress = loadedWallet?.address;
    if (walletAddress) {
      const fetchBalance = async () => {
        const res = await fetch(`/api/balance?address=${walletAddress}`);
        const data = await res.json();
        setBalance(data);
      };
      fetchBalance();
    }
  }, [loadedWallet]);

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

  const createWallet = async () => {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    setCreatedWallet(data);
    setLoadedWallet(null); // Clear loaded wallet if any
  };

  const loadWallet = async () => {
    const res = await fetch('/api/load-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, privateKey }),
    });
    const data = await res.json();
    if (res.ok) {
      setLoadedWallet(data);
      setCreatedWallet(null); // Clear created wallet if any
    } else {
      alert(data.error);
    }
  };

  const sendBitcoin = async () => {
    if (!loadedWallet) {
      alert('Please load a wallet to send Bitcoin.');
      return;
    }

    const minAmount = 0.0001; // Minimum amount in BTC
    const amountInSatoshis = parseFloat(amount) * 100000000;

    if (isNaN(amountInSatoshis) || amountInSatoshis < minAmount * 100000000) {
      alert(`The amount is too low. Minimum amount is ${minAmount} BTC.`);
      return;
    }

    try {
      const transactionSize = 250; // Estimated transaction size in bytes
      const fee = transactionSize * feeRate;
      const totalAmount = amountInSatoshis + fee;

      // Log the values being checked
      console.log(`Amount: ${amountInSatoshis} satoshis`);
      console.log(`Fee: ${fee} satoshis`);
      console.log(`Total amount needed: ${totalAmount} satoshis`);
      console.log(`Balance: ${balance} satoshis`);

      if (balance === null || totalAmount > balance) {
        alert('Insufficient balance to cover the amount and the fee.');
        return;
      }

      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPrivateKey: loadedWallet.privateKey,
          recipientAddress,
          amount: Math.round(amountInSatoshis),
          fee,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Transaction sent successfully! TX ID: ${data.txId}`);
      } else {
        console.error("Response data on error:", data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error in sending transaction:", error);
      alert('An unknown error occurred');
    }
  };

  const formatBalance = (balanceInSatoshis: number | null) => {
    if (balanceInSatoshis === null) return 'Loading...';
    if (balanceInSatoshis === 0) return '0';
    const balanceInBTC = balanceInSatoshis / 100000000;
    return balanceInBTC.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div>
      <h1>Bitcoin Marketplace</h1>
      <button onClick={createWallet}>Create Bitcoin Wallet</button>
      {createdWallet && (
        <div>
          <h2>Created Wallet</h2>
          <p>Address: {createdWallet.address}</p>
          <p>Private Key: {createdWallet.privateKey}</p>
          <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
        </div>
      )}
      <div>
        <h2>Access Existing Wallet</h2>
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Private Key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <button onClick={loadWallet}>Load Wallet</button>
      </div>
      {loadedWallet && (
        <div>
          <h2>Loaded Wallet</h2>
          <p>Address: {loadedWallet.address}</p>
          <p>Private Key: {loadedWallet.privateKey}</p>
          <p>Balance: {balance !== null ? formatBalance(balance) : 'Loading...'} BTC</p>
          <div>
            <h2>Send Bitcoin</h2>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Amount in BTC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendBitcoin}>Send Bitcoin</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitcoin;